import { NextRequest, NextResponse } from 'next/server'
import { enhanceToFramed } from '@/lib/enhance/pipeline'
import { StorageService } from '@/services/storage.service'
import { updateJob } from '@/services/imageJobs.service'
import { getRequestUser, isAllowedImageUrl, isValidBaseFileName } from '@/lib/enhance/guards'
import { isValidQuad } from '@/lib/enhance/quad'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  // 1. Auth check — must come before reading the body to avoid unnecessary work.
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let jobId: string | undefined
  try {
    const body = await req.json()
    jobId = body.jobId
    const { imageUrl, quad, presetKey, baseFileName, dewarp, flatten, color, aiFlatten } = body

    if (!imageUrl || !quad || !baseFileName) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    // 2. SSRF guard — only fetch from our own Supabase artworks bucket.
    if (!isAllowedImageUrl(imageUrl)) {
      return NextResponse.json({ error: 'invalid imageUrl' }, { status: 400 })
    }

    // 3. Path-injection guard — baseFileName must match the generated pattern.
    if (!isValidBaseFileName(baseFileName)) {
      return NextResponse.json({ error: 'invalid baseFileName' }, { status: 400 })
    }

    // 4. Geometry guard — the crop quad must be a sane, non-degenerate shape.
    if (!isValidQuad(quad, 0.02)) {
      return NextResponse.json({ error: 'invalid crop' }, { status: 400 })
    }

    if (jobId) await updateJob(jobId, { status: 'processing', stage: 'enhancing' })

    const original = Buffer.from(await (await fetch(imageUrl)).arrayBuffer())
    // dewarp / flatten / colour are opt-in (toggles re-run with these set). Default = geometry-only.
    const { enhanced, framed, cropped } = await enhanceToFramed(original, quad, presetKey, {
      dewarp: !!dewarp,
      flatten: !!flatten,
      color: !!color,
      aiFlatten: !!aiFlatten,
    })

    const enhancedUrl = await StorageService.uploadDerived('artworks', baseFileName, 'enhanced', enhanced)
    const framedUrl = await StorageService.uploadDerived('artworks', baseFileName, 'framed', framed)
    // Geometry-only (crop/straighten, no AI) — shown as the preview's left "before"
    // so the crop and the AI flatten can be judged apart. Display-only, never persisted.
    const croppedUrl = await StorageService.uploadDerived('artworks', baseFileName, 'cropped', cropped)

    // Toggling flatten/colour re-runs and OVERWRITES the same storage paths
    // (upsert). Bust the CDN cache so the preview shows the new bytes, not a
    // stale copy of the same URL.
    const v = `?v=${Date.now()}`
    if (jobId) await updateJob(jobId, { status: 'done', stage: 'done', result: { enhanced: enhancedUrl + v, framed: framedUrl + v, cropped: croppedUrl + v, framePreset: presetKey } })
    return NextResponse.json({ enhanced: enhancedUrl + v, framed: framedUrl + v, cropped: croppedUrl + v })
  } catch (e) {
    console.error('enhance run failed', e)
    // 5. Sanitize persisted error — never store raw exception text in the DB.
    if (jobId) await updateJob(jobId, { status: 'failed', error: 'enhance_failed' }).catch(() => {})
    return NextResponse.json({ error: 'enhance failed' }, { status: 500 })
  }
}
