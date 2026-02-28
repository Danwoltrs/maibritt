'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface LightboxImage {
  src: string
  alt: string
  caption?: string
}

interface ImageLightboxProps {
  images: LightboxImage[]
  currentIndex: number
  open: boolean
  onClose: () => void
  onNavigate: (index: number) => void
}

export function ImageLightbox({ images, currentIndex, open, onClose, onNavigate }: ImageLightboxProps) {
  const current = images[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < images.length - 1

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1)
    },
    [onClose, onNavigate, currentIndex, hasPrev, hasNext]
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Previous */}
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1) }}
              className="absolute left-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Image */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.src}
              alt={current.alt}
              className="max-w-full max-h-[80vh] object-contain"
            />
            {current.caption && (
              <p className="mt-3 text-sm text-white/70 text-center max-w-lg">
                {current.caption}
              </p>
            )}
            {images.length > 1 && (
              <p className="mt-1 text-xs text-white/50">
                {currentIndex + 1} / {images.length}
              </p>
            )}
          </motion.div>

          {/* Next */}
          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1) }}
              className="absolute right-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
