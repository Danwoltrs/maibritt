'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Artwork } from '@/types'

interface ArtworkDetailClientProps {
  artwork: Artwork
}

export default function ArtworkDetailClient({ artwork }: ArtworkDetailClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showFullscreen, setShowFullscreen] = useState(false)

  const currentImage = artwork.images[currentImageIndex]
  const hasMultipleImages = artwork.images.length > 1

  const handleDownload = async () => {
    if (!currentImage) return
    const link = document.createElement('a')
    link.href = currentImage.original
    link.download = `${artwork.title.en} - Mai-Britt Wolthers.jpg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const prevImage = () => {
    setCurrentImageIndex((i) => (i === 0 ? artwork.images.length - 1 : i - 1))
  }

  const nextImage = () => {
    setCurrentImageIndex((i) => (i === artwork.images.length - 1 ? 0 : i + 1))
  }

  return (
    <>
      <div className="min-h-screen bg-white pt-8 pb-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back link */}
          <Link
            href="/portfolio"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Portfolio
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden group">
                {currentImage ? (
                  <>
                    <Image
                      src={currentImage.display}
                      alt={artwork.title.en}
                      fill
                      className="object-contain cursor-zoom-in"
                      priority
                      onClick={() => setShowFullscreen(true)}
                    />
                    <button
                      onClick={() => setShowFullscreen(true)}
                      className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ZoomIn className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image available
                  </div>
                )}

                {/* Navigation arrows */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {hasMultipleImages && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {artwork.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`relative w-20 h-20 flex-shrink-0 rounded overflow-hidden border-2 transition-colors ${
                        i === currentImageIndex
                          ? 'border-gray-900'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={img.thumbnail}
                        alt={`${artwork.title.en} - view ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Details section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl md:text-4xl font-light text-gray-900">
                  {artwork.title.en}
                </h1>
                {artwork.forSale && (
                  <Badge className="bg-green-50 text-green-700 border-green-200 flex-shrink-0">
                    Available
                  </Badge>
                )}
              </div>

              {artwork.title.ptBR && artwork.title.ptBR !== artwork.title.en && (
                <p className="text-lg text-gray-500 italic mb-6">{artwork.title.ptBR}</p>
              )}

              <div className="space-y-4 text-gray-700 mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-500 w-24">Year</span>
                  <span>{artwork.year}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-500 w-24">Medium</span>
                  <span>{artwork.medium.en}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-500 w-24">Dimensions</span>
                  <span>{artwork.dimensions}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-500 w-24">Category</span>
                  <span className="capitalize">{artwork.category}</span>
                </div>
              </div>

              {artwork.description.en && (
                <div className="mb-8">
                  <p className="text-gray-600 leading-relaxed">{artwork.description.en}</p>
                  {artwork.description.ptBR && artwork.description.ptBR !== artwork.description.en && (
                    <p className="text-gray-500 leading-relaxed mt-3 text-sm italic">
                      {artwork.description.ptBR}
                    </p>
                  )}
                </div>
              )}

              {artwork.forSale && artwork.price && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <p className="text-2xl font-light text-gray-900">
                    {artwork.currency === 'BRL' ? 'R$' : artwork.currency === 'EUR' ? '€' : '$'}{' '}
                    {artwork.price.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Contact for acquisition details
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-auto">
                {currentImage && (
                  <Button onClick={handleDownload} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Image
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href="/contact">Inquire</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Fullscreen overlay */}
      {showFullscreen && currentImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center cursor-zoom-out"
          onClick={() => setShowFullscreen(false)}
        >
          <Image
            src={currentImage.original}
            alt={artwork.title.en}
            fill
            className="object-contain p-8"
          />
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white text-lg"
          >
            Close
          </button>
        </motion.div>
      )}
    </>
  )
}
