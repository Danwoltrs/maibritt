import type { Metadata } from 'next'
import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Story } from '@/components/story/Story'
import { NotReady } from '@/components/story/NotReady'
import type { StoryDocument } from '@/lib/story/types'
import { normalizeDocument } from '@/lib/story/document'

export const dynamic = 'force-dynamic'

const loadPublished = cache(async (): Promise<StoryDocument | null> => {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.from('story').select('published').limit(1).maybeSingle()
  if (error) {
    console.error('[story] failed to load published story', error)
    return null
  }
  return data?.published ? normalizeDocument(data.published) : null
})

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
