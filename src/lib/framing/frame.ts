import sharp from 'sharp'
import path from 'path'
import type { FramePreset } from './presets'
import { makeShadow } from './shadows'
import { miteredFrame } from './miter'

const WALL = { r: 244, g: 242, b: 238, alpha: 1 }

function texturePath(preset: FramePreset): string {
  return path.join(process.cwd(), preset.texturePath)
}

export async function composeFrame(painting: Buffer, preset: FramePreset): Promise<Buffer> {
  return preset.family === 'matted' ? composeMat(painting, preset) : composeFloater(painting, preset)
}

/** Gently lit gallery wall (slightly darker toward the floor). */
function wallSvg(w: number, h: number): Buffer {
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs>` +
    `<linearGradient id="w" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#f7f5f1"/><stop offset="0.55" stop-color="#f3f1ed"/>` +
    `<stop offset="1" stop-color="#edeae5"/></linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#w)"/></svg>`)
}

/** Two-layer wall shadow: wide ambient + tight contact, both offset down-right. */
async function wallShadows(frameW: number, frameH: number, L: number) {
  const amb = await makeShadow(frameW, frameH, Math.max(Math.round(L * 0.016), 8), 0.22)
  const con = await makeShadow(frameW, frameH, Math.max(Math.round(L * 0.005), 3), 0.28)
  return {
    amb, con,
    dx1: Math.round(L * 0.003), dy1: Math.round(L * 0.010),
    dx2: Math.round(L * 0.001), dy2: Math.round(L * 0.004),
  }
}

async function composeFloater(painting: Buffer, preset: FramePreset): Promise<Buffer> {
  const m = await sharp(painting).metadata()
  const W = m.width!, H = m.height!, L = Math.max(W, H)
  const gap = Math.max(Math.round(L * 0.011), 3)
  const fw = Math.max(Math.round(L * preset.frameWidthFrac), 10)
  const frameW = W + 2 * (gap + fw), frameH = H + 2 * (gap + fw)

  const frame = await miteredFrame(texturePath(preset), frameW, frameH, fw)
  const { amb, con, dx1, dy1, dx2, dy2 } = await wallShadows(frameW, frameH, L)
  // Wall margin must fully contain the blurred shadows (small paintings would
  // otherwise overflow the canvas and sharp refuses oversized composites).
  const margin = Math.max(Math.round(L * 0.075), amb.margin + dy1, con.margin + dy2)
  const outW = frameW + 2 * margin, outH = frameH + 2 * margin

  // Floater rebate: near-black gap; the canvas block casts a small contact shadow
  // inside the gap; a light hairline marks the canvas edge. All of it sits in the
  // gap — the painting itself is composited last, untouched.
  const gw = W + 2 * gap, gh = H + 2 * gap
  const recess = Buffer.from(
    `<svg width="${gw}" height="${gh}" xmlns="http://www.w3.org/2000/svg"><defs>` +
    `<linearGradient id="d" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#070707"/><stop offset="0.5" stop-color="#101010"/>` +
    `<stop offset="1" stop-color="#181818"/></linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#d)"/></svg>`)
  const canvasShadow = await sharp(Buffer.from(
    `<svg width="${gw}" height="${gh}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="${gap + Math.round(gap * 0.35)}" y="${gap + Math.round(gap * 0.5)}" width="${W}" height="${H}" fill="black" fill-opacity="0.55"/></svg>`))
    .blur(Math.max(gap * 0.45, 2)).png().toBuffer()
  const canvasEdge = Buffer.from(
    `<svg width="${gw}" height="${gh}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="${gap - 1}" y="${gap - 1}" width="${W + 2}" height="${H + 2}" fill="none" stroke="#3a3a3a" stroke-width="1"/></svg>`)

  return sharp({ create: { width: outW, height: outH, channels: 4, background: WALL } })
    .composite([
      { input: wallSvg(outW, outH), left: 0, top: 0 },
      { input: amb.buffer, left: margin - amb.margin + dx1, top: margin - amb.margin + dy1 },
      { input: con.buffer, left: margin - con.margin + dx2, top: margin - con.margin + dy2 },
      { input: frame, left: margin, top: margin },
      { input: recess, left: margin + fw, top: margin + fw },
      { input: canvasShadow, left: margin + fw, top: margin + fw },
      { input: canvasEdge, left: margin + fw, top: margin + fw },
      { input: painting, left: margin + fw + gap, top: margin + fw + gap },
    ])
    .keepIccProfile()
    .png()
    .toBuffer()
}

