import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { StorageService } from '@/services/storage.service'
import { qualifiesForAr, arModelHash } from '@/lib/ar/eligibility'
import { prepareTexture } from '@/lib/ar/texture'
import { buildGlb } from '@/lib/ar/glb'
import { buildUsdz } from '@/lib/ar/usdz'
import { FRAME_PRESETS } from '@/lib/framing/presets'

export const runtime = 'nodejs'
export const maxDuration = 60

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Public endpoint: artworks are public, and generation inputs come solely
 * from the artwork's own DB row (no user-supplied URLs -> no SSRF surface).
 * Output files are content-addressed, so repeat calls are cache hits. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ artworkId: string }> },
) {
  const { artworkId } = await params
  if (!UUID_RE.test(artworkId)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  try {
    const client = supabaseAdmin ?? supabase
    const { data, error } = await client
      .from('artworks')
      .select('id, category, height_cm, width_cm, images')
      .eq('id', artworkId)
      .single()
    if (error || !data) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const q = qualifiesForAr(data)
    if (!q.ok) return NextResponse.json({ error: q.reason }, { status: 422 })

    const hash = arModelHash(q)
    const baseName = `${artworkId}-${hash}`

    // Cache check: both files already generated?
    const { data: existing } = await client.storage
      .from('artworks')
      .list('ar', { search: baseName })
    const have = new Set((existing ?? []).map(f => f.name))
    const publicUrl = (kind: 'glb' | 'usdz') =>
      client.storage.from('artworks').getPublicUrl(`ar/${baseName}.${kind}`).data.publicUrl
    if (have.has(`${baseName}.glb`) && have.has(`${baseName}.usdz`)) {
      return NextResponse.json({ glb: publicUrl('glb'), usdz: publicUrl('usdz') })
    }

    // Generate. Image URL comes from our own DB row (Supabase public URL).
    const imgRes = await fetch(q.imageUrl, { signal: AbortSignal.timeout(15_000) })
    if (!imgRes.ok) return NextResponse.json({ error: 'image_fetch_failed' }, { status: 500 })
    const textureJpeg = await prepareTexture(Buffer.from(await imgRes.arrayBuffer()))

    const preset = FRAME_PRESETS[q.presetKey]
    const buildOpts = {
      widthCm: q.widthCm,
      heightCm: q.heightCm,
      textureJpeg,
      woodHex: preset.woodHex,
      frameWidthFrac: preset.frameWidthFrac,
    }
    const [glbBytes, usdzBytes] = [await buildGlb(buildOpts), buildUsdz(buildOpts)]

    const [glb, usdz] = await Promise.all([
      StorageService.uploadArModel(baseName, 'glb', glbBytes),
      StorageService.uploadArModel(baseName, 'usdz', usdzBytes),
    ])
    return NextResponse.json({ glb, usdz })
  } catch (e) {
    console.error('AR model generation failed', e)
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 })
  }
}
