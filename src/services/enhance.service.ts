import { supabase } from '@/lib/supabase'
import type { RotatedRect } from '@/lib/enhance/types'

/** Upload the original straight to Storage via a signed URL (bypasses serverless body cap). */
export async function uploadOriginalSigned(file: File): Promise<{ imageUrl: string; baseFileName: string }> {
  const baseFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10).padEnd(8, '0')}`
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `original/${baseFileName}.${ext}`

  const { data: signed, error } = await supabase.storage.from('artworks').createSignedUploadUrl(path)
  if (error || !signed) throw error ?? new Error('could not sign upload')
  const { error: upErr } = await supabase.storage.from('artworks')
    .uploadToSignedUrl(path, signed.token, file, { contentType: file.type })
  if (upErr) throw upErr

  const imageUrl = supabase.storage.from('artworks').getPublicUrl(path).data.publicUrl
  return { imageUrl, baseFileName }
}

export async function requestDetect(imageUrl: string): Promise<RotatedRect> {
  const res = await fetch('/api/enhance/detect', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrl }),
  })
  if (!res.ok) throw new Error('detection failed')
  return (await res.json()).rect
}

export async function runEnhance(args: {
  jobId?: string; imageUrl: string; rect: RotatedRect; presetKey: string; baseFileName: string
}): Promise<{ enhanced: string; framed: string }> {
  const res = await fetch('/api/enhance/run', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args),
  })
  if (!res.ok) throw new Error('enhance failed')
  return await res.json()
}
