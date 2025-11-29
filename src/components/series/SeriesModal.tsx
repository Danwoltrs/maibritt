'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Calendar, Images, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SeriesService, SeriesWithArtworks } from '@/services'
import { Artwork } from '@/types'

interface SeriesModalProps {
  seriesId: string | null
  isOpen: boolean
  onClose: () => void
}

export default function SeriesModal({ seriesId, isOpen, onClose }: SeriesModalProps) {
  const [series, setSeries] = useState<SeriesWithArtworks | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Fetch series data when modal opens
  useEffect(() => {
    if (isOpen && seriesId) {
      const fetchSeries = async () => {
        setLoading(true)
        try {
          const data = await SeriesService.getSeriesById(seriesId)
          setSeries(data)
        } catch (err) {
          console.error('Error fetching series:', err)
        } finally {
          setLoading(false)
        }
      }
      fetchSeries()
    } else {
      setSeries(null)
      setSelectedArtwork(null)
    }
  }, [isOpen, seriesId])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedArtwork) {
          setSelectedArtwork(null)
        } else {
          onClose()
        }
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, selectedArtwork, onClose])

  // Navigate lightbox
  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (!series || !selectedArtwork) return
    const currentIndex = series.latestArtworks.findIndex(a => a.id === selectedArtwork.id)
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedArtwork(series.latestArtworks[currentIndex - 1])
      setLightboxIndex(0)
    } else if (direction === 'next' && currentIndex < series.latestArtworks.length - 1) {
      setSelectedArtwork(series.latestArtworks[currentIndex + 1])
      setLightboxIndex(0)
    }
  }

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    const handleKeyNav = (e: KeyboardEvent) => {
      if (!selectedArtwork) return
      if (e.key === 'ArrowLeft') navigateLightbox('prev')
      if (e.key === 'ArrowRight') navigateLightbox('next')
    }
    document.addEventListener('keydown', handleKeyNav)
    return () => document.removeEventListener('keydown', handleKeyNav)
  }, [selectedArtwork, series])

  const getDisplayTitle = (artwork: Artwork) => artwork.title.en || artwork.title.ptBR
  const getDisplayMedium = (artwork: Artwork) => artwork.medium.en || artwork.medium.ptBR

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b">
              <div className="flex-1">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                ) : series ? (
                  <>
                    <h2 className="text-xl md:text-2xl font-light text-gray-900">
                      {series.name.en || series.name.ptBR}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {series.year}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Images className="w-4 h-4" />
                        {series.artworkCount} works
                      </span>
                      {series.isSeasonal ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">Seasonal</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">Collection</Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">Series not found</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="ml-4">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : series ? (
                <>
                  {/* Series description */}
                  {(series.description.en || series.description.ptBR) && (
                    <p className="text-gray-600 mb-6 max-w-3xl">
                      {series.description.en || series.description.ptBR}
                    </p>
                  )}

                  {/* Artwork grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {series.latestArtworks.map((artwork, index) => (
                      <motion.div
                        key={artwork.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group cursor-pointer"
                        onClick={() => {
                          setSelectedArtwork(artwork)
                          setLightboxIndex(0)
                        }}
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                          {artwork.images.length > 0 ? (
                            <Image
                              src={artwork.images[0].display}
                              alt={getDisplayTitle(artwork)}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Images className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="mt-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {getDisplayTitle(artwork)}
                          </h3>
                          <p className="text-xs text-gray-500">{artwork.year}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {series.latestArtworks.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Images className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No artworks in this series yet.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Failed to load series.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Lightbox for viewing individual artwork */}
          <AnimatePresence>
            {selectedArtwork && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center"
                onClick={() => setSelectedArtwork(null)}
              >
                {/* Close button */}
                <button
                  onClick={() => setSelectedArtwork(null)}
                  className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
                >
                  <X className="w-8 h-8" />
                </button>

                {/* Navigation arrows */}
                {series && (
                  <>
                    {series.latestArtworks.findIndex(a => a.id === selectedArtwork.id) > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigateLightbox('prev') }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors z-10"
                      >
                        <ChevronLeft className="w-10 h-10" />
                      </button>
                    )}
                    {series.latestArtworks.findIndex(a => a.id === selectedArtwork.id) < series.latestArtworks.length - 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigateLightbox('next') }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors z-10"
                      >
                        <ChevronRight className="w-10 h-10" />
                      </button>
                    )}
                  </>
                )}

                {/* Image */}
                <motion.div
                  key={selectedArtwork.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative max-w-[90vw] max-h-[80vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {selectedArtwork.images.length > 0 && (
                    <Image
                      src={selectedArtwork.images[lightboxIndex]?.original || selectedArtwork.images[lightboxIndex]?.display}
                      alt={getDisplayTitle(selectedArtwork)}
                      width={1200}
                      height={900}
                      className="max-h-[80vh] w-auto object-contain"
                    />
                  )}

                  {/* Multiple images indicator */}
                  {selectedArtwork.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {selectedArtwork.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx) }}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === lightboxIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Artwork info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="max-w-3xl mx-auto text-white">
                    <h3 className="text-xl font-medium">{getDisplayTitle(selectedArtwork)}</h3>
                    <p className="text-white/70 text-sm mt-1">
                      {selectedArtwork.year} • {getDisplayMedium(selectedArtwork)}
                      {selectedArtwork.dimensions && ` • ${selectedArtwork.dimensions}`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
