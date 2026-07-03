import { supabase } from '@/lib/supabase'

let cached: Promise<boolean> | null = null

/**
 * Whether the AR wall-preview feature is enabled site-wide
 * (admin Settings -> Features). Missing key or any read error => true:
 * a broken settings read must never silently kill the feature.
 * Cached for the lifetime of the page; all ArWallButton instances share
 * one query.
 */
export function getArEnabled(): Promise<boolean> {
  if (!cached) {
    cached = supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'ar_enabled')
      .single()
      .then(
        ({ data, error }) => {
          if (error || !data) return true
          return data.value === true || data.value === 'true'
        },
        () => true,
      )
  }
  return cached
}

/** Test-only: clear the module cache. */
export function _resetArEnabledCache(): void {
  cached = null
}
