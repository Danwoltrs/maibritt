import sharp from 'sharp'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import type { Pt, Quad } from './types'
import { quadPoints } from './quad'

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

/** Solve an 8x8 linear system by Gaussian elimination with partial pivoting. */
function gaussianSolve(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r
    ;[M[col], M[pivot]] = [M[pivot], M[col]]
    const pv = M[col][col] || 1e-12
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col] / pv
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c]
    }
  }
  return M.map((row, i) => row[n] / (row[i] || 1e-12))
}

/**
 * Homography mapping `from[i]` -> `to[i]` for four correspondences.
 * Returns [a,b,c,d,e,f,g,h] with the implicit h33 = 1, so that
 *   x' = (aX + bY + c) / (gX + hY + 1),  y' = (dX + eY + f) / (gX + hY + 1).
 */
export function solveHomography(from: Pt[], to: Pt[]): number[] {
  const A: number[][] = []
  const rhs: number[] = []
  for (let i = 0; i < 4; i++) {
    const { x: X, y: Y } = from[i]
    const { x, y } = to[i]
    A.push([X, Y, 1, 0, 0, 0, -X * x, -Y * x]); rhs.push(x)
    A.push([0, 0, 0, X, Y, 1, -X * y, -Y * y]); rhs.push(y)
  }
  return gaussianSolve(A, rhs)
}

export function applyHomography(h: number[], X: number, Y: number): Pt {
  const denom = h[6] * X + h[7] * Y + 1
  return { x: (h[0] * X + h[1] * Y + h[2]) / denom, y: (h[3] * X + h[4] * Y + h[5]) / denom }
}

/** Pick the output rectangle size from the quad's edge lengths (in pixels). */
export function outputSize(cornersPx: Pt[]): { w: number; h: number } {
  const [tl, tr, br, bl] = cornersPx
  const w = Math.round(Math.max(dist(tl, tr), dist(bl, br)))
  const h = Math.round(Math.max(dist(tl, bl), dist(tr, br)))
  return { w: Math.max(1, w), h: Math.max(1, h) }
}

/**
 * De-keystone: warp the (normalized) quad of the canvas to a straight rectangle.
 * This crops, straightens (in-plane rotation), AND removes perspective in a
 * single bilinear resample — a geometric remap that never repaints the artwork,
 * so it respects the pipeline's fidelity invariant. The original ICC profile is
 * re-attached best-effort.
 */
export async function warpToRect(input: Buffer, quad: Quad): Promise<Buffer> {
  // Opaque RGB source (photos have no meaningful alpha). Reading — and writing —
  // 3 channels means the warp can never emit a transparent pixel, so downstream
  // framing cannot composite a hole into white.
  const { data, info } = await sharp(input, { failOn: 'none' }).removeAlpha().raw()
    .toBuffer({ resolveWithObject: true })
  const sw = info.width, sh = info.height

  // Normalized corners -> source pixels.
  const cornersPx = quadPoints(quad).map((p) => ({ x: p.x * sw, y: p.y * sh }))
  const { w: outW, h: outH } = outputSize(cornersPx)

  const dst: Pt[] = [{ x: 0, y: 0 }, { x: outW, y: 0 }, { x: outW, y: outH }, { x: 0, y: outH }]
  const H = solveHomography(dst, cornersPx) // output pixel -> source pixel

  const out = Buffer.alloc(outW * outH * 3)
  for (let Y = 0; Y < outH; Y++) {
    for (let X = 0; X < outW; X++) {
      const denom = H[6] * X + H[7] * Y + 1
      let sx = (H[0] * X + H[1] * Y + H[2]) / denom
      let sy = (H[3] * X + H[4] * Y + H[5]) / denom
      // CLAMP the source sample into the image. A corner sitting on the very edge, or
      // a near-degenerate / non-convex quad, would otherwise map some output pixels
      // outside the photo; clamping smears the nearest edge pixel instead of injecting
      // a transparent/white one. No white margin or clipped hole can ever enter.
      if (sx < 0) sx = 0; else if (sx > sw - 1) sx = sw - 1
      if (sy < 0) sy = 0; else if (sy > sh - 1) sy = sh - 1
      const o = (Y * outW + X) * 3
      const x0 = Math.floor(sx), y0 = Math.floor(sy)
      const x1 = Math.min(x0 + 1, sw - 1), y1 = Math.min(y0 + 1, sh - 1)
      const fx = sx - x0, fy = sy - y0
      const i00 = (y0 * sw + x0) * 3, i10 = (y0 * sw + x1) * 3
      const i01 = (y1 * sw + x0) * 3, i11 = (y1 * sw + x1) * 3
      for (let c = 0; c < 3; c++) {
        const top = data[i00 + c] * (1 - fx) + data[i10 + c] * fx
        const bot = data[i01 + c] * (1 - fx) + data[i11 + c] * fx
        out[o + c] = Math.round(top * (1 - fy) + bot * fy)
      }
    }
  }

  const encode = () => sharp(out, { raw: { width: outW, height: outH, channels: 3 } }).png()

  // Best-effort ICC preservation. sharp's withIccProfile takes a filename, so we
  // stage the original profile to a UNIQUE temp file (concurrent same-size warps
  // must not share a path — sharp reads it lazily at toBuffer()), then unlink it.
  const meta = await sharp(input).metadata().catch(() => null)
  if (meta?.icc) {
    const tmp = path.join(os.tmpdir(), `enh-icc-${process.pid}-${randomUUID()}.icc`)
    try {
      await fs.writeFile(tmp, meta.icc)
      return await encode().withIccProfile(tmp).toBuffer()
    } catch {
      // fall through to sRGB-assumed output
    } finally {
      fs.unlink(tmp).catch(() => {})
    }
  }
  return encode().toBuffer()
}
