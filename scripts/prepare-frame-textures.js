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
