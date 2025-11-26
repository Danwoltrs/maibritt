'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Calendar, MapPin, Award, Users, Palette, ArrowLeft,
  Share2, ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ExhibitionsService } from '@/services/exhibitions.service'
import { Exhibition } from '@/types'

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

  useEffect(() => {
    const fetchExhibition = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all exhibitions to find by slug
        const allExhibitions = await ExhibitionsService.getExhibitions()

        // Find exhibition by slug (title-year format)
        const found = allExhibitions.find(e => {
          const titleSlug = e.title.toLowerCase()
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

  const generateSlug = (exhibition: Exhibition) => {
    const titleSlug = exhibition.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return `${titleSlug}-${exhibition.year}`
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: exhibition?.title,
          text: `${exhibition?.title} at ${exhibition?.venue}`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/exhibitions')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Exhibitions
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      {exhibition.image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative h-[50vh] md:h-[60vh] w-full"
        >
          <Image
            src={exhibition.image}
            alt={exhibition.title}
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
                {exhibition.title}
              </h1>
              <p className="text-xl text-gray-200">{exhibition.year}</p>
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
              {exhibition.title}
            </h1>
            <p className="text-2xl text-gray-500">{exhibition.year}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                About this {typeLabel.en}
              </h2>
              <div className="prose prose-lg max-w-none">
                {exhibition.description ? (
                  <p className="text-gray-700 leading-relaxed">{exhibition.description}</p>
                ) : (
                  <p className="text-gray-500 italic">
                    No description available for this exhibition.
                  </p>
                )}
              </div>
            </motion.div>

            {/* Placeholder for future curator text, images, videos */}
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
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Year
                    </h3>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4" />
                      <span>{exhibition.year}</span>
                    </div>
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
                                  alt={related.title}
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
                                {related.title}
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
    </div>
  )
}
