// Not a real assertion suite — renders one sample per preset for eyeballing.
// Only writes files when FRAME_SAMPLE_DIR is set; FRAME_SAMPLE_ART points at a
// real painting photo (defaults to a flat red canvas):
//   FRAME_SAMPLE_DIR=/tmp/frames FRAME_SAMPLE_ART=painting.jpg npx vitest run src/lib/framing/frame.samples.test.ts
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { composeFrame } from './frame'
import { FRAME_PRESETS } from './presets'

describe('frame samples', () => {
  it('renders every preset on a non-square painting', async () => {
    const dir = process.env.FRAME_SAMPLE_DIR
    const art = process.env.FRAME_SAMPLE_ART
      ? await sharp(process.env.FRAME_SAMPLE_ART).resize(1200, 1200, { fit: 'inside' }).png().toBuffer()
      : await sharp({ create: { width: 900, height: 720, channels: 3, background: { r: 188, g: 40, b: 36 } } })
        .png().toBuffer()
    for (const preset of Object.values(FRAME_PRESETS)) {
      const out = await composeFrame(art, preset)
      expect((await sharp(out).metadata()).width!).toBeGreaterThan(900)
      if (dir) {
        fs.mkdirSync(dir, { recursive: true })
        await sharp(out).webp({ quality: 82 }).toFile(path.join(dir, `${preset.key}.webp`))
      }
    }
  }, 60_000)
})
