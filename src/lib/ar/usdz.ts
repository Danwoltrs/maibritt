import { zipSync, type ZipOptions } from 'fflate'
import {
  buildArtworkModel, hexToLinearRgb, CANVAS_EDGE_HEX, type ArMeshData,
} from './geometry'
import type { ArBuildOptions } from './glb'

const f = (v: number) => {
  const s = v.toFixed(4)
  return s === '-0.0000' ? '0.0000' : s
}

function pointsAttr(data: ArMeshData): string {
  const pts: string[] = []
  for (let i = 0; i < data.positions.length; i += 3) {
    pts.push(`(${f(data.positions[i])}, ${f(data.positions[i + 1])}, ${f(data.positions[i + 2])})`)
  }
  return pts.join(', ')
}

function normalsAttr(data: ArMeshData): string {
  const ns: string[] = []
  for (let i = 0; i < data.normals.length; i += 3) {
    ns.push(`(${f(data.normals[i])}, ${f(data.normals[i + 1])}, ${f(data.normals[i + 2])})`)
  }
  return ns.join(', ')
}

/** USD st convention flips V relative to the glTF UVs stored in geometry. */
function stAttr(data: ArMeshData): string {
  const st: string[] = []
  for (let i = 0; i < (data.uvs?.length ?? 0); i += 2) {
    st.push(`(${f(data.uvs![i])}, ${f(1 - data.uvs![i + 1])})`)
  }
  return st.join(', ')
}

function extentAttr(data: ArMeshData): string {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < data.positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], data.positions[i + a])
      max[a] = Math.max(max[a], data.positions[i + a])
    }
  }
  return `[(${min.map(f).join(', ')}), (${max.map(f).join(', ')})]`
}

function meshBlock(name: string, data: ArMeshData, materialPath: string): string {
  const counts = new Array(data.quadCount).fill(4).join(', ')
  const indices = Array.from({ length: data.quadCount * 4 }, (_, i) => i).join(', ')
  const st = data.uvs
    ? `\n        texCoord2f[] primvars:st = [${stAttr(data)}] (\n            interpolation = "vertex"\n        )`
    : ''
  return `
    def Mesh "${name}" (
        prepend apiSchemas = ["MaterialBindingAPI"]
    )
    {
        uniform bool doubleSided = 0
        float3[] extent = ${extentAttr(data)}
        int[] faceVertexCounts = [${counts}]
        int[] faceVertexIndices = [${indices}]
        rel material:binding = ${materialPath}
        normal3f[] normals = [${normalsAttr(data)}] (
            interpolation = "vertex"
        )
        point3f[] points = [${pointsAttr(data)}]${st}
        uniform token subdivisionScheme = "none"
    }`
}

function colorMaterial(name: string, hex: string): string {
  const [r, g, b] = hexToLinearRgb(hex)
  return `
        def Material "${name}"
        {
            token outputs:surface.connect = </Artwork/Materials/${name}/Surface.outputs:surface>

            def Shader "Surface"
            {
                uniform token info:id = "UsdPreviewSurface"
                color3f inputs:diffuseColor = (${f(r)}, ${f(g)}, ${f(b)})
                float inputs:metallic = 0
                float inputs:roughness = 0.8
                token outputs:surface
            }
        }`
}

export function buildUsda(opts: ArBuildOptions): string {
  const model = buildArtworkModel(opts.widthCm, opts.heightCm, opts.frameWidthFrac)
  return `#usda 1.0
(
    customLayerData = {
        string creator = "maibrittwolthers.com AR generator"
    }
    defaultPrim = "Artwork"
    metersPerUnit = 1
    upAxis = "Y"
)

def Xform "Artwork" (
    prepend apiSchemas = ["Preliminary_AnchoringAPI"]
)
{
    uniform token preliminary:anchoring:type = "plane"
    uniform token preliminary:planeAnchoring:alignment = "vertical"
${meshBlock('Painting', model.painting, '</Artwork/Materials/PaintingMat>')}
${meshBlock('CanvasBody', model.canvas, '</Artwork/Materials/CanvasMat>')}
${meshBlock('Frame', model.frame, '</Artwork/Materials/WoodMat>')}

    def Scope "Materials"
    {
        def Material "PaintingMat"
        {
            token outputs:surface.connect = </Artwork/Materials/PaintingMat/Surface.outputs:surface>

            def Shader "Surface"
            {
                uniform token info:id = "UsdPreviewSurface"
                color3f inputs:diffuseColor.connect = </Artwork/Materials/PaintingMat/Tex.outputs:rgb>
                float inputs:metallic = 0
                float inputs:roughness = 0.9
                token outputs:surface
            }

            def Shader "Primvar"
            {
                uniform token info:id = "UsdPrimvarReader_float2"
                string inputs:varname = "st"
                float2 outputs:result
            }

            def Shader "Tex"
            {
                uniform token info:id = "UsdUVTexture"
                asset inputs:file = @textures/painting.jpg@
                token inputs:sourceColorSpace = "sRGB"
                float2 inputs:st.connect = </Artwork/Materials/PaintingMat/Primvar.outputs:result>
                token inputs:wrapS = "clamp"
                token inputs:wrapT = "clamp"
                color3f outputs:rgb
            }
        }
${colorMaterial('CanvasMat', CANVAS_EDGE_HEX)}
${colorMaterial('WoodMat', opts.woodHex)}
    }
}
`
}

/** Store-only zip with every entry's DATA offset 64-byte aligned (USDZ spec).
 *  Alignment padding rides in the local-header extra field (id 12345), the
 *  same technique three.js's USDZExporter uses. */
export function packUsdz(entries: Record<string, Uint8Array>): Uint8Array {
  const files: Record<string, [Uint8Array, ZipOptions & { extra?: Record<number, Uint8Array> }]> = {}
  let offset = 0
  for (const [name, data] of Object.entries(entries)) {
    const headerBase = 30 + name.length          // local header without extra field
    const dataStart = offset + headerBase
    const rem = dataStart & 63
    if (rem === 0) {
      files[name] = [data, { level: 0 }]
      offset = dataStart + data.length
    } else {
      // extra field = 4-byte id+size header + padding bytes
      let padTotal = 64 - rem
      if (padTotal < 4) padTotal += 64
      files[name] = [data, { level: 0, extra: { 12345: new Uint8Array(padTotal - 4) } }]
      offset = dataStart + padTotal + data.length
    }
  }
  return zipSync(files as Parameters<typeof zipSync>[0])
}

export function buildUsdz(opts: ArBuildOptions): Uint8Array {
  const usda = new TextEncoder().encode(buildUsda(opts))
  return packUsdz({
    'model.usda': usda,                    // must be the FIRST file in the package
    'textures/painting.jpg': opts.textureJpeg,
  })
}
