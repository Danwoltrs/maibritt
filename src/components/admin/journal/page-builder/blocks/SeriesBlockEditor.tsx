'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

interface SeriesBlockEditorProps {
  seriesId: string
  name?: string
  coverImage?: string
  artworkCount?: number
}

export function SeriesBlockEditor({ seriesId, name, coverImage, artworkCount }: SeriesBlockEditorProps) {
  const [count, setCount] = useState(artworkCount ?? 0)
  const [seriesName, setSeriesName] = useState(name || '')
  const [seriesCover, setSeriesCover] = useState(coverImage || '')
  const [loading, setLoading] = useState(!name)

  useEffect(() => {
    if (!seriesId) return

    let cancelled = false

    async function load() {
      try {
        // Fetch series details if we don't have them
        if (!name) {
          const { data: series } = await supabase
            .from('series')
            .select('name_en, name_pt, cover_image')
            .eq('id', seriesId)
            .single()

          if (!cancelled && series) {
            setSeriesName(series.name_en || series.name_pt || '')
            setSeriesCover(series.cover_image || '')
          }
        }

        // Fetch artwork count
        const { count: artCount } = await supabase
          .from('artworks')
          .select('*', { count: 'exact', head: true })
          .eq('series_id', seriesId)

        if (!cancelled) setCount(artCount ?? 0)
      } catch (err) {
        console.error('SeriesBlockEditor: fetch error', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [seriesId, name])

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50">
      <div className="flex items-center justify-between border-b border-violet-200 px-3 py-1.5">
        <span className="text-xs font-medium text-violet-600">Works</span>
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-violet-200">
          {seriesCover ? (
            <img src={seriesCover} alt={seriesName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-violet-400">
              No image
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800">
            {loading ? 'Loading...' : seriesName || 'Untitled works'}
          </p>
          <Badge variant="secondary" className="text-xs mt-1">
            {loading ? '...' : count} artworks
          </Badge>
        </div>
      </div>
    </div>
  )
}
