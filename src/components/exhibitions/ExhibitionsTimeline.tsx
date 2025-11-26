'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Calendar, MapPin, Award, Users, Palette } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ExhibitionsService } from '@/services'
import { Exhibition } from '@/types'
import { useScrollAnimation, useContinuousParallax, useScrollProgress } from '@/hooks/useScrollAnimation'

interface ExhibitionsTimelineProps {
  id?: string
  className?: string
}

const ExhibitionsTimeline = ({ id = "exhibitions", className = "" }: ExhibitionsTimelineProps) => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [ref, isInView] = useScrollAnimation(0.01) // Very low threshold

  // Force visibility after a short delay to ensure content is shown
  const [forceVisible, setForceVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setForceVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const shouldAnimate = isInView || forceVisible
  const [parallaxRef, parallaxOffset] = useContinuousParallax(0.3)
  const [progressRef, scrollProgress] = useScrollProgress()

  // Fetch exhibitions data
  useEffect(() => {
    const fetchExhibitions = async () => {
      try {
        setIsLoading(true)
        console.log('[ExhibitionsTimeline] Fetching exhibitions...')
        const exhibitionsData = await ExhibitionsService.getExhibitions()
        console.log('[ExhibitionsTimeline] Fetched exhibitions:', exhibitionsData?.length, exhibitionsData)
        setExhibitions(exhibitionsData)
      } catch (err) {
        console.error('[ExhibitionsTimeline] Error fetching exhibitions:', err)
        setError('Failed to load exhibitions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExhibitions()
  }, [])

  const getExhibitionIcon = (type: string) => {
    switch (type) {
      case 'solo':
        return <Award className="w-5 h-5" />
      case 'group':
        return <Users className="w-5 h-5" />
      case 'residency':
        return <Palette className="w-5 h-5" />
      default:
        return <Calendar className="w-5 h-5" />
    }
  }

  const getExhibitionColor = (type: string) => {
    switch (type) {
      case 'solo':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'group':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'residency':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <section id={id} className={`py-24 px-8 bg-gray-50 ${className}`}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-12"></div>
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id={id} className={`py-24 px-8 bg-gray-50 ${className}`}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-600">Error loading exhibitions: {error}</p>
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

  if (exhibitions.length === 0) {
    return (
      <section id={id} className={`py-24 px-8 bg-gray-50 ${className}`}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-light text-gray-900 mb-4">Exhibitions</h2>
          <p className="text-gray-600">No exhibitions available yet.</p>
        </div>
      </section>
    )
  }

  return (
    <section id={id} ref={ref} className={`relative py-24 px-8 bg-gray-50 overflow-hidden ${className}`}>
      {/* Continuous parallax background elements */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 opacity-5"
        style={{
          transform: `translateY(${parallaxOffset}px)`
        }}
      >
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-green-200 to-blue-200 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Animated timeline line */}
      <div ref={progressRef} className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gray-200 h-full">
        <motion.div
          className="w-full bg-gradient-to-b from-blue-500 to-purple-500"
          style={{
            height: `${scrollProgress * 100}%`
          }}
          transition={{ ease: "easeOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10"
      >
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl font-light text-gray-900 mb-4"
          >
            Artistic Journey
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Four decades of exhibitions, residencies, and artistic exploration
            <span className="block text-lg mt-2 opacity-80">
              Jornada Artística • Quatro décadas de exposições e exploração
            </span>
          </motion.p>
        </div>

        <div className="max-w-6xl mx-auto">
          {exhibitions.map((exhibition, index) => {
            const isLeft = index % 2 === 0
            const delay = index * 0.1

            return (
              <motion.div
                key={exhibition.id}
                initial={{ opacity: 0, x: isLeft ? -100 : 100, y: 50 }}
                animate={shouldAnimate ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: isLeft ? -100 : 100, y: 50 }}
                transition={{
                  duration: 0.8,
                  delay: delay,
                  ease: "easeOut"
                }}
                className={`relative flex items-center mb-12 md:mb-16 ${
                  isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Timeline dot with fancy animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={shouldAnimate ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                  transition={{
                    duration: 0.6,
                    delay: delay + 0.3,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="absolute left-1/2 transform -translate-x-1/2 z-20 md:relative md:left-auto md:transform-none"
                >
                  <div className="w-16 h-16 bg-white rounded-full border-4 border-gray-200 flex items-center justify-center shadow-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getExhibitionColor(exhibition.type)}`}>
                      {getExhibitionIcon(exhibition.type)}
                    </div>
                  </div>
                </motion.div>

                {/* Exhibition card with parallax effect */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: 0.8,
                    delay: delay + 0.4,
                    ease: "easeOut"
                  }}
                  whileHover={{
                    scale: 1.02,
                    y: -5,
                    transition: { duration: 0.3 }
                  }}
                  className={`w-full md:w-5/12 ${isLeft ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'}`}
                >
                  <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500">
                    {exhibition.image && (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={exhibition.image}
                          alt={exhibition.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}

                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <motion.span
                          initial={{ opacity: 0, x: -20 }}
                          animate={shouldAnimate ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                          transition={{ delay: delay + 0.6 }}
                          className="text-3xl font-light text-gray-900"
                        >
                          {exhibition.year}
                        </motion.span>
                        <Badge
                          variant="outline"
                          className={`${getExhibitionColor(exhibition.type)} capitalize`}
                        >
                          {exhibition.type}
                        </Badge>
                      </div>

                      <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ delay: delay + 0.7 }}
                        className="text-xl font-medium text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors"
                      >
                        {exhibition.title}
                      </motion.h3>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ delay: delay + 0.8 }}
                        className="space-y-2 text-sm text-gray-600"
                      >
                        <p className="font-medium">{exhibition.venue}</p>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{exhibition.location}</span>
                        </div>
                        {exhibition.description && (
                          <p className="line-clamp-3 mt-3 text-gray-700">
                            {exhibition.description}
                          </p>
                        )}
                      </motion.div>

                      {exhibition.featured && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                          transition={{ delay: delay + 0.9 }}
                          className="mt-4"
                        >
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            Featured Exhibition
                          </Badge>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Floating year indicator with continuous movement */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={shouldAnimate ? {
                    opacity: 1,
                    scale: 1,
                    y: [0, -10, 0],
                    rotate: [0, 2, 0, -2, 0]
                  } : { opacity: 0, scale: 0 }}
                  transition={{
                    opacity: { delay: delay + 0.5, type: "spring", stiffness: 100 },
                    scale: { delay: delay + 0.5, type: "spring", stiffness: 100 },
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 },
                    rotate: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }
                  }}
                  className={`hidden md:block absolute ${
                    isLeft ? 'right-0 transform translate-x-1/2' : 'left-0 transform -translate-x-1/2'
                  } bg-white rounded-full shadow-lg p-3 border-2 border-gray-100`}
                  style={{
                    transform: `translateY(${parallaxOffset * 0.5}px)`
                  }}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{exhibition.year}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      {exhibition.type}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* Statistics section with fancy animation */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { value: exhibitions.filter(e => e.type === 'solo').length, label: 'Solo Exhibitions', subLabel: 'Exposições Solo' },
              { value: exhibitions.filter(e => e.type === 'group').length, label: 'Group Shows', subLabel: 'Mostras Coletivas' },
              { value: exhibitions.filter(e => e.type === 'residency').length, label: 'Residencies', subLabel: 'Residências' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-lg p-6 shadow-lg border border-gray-100"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={shouldAnimate ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className="text-4xl font-light text-gray-900 mb-2"
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm font-medium text-gray-800">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.subLabel}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default ExhibitionsTimeline