'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArtworkService } from '@/services'
import { Artwork } from '@/types'

interface HeroCarouselProps {
  autoRotateInterval?: number
  showControls?: boolean
  className?: string
}

const HeroCarousel = ({
  autoRotateInterval = 8000, // Slower: 8 seconds instead of 5
  showControls = true,
  className = ""
}: HeroCarouselProps) => {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch latest artworks for carousel
  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        setIsLoading(true)
        const response = await ArtworkService.getArtworks(
          { featured: true }, // Show featured artworks first
          { page: 1, limit: 6 }
        )

        if (response.artworks.length === 0) {
          // Fallback to latest artworks if no featured ones
          const fallbackResponse = await ArtworkService.getArtworks(
            {},
            { page: 1, limit: 6 }
          )
          setArtworks(fallbackResponse.artworks)
        } else {
          setArtworks(response.artworks)
        }
      } catch (err) {
        console.error('Error fetching artworks for carousel:', err)
        setError('Failed to load artworks')
      } finally {
        setIsLoading(false)
      }
    }

    fetchArtworks()
  }, [])

  // Auto-rotation effect
  useEffect(() => {
    if (!isPlaying || artworks.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % artworks.length)
    }, autoRotateInterval)

    return () => clearInterval(interval)
  }, [isPlaying, artworks.length, autoRotateInterval])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious()
      } else if (event.key === 'ArrowRight') {
        goToNext()
      } else if (event.key === ' ') {
        event.preventDefault()
        togglePlayPause()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [artworks.length])

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % artworks.length)
  }

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + artworks.length) % artworks.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  if (isLoading) {
    return (
      <div className={`relative h-screen w-full bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading artworks...</p>
        </div>
      </div>
    )
  }

  if (error || artworks.length === 0) {
    return (
      <div className={`relative h-screen w-full bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'No artworks available'}</p>
          <Button onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    )
  }

  const currentArtwork = artworks[currentSlide]

  return (
    <div
      className={`relative h-screen w-full overflow-hidden ${className}`}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Main carousel content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.2,
            ease: "easeInOut"
          }}
          className="absolute inset-0"
        >
          {currentArtwork.images.length > 0 && (
            <Image
              src={currentArtwork.images[0].display}
              alt={currentArtwork.title.en}
              fill
              className="object-cover"
              priority={currentSlide === 0}
              sizes="100vw"
            />
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Artwork information */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute bottom-8 left-8 text-white max-w-md"
          >
            <h2 className="text-3xl md:text-4xl font-light mb-3">
              {currentArtwork.title.en}
            </h2>
            <p className="text-lg opacity-90 mb-2">
              {currentArtwork.year} • {currentArtwork.medium.en}
            </p>
            <p className="text-sm opacity-80">
              {currentArtwork.dimensions}
            </p>
            {currentArtwork.forSale && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4"
              >
                <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                  Available for purchase
                </span>
              </motion.div>
            )}
          </motion.div>

        </motion.div>
      </AnimatePresence>

      {/* Navigation controls */}
      {showControls && artworks.length > 1 && (
        <>
          {/* Arrow controls */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border-none z-10"
            onClick={goToPrevious}
            aria-label="Previous artwork"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border-none z-10"
            onClick={goToNext}
            aria-label="Next artwork"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Play/Pause control */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white border-none z-10"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          {/* Dot indicators with counter below */}
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-4 z-10">
            <div className="flex space-x-3">
              {artworks.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'bg-white scale-125'
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to artwork ${index + 1}`}
                />
              ))}
            </div>
            
            {/* Artwork counter below dots */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-white bg-black/20 backdrop-blur-sm rounded-full px-3 py-1"
            >
              <span className="text-xs font-medium">
                {currentSlide + 1} of {artworks.length}
              </span>
            </motion.div>
          </div>
        </>
      )}

      {/* Progress bar */}
      {isPlaying && artworks.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-10">
          <motion.div
            className="h-full bg-white"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: autoRotateInterval / 1000,
              ease: 'linear',
              repeat: Infinity
            }}
            key={currentSlide} // Reset animation on slide change
          />
        </div>
      )}

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white z-10"
      >
        <div className="flex flex-col items-center space-y-2">
          <span className="text-xs opacity-70 uppercase tracking-wide">
            Scroll to explore
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-px h-8 bg-white/60"
          />
        </div>
      </motion.div>
    </div>
  )
}

export default HeroCarousel