import { Document, NodeIO, Material } from '@gltf-transform/core'
import {
  buildArtworkModel, hexToLinearRgb, CANVAS_EDGE_HEX, type ArMeshData,
} from './geometry'

export interface ArBuildOptions {
  widthCm: number
  heightCm: number
  textureJpeg: Uint8Array
  woodHex: string
  frameWidthFrac?: number
}

/** Quad soup -> two triangles per quad, sequential vertices. */
function triIndices(quadCount: number): Uint32Array {
  const idx = new Uint32Array(quadCount * 6)
  for (let q = 0; q < quadCount; q++) {
    const v = q * 4, t = q * 6
    idx[t] = v; idx[t + 1] = v + 1; idx[t + 2] = v + 2
    idx[t + 3] = v; idx[t + 4] = v + 2; idx[t + 5] = v + 3
  }
  return idx
}

export async function buildGlb(opts: ArBuildOptions): Promise<Uint8Array> {
  const model = buildArtworkModel(opts.widthCm, opts.heightCm, opts.frameWidthFrac)
  const doc = new Document()
  const buffer = doc.createBuffer()

  const tex = doc.createTexture('painting')
    .setImage(opts.textureJpeg)
    .setMimeType('image/jpeg')

  const matPainting = doc.createMaterial('painting')
    .setBaseColorTexture(tex)
    .setRoughnessFactor(0.9)
    .setMetallicFactor(0)
  const matCanvas = doc.createMaterial('canvasEdge')
    .setBaseColorFactor([...hexToLinearRgb(CANVAS_EDGE_HEX), 1])
    .setRoughnessFactor(1)
    .setMetallicFactor(0)
  const matWood = doc.createMaterial('wood')
    .setBaseColorFactor([...hexToLinearRgb(opts.woodHex), 1])
    .setRoughnessFactor(0.7)
    .setMetallicFactor(0)

  const mesh = doc.createMesh('artwork')
  const addPrim = (data: ArMeshData, material: Material) => {
    const prim = doc.createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3')
        .setArray(new Float32Array(data.positions)).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3')
        .setArray(new Float32Array(data.normals)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType('SCALAR')
        .setArray(triIndices(data.quadCount)).setBuffer(buffer))
      .setMaterial(material)
    if (data.uvs) {
      prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2')
        .setArray(new Float32Array(data.uvs)).setBuffer(buffer))
    }
    mesh.addPrimitive(prim)
  }
  addPrim(model.painting, matPainting)
  addPrim(model.canvas, matCanvas)
  addPrim(model.frame, matWood)

  const node = doc.createNode('Artwork').setMesh(mesh)
  doc.createScene('Scene').addChild(node)

  return new NodeIO().writeBinary(doc)
}
