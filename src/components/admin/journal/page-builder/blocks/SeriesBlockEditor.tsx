'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface ArtworkImage {
  original: string
  display: string
  thumbnail: string
}

interface SeriesArtwork {
  id: string
  title_en: string
  title_pt: string
  year: number
  images: ArtworkImage[]
}

function getThumb(artwork: SeriesArtwork): string {
  if (!artwork.images || !Array.isArray(artwork.images) || artwork.images.length === 0) return ''
  const img = artwork.images[0]
  if (typeof img === 'string') return img
  return img?.thumbnail || img?.display || img?.original || ''
}

interface SeriesBlockEditorProps {
  seriesId: string
  name?: string
  coverImage?: string
  artworkCount?: number
}

export function SeriesBlockEditor({ seriesId, name }: SeriesBlockEditorProps) {
  const [artworks, setArtworks] = useState<SeriesArtwork[]>([])
  const [seriesName, setSeriesName] = useState(name || '')
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    if (!seriesId) return
    let cancelled = false

    async function load() {
      try {
        const [{ data: series }, { data: works }] = await Promise.all([
          supabase.from('series').select('name_en, name_pt').eq('id', seriesId).single(),
          supabase.from('artworks').select('id, title_en, title_pt, year, images')
            .eq('series_id', seriesId)
            .order('display_order', { ascending: true })
            .limit(20),
        ])

        if (!cancelled) {
          setSeriesName(series?.name_en || series?.name_pt || name || '')
          setArtworks((works || []) as SeriesArtwork[])
        }
      } catch (err) {
        console.error('SeriesBlockEditor: fetch error', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [seriesId, name])

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 5)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5)
  }

  useEffect(() => {
    checkScroll()
  }, [artworks])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.6
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
    setTimeout(checkScroll, 350)
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
        <div className="h-4 w-24 bg-violet-200 rounded animate-pulse mb-2" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 w-20 shrink-0 bg-violet-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-violet-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-violet-600">Works</span>
          <span className="text-xs text-violet-400">·</span>
          <span className="text-xs text-stone-600 font-medium truncate">{seriesName || 'Untitled'}</span>
        </div>
        <span className="text-xs text-violet-400">{artworks.length} artworks</span>
      </div>

      {artworks.length === 0 ? (
        <div className="px-3 py-6 text-center text-xs text-violet-400">
          No artworks in this series yet.
        </div>
      ) : (
        <div className="relative p-2">
          {canScrollLeft && (
            <Button
              type="button" variant="outline" size="sm"
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 p-0 rounded-full bg-white/90 shadow-sm"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          )}

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-1.5 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {artworks.map((artwork) => {
              const thumb = getThumb(artwork)
              const title = artwork.title_en || artwork.title_pt || 'Untitled'

              return (
                <div key={artwork.id} className="shrink-0 group" title={title}>
                  <div className="h-20 w-20 overflow-hidden rounded bg-violet-200">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-violet-400">
                        No img
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {canScrollRight && (
            <Button
              type="button" variant="outline" size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 p-0 rounded-full bg-white/90 shadow-sm"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
