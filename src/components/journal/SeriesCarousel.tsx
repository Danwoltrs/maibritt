'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { ImageLightbox } from './ImageLightbox'

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

function getImageUrl(artwork: SeriesArtwork, size: 'display' | 'thumbnail' = 'display'): string {
  if (!artwork.images || !Array.isArray(artwork.images) || artwork.images.length === 0) return ''
  const img = artwork.images[0]
  if (typeof img === 'string') return img
  return img?.[size] || img?.display || img?.thumbnail || img?.original || ''
}

type ThumbnailSize = 'sm' | 'md' | 'lg'

const THUMB_PX: Record<ThumbnailSize, { box: string; w: string }> = {
  sm: { box: 'h-32 w-32', w: 'w-32' },
  md: { box: 'h-48 w-48', w: 'w-48' },
  lg: { box: 'h-64 w-64', w: 'w-64' },
}

interface SeriesCarouselProps {
  seriesId: string
  thumbnailSize?: ThumbnailSize
  maxThumbnails?: number
}

export function SeriesCarousel({ seriesId, thumbnailSize = 'md', maxThumbnails = 20 }: SeriesCarouselProps) {
  const [artworks, setArtworks] = useState<SeriesArtwork[]>([])
  const [seriesName, setSeriesName] = useState('')
  const [loading, setLoading] = useState(true)
  const [scrollPos, setScrollPos] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })

  useEffect(() => {
    if (!seriesId) return
    let cancelled = false

    async function load() {
      try {
        const [{ data: series }, { data: works }] = await Promise.all([
          supabase.from('series').select('name_en, name_pt').eq('id', seriesId).single(),
          supabase.from('artworks').select('*').eq('series_id', seriesId).order('display_order', { ascending: true }).limit(20),
        ])

        if (!cancelled) {
          setSeriesName(series?.name_en || series?.name_pt || '')
          setArtworks((works || []) as SeriesArtwork[])
        }
      } catch (err) {
        console.error('SeriesCarousel: fetch error', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [seriesId])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.7
    const newPos = direction === 'left' ? scrollPos - amount : scrollPos + amount
    scrollRef.current.scrollTo({ left: newPos, behavior: 'smooth' })
    setScrollPos(newPos)
  }

  const handleScroll = () => {
    if (scrollRef.current) setScrollPos(scrollRef.current.scrollLeft)
  }

  const lightboxImages = artworks.map(a => ({
    src: getImageUrl(a, 'display'),
    alt: a.title_en || a.title_pt || 'Artwork',
    caption: [a.title_en || a.title_pt, a.year].filter(Boolean).join(', '),
  }))

  const canScrollLeft = scrollPos > 10
  const canScrollRight = scrollRef.current
    ? scrollPos < scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10
    : false

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 w-48 shrink-0 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (artworks.length === 0) return null

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{seriesName || 'Works'}</h3>
          <span className="text-sm text-gray-500">
            {artworks.length} {artworks.length === 1 ? 'artwork' : 'artworks'}
          </span>
        </div>

        <div className="relative">
          {canScrollLeft && (
            <Button
              variant="outline" size="sm"
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 rounded-full bg-white shadow-md"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {artworks.slice(0, maxThumbnails).map((artwork, i) => {
              const imageUrl = getImageUrl(artwork, thumbnailSize === 'sm' ? 'thumbnail' : 'display')
              const title = artwork.title_en || artwork.title_pt || 'Untitled'
              const sz = THUMB_PX[thumbnailSize]

              return (
                <motion.div
                  key={artwork.id}
                  className="shrink-0 cursor-pointer group"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setLightbox({ open: true, index: i })}
                >
                  <div className={`${sz.box} overflow-hidden rounded-lg bg-gray-200`}>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <p className={`mt-1.5 text-xs text-gray-700 font-medium truncate ${sz.w}`}>{title}</p>
                  {artwork.year && <p className="text-xs text-gray-400">{artwork.year}</p>}
                </motion.div>
              )
            })}
          </div>

          {canScrollRight && (
            <Button
              variant="outline" size="sm"
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 rounded-full bg-white shadow-md"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightbox.index}
        open={lightbox.open}
        onClose={() => setLightbox({ open: false, index: 0 })}
        onNavigate={(index) => setLightbox({ open: true, index })}
      />
    </>
  )
}
