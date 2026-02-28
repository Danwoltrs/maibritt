'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { ImageLightbox } from '@/components/journal/ImageLightbox'
import type { EmbedDisplay, ThumbnailSize } from '../types'

const THUMB_PX: Record<ThumbnailSize, { box: string }> = {
  sm: { box: 'h-20 w-20' },
  md: { box: 'h-32 w-32' },
  lg: { box: 'h-48 w-48' },
}

interface ExhibitionImageData {
  url: string
  captionPt?: string
  captionEn?: string
  isCover?: boolean
}

interface ExhibitionBlockEditorProps {
  exhibitionId: string
  title?: string
  imageUrl?: string
  subtitle?: string
  display?: EmbedDisplay
  thumbnailSize?: ThumbnailSize
  maxThumbnails?: number
}

export function ExhibitionBlockEditor({ exhibitionId, title, imageUrl, subtitle, display = 'card', thumbnailSize = 'sm', maxThumbnails = 20 }: ExhibitionBlockEditorProps) {
  const [exTitle, setExTitle] = useState(title || '')
  const [exSubtitle, setExSubtitle] = useState(subtitle || '')
  const [images, setImages] = useState<ExhibitionImageData[]>([])
  const [loading, setLoading] = useState(!title)
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    if (!exhibitionId || title) return
    let cancelled = false

    async function load() {
      try {
        const { data } = await supabase
          .from('exhibitions')
          .select('title_en, title_pt, year, venue, image, images')
          .eq('id', exhibitionId)
          .single()

        if (!cancelled && data) {
          setExTitle(data.title_en || data.title_pt || '')
          setExSubtitle([data.year, data.venue].filter(Boolean).join(' · '))

          const imgs: ExhibitionImageData[] = []
          if (data.images && Array.isArray(data.images)) {
            imgs.push(...(data.images as ExhibitionImageData[]))
          }
          if (imgs.length === 0 && data.image) {
            imgs.push({ url: data.image })
          }
          setImages(imgs)
        }
      } catch (err) {
        console.error('ExhibitionBlockEditor: fetch error', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [exhibitionId, title])

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 5)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5)
  }

  useEffect(() => {
    checkScroll()
  }, [images])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.6
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
    setTimeout(checkScroll, 350)
  }

  const lightboxImages = images.map(img => ({
    src: img.url,
    alt: img.captionEn || exTitle,
    caption: img.captionEn || img.captionPt,
  }))

  // Link display
  if (display === 'link') {
    return (
      <>
        <button
          type="button"
          onClick={() => images.length > 0 && setLightbox({ open: true, index: 0 })}
          className="inline-flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 font-medium underline underline-offset-2 decoration-amber-300 hover:decoration-amber-500 transition-colors py-1"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {loading ? 'Loading...' : exTitle || 'Untitled exhibition'}
          {exSubtitle && <span className="text-amber-400 no-underline text-xs">({exSubtitle})</span>}
        </button>

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

  // Card display with thumbnails
  if (loading) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="h-4 w-24 bg-amber-200 rounded animate-pulse mb-2" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 w-20 shrink-0 bg-amber-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-amber-600">Exhibition</span>
            <span className="text-xs text-amber-400">&middot;</span>
            <span className="text-xs text-stone-600 font-medium truncate">{exTitle || 'Untitled'}</span>
          </div>
          <span className="text-xs text-amber-400">{images.length} images</span>
        </div>

        {images.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-amber-400">
            No images for this exhibition.
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
              {images.slice(0, maxThumbnails).map((img, i) => {
                const sz = THUMB_PX[thumbnailSize]
                return (
                  <button
                    key={i}
                    type="button"
                    className="shrink-0 group cursor-pointer"
                    title={img.captionEn || exTitle}
                    onClick={() => setLightbox({ open: true, index: i })}
                  >
                    <div className={`${sz.box} overflow-hidden rounded bg-amber-200 ring-0 group-hover:ring-2 ring-amber-400 transition-all`}>
                      <img src={img.url} alt={img.captionEn || exTitle} className="h-full w-full object-cover" />
                    </div>
                  </button>
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
