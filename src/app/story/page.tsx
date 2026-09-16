import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Story } from '@/components/story/Story'
import { NotReady } from '@/components/story/NotReady'
import type { StoryDocument } from '@/lib/story/types'

export const dynamic = 'force-dynamic'

async function loadPublished(): Promise<StoryDocument | null> {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data } = await client.from('story').select('published').limit(1).maybeSingle()
  return (data?.published as StoryDocument | null) ?? null
}

export async function generateMetadata(): Promise<Metadata> {
  const doc = await loadPublished()
  const name = doc?.opening.name || 'Life story'
  return {
    title: doc?.opening.title ? `${name} — ${doc.opening.title}` : name,
    description: doc?.opening.title || undefined,
    openGraph: doc?.opening.cover ? { images: [{ url: doc.opening.cover.url }] } : undefined,
  }
}

export default async function StoryPage() {
  const doc = await loadPublished()
  if (!doc || !doc.opening.name || doc.chapters.length === 0) return <NotReady />
  return <Story document={doc} />
}
