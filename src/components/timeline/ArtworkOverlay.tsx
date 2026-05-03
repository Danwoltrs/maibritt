'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Artwork } from '@/types'
import { Badge } from '@/components/ui/badge'

interface ArtworkOverlayProps {
  artwork: Artwork | null
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
  positionLabel?: string  // e.g. "3 / 12 in 2012"
}

export default function ArtworkOverlay({
  artwork, onClose,
  onPrev, onNext, hasPrev = false, hasNext = false, positionLabel,
}: ArtworkOverlayProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev()
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext()
    }
    if (artwork) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [artwork, onClose, onPrev, onNext, hasPrev, hasNext])

  if (!artwork) return null

  const title = artwork.title.en || artwork.title.ptBR
  const medium = artwork.medium.en || artwork.medium.ptBR
  const mainImage = artwork.images?.[0]?.display || artwork.images?.[0]?.original

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="
            relative z-10 bg-white rounded-lg shadow-2xl overflow-hidden
            w-[95vw] h-[95vh] flex flex-col
            max-md:w-screen max-md:h-screen max-md:rounded-none
          "
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white rounded-full text-gray-700 hover:text-gray-900 transition-colors shadow"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image area (top ~75%) */}
          <div className="relative bg-neutral-900 flex-1 min-h-0 flex items-center justify-center">
            {mainImage ? (
              <img
                src={mainImage}
                alt={title}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-gray-500 text-sm">No image</span>
            )}

            {/* Desktop: edge-overlay arrows */}
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              aria-label="Previous artwork"
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center bg-black/40 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed rounded-full text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              aria-label="Next artwork"
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center bg-black/40 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed rounded-full text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Description strip (bottom ~25%) */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 max-md:px-4 max-md:py-3">
            <div className="flex items-start gap-6 max-md:flex-col max-md:gap-3">
              {/* Title block */}
              <div className="min-w-0 flex-shrink-0">
                <Badge variant="outline" className="bg-gray-100 text-gray-800 capitalize text-[10px] border-0 mb-1.5">
                  {artwork.category ? artwork.category.charAt(0).toUpperCase() + artwork.category.slice(1) : 'Artwork'}
                </Badge>
                <h2 className="text-[20px] font-medium leading-tight text-gray-900 truncate">{title}</h2>
                <div className="text-[11px] text-gray-500 mt-0.5">{artwork.year}</div>
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap gap-x-6 gap-y-1.5 flex-1 text-[12px] text-gray-700 max-md:text-[11px]">
                {medium && (
                  <div>
                    <span className="text-[9px] tracking-[2px] uppercase text-gray-500 font-medium block">Medium</span>
                    <span>{medium}</span>
                  </div>
                )}
                {artwork.dimensions && (
                  <div>
                    <span className="text-[9px] tracking-[2px] uppercase text-gray-500 font-medium block">Dimensions</span>
                    <span>{artwork.dimensions}</span>
                  </div>
                )}
                {artwork.artSeries && (
                  <div>
                    <span className="text-[9px] tracking-[2px] uppercase text-gray-500 font-medium block">Series</span>
                    <span>{artwork.artSeries.nameEn || artwork.artSeries.namePt}</span>
                  </div>
                )}
              </div>

              {/* View full link */}
              {artwork.slug && (
                <a
                  href={`/artwork/${artwork.slug}`}
                  className="text-[10px] tracking-[2px] uppercase text-blue-600 hover:text-gray-900 transition-colors font-medium whitespace-nowrap self-end max-md:self-start"
                >
                  View Full Details &rarr;
                </a>
              )}
            </div>

            {/* Pagination indicator (desktop: centered below row; mobile: bottom bar) */}
            {positionLabel && (
              <>
                <div className="hidden md:block text-center text-[11px] text-gray-500 mt-3">
                  {positionLabel}
                </div>
                <div className="md:hidden flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={onPrev}
                    disabled={!hasPrev}
                    aria-label="Previous artwork"
                    className="min-h-[44px] px-4 flex items-center gap-1 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-[12px]">Prev</span>
                  </button>
                  <span className="text-[11px] text-gray-500">{positionLabel}</span>
                  <button
                    onClick={onNext}
                    disabled={!hasNext}
                    aria-label="Next artwork"
                    className="min-h-[44px] px-4 flex items-center gap-1 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="text-[12px]">Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
