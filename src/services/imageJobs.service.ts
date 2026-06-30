import { supabase } from '@/lib/supabase'

export interface ImageJob {
  id: string
  artwork_id: string | null
  source_path: string
  status: 'pending' | 'detecting' | 'processing' | 'done' | 'failed'
  stage: string | null
  frame_preset: string
  quad: unknown | null
  result: { enhanced?: string; framed?: string; cropped?: string; framePreset?: string } | null
  error: string | null
}

export async function createJob(input: { source_path: string; frame_preset: string; artwork_id?: string | null }): Promise<ImageJob> {
  const { data, error } = await supabase.from('image_jobs').insert({
    source_path: input.source_path,
    frame_preset: input.frame_preset,
    artwork_id: input.artwork_id ?? null,
    status: 'pending',
  }).select().single()
  if (error) throw error
  return data as ImageJob
}

export async function updateJob(id: string, patch: Partial<ImageJob>): Promise<void> {
  const { error } = await supabase.from('image_jobs')
    .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function getJob(id: string): Promise<ImageJob | null> {
  const { data, error } = await supabase.from('image_jobs').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as ImageJob) ?? null
}
