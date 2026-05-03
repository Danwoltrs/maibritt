import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useBackgroundUploads } from './useBackgroundUploads'

vi.mock('@/services/artwork.service', () => ({
  ArtworkService: {
    createArtwork: vi.fn(),
    updateArtwork: vi.fn(),
  },
}))

import { ArtworkService } from '@/services/artwork.service'

const mockCreate = ArtworkService.createArtwork as unknown as ReturnType<typeof vi.fn>
const mockUpdate = ArtworkService.updateArtwork as unknown as ReturnType<typeof vi.fn>

const samplePayload = {
  title: { ptBR: 'A', en: 'A' },
  year: 2026,
  medium: { ptBR: '', en: '' },
  dimensions: '',
  description: { ptBR: '', en: '' },
  category: 'painting' as const,
  images: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })],
  featured: false,
}

beforeEach(() => {
  mockCreate.mockReset()
  mockUpdate.mockReset()
})

describe('useBackgroundUploads — happy path', () => {
  it('starts at idle and transitions to uploaded on success', async () => {
    mockCreate.mockResolvedValue({ id: 'artwork-1' })
    const { result } = renderHook(() => useBackgroundUploads())

    expect(result.current.getState(0).status).toBe('idle')

    act(() => {
      result.current.startUpload(0, samplePayload)
    })

    await waitFor(() =>
      expect(result.current.getState(0).status).toBe('uploaded')
    )
    const state = result.current.getState(0)
    if (state.status === 'uploaded') {
      expect(state.artworkId).toBe('artwork-1')
    }
  })
})

describe('useBackgroundUploads — concurrency cap', () => {
  it('runs at most 2 uploads in parallel', async () => {
    let inFlight = 0
    let maxInFlight = 0
    const resolvers: Array<() => void> = []

    mockCreate.mockImplementation(() => {
      inFlight += 1
      maxInFlight = Math.max(maxInFlight, inFlight)
      return new Promise<{ id: string }>((resolve) => {
        resolvers.push(() => {
          inFlight -= 1
          resolve({ id: `id-${resolvers.length}` })
        })
      })
    })

    const { result } = renderHook(() => useBackgroundUploads())

    act(() => {
      result.current.startUpload(0, samplePayload)
      result.current.startUpload(1, samplePayload)
      result.current.startUpload(2, samplePayload)
      result.current.startUpload(3, samplePayload)
    })

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(2))
    expect(maxInFlight).toBe(2)

    // Resolve first two; next two should now run.
    act(() => {
      resolvers[0]()
      resolvers[1]()
    })

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(4))
    expect(maxInFlight).toBe(2)

    act(() => {
      resolvers[2]()
      resolvers[3]()
    })

    await waitFor(() =>
      expect(result.current.allDone).toBe(true)
    )
  })
})

describe('useBackgroundUploads — retries', () => {
  it('retries up to 2 times on network/5xx errors and succeeds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockCreate
      .mockRejectedValueOnce(Object.assign(new Error('boom'), { status: 503 }))
      .mockRejectedValueOnce(Object.assign(new Error('boom'), { status: 503 }))
      .mockResolvedValueOnce({ id: 'art-after-retry' })

    const { result } = renderHook(() => useBackgroundUploads())
    act(() => {
      result.current.startUpload(0, samplePayload)
    })

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000)
    })
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(2))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000)
    })
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(3))

    await waitFor(() =>
      expect(result.current.getState(0).status).toBe('uploaded')
    )
    vi.useRealTimers()
  })

  it('fails fast on 4xx without retry', async () => {
    mockCreate.mockRejectedValueOnce(
      Object.assign(new Error('bad request'), { status: 400 })
    )
    const { result } = renderHook(() => useBackgroundUploads())
    act(() => {
      result.current.startUpload(0, samplePayload)
    })

    await waitFor(() =>
      expect(result.current.getState(0).status).toBe('failed')
    )
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('marks as failed after retries exhausted', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockCreate.mockRejectedValue(
      Object.assign(new Error('boom'), { status: 503 })
    )
    const { result } = renderHook(() => useBackgroundUploads())
    act(() => {
      result.current.startUpload(0, samplePayload)
    })

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000)
    })
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(2))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000)
    })
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(3))

    await waitFor(() =>
      expect(result.current.getState(0).status).toBe('failed')
    )
    vi.useRealTimers()
  })
})
