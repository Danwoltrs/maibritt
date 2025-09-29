'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Eye, Heart, ArrowRight, DollarSign, Calendar, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArtworkService } from '@/services'
import { Artwork } from '@/types'
import { useScrollAnimation, useContinuousParallax } from '@/hooks/useScrollAnimation'

interface CurrentAvailabilityProps {
  id?: string
  className?: string
}

// Mock reviews data - in a real app, this would come from a reviews service
const mockReviews = [
  {
    id: '1',
    title: 'Mai-Britt Wolthers e a Cor Protagonista',
    excerpt: 'A retrospective showcasing four decades of transcultural artistic exploration, where Danish sensibility meets Brazilian landscape exuberance...',
    source: 'Pinacoteca Benedicto Calixto',
    publishedDate: '2025',
    url: '#'
  },
  {
    id: '2',
    title: 'Confluências: Brazilian-Danish Contemporary Art',
    excerpt: 'An extraordinary exhibition that bridges cultures through color and form, demonstrating the artist\'s unique perspective on transcultural narratives...',
    source: 'Arte Magazine',
    publishedDate: '2024',
    url: '#'
  }
]

const CurrentAvailability = ({ id = "availability", className = "" }: CurrentAvailabilityProps) => {
  const [availableWorks, setAvailableWorks] = useState<Artwork[]>([])
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [ref, isInView] = useScrollAnimation(0.3)
  const [parallaxRef, parallaxOffset] = useContinuousParallax(0.2)

  // Fetch available artworks
  useEffect(() => {
    const fetchAvailableWorks = async () => {
      try {
        setIsLoading(true)
        const response = await ArtworkService.getArtworks(
          { forSale: true },
          { page: 1, limit: 4 }
        )
        setAvailableWorks(response.artworks)
        setTotalAvailable(response.total)
      } catch (err) {
        console.error('Error fetching available works:', err)
        setError('Failed to load available works')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableWorks()
  }, [])

  const formatPrice = (price: number, currency: string) => {
    const symbols = { BRL: 'R$', USD: '$', EUR: '€' }
    return `${symbols[currency as keyof typeof symbols] || currency} ${price.toLocaleString()}`
  }

  if (isLoading) {
    return (
      <section id={id} className={`py-24 px-8 bg-white ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
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
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      >
        <div className="absolute top-1/4 right-10 w-80 h-80 bg-gradient-to-br from-green-200 to-blue-200 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-7xl mx-auto"
      >
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl font-light text-gray-900 mb-4"
          >
            Available Now
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Current artworks available for acquisition and latest press coverage
            <span className="block text-lg mt-2 opacity-80">
              Disponível Agora • Obras atuais e cobertura da imprensa
            </span>
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Available Works */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-medium text-gray-900 flex items-center">
                <ShoppingBag className="w-6 h-6 mr-3 text-blue-600" />
                Works for Acquisition
              </h3>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {totalAvailable} available
              </Badge>
            </div>

            {error ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : availableWorks.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {availableWorks.map((work, index) => (
                    <motion.div
                      key={work.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="group cursor-pointer"
                    >
                      <Link href={`/artwork/${work.id}`}>
                        <Card className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
                          <div className="aspect-square overflow-hidden relative">
                            {work.images.length > 0 ? (
                              <Image
                                src={work.images[0].thumbnail}
                                alt={work.title.en}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <Eye className="w-8 h-8 text-gray-400" />
                              </div>
                            )}

                            {/* Price overlay */}
                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium text-gray-900">
                              {work.price ? formatPrice(work.price, work.currency || 'BRL') : 'POA'}
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="text-white text-center">
                                <Eye className="w-6 h-6 mx-auto mb-2" />
                                <span className="text-sm">View Details</span>
                              </div>
                            </div>
                          </div>

                          <CardContent className="p-4">
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-1 mb-1">
                              {work.title.en}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">{work.title.ptBR}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{work.year}</span>
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {work.medium.en.split(',')[0]}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="text-center space-y-4"
                >
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span>Secure transactions</span>
                    </div>
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-1" />
                      <span>Authenticity guaranteed</span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="bg-gray-900 hover:bg-gray-800 text-white group"
                    asChild
                  >
                    <Link href="/portfolio?available=true">
                      View All Available Works ({totalAvailable})
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </motion.div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">No works currently available for purchase</p>
                <Button variant="outline" asChild>
                  <Link href="/contact">
                    Inquire about future availability
                  </Link>
                </Button>
              </div>
            )}
          </motion.div>

          {/* Latest Reviews */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-medium text-gray-900 flex items-center">
                <Newspaper className="w-6 h-6 mr-3 text-purple-600" />
                Latest Reviews
              </h3>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Recent press
              </Badge>
            </div>

            <div className="space-y-6">
              {mockReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className="border-l-4 border-purple-200 pl-6 py-4 hover:border-purple-400 transition-all duration-300 cursor-pointer"
                >
                  <Link href={review.url}>
                    <h4 className="font-medium text-gray-900 text-lg mb-3 hover:text-purple-600 transition-colors">
                      {review.title}
                    </h4>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {review.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-medium">{review.source}</span>
                      <span>{review.publishedDate}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="mt-8 text-center"
            >
              <Button
                variant="outline"
                className="group hover:bg-purple-50 hover:border-purple-300"
                asChild
              >
                <Link href="/press">
                  View All Press Coverage
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Live stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              value: totalAvailable,
              label: 'Available Works',
              labelPt: 'Obras Disponíveis',
              icon: ShoppingBag,
              color: 'text-green-600'
            },
            {
              value: '40+',
              label: 'Years Creating',
              labelPt: 'Anos Criando',
              icon: Calendar,
              color: 'text-blue-600'
            },
            {
              value: '17',
              label: 'Solo Exhibitions',
              labelPt: 'Exposições Solo',
              icon: Eye,
              color: 'text-purple-600'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ delay: 1.1 + index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              className="text-center bg-gray-50 rounded-lg p-6 border border-gray-100"
            >
              <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
              <div className="text-3xl font-light text-gray-900 mb-2">{stat.value}</div>
              <div className="text-sm font-medium text-gray-800">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.labelPt}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

export default CurrentAvailability