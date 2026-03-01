'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Exhibition } from '@/types'

interface ExhibitionOverlayProps {
  exhibition: Exhibition | null
  onClose: () => void
}

const TYPE_LABELS: Record<string, string> = {
  solo: 'Solo Exhibition',
  group: 'Group Exhibition',
  residency: 'Residency',
  installation: 'Installation',
}

export default function ExhibitionOverlay({ exhibition, onClose }: ExhibitionOverlayProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (exhibition) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [exhibition, onClose])

  if (!exhibition) return null

  const title = exhibition.title.en || exhibition.title.ptBR
  const typeLabel = TYPE_LABELS[exhibition.type] || exhibition.type
  const coverImage = exhibition.images?.find(i => i.isCover)?.url
    || exhibition.images?.[0]?.url
    || exhibition.image

  const formatDates = () => {
    const parts: string[] = []
    if (exhibition.startDate) {
      parts.push(exhibition.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
    }
    if (exhibition.endDate) {
      parts.push(exhibition.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
    }
    if (parts.length === 2) return `${parts[0]} – ${parts[1]}`
    if (parts.length === 1) return parts[0]
    return String(exhibition.year)
  }

  const details = [
    { label: 'Venue', value: exhibition.venue },
    { label: 'Location', value: exhibition.location },
    { label: 'Type', value: typeLabel },
    { label: 'Dates', value: formatDates() },
    ...(exhibition.curatorName ? [{ label: 'Curator', value: exhibition.curatorName }] : []),
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

        {/* Panel — desktop: centered, mobile: bottom sheet */}
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
            {coverImage ? (
              <img src={coverImage} alt={title} className="w-full h-full min-h-[280px] object-cover" />
            ) : (
              <div className="w-full h-full min-h-[280px] bg-gradient-to-br from-[#1a3a2a] to-[#2a3a1a]" />
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

            <div className="text-[8px] tracking-[3px] uppercase text-[#b8956a] mb-2">Exhibition</div>
            <h2 className="font-serif text-[22px] font-normal leading-tight mb-1">{title}</h2>
            <div className="text-[11px] text-[#9a9080] mb-5">{formatDates()}</div>

            <hr className="border-t border-[#e0d8cc] my-4" />

            {details.map((d, i) => (
              <div key={i} className="flex justify-between items-baseline py-1.5 border-b border-[#f0e8dc] last:border-b-0 text-[11px]">
                <span className="text-[9px] tracking-[2px] uppercase text-[#9a9080]">{d.label}</span>
                <span className="font-serif text-[13px]">{d.value}</span>
              </div>
            ))}

            <hr className="border-t border-[#e0d8cc] my-4" />

            {/* Thumbnails */}
            {exhibition.images && exhibition.images.length > 0 && (
              <>
                <div className="text-[9px] tracking-[2px] uppercase text-[#9a9080] mb-2">Gallery</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {exhibition.images.map((img, i) => (
                    <div key={i} className="aspect-square overflow-hidden border-2 border-transparent hover:border-[#b8956a] transition-colors cursor-pointer">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {exhibition.slug && (
              <a
                href={`/exhibitions/${exhibition.slug}`}
                className="block mt-5 text-[9px] tracking-[2px] uppercase text-[#b8956a] hover:text-[#1a1612] transition-colors"
              >
                View Full Exhibition &rarr;
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
