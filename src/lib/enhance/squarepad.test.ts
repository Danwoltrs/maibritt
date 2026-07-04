import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { padToSquare, cropFromSquare } from './squarepad'

const solid = (w: number, h: number, r = 200, g = 30, b = 30) =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r, g, b } } }).png().toBuffer()

describe('padToSquare', () => {
  it('returns null for an already-square image (sent to the model as-is)', async () => {
    expect(await padToSquare(await solid(100, 100))).toBeNull()
  })

  it('pads a landscape image to a centered square and reports the crop-back geometry', async () => {
    const { buffer, pad } = (await padToSquare(await solid(200, 120)))!
    const meta = await sharp(buffer).metadata()
    expect([meta.width, meta.height]).toEqual([200, 200])
    expect(pad).toEqual({ side: 200, left: 0, top: 40, width: 200, height: 120 })
  })

  it('pads a portrait image to a centered square', async () => {
    const { pad } = (await padToSquare(await solid(120, 200)))!
    expect(pad).toEqual({ side: 200, left: 40, top: 0, width: 120, height: 200 })
  })

  it('returns null on unreadable input (caller sends the original)', async () => {
    expect(await padToSquare(Buffer.from('not an image'))).toBeNull()
  })
})

describe('cropFromSquare', () => {
  it('round-trips: pad then crop-back restores the original dimensions', async () => {
    const original = await solid(200, 120)
    const { buffer, pad } = (await padToSquare(original))!
    const out = await cropFromSquare(buffer, pad)
    const meta = await sharp(out).metadata()
    expect([meta.width, meta.height]).toEqual([200, 120])
  })

  it('normalises a model output that came back at the wrong size, then extracts', async () => {
    const pad = { side: 200, left: 0, top: 40, width: 200, height: 120 }
    // Model ignored image_size and returned 512x512 — must still crop cleanly.
    const wrongSize = await solid(512, 512)
    const out = await cropFromSquare(wrongSize, pad)
    const meta = await sharp(out).metadata()
    expect([meta.width, meta.height]).toEqual([200, 120])
  })

  it('returns the model output unchanged on any failure', async () => {
    const garbage = Buffer.from('not an image')
    const pad = { side: 200, left: 0, top: 40, width: 200, height: 120 }
    expect(await cropFromSquare(garbage, pad)).toBe(garbage)
  })
})
