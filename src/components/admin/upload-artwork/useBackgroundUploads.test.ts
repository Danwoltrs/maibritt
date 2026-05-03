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
