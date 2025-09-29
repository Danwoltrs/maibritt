import { createClient } from '@supabase/supabase-js'
import { config } from './config'

// Create Supabase client using the configuration
export const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

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