async function composeMat(painting: Buffer, preset: FramePreset): Promise<Buffer> {
  const m = await sharp(painting).metadata()
  const W = m.width!, H = m.height!, L = Math.max(W, H)
  const mat = Math.round(L * 0.14)
  const fw = Math.max(Math.round(L * preset.frameWidthFrac), 10)
  const matW = W + 2 * mat, matH = H + 2 * mat
  const frameW = matW + 2 * fw, frameH = matH + 2 * fw

  const frame = await miteredFrame(texturePath(preset), frameW, frameH, fw)
  const { amb, con, dx1, dy1, dx2, dy2 } = await wallShadows(frameW, frameH, L)
  // Wall margin must fully contain the blurred shadows (small paintings would
  // otherwise overflow the canvas and sharp refuses oversized composites).
  const margin = Math.max(Math.round(L * 0.075), amb.margin + dy1, con.margin + dy2)
  const outW = frameW + 2 * margin, outH = frameH + 2 * margin

  // Mat board with a soft inner shadow from the frame and a true 45° bevel core
  // around the window. The bevel ring sits OUTSIDE the painting bounds.
  const bev = Math.max(Math.round(L * 0.006), 4)
  const matSvg = Buffer.from(
    `<svg width="${matW}" height="${matH}" xmlns="http://www.w3.org/2000/svg"><defs>` +
    `<linearGradient id="ms" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#fcfbf8"/><stop offset="1" stop-color="#f6f4ef"/></linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#ms)"/>` +
    `<rect x="0" y="0" width="${matW}" height="${Math.round(mat * 0.18)}" fill="black" fill-opacity="0.055"/>` +
    `<rect x="0" y="0" width="${Math.round(mat * 0.12)}" height="${matH}" fill="black" fill-opacity="0.04"/>` +
    `<rect x="${mat - bev}" y="${mat - bev}" width="${W + 2 * bev}" height="${H + 2 * bev}" fill="#ffffff"/>` +
    `<rect x="${mat - bev}" y="${mat - bev}" width="${W + 2 * bev}" height="${Math.round(bev * 0.9)}" fill="black" fill-opacity="0.22"/>` +
    `<rect x="${mat - bev}" y="${mat - bev}" width="${Math.round(bev * 0.9)}" height="${H + 2 * bev}" fill="black" fill-opacity="0.16"/>` +
    `<rect x="${mat - bev}" y="${mat + H + bev - Math.round(bev * 0.7)}" width="${W + 2 * bev}" height="${Math.round(bev * 0.7)}" fill="white" fill-opacity="0.7"/>` +
    `<rect x="${mat - bev}" y="${mat - bev}" width="${W + 2 * bev}" height="${H + 2 * bev}" fill="none" stroke="black" stroke-opacity="0.18" stroke-width="1"/></svg>`)

  return sharp({ create: { width: outW, height: outH, channels: 4, background: WALL } })
    .composite([
      { input: wallSvg(outW, outH), left: 0, top: 0 },
      { input: amb.buffer, left: margin - amb.margin + dx1, top: margin - amb.margin + dy1 },
      { input: con.buffer, left: margin - con.margin + dx2, top: margin - con.margin + dy2 },
      { input: frame, left: margin, top: margin },
      { input: matSvg, left: margin + fw, top: margin + fw },
      { input: painting, left: margin + fw + mat, top: margin + fw + mat },
    ])
    .keepIccProfile()
    .png()
    .toBuffer()
}
