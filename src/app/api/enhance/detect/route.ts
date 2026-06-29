import { NextRequest, NextResponse } from 'next/server'
import { detectPainting } from '@/lib/enhance/detect'
import { getRequestUser, isAllowedImageUrl } from '@/lib/enhance/guards'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  // 1. Auth check — gate the paid fal API call to authenticated users only.
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 })

    // 2. SSRF guard — only detect paintings from our own Supabase artworks bucket.
    if (!isAllowedImageUrl(imageUrl)) {
      return NextResponse.json({ error: 'invalid imageUrl' }, { status: 400 })
    }

    const { quad } = await detectPainting(imageUrl)
    return NextResponse.json({ quad })
  } catch (e) {
    console.error('detect failed', e)
    return NextResponse.json({ error: 'detection failed' }, { status: 500 })
  }
}
