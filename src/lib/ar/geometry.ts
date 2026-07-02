/** Framed-canvas AR geometry. Meters, Y-up, back of the frame at z=0 (flush
 *  with the wall), +z out of the wall. Origin centered on the wall face. */

export const CANVAS_DEPTH_M = 0.04   // stretched-canvas depth
export const FRAME_DEPTH_M = 0.055   // floater frame depth (canvas sits recessed)
export const GAP_FRAC = 0.010        // floater reveal gap, fraction of long edge

export interface ArMeshData {
  positions: number[]      // xyz, 4 unique verts per quad, quad-by-quad
  normals: number[]
  uvs: number[] | null     // glTF convention: v=0 at image top
  quadCount: number
}

export interface ArModel {
  painting: ArMeshData
  canvas: ArMeshData
  frame: ArMeshData
  outerWidthM: number
  outerHeightM: number
  depthM: number
}

function emptyMesh(): ArMeshData {
  return { positions: [], normals: [], uvs: null, quadCount: 0 }
}

/** Push one quad (4 verts, CCW as seen from the normal side). */
function pushQuad(
  mesh: ArMeshData,
  verts: [number, number, number][],
  normal: [number, number, number],
  uvs?: [number, number][],
) {
  for (let i = 0; i < 4; i++) {
    mesh.positions.push(...verts[i])
    mesh.normals.push(...normal)
    if (uvs) {
      if (!mesh.uvs) mesh.uvs = []
      mesh.uvs.push(...uvs[i])
    }
  }
  mesh.quadCount++
}

/** Axis-aligned box as 6 quads with outward normals. skipFront omits the +z face. */
function pushBox(
  mesh: ArMeshData,
  x0: number, x1: number, y0: number, y1: number, z0: number, z1: number,
  opts: { skipFront?: boolean } = {},
) {
  if (!opts.skipFront) {
    pushQuad(mesh, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1])
  }
  pushQuad(mesh, [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1]) // back
  pushQuad(mesh, [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0])  // top
  pushQuad(mesh, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0]) // bottom
  pushQuad(mesh, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0]) // left
  pushQuad(mesh, [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0])  // right
}

export function buildArtworkModel(
  widthCm: number,
  heightCm: number,
  frameWidthFrac = 0.022,
): ArModel {
  const w = widthCm / 100
  const h = heightCm / 100
  const long = Math.max(w, h)
  const gap = GAP_FRAC * long
  const fw = frameWidthFrac * long

  const painting = emptyMesh()
  const canvas = emptyMesh()
  const frame = emptyMesh()

  // Painting face: single textured quad at the canvas front.
  const zf = CANVAS_DEPTH_M
  pushQuad(
    painting,
    [[-w / 2, -h / 2, zf], [w / 2, -h / 2, zf], [w / 2, h / 2, zf], [-w / 2, h / 2, zf]],
    [0, 0, 1],
    [[0, 1], [1, 1], [1, 0], [0, 0]], // glTF UVs: v=0 is the image top
  )

  // Canvas body: box without its front face (the painting quad replaces it).
  pushBox(canvas, -w / 2, w / 2, -h / 2, h / 2, 0, CANVAS_DEPTH_M, { skipFront: true })

  // Floater frame: left/right run full outer height; top/bottom butt between them.
  const ix = w / 2 + gap          // inner frame edge (x)
  const iy = h / 2 + gap          // inner frame edge (y)
  const ox = ix + fw              // outer edge (x)
  const oy = iy + fw              // outer edge (y)
  pushBox(frame, -ox, -ix, -oy, oy, 0, FRAME_DEPTH_M)  // left
  pushBox(frame, ix, ox, -oy, oy, 0, FRAME_DEPTH_M)    // right
  pushBox(frame, -ix, ix, iy, oy, 0, FRAME_DEPTH_M)    // top
  pushBox(frame, -ix, ix, -oy, -iy, 0, FRAME_DEPTH_M)  // bottom

  return {
    painting, canvas, frame,
    outerWidthM: 2 * ox,
    outerHeightM: 2 * oy,
    depthM: FRAME_DEPTH_M,
  }
}

/** sRGB hex -> linear RGB triplet (glTF baseColorFactor / USD diffuseColor are linear). */
export function hexToLinearRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  const s = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => v / 255)
  const lin = s.map(c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return [lin[0], lin[1], lin[2]]
}

/** Raw-canvas edge color (sides of the stretched canvas). */
export const CANVAS_EDGE_HEX = '#EFEAE2'
