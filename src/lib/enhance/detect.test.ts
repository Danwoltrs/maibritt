import { describe, it, expect, vi, beforeEach } from 'vitest'
import sharp from 'sharp'
import { makeTiltedRectMask } from '../../test/images'

const subscribe = vi.fn()
vi.mock('@fal-ai/client', () => ({ fal: { config: vi.fn(), subscribe: (...a: any[]) => subscribe(...a) } }))

beforeEach(() => { subscribe.mockReset() })

describe('detectPainting', () => {
  it('returns a normalized quad derived from the fal mask', async () => {
    // 120x80 rect centred in 200x200 → corners at x∈[40,160], y∈[60,140].
    const mask = makeTiltedRectMask(200, 200, 120, 80, 0)
    const png = await sharp(Buffer.from(mask), { raw: { width: 200, height: 200, channels: 1 } }).png().toBuffer()
    subscribe.mockResolvedValue({ data: { image: { url: 'https://x/mask.png' } } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ arrayBuffer: async () => png.buffer }))

    const { detectPainting } = await import('./detect')
    const { quad } = await detectPainting('https://x/original.jpg')
    expect(quad.tl.x).toBeCloseTo(0.2, 1)
    expect(quad.tl.y).toBeCloseTo(0.3, 1)
    expect(quad.br.x).toBeCloseTo(0.8, 1)
    expect(quad.br.y).toBeCloseTo(0.7, 1)
  })
})
