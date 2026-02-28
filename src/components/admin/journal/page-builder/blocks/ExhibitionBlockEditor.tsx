'use client'

import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ImageLightbox } from '@/components/journal/ImageLightbox'
import type { EmbedDisplay } from '../types'

interface ExhibitionBlockEditorProps {
  exhibitionId: string
  title?: string
  imageUrl?: string
  subtitle?: string
  display?: EmbedDisplay
}

export function ExhibitionBlockEditor({ exhibitionId, title, imageUrl, subtitle, display = 'card' }: ExhibitionBlockEditorProps) {
  const [exTitle, setExTitle] = useState(title || '')
  const [exImage, setExImage] = useState(imageUrl || '')
  const [exSubtitle, setExSubtitle] = useState(subtitle || '')
  const [loading, setLoading] = useState(!title)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!exhibitionId || title) return

    let cancelled = false

    async function load() {
      try {
        const { data } = await supabase
          .from('exhibitions')
          .select('title_en, title_pt, year, venue, image')
          .eq('id', exhibitionId)
          .single()

        if (!cancelled && data) {
          setExTitle(data.title_en || data.title_pt || '')
          setExImage(data.image || '')
          setExSubtitle([data.year, data.venue].filter(Boolean).join(' · '))
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

  // Link display: just the exhibition name as a styled link
  if (display === 'link') {
    return (
      <>
        <button
          type="button"
          onClick={() => exImage && setLightboxOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 font-medium underline underline-offset-2 decoration-amber-300 hover:decoration-amber-500 transition-colors py-1"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {loading ? 'Loading...' : exTitle || 'Untitled exhibition'}
          {exSubtitle && <span className="text-amber-400 no-underline text-xs">({exSubtitle})</span>}
        </button>

        {exImage && (
          <ImageLightbox
            images={[{ src: exImage, alt: exTitle, caption: exSubtitle }]}
            currentIndex={0}
            open={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            onNavigate={() => {}}
          />
        )}
      </>
    )
  }

  // Card display
  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50">
        <div className="flex items-center justify-between border-b border-amber-200 px-3 py-1.5">
          <span className="text-xs font-medium text-amber-600">Exhibition</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <button
            type="button"
            className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-amber-200 cursor-pointer ring-0 hover:ring-2 ring-amber-400 transition-all"
            onClick={() => exImage && setLightboxOpen(true)}
          >
            {exImage ? (
              <img src={exImage} alt={exTitle} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-amber-400">
                No image
              </div>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-800">
              {loading ? 'Loading...' : exTitle || 'Untitled exhibition'}
            </p>
            {exSubtitle && (
              <p className="text-xs text-stone-500 mt-0.5">{exSubtitle}</p>
            )}
          </div>
        </div>
      </div>

      {exImage && (
        <ImageLightbox
          images={[{ src: exImage, alt: exTitle, caption: exSubtitle }]}
          currentIndex={0}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={() => {}}
        />
      )}
    </>
  )
}
