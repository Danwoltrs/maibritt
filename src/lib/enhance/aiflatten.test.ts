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
  delete process.env.ENHANCE_FLATTEN_COLORMATCH
  delete process.env.ENHANCE_FLATTEN_SQUAREPAD
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
    const meta = await sharp(out).metadata()
    expect(meta.format).toBe('png')
    expect(meta.width).toBe(32)
    // Colour-locked by default: the model's drifted red is matched back to the input's.
    const { data } = await sharp(out).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    expect([data[0], data[1], data[2]]).toEqual([180, 40, 40])
  })

  it('pads a non-square painting to a square for the model, then crops the framing back', async () => {
    process.env.FAL_KEY = 'k'
    process.env.ENHANCE_FLATTEN_COLORMATCH = '0' // isolate the reframe geometry
    const inputPng = await sharp({ create: { width: 48, height: 32, channels: 3, background: { r: 180, g: 40, b: 40 } } }).png().toBuffer()
    const editedSquare = await sharp({ create: { width: 48, height: 48, channels: 3, background: { r: 150, g: 35, b: 35 } } }).png().toBuffer()
    upload.mockResolvedValue('https://fal.storage/in.png')
    subscribe.mockResolvedValue({ data: { images: [{ url: 'https://fal.storage/out.png' }] } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ arrayBuffer: async () => new Uint8Array(editedSquare).buffer }))

    const out = await aiFlattenGenerative(inputPng)

    // Model saw a square canvas (so it can't shear the artwork off the long edge)...
    const [, payload] = subscribe.mock.calls[0]
    expect(payload.input.image_size).toEqual({ width: 48, height: 48 })
    // ...and the returned image is cropped back to the painting's real aspect.
    const meta = await sharp(out).metadata()
    expect([meta.width, meta.height]).toEqual([48, 32])
  })

  it('sends the image as-is (no pad) when ENHANCE_FLATTEN_SQUAREPAD=0', async () => {
    process.env.FAL_KEY = 'k'
    process.env.ENHANCE_FLATTEN_SQUAREPAD = '0'
    const inputPng = await sharp({ create: { width: 48, height: 32, channels: 3, background: { r: 180, g: 40, b: 40 } } }).png().toBuffer()
    const editedPng = await sharp({ create: { width: 48, height: 32, channels: 3, background: { r: 150, g: 35, b: 35 } } }).png().toBuffer()
    upload.mockResolvedValue('https://fal.storage/in.png')
    subscribe.mockResolvedValue({ data: { images: [{ url: 'https://fal.storage/out.png' }] } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ arrayBuffer: async () => new Uint8Array(editedPng).buffer }))

    await aiFlattenGenerative(inputPng)
    const [, payload] = subscribe.mock.calls[0]
    expect(payload.input.image_size).toEqual({ width: 48, height: 32 }) // original dims, not squared
  })

  it('returns the raw model output when ENHANCE_FLATTEN_COLORMATCH=0', async () => {
    process.env.FAL_KEY = 'k'
    process.env.ENHANCE_FLATTEN_COLORMATCH = '0'
    const inputPng = await sharp({ create: { width: 32, height: 32, channels: 3, background: { r: 180, g: 40, b: 40 } } }).png().toBuffer()
    const editedPng = await sharp({ create: { width: 32, height: 32, channels: 3, background: { r: 150, g: 35, b: 35 } } }).png().toBuffer()
    upload.mockResolvedValue('https://fal.storage/in.png')
    subscribe.mockResolvedValue({ data: { images: [{ url: 'https://fal.storage/out.png' }] } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ arrayBuffer: async () => new Uint8Array(editedPng).buffer }))

    const out = await aiFlattenGenerative(inputPng)
    const { data } = await sharp(out).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    expect([data[0], data[1], data[2]]).toEqual([150, 35, 35])
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
