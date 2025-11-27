'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, MapPin, Award, Users, Palette, ArrowLeft,
  Share2, ExternalLink, ChevronLeft, ChevronRight, X,
  Clock, Quote, Play, BookOpen, Download
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ExhibitionsService } from '@/services/exhibitions.service'
import { Exhibition, ExhibitionImage } from '@/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function ExhibitionDetailPage({ params }: PageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [relatedExhibitions, setRelatedExhibitions] = useState<Exhibition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    const fetchExhibition = async () => {
      try {
        setLoading(true)
        setError(null)

        const allExhibitions = await ExhibitionsService.getExhibitions()

        // Find exhibition by slug (title-year format)
        const found = allExhibitions.find(e => {
          const title = e.title.en || e.title.ptBR
          const titleSlug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
          const exhibitionSlug = `${titleSlug}-${e.year}`
          return exhibitionSlug === slug
        })

        if (!found) {
          setError('Exhibition not found')
          return
        }

        setExhibition(found)

        // Get related exhibitions (same type or same year)
        const related = allExhibitions
          .filter(e => e.id !== found.id && (e.type === found.type || e.year === found.year))
          .slice(0, 3)
        setRelatedExhibitions(related)

      } catch (err) {
        console.error('Error fetching exhibition:', err)
        setError('Failed to load exhibition')
      } finally {
        setLoading(false)
      }
    }

    fetchExhibition()
  }, [slug])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'solo': return <Award className="w-5 h-5" />
      case 'group': return <Users className="w-5 h-5" />
      case 'residency': return <Palette className="w-5 h-5" />
      default: return <Calendar className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'solo': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'group': return 'bg-green-100 text-green-800 border-green-200'
      case 'residency': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'solo': return { en: 'Solo Exhibition', pt: 'Exposicao Individual' }
      case 'group': return { en: 'Group Exhibition', pt: 'Exposicao Coletiva' }
      case 'residency': return { en: 'Artist Residency', pt: 'Residencia Artistica' }
      default: return { en: 'Exhibition', pt: 'Exposicao' }
    }
  }

  // Helpers for bilingual content
  const getDisplayTitle = (ex: Exhibition) => ex.title.en || ex.title.ptBR
  const getDisplayDescription = (ex: Exhibition) => ex.description?.en || ex.description?.ptBR || ''
  const getDisplayContent = (ex: Exhibition) => ex.content?.en || ex.content?.ptBR || ''
  const getDisplayCuratorText = (ex: Exhibition) => ex.curatorText?.en || ex.curatorText?.ptBR || ''

  const generateSlug = (ex: Exhibition) => {
    const title = getDisplayTitle(ex)
    const titleSlug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return `${titleSlug}-${ex.year}`
  }

  const formatDate = (date?: Date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateRange = (start?: Date, end?: Date) => {
    if (!start && !end) return null
    if (start && end) {
      return `${formatDate(start)} - ${formatDate(end)}`
    }
    return formatDate(start || end)
  }

  const getVideoEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }
    return url
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const title = exhibition ? getDisplayTitle(exhibition) : ''
        await navigator.share({
          title: title,
          text: `${title} at ${exhibition?.venue}`,
          url: window.location.href
        })
      } catch {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  // Get all images for lightbox (cover + gallery)
  const getAllImages = (): ExhibitionImage[] => {
    if (!exhibition) return []
    const images: ExhibitionImage[] = []
    if (exhibition.image) {
      images.push({ url: exhibition.image, isCover: true })
    }
    if (exhibition.images && exhibition.images.length > 0) {
      images.push(...exhibition.images)
    }
    return images
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const images = getAllImages()
    if (direction === 'prev') {
      setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    } else {
      setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-24 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !exhibition) {
    return (
      <div className="min-h-screen bg-gray-50 py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Exhibition Not Found</h1>
          <p className="text-gray-500 mb-8">{error || 'The requested exhibition could not be found.'}</p>
          <Button onClick={() => router.push('/exhibitions')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Exhibitions
          </Button>
        </div>
      </div>
    )
  }

  const typeLabel = getTypeLabel(exhibition.type)
  const dateRange = formatDateRange(exhibition.startDate, exhibition.endDate)
  const hasContent = getDisplayContent(exhibition).length > 0
  const hasCuratorText = getDisplayCuratorText(exhibition).length > 0
  const hasGalleryImages = exhibition.images && exhibition.images.length > 0
  const hasVideos = exhibition.videos && exhibition.videos.length > 0
  const allImages = getAllImages()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/exhibitions')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Exhibitions
          </Button>
          <div className="flex items-center gap-2">
            {exhibition.catalogUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={exhibition.catalogUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Catalog
                </a>
              </Button>
            )}
            {exhibition.externalUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={exhibition.externalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Website
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      {exhibition.image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative h-[50vh] md:h-[60vh] w-full cursor-pointer"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={exhibition.image}
            alt={getDisplayTitle(exhibition)}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <div className="max-w-6xl mx-auto">
              <Badge className={`${getTypeColor(exhibition.type)} mb-4`}>
                {getTypeIcon(exhibition.type)}
                <span className="ml-2 capitalize">{exhibition.type}</span>
              </Badge>
              <h1 className="text-3xl md:text-5xl font-light text-white mb-2">
                {getDisplayTitle(exhibition)}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-200">
                <span className="text-xl">{exhibition.year}</span>
                {dateRange && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {dateRange}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {!exhibition.image && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Badge className={`${getTypeColor(exhibition.type)} mb-4`}>
              {getTypeIcon(exhibition.type)}
              <span className="ml-2 capitalize">{exhibition.type}</span>
            </Badge>
            <h1 className="text-3xl md:text-5xl font-light text-gray-900 mb-2">
              {getDisplayTitle(exhibition)}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-500">
              <span className="text-2xl">{exhibition.year}</span>
              {dateRange && (
                <>
                  <span>|</span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {dateRange}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            {getDisplayDescription(exhibition) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  About this {typeLabel.en}
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {getDisplayDescription(exhibition)}
                </p>
              </motion.div>
            )}

            {/* Curator Quote */}
            {hasCuratorText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="border-l-4 border-gray-900 pl-6 py-4 bg-gray-100 rounded-r-lg"
              >
                <Quote className="w-8 h-8 text-gray-400 mb-3" />
                <blockquote className="text-lg italic text-gray-700 leading-relaxed">
                  {getDisplayCuratorText(exhibition)}
                </blockquote>
                {exhibition.curatorName && (
                  <p className="mt-4 text-sm font-medium text-gray-900">
                    - {exhibition.curatorName}
                  </p>
                )}
              </motion.div>
            )}

            {/* Rich Content Body */}
            {hasContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border-t pt-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-gray-500" />
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Exhibition Details
                  </h2>
                </div>
                <div className="prose prose-lg max-w-none prose-headings:font-light prose-p:text-gray-700 prose-p:leading-relaxed">
                  {/* Render content as paragraphs (split by double newlines) */}
                  {getDisplayContent(exhibition).split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Image Gallery */}
            {hasGalleryImages && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="border-t pt-8"
              >
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                  Gallery
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {exhibition.images.map((img, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => openLightbox(exhibition.image ? idx + 1 : idx)}
                    >
                      <Image
                        src={img.url}
                        alt={img.captionEn || img.captionPt || `Gallery image ${idx + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {(img.captionEn || img.captionPt) && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-sm line-clamp-2">
                            {img.captionEn || img.captionPt}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Videos */}
            {hasVideos && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="border-t pt-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Play className="w-5 h-5 text-gray-500" />
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Videos
                  </h2>
                </div>
                <div className="space-y-6">
                  {exhibition.videos.map((video, idx) => (
                    <div key={idx} className="space-y-2">
                      {(video.titleEn || video.titlePt) && (
                        <h3 className="text-lg font-medium text-gray-900">
                          {video.titleEn || video.titlePt}
                        </h3>
                      )}
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                        <iframe
                          src={getVideoEmbedUrl(video.url)}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Exhibition Type - Show if no rich content */}
            {!hasContent && !hasCuratorText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border-t pt-8"
              >
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                  Exhibition Type
                </h2>
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-lg ${getTypeColor(exhibition.type)}`}>
                    {getTypeIcon(exhibition.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{typeLabel.en}</p>
                    <p className="text-sm text-gray-500">{typeLabel.pt}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Venue
                    </h3>
                    <p className="text-lg font-medium text-gray-900">{exhibition.venue}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Location
                    </h3>
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4" />
                      <span>{exhibition.location}</span>
                    </div>
                  </div>
                  {dateRange && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Dates
                      </h3>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span>{dateRange}</span>
                      </div>
                    </div>
                  )}
                  {exhibition.openingDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Opening Reception
                      </h3>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4" />
                        <div>
                          <p>{formatDate(exhibition.openingDate)}</p>
                          {exhibition.openingDetails && (
                            <p className="text-sm text-gray-500">{exhibition.openingDetails}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Type
                    </h3>
                    <Badge className={`${getTypeColor(exhibition.type)}`}>
                      {getTypeIcon(exhibition.type)}
                      <span className="ml-2">{typeLabel.en}</span>
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Related Exhibitions */}
            {relatedExhibitions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                  Related Exhibitions
                </h3>
                <div className="space-y-3">
                  {relatedExhibitions.map((related) => (
                    <Link
                      key={related.id}
                      href={`/exhibitions/${generateSlug(related)}`}
                      className="block"
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {related.image ? (
                              <div className="w-16 h-12 relative rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={related.image}
                                  alt={getDisplayTitle(related)}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                {getTypeIcon(related.type)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm line-clamp-1">
                                {getDisplayTitle(related)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {related.venue}, {related.year}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-white border-t py-8 px-8">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push('/exhibitions')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            View All Exhibitions
          </Button>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && allImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-50"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('prev') }}
                  className="absolute left-4 text-white/80 hover:text-white p-2"
                >
                  <ChevronLeft className="w-10 h-10" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('next') }}
                  className="absolute right-4 text-white/80 hover:text-white p-2"
                >
                  <ChevronRight className="w-10 h-10" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full max-w-5xl max-h-[85vh] mx-8"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={allImages[lightboxIndex].url}
                alt={allImages[lightboxIndex].captionEn || allImages[lightboxIndex].captionPt || 'Exhibition image'}
                fill
                className="object-contain"
              />
              {/* Caption */}
              {(allImages[lightboxIndex].captionEn || allImages[lightboxIndex].captionPt) && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-center">
                    {allImages[lightboxIndex].captionEn || allImages[lightboxIndex].captionPt}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
