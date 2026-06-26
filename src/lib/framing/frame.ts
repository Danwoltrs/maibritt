import sharp from 'sharp'
import path from 'path'
import type { FramePreset } from './presets'
import { makeShadow, bevelSvg } from './shadows'

const WALL = { r: 244, g: 242, b: 238, alpha: 1 }

function texturePath(preset: FramePreset): string {
  return path.join(process.cwd(), preset.texturePath)
}

export async function composeFrame(painting: Buffer, preset: FramePreset): Promise<Buffer> {
  return preset.family === 'matted' ? composeMat(painting, preset) : composeFloater(painting, preset)
}

async function composeFloater(painting: Buffer, preset: FramePreset): Promise<Buffer> {
  const m = await sharp(painting).metadata()
  const W = m.width!, H = m.height!, L = Math.max(W, H)
  const gap = Math.round(L * 0.010)
  const fw = Math.round(L * preset.frameWidthFrac)
  const sigma = Math.max(Math.round(L * 0.012), 6)
  const margin = sigma * 3 + Math.round(L * 0.02)
  const bevelT = Math.max(2, Math.round(L * 0.004))

  const frameW = W + 2 * (gap + fw)
  const frameH = H + 2 * (gap + fw)
  const outW = frameW + 2 * margin
  const outH = frameH + 2 * margin
  const fx = margin, fy = margin
  const cx = margin + fw + gap, cy = margin + fw + gap

  const wood = await sharp(texturePath(preset)).resize(frameW, frameH, { fit: 'fill' }).toBuffer()
  const recess = Buffer.from(
    `<svg width="${W + 2 * gap}" height="${H + 2 * gap}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="100%" height="100%" rx="2" fill="#1c1c1c" fill-opacity="0.5"/></svg>`
  )
  const { buffer: shadow, margin: sMargin } = await makeShadow(frameW, frameH, sigma, 0.35)
  const bevel = bevelSvg(W, H, bevelT)

  return sharp({ create: { width: outW, height: outH, channels: 4, background: WALL } })
    .composite([
      { input: shadow, left: fx - sMargin + Math.round(L * 0.004), top: fy - sMargin + Math.round(L * 0.008) },
      { input: wood, left: fx, top: fy },
      { input: recess, left: margin + fw, top: margin + fw },
      { input: painting, left: cx, top: cy },
      { input: bevel, left: cx, top: cy },
    ])
    .keepIccProfile()
    .png()
    .toBuffer()
}

async function composeMat(painting: Buffer, preset: FramePreset): Promise<Buffer> {
  const m = await sharp(painting).metadata()
  const W = m.width!, H = m.height!, L = Math.max(W, H)
  const mat = Math.round(L * 0.14)
  const fw = Math.round(L * preset.frameWidthFrac)
  const sigma = Math.max(Math.round(L * 0.012), 6)
  const margin = sigma * 3 + Math.round(L * 0.02)
  const bevelT = Math.max(1, Math.round(L * 0.0025))

  const matW = W + 2 * mat, matH = H + 2 * mat
  const frameW = matW + 2 * fw, frameH = matH + 2 * fw
  const outW = frameW + 2 * margin, outH = frameH + 2 * margin
  const fx = margin, fy = margin
  const mx = margin + fw, my = margin + fw
  const ax = mx + mat, ay = my + mat

  const wood = await sharp(texturePath(preset)).resize(frameW, frameH, { fit: 'fill' }).toBuffer()
  const matRect = Buffer.from(
    `<svg width="${matW}" height="${matH}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="100%" height="100%" fill="#fbfaf7"/></svg>`
  )
  // Subtle inner-bevel of the mat window + a faint paper shadow under the art.
  const window = bevelSvg(W + 2 * bevelT, H + 2 * bevelT, bevelT)
  const { buffer: shadow, margin: sMargin } = await makeShadow(frameW, frameH, sigma, 0.35)

  return sharp({ create: { width: outW, height: outH, channels: 4, background: WALL } })
    .composite([
      { input: shadow, left: fx - sMargin + Math.round(L * 0.004), top: fy - sMargin + Math.round(L * 0.008) },
      { input: wood, left: fx, top: fy },
      { input: matRect, left: mx, top: my },
      { input: window, left: ax - bevelT, top: ay - bevelT },
      { input: painting, left: ax, top: ay },
    ])
    .keepIccProfile()
    .png()
    .toBuffer()
}
