# Photoreal Mitered Frames Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat-swatch frame renderer with the approved photoreal look — real wood-grain photos, true 45° mitered corners, moulding-profile depth, floater contact shadows — behind the unchanged `composeFrame(painting, preset)` API.

**Architecture:** A one-time bake script turns CC0 grain photos into normalized (grain-vertical) JPEG assets in `public/frames/`. A new `src/lib/framing/miter.ts` builds the mitered frame ring (4 rails, per-side grain crop, profile shading, miter masks + seams). `frame.ts` is rewritten to composite: wall gradient → two-layer shadow → mitered ring → recess/mat → painting (last, untouched). Presets keep their keys, labels, `frameWidthFrac`, `woodHex` — so **no `AR_MODEL_VERSION` bump** is needed.

**Tech Stack:** sharp (server-side), SVG buffers for masks/gradients, Vitest.

## Global Constraints

- Never tint, cover, or resample the painting: it is composited last, unmodified; all shading lives outside its bounds.
- Deterministic: no randomness; per-side grain offsets are fixed constants. Two runs must be byte-identical.
- Must work for arbitrary aspect ratios (portrait/landscape/square).
- Keep `composeFrame(painting: Buffer, preset: FramePreset): Promise<Buffer>` signature — `pipeline.ts` is untouched.
- Do NOT change `woodHex` / `frameWidthFrac` / preset keys (AR model contract; changing them requires bumping `AR_MODEL_VERSION` — avoided).
- Bilingual labels unchanged. Files under ~2000 lines. `keepIccProfile()` on final output.
- Reference look: `scripts/frame-mockup-prototype.js` (the approved Phase-1 mockups). Textures: `scripts/frame-mockup-assets/*.jpg` (CC0, Polyhaven).
- Only stage files this plan touches — the working tree has unrelated edits.

---

### Task 1: Bake real-grain texture assets + point presets at them

**Files:**
- Create: `scripts/prepare-frame-textures.js`
- Create (generated): `public/frames/real-oak.jpg`, `public/frames/real-ash.jpg`, `public/frames/real-walnut.jpg`, `public/frames/real-black.jpg`
- Modify: `src/lib/framing/presets.ts` (texturePath values only)
- Delete: `public/frames/oak.png`, `ash.png`, `walnut.png`, `black.png`

**Interfaces:**
- Produces: baked JPEGs, grain running **vertically**, tone pre-baked (no runtime modulate), 1024px long edge. `FRAME_PRESETS[key].texturePath` points at them.

- [x] **Step 1: Write the bake script**

```js
// scripts/prepare-frame-textures.js
// One-time bake: CC0 grain photos (scripts/frame-mockup-assets, Polyhaven) ->
// normalized frame textures. Grain vertical, tone pre-baked, 1024px, q82.
// Run from repo root: node scripts/prepare-frame-textures.js
const sharp = require('sharp')
const path = require('path')

const SRC = path.join(__dirname, 'frame-mockup-assets')
const OUT = path.join(__dirname, '..', 'public', 'frames')

const BAKES = [
  { out: 'real-oak.jpg',    src: 'oak_veneer_01.jpg',  rotate: 0,  mod: { brightness: 1.06, saturation: 0.96 } },
  { out: 'real-ash.jpg',    src: 'plywood.jpg',        rotate: 0,  mod: { brightness: 1.16, saturation: 0.65 } },
  { out: 'real-walnut.jpg', src: 'dark_wood.jpg',      rotate: 90, mod: { brightness: 1.02, saturation: 0.72, hue: -8 } },
  { out: 'real-black.jpg',  src: 'wood_table_001.jpg', rotate: 0,  mod: { brightness: 0.34, saturation: 0.25 } },
]

async function main() {
  for (const b of BAKES) {
    let img = sharp(path.join(SRC, b.src))
    if (b.rotate) img = img.rotate(b.rotate)
    await img.modulate(b.mod)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toFile(path.join(OUT, b.out))
    console.log('baked', b.out)
  }
}
main().catch(e => { console.error(e); process.exit(1) })
```

- [x] **Step 2: Run it and delete old swatches**

