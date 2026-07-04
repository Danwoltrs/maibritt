import { describe, it, expect } from 'vitest'
import { buildUsdz, buildUsda, packUsdz } from './usdz'

const TINY_JPEG = Uint8Array.from(Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA' +
  'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==', 'base64'))

const OPTS = { widthCm: 285, heightCm: 185, textureJpeg: TINY_JPEG, woodHex: '#C6A678' }

/** Walk zip local file headers. */
function localEntries(buf: Uint8Array) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const out: { name: string; method: number; dataOffset: number; size: number }[] = []
  let p = 0
  while (p + 30 <= buf.length && dv.getUint32(p, true) === 0x04034b50) {
    const method = dv.getUint16(p + 8, true)
    const size = dv.getUint32(p + 18, true)
    const nameLen = dv.getUint16(p + 26, true)
    const extraLen = dv.getUint16(p + 28, true)
    const name = new TextDecoder().decode(buf.subarray(p + 30, p + 30 + nameLen))
    const dataOffset = p + 30 + nameLen + extraLen
    out.push({ name, method, dataOffset, size })
    p = dataOffset + size
  }
  return out
}

describe('buildUsda', () => {
  const usda = buildUsda(OPTS)
  it('declares real-world scale and vertical wall anchoring', () => {
    expect(usda).toContain('metersPerUnit = 1')
    expect(usda).toContain('upAxis = "Y"')
    expect(usda).toContain('prepend apiSchemas = ["Preliminary_AnchoringAPI"]')
    expect(usda).toContain('uniform token preliminary:anchoring:type = "plane"')
    expect(usda).toContain('uniform token preliminary:planeAnchoring:alignment = "vertical"')
  })
  it('rotates the upright geometry into ARKit wall-anchor space (X-Z = wall, +Y = out)', () => {
    expect(usda).toContain('float xformOp:rotateX = -90')
    expect(usda).toContain('uniform token[] xformOpOrder = ["xformOp:rotateX"]')
  })
  it('meshes reference the packed texture and true-size points', () => {
    expect(usda).toContain('@textures/painting.jpg@')
    expect(usda).toContain('1.425')   // half width in meters (285cm/2)
    expect(usda).toContain('0.925')   // half height in meters (185cm/2)
  })
})

describe('packUsdz / buildUsdz', () => {
  it('is a store-only zip, usda first, all data offsets 64-byte aligned', () => {
    const usdz = buildUsdz(OPTS)
    const entries = localEntries(usdz)
    expect(entries.length).toBe(2)
    expect(entries[0].name).toBe('model.usda')
    expect(entries[1].name).toBe('textures/painting.jpg')
    for (const e of entries) {
      expect(e.method).toBe(0)            // stored, no deflate
      expect(e.dataOffset % 64).toBe(0)   // USDZ spec alignment
    }
  })
  it('aligns regardless of entry sizes', () => {
    for (const padTo of [1, 63, 64, 100, 1000]) {
      const entries = {
        'model.usda': new Uint8Array(padTo).fill(65),
        'b.jpg': new Uint8Array(17).fill(66),
        'c.jpg': new Uint8Array(3).fill(67),
      }
      const zip = packUsdz(entries)
      for (const e of localEntries(zip)) expect(e.dataOffset % 64).toBe(0)
    }
  })
})
