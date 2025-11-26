'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, ExternalLink, Globe, Images, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GalleryService, Gallery } from '@/services'
import { useScrollAnimation, useParallax } from '@/hooks/useScrollAnimation'

interface GalleryWithArtworks extends Gallery {
  artworks: {
    id: string
    title_en: string
    title_pt: string
    images: { thumbnail: string; display: string }[]
    year: number
  }[]
}

interface GalleryLocationsProps {
  id?: string
  className?: string
  limit?: number
}

const GalleryLocations = ({ id = "availability", className = "", limit = 6 }: GalleryLocationsProps) => {
  const [galleries, setGalleries] = useState<GalleryWithArtworks[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [ref, isInView] = useScrollAnimation(0.2)
  const [parallaxRef, parallaxY] = useParallax(25)

  // Fetch galleries with artworks
  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        setIsLoading(true)
        const response = await GalleryService.getGalleriesWithArtworks(limit)
        if (response.success && response.data) {
          setGalleries(response.data as GalleryWithArtworks[])
        } else {
          setError(response.error || 'Failed to load galleries')
        }
      } catch (err) {
        console.error('Error fetching galleries:', err)
        setError('Failed to load galleries')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGalleries()
  }, [limit])

  if (isLoading) {
    return (
      <section id={id} className={`py-24 px-8 bg-white ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-video bg-gray-200 rounded-lg"></div>
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

  if (error || galleries.length === 0) {
    return (
      <section id={id} className={`py-24 px-8 bg-white ${className}`}>
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
              Where to Find My Work
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Onde Encontrar Meus Trabalhos
            </p>
            <p className="text-gray-500">
              {error || 'Gallery locations coming soon. Contact the artist for availability.'}
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/contact">
                Contact for Availability
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
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
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-gradient-to-br from-green-200 to-blue-200 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10"
      >
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl font-light text-gray-900 mb-4"
          >
            Where to Find My Work
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Visit these galleries to see original works in person
            <span className="block text-lg mt-2 opacity-80">
              Onde Encontrar Meus Trabalhos
            </span>
          </motion.p>
        </div>

        {/* Gallery Cards */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleries.map((gallery, index) => {
              const delay = index * 0.15

              return (
                <motion.div
                  key={gallery.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{
                    duration: 0.6,
                    delay: delay,
                    ease: "easeOut"
                  }}
                  className="group"
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                    {/* Gallery Photo */}
                    <div className="relative aspect-video overflow-hidden">
                      {gallery.gallery_photo ? (
                        <Image
                          src={gallery.gallery_photo}
                          alt={gallery.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <MapPin className="w-12 h-12 text-gray-400" />
                        </div>
                      )}

                      {/* Featured badge */}
                      {gallery.featured && (
                        <Badge className="absolute top-3 left-3 bg-blue-600 text-white">
                          Featured
                        </Badge>
                      )}

                      {/* Country badge */}
                      <Badge
                        variant="outline"
                        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm"
                      >
                        {gallery.country}
                      </Badge>
                    </div>

                    <CardContent className="p-6">
                      {/* Gallery Name */}
                      <h3 className="text-xl font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {gallery.name}
                      </h3>

                      {/* Location */}
                      <div className="flex items-start gap-2 text-gray-600 text-sm mb-4">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p>{gallery.address_line1}</p>
                          <p>{gallery.city}, {gallery.country}</p>
                        </div>
                      </div>

                      {/* Artwork Previews */}
                      {gallery.artworks && gallery.artworks.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                            <Images className="w-3 h-3" />
                            {gallery.artworks.length} work{gallery.artworks.length > 1 ? 's' : ''} available
                          </p>
                          <div className="flex gap-2">
                            {gallery.artworks.slice(0, 4).map((artwork, artIndex) => (
                              <motion.div
                                key={artwork.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                                transition={{ delay: delay + 0.3 + artIndex * 0.05 }}
                                className="w-12 h-12 relative rounded overflow-hidden border border-gray-100"
                              >
                                {artwork.images && artwork.images[0] && (
                                  <Image
                                    src={artwork.images[0].thumbnail || artwork.images[0].display}
                                    alt={artwork.title_en}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {(gallery.description_en || gallery.description_pt) && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {gallery.description_en || gallery.description_pt}
                        </p>
                      )}

                      {/* Website Link */}
                      {gallery.website && (
                        <a
                          href={gallery.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          Visit Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mt-12"
          >
            <Button
              variant="outline"
              size="lg"
              className="group hover:bg-gray-900 hover:text-white transition-all duration-300"
              asChild
            >
              <Link href="/galleries">
                View All Gallery Locations
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Decorative elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={isInView ? { opacity: 0.2, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-green-100 to-blue-100 rounded-full blur-3xl hidden lg:block"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={isInView ? { opacity: 0.2, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl hidden lg:block"
      />
    </section>
  )
}

export default GalleryLocations
