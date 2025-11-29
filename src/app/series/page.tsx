'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Calendar, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SeriesService, SeriesWithArtworks } from '@/services'
import SeriesModal from '@/components/series/SeriesModal'

export default function SeriesGalleryPage() {
  const [series, setSeries] = useState<SeriesWithArtworks[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setIsLoading(true)
        const data = await SeriesService.getFeaturedSeries(100) // Get all series
        setSeries(data)
      } catch (err) {
        console.error('Error fetching series:', err)
        setError('Failed to load series')
      } finally {
        setIsLoading(false)
      }
    }
    fetchSeries()
  }, [])

  const openSeriesModal = (seriesId: string) => {
    setSelectedSeriesId(seriesId)
    setIsModalOpen(true)
  }

  const closeSeriesModal = () => {
    setIsModalOpen(false)
    setSelectedSeriesId(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[4/5] bg-gray-200 rounded-lg"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-light text-gray-900"
          >
            All Series
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 mt-4 max-w-2xl"
          >
            Explore curated collections exploring themes of cultural confluence and landscape memory
            <span className="block text-lg mt-1 opacity-80">
              Todas as Séries • Coleções que exploram confluências culturais
            </span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-gray-500 mt-4"
          >
            {series.length} series available
          </motion.p>
        </div>
      </div>

      {/* Series Grid */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {series.length === 0 ? (
          <div className="text-center py-16">
            <Images className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No series available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {series.map((seriesItem, index) => (
              <motion.div
                key={seriesItem.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group cursor-pointer"
                onClick={() => openSeriesModal(seriesItem.id)}
              >
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group-hover:scale-[1.02]">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {seriesItem.coverImage ? (
                      <Image
                        src={seriesItem.coverImage}
                        alt={seriesItem.name.en || seriesItem.name.ptBR}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : seriesItem.latestArtworks.length > 0 && seriesItem.latestArtworks[0].images.length > 0 ? (
                      <Image
                        src={seriesItem.latestArtworks[0].images[0].display}
                        alt={seriesItem.name.en || seriesItem.name.ptBR}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Images className="w-16 h-16 text-gray-400" />
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Badge */}
                    <div className="absolute top-4 right-4">
                      {seriesItem.isSeasonal ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">Seasonal</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">Collection</Badge>
                      )}
                    </div>

                    {/* Artwork count */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-gray-900">
                      {seriesItem.artworkCount} works
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{seriesItem.year}</span>
                    </div>

                    <h3 className="text-xl font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {seriesItem.name.en || seriesItem.name.ptBR}
                    </h3>

                    {seriesItem.name.ptBR && seriesItem.name.en && (
                      <p className="text-sm text-gray-500 mb-2">{seriesItem.name.ptBR}</p>
                    )}

                    <p className="text-gray-600 text-sm line-clamp-3">
                      {seriesItem.description.en || seriesItem.description.ptBR}
                    </p>

                    {/* Preview thumbnails */}
                    {seriesItem.latestArtworks.length > 0 && (
                      <div className="mt-4 flex space-x-2">
                        {seriesItem.latestArtworks.slice(0, 4).map((artwork) => (
                          artwork.images.length > 0 && (
                            <div
                              key={artwork.id}
                              className="w-10 h-10 relative rounded overflow-hidden border border-gray-100"
                            >
                              <Image
                                src={artwork.images[0].thumbnail}
                                alt={artwork.title.en || artwork.title.ptBR}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )
                        ))}
                        {seriesItem.artworkCount > 4 && (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-500">
                            +{seriesItem.artworkCount - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Series Modal */}
      <SeriesModal
        seriesId={selectedSeriesId}
        isOpen={isModalOpen}
        onClose={closeSeriesModal}
      />
    </div>
  )
}
