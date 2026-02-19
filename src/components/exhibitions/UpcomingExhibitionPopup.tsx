'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { X, Calendar, MapPin, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExhibitionsService } from '@/services/exhibitions.service'
import { Exhibition } from '@/types'

interface UpcomingExhibitionPopupProps {
  delay?: number // Delay before showing popup (ms)
}

export default function UpcomingExhibitionPopup({ delay = 3000 }: UpcomingExhibitionPopupProps) {
  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed this popup in this session
    const dismissedId = sessionStorage.getItem('dismissedExhibitionPopup')

    const fetchUpcomingExhibition = async () => {
      try {
        const popupExhibition = await ExhibitionsService.getUpcomingPopupExhibition()

        if (popupExhibition && dismissedId !== popupExhibition.id) {
          setExhibition(popupExhibition)
          // Show popup after delay
          setTimeout(() => setIsOpen(true), delay)
        }
      } catch (err) {
        console.error('Error fetching upcoming exhibition:', err)
      }
    }

    fetchUpcomingExhibition()
  }, [delay])

  const handleDismiss = () => {
    setIsOpen(false)
    setDismissed(true)
    if (exhibition) {
      sessionStorage.setItem('dismissedExhibitionPopup', exhibition.id)
    }
  }

  const getDisplayTitle = (ex: Exhibition) => ex.title.en || ex.title.ptBR
  const getDisplayDescription = (ex: Exhibition) => ex.description?.en || ex.description?.ptBR || ''

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
      const startDate = new Date(start)
      const endDate = new Date(end)
      const startMonth = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const endMonth = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return `${startMonth} - ${endMonth}`
    }
    return formatDate(start || end)
  }

  const generateSlug = (ex: Exhibition) => {
    const title = getDisplayTitle(ex)
    const titleSlug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return `${titleSlug}-${ex.year}`
  }

  if (!exhibition || dismissed) return null

  const dateRange = formatDateRange(exhibition.startDate, exhibition.endDate)

  // Determine if exhibition is upcoming or currently open
  const now = new Date()
  const isOngoing = exhibition.startDate && new Date(exhibition.startDate) <= now
  const statusLabel = isOngoing ? 'Now Open' : 'Upcoming Exhibition'
  const badgeColor = isOngoing ? 'bg-green-500' : 'bg-amber-500'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
          >
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image */}
              {exhibition.image && (
                <div className="relative h-48 md:h-56">
                  <Image
                    src={exhibition.image}
                    alt={getDisplayTitle(exhibition)}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge className={`${badgeColor} text-white border-0 mb-2`}>
                      {statusLabel}
                    </Badge>
                    <h2 className="text-2xl font-light text-white">
                      {getDisplayTitle(exhibition)}
                    </h2>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-6 space-y-4">
                {!exhibition.image && (
                  <div className="mb-4">
                    <Badge className={`${badgeColor} text-white border-0 mb-2`}>
                      {statusLabel}
                    </Badge>
                    <h2 className="text-2xl font-light text-gray-900">
                      {getDisplayTitle(exhibition)}
                    </h2>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2 text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{exhibition.venue}</span>
                    <span className="text-gray-400">|</span>
                    <span>{exhibition.location}</span>
                  </div>

                  {dateRange && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{dateRange}</span>
                    </div>
                  )}

                  {exhibition.openingDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>
                        Opening: {formatDate(exhibition.openingDate)}
                        {exhibition.openingDetails && ` - ${exhibition.openingDetails}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {getDisplayDescription(exhibition) && (
                  <p className="text-gray-700 text-sm line-clamp-3">
                    {getDisplayDescription(exhibition)}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button asChild className="flex-1">
                    <Link href={`/exhibitions/${generateSlug(exhibition)}`}>
                      View Details
                    </Link>
                  </Button>
                  {exhibition.externalUrl && (
                    <Button variant="outline" asChild>
                      <a href={exhibition.externalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>

                {/* Dismiss text */}
                <p className="text-center text-xs text-gray-400">
                  Click outside or press X to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
