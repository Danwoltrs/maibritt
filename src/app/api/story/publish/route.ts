import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { data: row, error: readError } = await supabase.from('story').select('id, draft').limit(1).single()
  if (readError || !row) return NextResponse.json({ error: 'Story not found' }, { status: 404 })

  const publishedAt = new Date().toISOString()
  const { error } = await supabase.from('story').update({ published: row.draft, published_at: publishedAt }).eq('id', row.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ publishedAt })
}
