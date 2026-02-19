import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { config } from './config'

// Browser client using @supabase/ssr — stores auth tokens in cookies
// so the middleware can read them for session validation.
export const supabase = createBrowserClient(
  config.supabase.url,
  config.supabase.anonKey
)

// Admin client for server-side operations
export const supabaseAdmin = config.supabase.serviceRoleKey ? createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null