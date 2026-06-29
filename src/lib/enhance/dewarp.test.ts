import { describe, it, expect, vi, beforeEach } from 'vitest'

const subscribe = vi.fn()
const upload = vi.fn()
vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    storage: { upload: (...a: any[]) => upload(...a) },
    subscribe: (...a: any[]) => subscribe(...a),
  },
}))

import { dewarpDocRes } from './dewarp'

beforeEach(() => {
  subscribe.mockReset()
  upload.mockReset()
  vi.unstubAllGlobals()
  delete process.env.FAL_KEY
  delete process.env.ENHANCE_DEWARP_MODEL
})

describe('dewarpDocRes', () => {
  it('returns the input unchanged when FAL_KEY is unset (no paid call)', async () => {
    const buf = Buffer.from('original')
    const out = await dewarpDocRes(buf)
    expect(out).toBe(buf)
    expect(subscribe).not.toHaveBeenCalled()
  })

  it('uploads the buffer, calls DocRes dewarp, and returns the fetched result', async () => {
    process.env.FAL_KEY = 'k'
    upload.mockResolvedValue('https://fal.storage/in.png')
    subscribe.mockResolvedValue({ data: { image: { url: 'https://fal.storage/out.png' } } })
    const fetchMock = vi.fn().mockResolvedValue({ arrayBuffer: async () => new TextEncoder().encode('dewarped').buffer })
    vi.stubGlobal('fetch', fetchMock)

    const out = await dewarpDocRes(Buffer.from('original'))

    expect(upload).toHaveBeenCalledOnce()
    expect(subscribe).toHaveBeenCalledWith('fal-ai/docres/dewarp', expect.objectContaining({ input: { image_url: 'https://fal.storage/in.png' } }))
    expect(fetchMock).toHaveBeenCalledWith('https://fal.storage/out.png')
    expect(out.toString()).toBe('dewarped')
  })

  it('falls back to the input when the model returns no image', async () => {
    process.env.FAL_KEY = 'k'
    upload.mockResolvedValue('https://fal.storage/in.png')
    subscribe.mockResolvedValue({ data: {} })
    const buf = Buffer.from('original')
    expect(await dewarpDocRes(buf)).toBe(buf)
  })

  it('falls back to the input when the call throws (never fails the enhance)', async () => {
    process.env.FAL_KEY = 'k'
    upload.mockRejectedValue(new Error('network'))
    const buf = Buffer.from('original')
    expect(await dewarpDocRes(buf)).toBe(buf)
  })
})
