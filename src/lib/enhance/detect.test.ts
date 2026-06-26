import { describe, it, expect, vi, beforeEach } from 'vitest'
import sharp from 'sharp'
import { makeTiltedRectMask } from '../../test/images'

const subscribe = vi.fn()
vi.mock('@fal-ai/client', () => ({ fal: { config: vi.fn(), subscribe: (...a: any[]) => subscribe(...a) } }))

beforeEach(() => { subscribe.mockReset() })

describe('detectPainting', () => {
  it('returns a rect derived from the fal mask', async () => {
    const mask = makeTiltedRectMask(200, 200, 120, 80, 0)
    const png = await sharp(Buffer.from(mask), { raw: { width: 200, height: 200, channels: 1 } }).png().toBuffer()
    subscribe.mockResolvedValue({ data: { image: { url: 'https://x/mask.png' } } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ arrayBuffer: async () => png.buffer }))

    const { detectPainting } = await import('./detect')
    const { rect } = await detectPainting('https://x/original.jpg')
    expect(rect.width).toBeGreaterThan(100)
    expect(Math.abs(rect.angleDeg)).toBeLessThan(2)
  })
})
