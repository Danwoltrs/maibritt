import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { matchColors } from './colormatch'

const solid = (r: number, g: number, b: number, w = 16, h = 16) =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r, g, b } } }).png().toBuffer()

async function firstPixel(buf: Buffer): Promise<[number, number, number]> {
  const { data } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  return [data[0], data[1], data[2]]
}

/** Horizontal gradient PNG where every channel ramps 0..255, optionally remapped. */
async function gradient(w: number, h: number, map: (v: number) => number = v => v): Promise<Buffer> {
  const data = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = Math.max(0, Math.min(255, Math.round(map((x * 255) / (w - 1)))))
      const i = (y * w + x) * 3
      data[i] = v; data[i + 1] = v; data[i + 2] = v
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
}

async function channelMeans(buf: Buffer): Promise<[number, number, number]> {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const sums = [0, 0, 0]
  for (let i = 0; i < data.length; i += info.channels) {
    sums[0] += data[i]; sums[1] += data[i + 1]; sums[2] += data[i + 2]
  }
  const n = data.length / info.channels
  return [sums[0] / n, sums[1] / n, sums[2] / n]
}

describe('matchColors', () => {
  it('restores a solid colour the model drifted, exactly', async () => {
    const ref = await solid(180, 40, 40)
    const drifted = await solid(150, 35, 55)
    expect(await firstPixel(await matchColors(ref, drifted))).toEqual([180, 40, 40])
  })

  it('pulls a shifted/compressed tonal range back to the reference distribution', async () => {
    const ref = await gradient(64, 8)
    const drifted = await gradient(64, 8, v => v * 0.8 + 30) // washed out + lifted blacks
    const matched = await matchColors(ref, drifted)
    const [refMeans, matchedMeans] = [await channelMeans(ref), await channelMeans(matched)]
    for (let c = 0; c < 3; c++) expect(Math.abs(matchedMeans[c] - refMeans[c])).toBeLessThan(3)
  })

  it('keeps the target dimensions (reference size is irrelevant)', async () => {
    const matched = await matchColors(await solid(10, 20, 30, 8, 8), await solid(50, 60, 70, 64, 32))
    const meta = await sharp(matched).metadata()
    expect([meta.width, meta.height]).toEqual([64, 32])
  })

  it('returns the target unchanged on any failure (never fails the enhance)', async () => {
    const garbage = Buffer.from('not an image')
    expect(await matchColors(await solid(1, 2, 3), garbage)).toBe(garbage)
  })
})
