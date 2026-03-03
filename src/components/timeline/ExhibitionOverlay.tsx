'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Exhibition } from '@/types'
import { Badge } from '@/components/ui/badge'

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

const TYPE_COLORS: Record<string, string> = {
  solo: 'bg-blue-100 text-blue-800',
  group: 'bg-green-100 text-green-800',
  residency: 'bg-purple-100 text-purple-800',
  installation: 'bg-amber-100 text-amber-800',
}

export default function ExhibitionOverlay({ exhibition, onClose }: ExhibitionOverlayProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxIndex !== null) {
          setLightboxIndex(null)
        } else {
          onClose()
        }
      }
      if (lightboxIndex !== null && exhibition?.images) {
        if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? Math.min(i + 1, exhibition.images.length - 1) : 0)
        if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : 0)
      }
    }
    if (exhibition) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [exhibition, onClose, lightboxIndex])

  if (!exhibition) return null

  const title = exhibition.title.en || exhibition.title.ptBR
  const typeLabel = TYPE_LABELS[exhibition.type] || exhibition.type
  const typeColor = TYPE_COLORS[exhibition.type] || 'bg-gray-100 text-gray-800'
  const coverImage = exhibition.images?.find(i => i.isCover)?.url
    || exhibition.images?.[0]?.url
    || exhibition.image

  const allImages = exhibition.images || []
  const hasGallery = allImages.length > 0
  const hasVideos = exhibition.videos && exhibition.videos.length > 0
  const bodyText = exhibition.content?.en || exhibition.content?.ptBR || ''
  const descriptionText = exhibition.description?.en || exhibition.description?.ptBR || ''
  const curatorText = exhibition.curatorText?.en || exhibition.curatorText?.ptBR || ''

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
          className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative z-10 bg-white max-w-[900px] w-[calc(100%-32px)] max-h-[92vh] overflow-y-auto rounded-lg shadow-2xl
            grid grid-cols-2
            max-md:grid-cols-1 max-md:w-full max-md:max-w-full max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:rounded-none"
        >
          {/* Left column — Cover + Gallery + Videos */}
          <div className="bg-gray-900 min-h-[280px] relative overflow-hidden flex flex-col rounded-l-lg max-md:rounded-none">
            {coverImage ? (
              <img src={coverImage} alt={title} className="w-full min-h-[280px] object-cover" />
            ) : (
              <div className="w-full min-h-[280px] bg-gradient-to-br from-gray-200 to-gray-300" />
            )}

            {hasGallery && allImages.length > 1 && (
              <div className="p-3 bg-gray-900">
                <div className="grid grid-cols-3 gap-1.5">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className="aspect-square overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors cursor-pointer rounded"
                    >
                      <img src={img.url} alt={img.captionEn || img.captionPt || ''} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasVideos && (
              <div className="p-3 bg-gray-900 space-y-3">
                {exhibition.videos.map((video, i) => (
                  <div key={i}>
                    {video.titleEn && (
                      <div className="text-xs text-gray-400 mb-1.5 font-medium">
                        {video.titleEn || video.titlePt}
                      </div>
                    )}
                    <div className="aspect-video w-full">
                      {isEmbedUrl(video.url) ? (
                        <iframe
                          src={toEmbedUrl(video.url)}
                          className="w-full h-full border-0 rounded"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video src={video.url} controls className="w-full h-full object-contain bg-black rounded" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column — Info */}
          <div className="p-7 px-6 relative overflow-y-auto">
            <button
              onClick={onClose}
              className="absolute top-3 right-3.5 bg-transparent border-none text-xl cursor-pointer text-gray-400 hover:text-gray-900 w-7 h-7 flex items-center justify-center"
            >
              &times;
            </button>

            <Badge variant="outline" className={`${typeColor} capitalize text-[10px] border-0 mb-2`}>
              {typeLabel}
            </Badge>
            <h2 className="text-[22px] font-medium leading-tight mb-1 text-gray-900">{title}</h2>
            <div className="text-[11px] text-gray-500 mb-5">{formatDates()}</div>

            <hr className="border-t border-gray-200 my-4" />

            {details.map((d, i) => (
              <div key={i} className="flex justify-between items-baseline py-1.5 border-b border-gray-100 last:border-b-0 text-[11px]">
                <span className="text-[9px] tracking-[2px] uppercase text-gray-500 font-medium">{d.label}</span>
                <span className="text-[13px] text-gray-800">{d.value}</span>
              </div>
            ))}

            {descriptionText && (
              <>
                <hr className="border-t border-gray-200 my-4" />
                <div className="text-[9px] tracking-[2px] uppercase text-gray-500 mb-2 font-medium">About</div>
                <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-line">{descriptionText}</p>
              </>
            )}

            {bodyText && (
              <>
                <hr className="border-t border-gray-200 my-4" />
                <div className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-line">{bodyText}</div>
              </>
            )}

            {curatorText && (
              <>
                <hr className="border-t border-gray-200 my-4" />
                <div className="text-[9px] tracking-[2px] uppercase text-gray-500 mb-2 font-medium">Curator Statement</div>
                <blockquote className="border-l-2 border-blue-600 pl-3 text-[12px] text-gray-600 italic leading-relaxed whitespace-pre-line">
                  {curatorText}
                </blockquote>
                {exhibition.curatorName && (
                  <div className="mt-1.5 text-[10px] text-gray-500">— {exhibition.curatorName}</div>
                )}
              </>
            )}

            <div className="mt-5 space-y-2">
              {exhibition.externalUrl && (
                <a
                  href={exhibition.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[9px] tracking-[2px] uppercase text-blue-600 hover:text-gray-900 transition-colors font-medium"
                >
                  External Link &rarr;
                </a>
              )}
              {exhibition.catalogUrl && (
                <a
                  href={exhibition.catalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[9px] tracking-[2px] uppercase text-blue-600 hover:text-gray-900 transition-colors font-medium"
                >
                  View Catalog &rarr;
                </a>
              )}
              {exhibition.slug && (
                <a
                  href={`/exhibitions/${exhibition.slug}`}
                  className="block text-[9px] tracking-[2px] uppercase text-blue-600 hover:text-gray-900 transition-colors font-medium"
                >
                  View Full Exhibition &rarr;
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Lightbox */}
        {lightboxIndex !== null && allImages[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-5 text-white/70 hover:text-white text-2xl z-10"
            >
              &times;
            </button>

            {lightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl z-10"
              >
                &#8249;
              </button>
            )}

            {lightboxIndex < allImages.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl z-10"
              >
                &#8250;
              </button>
            )}

            <img
              src={allImages[lightboxIndex].url}
              alt={allImages[lightboxIndex].captionEn || allImages[lightboxIndex].captionPt || ''}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {(allImages[lightboxIndex].captionEn || allImages[lightboxIndex].captionPt) && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-xs text-center max-w-[60vw]">
                {allImages[lightboxIndex].captionEn || allImages[lightboxIndex].captionPt}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  )
}

/* ─── Video URL helpers ─── */

function isEmbedUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url)
}

function toEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  return url
}
