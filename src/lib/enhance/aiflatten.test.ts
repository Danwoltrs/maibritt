import { describe, it, expect, vi, beforeEach } from 'vitest'
import sharp from 'sharp'

const subscribe = vi.fn()
const upload = vi.fn()
vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    storage: { upload: (...a: any[]) => upload(...a) },
    subscribe: (...a: any[]) => subscribe(...a),
  },
}))

import { aiFlattenGenerative } from './aiflatten'

beforeEach(() => {
  subscribe.mockReset()
  upload.mockReset()
  vi.unstubAllGlobals()
  delete process.env.FAL_KEY
  delete process.env.ENHANCE_FLATTEN_MODEL
  delete process.env.ENHANCE_FLATTEN_GUIDANCE
  delete process.env.ENHANCE_FLATTEN_RECOMPOSITE
})

describe('aiFlattenGenerative', () => {
  it('returns the input unchanged when FAL_KEY is unset (no paid call)', async () => {
    const buf = Buffer.from('original')
    expect(await aiFlattenGenerative(buf)).toBe(buf)
    expect(subscribe).not.toHaveBeenCalled()
  })

  it('uploads, calls Qwen edit with image_urls + preserve prompt + image_size, returns the model output', async () => {
    process.env.FAL_KEY = 'k'
    const inputPng = await sharp({ create: { width: 32, height: 32, channels: 3, background: { r: 180, g: 40, b: 40 } } }).png().toBuffer()
    const editedPng = await sharp({ create: { width: 32, height: 32, channels: 3, background: { r: 150, g: 35, b: 35 } } }).png().toBuffer()
    upload.mockResolvedValue('https://fal.storage/in.png')
    subscribe.mockResolvedValue({ data: { images: [{ url: 'https://fal.storage/out.png' }] } })
    const fetchMock = vi.fn().mockResolvedValue({ arrayBuffer: async () => new Uint8Array(editedPng).buffer })
    vi.stubGlobal('fetch', fetchMock)

    const out = await aiFlattenGenerative(inputPng)

    expect(upload).toHaveBeenCalledOnce()
    const [model, payload] = subscribe.mock.calls[0]
    expect(model).toBe('fal-ai/qwen-image-edit-2511')
    expect(payload.input.image_urls).toEqual(['https://fal.storage/in.png'])
    expect(typeof payload.input.prompt).toBe('string')
    expect(payload.input.prompt.length).toBeGreaterThan(0)
    expect(payload.input.image_size).toEqual({ width: 32, height: 32 }) // keep original framing
    expect(fetchMock).toHaveBeenCalledWith('https://fal.storage/out.png')
    // Default path returns the raw model PNG (recomposite is opt-in).
    const meta = await sharp(out).metadata()
    expect(meta.format).toBe('png')
    expect(meta.width).toBe(32)
  })

  it('falls back to the input when the model returns no image', async () => {
    process.env.FAL_KEY = 'k'
    upload.mockResolvedValue('https://fal.storage/in.png')
    subscribe.mockResolvedValue({ data: { images: [] } })
    const buf = Buffer.from('original')
    expect(await aiFlattenGenerative(buf)).toBe(buf)
  })

  it('falls back to the input when the call throws (never fails the enhance)', async () => {
    process.env.FAL_KEY = 'k'
    upload.mockRejectedValue(new Error('network'))
    const buf = Buffer.from('original')
    expect(await aiFlattenGenerative(buf)).toBe(buf)
  })
})
