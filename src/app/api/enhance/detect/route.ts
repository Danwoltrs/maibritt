import { NextRequest, NextResponse } from 'next/server'
import { detectPainting } from '@/lib/enhance/detect'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 })
    const { rect } = await detectPainting(imageUrl)
    return NextResponse.json({ rect })
  } catch (e) {
    console.error('detect failed', e)
    return NextResponse.json({ error: 'detection failed' }, { status: 500 })
  }
}
