'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Artwork } from '@/types'

interface ArtworkOverlayProps {
  artwork: Artwork | null
  onClose: () => void
}

export default function ArtworkOverlay({ artwork, onClose }: ArtworkOverlayProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (artwork) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [artwork, onClose])

  if (!artwork) return null

  const title = artwork.title.en || artwork.title.ptBR
  const medium = artwork.medium.en || artwork.medium.ptBR
  const mainImage = artwork.images?.[0]?.display || artwork.images?.[0]?.original

  const details = [
    { label: 'Year', value: String(artwork.year) },
    { label: 'Medium', value: medium },
    ...(artwork.dimensions ? [{ label: 'Dimensions', value: artwork.dimensions }] : []),
    ...(artwork.artSeries ? [{ label: 'Series', value: artwork.artSeries.nameEn || artwork.artSeries.namePt }] : []),
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[rgba(18,15,12,0.85)] backdrop-blur-[4px] cursor-pointer"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative z-10 bg-[#faf8f4] max-w-[820px] w-[calc(100%-32px)] max-h-[92vh] overflow-y-auto
            grid grid-cols-2
            max-md:grid-cols-1 max-md:w-full max-md:max-w-full max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:rounded-none"
        >
          {/* Image column */}
          <div className="bg-[#1a1612] min-h-[280px] relative overflow-hidden">
            {mainImage ? (
              <img src={mainImage} alt={title} className="w-full h-full min-h-[280px] object-cover" />
            ) : (
              <div className="w-full h-full min-h-[280px] bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No image</span>
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="p-7 px-6 relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3.5 bg-transparent border-none text-xl cursor-pointer text-[#9a9080] hover:text-[#1a1612] w-7 h-7 flex items-center justify-center"
            >
              &times;
            </button>

            <div className="text-[8px] tracking-[3px] uppercase text-[#b8956a] mb-2">
              {artwork.category ? artwork.category.charAt(0).toUpperCase() + artwork.category.slice(1) : 'Artwork'}
            </div>
            <h2 className="font-serif text-[22px] font-normal leading-tight mb-1">{title}</h2>
            <div className="text-[11px] text-[#9a9080] mb-5">{artwork.year}</div>

            <hr className="border-t border-[#e0d8cc] my-4" />

            {details.map((d, i) => (
              <div key={i} className="flex justify-between items-baseline py-1.5 border-b border-[#f0e8dc] last:border-b-0 text-[11px]">
                <span className="text-[9px] tracking-[2px] uppercase text-[#9a9080]">{d.label}</span>
                <span className="font-serif text-[13px]">{d.value}</span>
              </div>
            ))}

            {/* Thumbnails */}
            {artwork.images && artwork.images.length > 1 && (
              <>
                <hr className="border-t border-[#e0d8cc] my-4" />
                <div className="grid grid-cols-3 gap-1.5">
                  {artwork.images.map((img, i) => (
                    <div key={i} className="aspect-square overflow-hidden border-2 border-transparent hover:border-[#b8956a] transition-colors cursor-pointer">
                      <img src={img.thumbnail || img.display} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {artwork.slug && (
              <a
                href={`/artwork/${artwork.slug}`}
                className="block mt-5 text-[9px] tracking-[2px] uppercase text-[#b8956a] hover:text-[#1a1612] transition-colors"
              >
                View Full Details &rarr;
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
