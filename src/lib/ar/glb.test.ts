import { describe, it, expect } from 'vitest'
import { NodeIO } from '@gltf-transform/core'
import { buildGlb } from './glb'

// 1x1 red JPEG (smallest valid), base64
const TINY_JPEG = Uint8Array.from(Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA' +
  'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==', 'base64'))

describe('buildGlb', () => {
  it('produces a valid GLB with true-scale extents and an embedded JPEG', async () => {
    const glb = await buildGlb({
      widthCm: 285, heightCm: 185, textureJpeg: TINY_JPEG, woodHex: '#C6A678',
    })
    expect(glb.length).toBeGreaterThan(500)

    const doc = await new NodeIO().readBinary(glb)
    const root = doc.getRoot()
    expect(root.listTextures()).toHaveLength(1)
    expect(root.listTextures()[0].getMimeType()).toBe('image/jpeg')
    expect(root.listMaterials().length).toBe(3)

    // Union of POSITION accessor bounds must match the outer frame in meters.
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
    for (const mesh of root.listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const acc = prim.getAttribute('POSITION')!
        const pmin = acc.getMin([0, 0, 0]), pmax = acc.getMax([0, 0, 0])
        min = min.map((v, i) => Math.min(v, pmin[i]))
        max = max.map((v, i) => Math.max(v, pmax[i]))
      }
    }
    const long = 2.85, extra = 2 * (0.010 * long + 0.022 * long)
    expect(max[0] - min[0]).toBeCloseTo(2.85 + extra, 2)
    expect(max[1] - min[1]).toBeCloseTo(1.85 + extra, 2)
    expect(max[2] - min[2]).toBeCloseTo(0.055, 3)
  })
})
