'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Calendar, Images, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SeriesService, SeriesWithArtworks } from '@/services'
import { useScrollAnimation, useParallax } from '@/hooks/useScrollAnimation'

interface FeaturedSeriesProps {
  id?: string
  className?: string
  limit?: number
}

const FeaturedSeries = ({ id = "series", className = "", limit = 6 }: FeaturedSeriesProps) => {
  const [series, setSeries] = useState<SeriesWithArtworks[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [ref, isInView] = useScrollAnimation(0.05) // Lower threshold to trigger earlier
  const [parallaxRef, parallaxY] = useParallax(30)

  // Fetch featured series data
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setIsLoading(true)
        console.log('[FeaturedSeries] Fetching series with limit:', limit)
        const seriesData = await SeriesService.getFeaturedSeries(limit)
        console.log('[FeaturedSeries] Fetched series:', seriesData?.length, seriesData)
        setSeries(seriesData)
      } catch (err) {
        console.error('[FeaturedSeries] Error fetching featured series:', err)
        setError('Failed to load series')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSeries()
  }, [limit])

  if (isLoading) {
    return (
      <section id={id} className={`py-24 px-8 bg-white ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[4/5] bg-gray-200 rounded-lg"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id={id} className={`py-24 px-8 bg-white ${className}`}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-600">Error loading series: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </section>
    )
  }

  if (series.length === 0) {
    return (
      <section id={id} className={`py-24 px-8 bg-white ${className}`}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-light text-gray-900 mb-4">Featured Series</h2>
          <p className="text-gray-600">No series available yet.</p>
        </div>
      </section>
    )
  }

  return (
    <section id={id} ref={ref} className={`relative py-24 px-8 bg-white overflow-hidden ${className}`}>
      {/* Parallax background elements */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 opacity-5"
        style={{ transform: `translateY(${parallaxY}px)` }}
      >
        <div className="absolute top-1/4 right-10 w-72 h-72 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-10 w-80 h-80 bg-gradient-to-br from-green-200 to-blue-200 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10"
      >
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl font-light text-gray-900 mb-4"
          >
            Featured Series
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Curated collections exploring themes of cultural confluence and landscape memory
            <span className="block text-lg mt-2 opacity-80">
              Séries em Destaque • Coleções que exploram confluências culturais
            </span>
          </motion.p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {series.map((seriesItem, index) => {
              const delay = index * 0.2

              return (
                <motion.div
                  key={seriesItem.id}
                  initial={{ opacity: 0, y: 60, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 60, scale: 0.9 }}
                  transition={{
                    duration: 0.8,
                    delay: delay,
                    ease: "easeOut",
                    type: "spring",
                    stiffness: 100
                  }}
                  className="group cursor-pointer"
                >
                  <Link href={`/series/${seriesItem.id}`}>
                    <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group-hover:scale-[1.02]">
                      {/* Main series image */}
                      <div className="relative aspect-[4/5] overflow-hidden">
                        {seriesItem.coverImage ? (
                          <Image
                            src={seriesItem.coverImage}
                            alt={seriesItem.name.en}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : seriesItem.latestArtworks.length > 0 && seriesItem.latestArtworks[0].images.length > 0 ? (
                          <Image
                            src={seriesItem.latestArtworks[0].images[0].display}
                            alt={seriesItem.name.en}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <Images className="w-16 h-16 text-gray-400" />
                          </div>
                        )}

                        {/* Overlay with artwork preview */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex space-x-1 mb-3">
                              {seriesItem.latestArtworks.slice(0, 3).map((artwork, artIndex) => (
                                artwork.images.length > 0 && (
                                  <motion.div
                                    key={artwork.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + artIndex * 0.1 }}
                                    className="flex-1 aspect-square relative rounded overflow-hidden"
                                  >
                                    <Image
                                      src={artwork.images[0].thumbnail}
                                      alt={artwork.title.en}
                                      fill
                                      className="object-cover"
                                    />
                                  </motion.div>
                                )
                              ))}
                            </div>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              className="flex items-center text-white text-sm"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              <span>View {seriesItem.artworkCount} artworks</span>
                            </motion.div>
                          </div>
                        </div>

                        {/* Series type badge */}
                        <div className="absolute top-4 right-4">
                          {seriesItem.isSeasonal ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Seasonal
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              Collection
                            </Badge>
                          )}
                        </div>

                        {/* Artwork count indicator */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                          transition={{ delay: delay + 0.5, type: "spring" }}
                          className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-gray-900"
                        >
                          {seriesItem.artworkCount} works
                        </motion.div>
                      </div>

                      <CardContent className="p-6">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                          transition={{ delay: delay + 0.3 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{seriesItem.year}</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                          </div>

                          <h3 className="text-xl font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                            {seriesItem.name.en}
                          </h3>

                          <p className="text-sm text-gray-600 mb-1 font-medium">
                            {seriesItem.name.ptBR}
                          </p>

                          <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                            {seriesItem.description.en || seriesItem.description.ptBR}
                          </p>

                          {/* Artwork preview thumbnails */}
                          {seriesItem.latestArtworks.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                              transition={{ delay: delay + 0.6 }}
                              className="mt-4 flex space-x-2"
                            >
                              {seriesItem.latestArtworks.slice(0, 4).map((artwork, artIndex) => (
                                artwork.images.length > 0 && (
                                  <motion.div
                                    key={artwork.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                                    transition={{ delay: delay + 0.7 + artIndex * 0.05 }}
                                    whileHover={{ scale: 1.1, zIndex: 10 }}
                                    className="w-12 h-12 relative rounded overflow-hidden border-2 border-gray-100 group-hover:border-blue-200 transition-colors"
                                  >
                                    <Image
                                      src={artwork.images[0].thumbnail}
                                      alt={artwork.title.en}
                                      fill
                                      className="object-cover"
                                    />
                                  </motion.div>
                                )
                              ))}
                              {seriesItem.artworkCount > 4 && (
                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-600">
                                  +{seriesItem.artworkCount - 4}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </motion.div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </div>

          {/* View all series button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center mt-12"
          >
            <Button
              variant="outline"
              size="lg"
              className="group hover:bg-gray-900 hover:text-white transition-all duration-300"
              asChild
            >
              <Link href="/series">
                View All Series
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating decorative elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={isInView ? {
          opacity: 1,
          scale: 1,
          y: [0, -15, 0],
          rotate: [0, 5, 0, -5, 0]
        } : { opacity: 0, scale: 0 }}
        transition={{
          opacity: { delay: 1.2, duration: 1 },
          scale: { delay: 1.2, duration: 1 },
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute top-20 right-20 w-16 h-16 bg-blue-100 rounded-full opacity-20 hidden lg:block"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={isInView ? {
          opacity: 1,
          scale: 1,
          y: [0, 20, 0],
          rotate: [0, -8, 0, 8, 0]
        } : { opacity: 0, scale: 0 }}
        transition={{
          opacity: { delay: 1.4, duration: 1 },
          scale: { delay: 1.4, duration: 1 },
          y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute bottom-20 left-20 w-24 h-24 bg-purple-100 rounded-full opacity-20 hidden lg:block"
      />
    </section>
  )
}

export default FeaturedSeries