Run: `node scripts/prepare-frame-textures.js && rm public/frames/{oak,ash,walnut,black}.png && ls public/frames/`
Expected: `real-oak.jpg real-ash.jpg real-walnut.jpg real-black.jpg` (plus nothing else).

- [x] **Step 3: Update presets.ts texture paths** (only `texturePath` values change)

```ts
'oak-floater':   { ...texturePath: 'public/frames/real-oak.jpg'... }
'ash-floater':   { ...texturePath: 'public/frames/real-ash.jpg'... }
'walnut-floater':{ ...texturePath: 'public/frames/real-walnut.jpg'... }
'black-floater': { ...texturePath: 'public/frames/real-black.jpg'... }
'oak-mat':       { ...texturePath: 'public/frames/real-oak.jpg'... }
```

- [x] **Step 4: Run preset tests**

Run: `npx vitest run src/lib/framing/presets.test.ts`
Expected: PASS (tests don't assert texture paths).

- [x] **Step 5: Commit**

```bash
git add scripts/prepare-frame-textures.js scripts/frame-mockup-assets public/frames src/lib/framing/presets.ts
git commit -m "feat(framing): bake real wood-grain textures (CC0) for the frame renderer"
```

---

### Task 2: Mitered frame ring builder (`miter.ts`)

**Files:**
- Create: `src/lib/framing/miter.ts`
- Test: `src/lib/framing/miter.test.ts`

**Interfaces:**
- Consumes: baked textures from Task 1 (grain vertical).
- Produces: `miteredFrame(texPath: string, frameW: number, frameH: number, t: number): Promise<Buffer>` — RGBA PNG buffer, frameW×frameH, opaque wood ring of thickness `t` with 45° miters + seams, fully transparent centre.

- [x] **Step 1: Write the failing test**

```ts
// src/lib/framing/miter.test.ts
import { describe, it, expect } from 'vitest'
import path from 'path'
import sharp from 'sharp'
import { miteredFrame } from './miter'

const TEX = path.join(process.cwd(), 'public/frames/real-oak.jpg')

describe('miteredFrame', () => {
  it('renders an opaque ring with a transparent centre at exact size', async () => {
    const buf = await miteredFrame(TEX, 400, 300, 24)
    const meta = await sharp(buf).metadata()
    expect(meta.width).toBe(400)
    expect(meta.height).toBe(300)
    const raw = await sharp(buf).raw().toBuffer()
    const px = (x: number, y: number) => raw[(y * 400 + x) * 4 + 3] // alpha
    expect(px(200, 150)).toBe(0)    // centre transparent
    expect(px(200, 6)).toBe(255)    // top rail opaque
    expect(px(6, 150)).toBe(255)    // left rail opaque
    expect(px(200, 293)).toBe(255)  // bottom rail opaque
  })

  it('is deterministic (two runs byte-identical)', async () => {
    const a = await miteredFrame(TEX, 300, 220, 16)
    const b = await miteredFrame(TEX, 300, 220, 16)
    expect(Buffer.compare(a, b)).toBe(0)
  })

  it('handles landscape, portrait and tiny thickness', async () => {
    for (const [w, h, t] of [[500, 200, 12], [200, 500, 12], [120, 120, 4]] as const) {
      const meta = await sharp(await miteredFrame(TEX, w, h, t)).metadata()
      expect(meta.width).toBe(w)
      expect(meta.height).toBe(h)
    }
  })
})
```

- [x] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/framing/miter.test.ts`
Expected: FAIL — `Cannot find module './miter'`.

- [x] **Step 3: Implement `miter.ts`** (port of the approved prototype, texture tone pre-baked)

```ts
// src/lib/framing/miter.ts
import sharp from 'sharp'

type Side = 'top' | 'bottom' | 'left' | 'right'
const SIDES: Side[] = ['top', 'bottom', 'left', 'right']

/** Fixed per-side crop offsets so the four rails show different grain (deterministic). */
const GRAIN_OFFSET: Record<Side, number> = { top: 0.05, right: 0.30, bottom: 0.55, left: 0.78 }

/** Slight per-side luminance (anisotropic reflection) — this is what sells the miter. */
const SIDE_LUM: Record<Side, number> = { top: 1.05, left: 1.0, right: 0.955, bottom: 0.915 }

/** A wood strip (length × t) with grain running along its length.
 *  Baked textures have vertical grain, so rotate 90° to get it horizontal. */
async function woodStrip(texPath: string, length: number, t: number, side: Side): Promise<Buffer> {
  const meta = await sharp(texPath).metadata()
  const w = meta.height!, h = meta.width! // dimensions after rotate(90)
  const sliceH = Math.max(1, Math.min(h, Math.max(Math.round(h * 0.16), Math.round(t * (w / length)))))
  const top = Math.max(0, Math.min(h - sliceH, Math.round(h * GRAIN_OFFSET[side])))
  return sharp(texPath).rotate(90)
    .extract({ left: 0, top, width: w, height: sliceH })
    .resize(length, t, { fit: 'fill' })
    .toBuffer()
}

/** Moulding profile across the strip: outer arris → sheen → flat face → lip highlight → rebate. */
function profileSvg(length: number, t: number, side: Side): Buffer {
  const dir = {
    top: { x1: 0, y1: 0, x2: 0, y2: 1 }, bottom: { x1: 0, y1: 1, x2: 0, y2: 0 },
    left: { x1: 0, y1: 0, x2: 1, y2: 0 }, right: { x1: 1, y1: 0, x2: 0, y2: 0 },
  }[side]
  const vertical = side === 'left' || side === 'right'
  const w = vertical ? t : length
  const h = vertical ? length : t
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs>` +
    `<linearGradient id="g" x1="${dir.x1}" y1="${dir.y1}" x2="${dir.x2}" y2="${dir.y2}">` +
    `<stop offset="0" stop-color="black" stop-opacity="0.30"/>` +
    `<stop offset="0.06" stop-color="white" stop-opacity="0.09"/>` +
    `<stop offset="0.20" stop-color="black" stop-opacity="0.05"/>` +
    `<stop offset="0.62" stop-color="black" stop-opacity="0"/>` +
    `<stop offset="0.86" stop-color="white" stop-opacity="0.14"/>` +
    `<stop offset="1" stop-color="black" stop-opacity="0.38"/>` +
    `</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`)
}

/** Trapezoid alpha mask (45° miter cuts) for one side, on the full frame rect. */
function miterMask(frameW: number, frameH: number, t: number, side: Side): Buffer {
  const pts = {
    top: `0,0 ${frameW},0 ${frameW - t},${t} ${t},${t}`,
    bottom: `0,${frameH} ${frameW},${frameH} ${frameW - t},${frameH - t} ${t},${frameH - t}`,
    left: `0,0 ${t},${t} ${t},${frameH - t} 0,${frameH}`,
    right: `${frameW},0 ${frameW},${frameH} ${frameW - t},${frameH - t} ${frameW - t},${t}`,
  }[side]
  return Buffer.from(
    `<svg width="${frameW}" height="${frameH}" xmlns="http://www.w3.org/2000/svg">` +
    `<polygon points="${pts}" fill="white"/></svg>`)
}

/** Fine 45° joint lines corner→corner plus a crisp outer arris outline. */
function seamsSvg(frameW: number, frameH: number, t: number): Buffer {
  const outer = ['0,0', `${frameW},0`, `${frameW},${frameH}`, `0,${frameH}`]
  const inner = [`${t},${t}`, `${frameW - t},${t}`, `${frameW - t},${frameH - t}`, `${t},${frameH - t}`]
  const lines = outer.map((o, i) => {
    const [ox, oy] = o.split(','), [ix, iy] = inner[i].split(',')
    return `<line x1="${ox}" y1="${oy}" x2="${ix}" y2="${iy}" stroke="black" stroke-opacity="0.28" stroke-width="1.2"/>` +
           `<line x1="${ox}" y1="${oy}" x2="${ix}" y2="${iy}" stroke="white" stroke-opacity="0.10" stroke-width="0.6" transform="translate(0.8,0)"/>`
  }).join('')
  return Buffer.from(
    `<svg width="${frameW}" height="${frameH}" xmlns="http://www.w3.org/2000/svg">${lines}` +
    `<rect x="0.5" y="0.5" width="${frameW - 1}" height="${frameH - 1}" fill="none" stroke="black" stroke-opacity="0.35" stroke-width="1"/></svg>`)
}

/** The full mitered frame ring (transparent centre) as one frameW×frameH RGBA layer. */
export async function miteredFrame(texPath: string, frameW: number, frameH: number, t: number): Promise<Buffer> {
  const blank = { create: { width: frameW, height: frameH, channels: 4 as const, background: { r: 0, g: 0, b: 0, alpha: 0 } } }
  const layers: sharp.OverlayOptions[] = []
  for (const side of SIDES) {
    const vertical = side === 'left' || side === 'right'
    const len = vertical ? frameH : frameW
    let strip = await woodStrip(texPath, len, t, side)
    if (side === 'left') strip = await sharp(strip).rotate(90).toBuffer()
    if (side === 'right') strip = await sharp(strip).rotate(270).toBuffer()
    strip = await sharp(strip)
      .composite([{ input: profileSvg(len, t, side) }])
      .modulate({ brightness: SIDE_LUM[side] })
      .toBuffer()
    const pos = {
      top: { left: 0, top: 0 }, bottom: { left: 0, top: frameH - t },
      left: { left: 0, top: 0 }, right: { left: frameW - t, top: 0 },
    }[side]
    const onCanvas = await sharp(blank)
      .composite([{ input: strip, left: pos.left, top: pos.top }])
      .png().toBuffer()
    const masked = await sharp(onCanvas)
      .composite([{ input: miterMask(frameW, frameH, t, side), blend: 'dest-in' }])
      .png().toBuffer()
    layers.push({ input: masked, left: 0, top: 0 })
  }
  layers.push({ input: seamsSvg(frameW, frameH, t), left: 0, top: 0 })
  return sharp(blank).composite(layers).png().toBuffer()
}
```

- [x] **Step 4: Run tests**

Run: `npx vitest run src/lib/framing/miter.test.ts`
Expected: PASS (3 tests).

- [x] **Step 5: Commit**

```bash
git add src/lib/framing/miter.ts src/lib/framing/miter.test.ts
git commit -m "feat(framing): mitered frame ring builder with real grain and profile shading"
```

---

### Task 3: Rewrite `frame.ts` on the mitered ring; retire `bevelSvg`

**Files:**
- Modify: `src/lib/framing/frame.ts` (full rewrite, same exported API)
- Modify: `src/lib/framing/shadows.ts` (delete `bevelSvg`; keep `makeShadow`)
- Modify: `src/lib/framing/shadows.test.ts` (drop the `bevelSvg` test)
- Test: `src/lib/framing/frame.test.ts` (existing tests must pass; add fidelity/determinism tests)

**Interfaces:**
- Consumes: `miteredFrame` (Task 2), `makeShadow(w, h, sigma, opacity)` (existing).
- Produces: `composeFrame(painting: Buffer, preset: FramePreset): Promise<Buffer>` — unchanged signature, used by `pipeline.ts`.

- [x] **Step 1: Add failing tests to `frame.test.ts`**

```ts
  it('is deterministic and preserves painting pixels exactly (floater)', async () => {
    const art = await redPainting(320, 240)
    const out1 = await composeFrame(art, FRAME_PRESETS['walnut-floater'])
    const out2 = await composeFrame(art, FRAME_PRESETS['walnut-floater'])
    expect(Buffer.compare(out1, out2)).toBe(0)
    // Painting corner pixel (just inside its bounds) must be the exact source red.
    const meta = await sharp(out1).metadata()
    const raw = await sharp(out1).raw().toBuffer()
    const W = meta.width!, ch = meta.channels!
    const ox = (W - 320) / 2, oy = (meta.height! - 240) / 2 // painting is centred
    const at = (x: number, y: number) => [raw[(y * W + x) * ch], raw[(y * W + x) * ch + 1], raw[(y * W + x) * ch + 2]]
    for (const [x, y] of [[ox + 1, oy + 1], [ox + 318, oy + 238], [ox + 160, oy + 120]] as const) {
      const [r, g, b] = at(Math.round(x), Math.round(y))
      expect([r, g, b]).toEqual([200, 30, 30])
    }
  })

  it('handles extreme landscape aspect', async () => {
    const art = await redPainting(600, 150)
    const meta = await sharp(await composeFrame(art, FRAME_PRESETS['black-floater'])).metadata()
    expect(meta.width!).toBeGreaterThan(600)
    expect(meta.height!).toBeGreaterThan(150)
  })
```

- [x] **Step 2: Run to verify the new fidelity test fails** (current renderer overlays `bevelSvg` ON the painting corners — the old look literally tints the art edge)

Run: `npx vitest run src/lib/framing/frame.test.ts`
Expected: FAIL on the exact-pixel assertions (bevel overlay changes corner pixels).

- [x] **Step 3: Rewrite `frame.ts`**

```ts
// src/lib/framing/frame.ts
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
```

- [x] **Step 4: Delete `bevelSvg` from `shadows.ts` and its test from `shadows.test.ts`** (keep `makeShadow` + its test; remove the unused import if any).

- [x] **Step 5: Run the framing test suite**

Run: `npx vitest run src/lib/framing`
Expected: PASS — all frame/miter/presets/shadows tests green.

- [x] **Step 6: Commit**

```bash
git add src/lib/framing
git commit -m "feat(framing): photoreal mitered frames — real grain, profile depth, layered shadows"
```

---

### Task 4: Full verification + refreshed samples

**Files:**
- Create: `scripts/render-frame-samples.js` (dev utility, uses the baked textures via the compiled behaviour — renders through vitest is overkill; call the TS via a one-off test) → simpler: Create `src/lib/framing/frame.samples.test.ts` (env-gated sample writer)

**Interfaces:**
- Consumes: `composeFrame` (Task 3).

- [x] **Step 1: Add the env-gated sample writer test**

```ts
// src/lib/framing/frame.samples.test.ts
// Not a real assertion suite — renders one sample per preset for eyeballing.
// Only writes when FRAME_SAMPLE_DIR is set:
//   FRAME_SAMPLE_DIR=/tmp/frames npx vitest run src/lib/framing/frame.samples.test.ts
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { composeFrame } from './frame'
import { FRAME_PRESETS } from './presets'

describe('frame samples', () => {
  it('renders every preset on a non-square painting', async () => {
    const dir = process.env.FRAME_SAMPLE_DIR
    const art = await sharp({ create: { width: 900, height: 720, channels: 3, background: { r: 188, g: 40, b: 36 } } })
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
```

- [x] **Step 2: Run the entire test suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests PASS; tsc clean on framing/enhance files (pre-existing errors in untracked `exhibitions/page.tsx` / stale `.next` types are known and unrelated).

- [x] **Step 3: Render real samples with a real painting and eyeball them**

Run: `FRAME_SAMPLE_DIR=<scratchpad>/pipeline-samples npx vitest run src/lib/framing/frame.samples.test.ts`
Then render the stand-in painting through `composeFrame` for all presets and visually compare against the approved Phase-1 mockups (grain, miters, shadows, no white margins, painting pixels untouched).

- [x] **Step 4: Commit**

```bash
git add src/lib/framing/frame.samples.test.ts
git commit -m "test(framing): env-gated sample renderer for visual checks"
```

---

## Self-review notes

- Spec coverage: real grain ✓, miters ✓, depth ✓, arbitrary aspect ✓, deterministic/fast ✓ (no AI, ~15 sharp ops), painting untouched ✓ (exact-pixel test), AR contract ✓ (woodHex/frameWidthFrac/keys unchanged → no version bump), bilingual labels ✓ (untouched), floater vs matted families ✓, engraving default ✓ (untouched logic).
- ash-floater had no Phase-1 mockup; it uses the same renderer with the baked ash texture — flagged for Mai-Britt's later review.
- `pipeline.ts` untouched; `composeFrame` failure still falls back to unframed (existing try/catch).
