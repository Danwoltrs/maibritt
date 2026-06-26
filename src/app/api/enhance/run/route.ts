import { NextRequest, NextResponse } from 'next/server'
import { enhanceToFramed } from '@/lib/enhance/pipeline'
import { StorageService } from '@/services/storage.service'
import { updateJob } from '@/services/imageJobs.service'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  let jobId: string | undefined
  try {
    const body = await req.json()
    jobId = body.jobId
    const { imageUrl, rect, presetKey, baseFileName } = body
    if (!imageUrl || !rect || !baseFileName) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }
    if (jobId) await updateJob(jobId, { status: 'processing', stage: 'enhancing' })

    const original = Buffer.from(await (await fetch(imageUrl)).arrayBuffer())
    const { enhanced, framed } = await enhanceToFramed(original, rect, presetKey)

    const enhancedUrl = await StorageService.uploadDerived('artworks', baseFileName, 'enhanced', enhanced)
    const framedUrl = await StorageService.uploadDerived('artworks', baseFileName, 'framed', framed)

    if (jobId) await updateJob(jobId, { status: 'done', stage: 'done', result: { enhanced: enhancedUrl, framed: framedUrl, framePreset: presetKey } })
    return NextResponse.json({ enhanced: enhancedUrl, framed: framedUrl })
  } catch (e) {
    console.error('enhance run failed', e)
    if (jobId) await updateJob(jobId, { status: 'failed', error: String(e) }).catch(() => {})
    return NextResponse.json({ error: 'enhance failed' }, { status: 500 })
  }
}
