import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Keep-alive ping for the free-tier Supabase project, which pauses after
 * 7 days with no requests. Called daily by the Vercel cron in vercel.json,
 * with .github/workflows/keep-supabase-alive.yml as a second line of defence.
 *
 * The read is the whole point: it has to actually reach Postgres to count as
 * activity, so this must not be cached or statically optimised.
 */
export async function GET(req: NextRequest) {
  // Vercel signs cron invocations with CRON_SECRET when that env var is set.
  // Left unset, the endpoint stays open — harmless, it reads a single id.
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const client = supabaseAdmin ?? supabase
  const startedAt = Date.now()
  const { error } = await client.from('artworks').select('id').limit(1)
  const ms = Date.now() - startedAt

  if (error) {
    console.error('[keep-alive] Supabase read failed:', error.message)
    return NextResponse.json({ ok: false, ms, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ms, at: new Date().toISOString() })
}
