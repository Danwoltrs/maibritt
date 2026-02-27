'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { X, Calendar, MapPin, Clock, ExternalLink, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExhibitionsService } from '@/services/exhibitions.service'
import { Exhibition } from '@/types'

interface UpcomingExhibitionPopupProps {
  delay?: number
}

function useCountdown(targetDate?: Date) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number; hours: number; minutes: number; seconds: number
  } | null>(null)

  useEffect(() => {
    if (!targetDate) return

    const target = new Date(targetDate).getTime()

    const calculate = () => {
      const now = Date.now()
      const diff = target - now
      if (diff <= 0) {
        setTimeLeft(null)
        return
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }

    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  return timeLeft
}

function formatFullAddress(exhibition: Exhibition): string | null {
  const parts: string[] = []

  if (exhibition.address) {
    const addr = exhibition.address
    // Street line
    const streetParts: string[] = []
    if (addr.street) streetParts.push(addr.street)
    if (addr.streetNumber) streetParts.push(addr.streetNumber)
    if (streetParts.length) parts.push(streetParts.join(', '))

    // Neighborhood
    if (addr.neighborhood) parts.push(addr.neighborhood)

    // City, State, Zip
    const cityLine: string[] = []
    if (addr.city) cityLine.push(addr.city)
    if (addr.state) cityLine.push(addr.state)
    if (addr.zipCode) cityLine.push(addr.zipCode)
    if (cityLine.length) parts.push(cityLine.join(', '))

    // Country
    if (addr.country) parts.push(addr.country)
  }

  if (parts.length === 0 && exhibition.location) {
    return exhibition.location
  }

  return parts.length > 0 ? parts.join(' \u2022 ') : null
}

export default function UpcomingExhibitionPopup({ delay = 3000 }: UpcomingExhibitionPopupProps) {
  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const countdown = useCountdown(exhibition?.startDate)

  useEffect(() => {
    const dismissedId = sessionStorage.getItem('dismissedExhibitionPopup')

    const fetchUpcomingExhibition = async () => {
      try {
        const popupExhibition = await ExhibitionsService.getUpcomingPopupExhibition()

        if (popupExhibition && dismissedId !== popupExhibition.id) {
          setExhibition(popupExhibition)
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

  const formatDateRange = (start?: Date, end?: Date) => {
    if (!start && !end) return null
    const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
    if (start && end) {
      const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return `${s} - ${e}`
    }
    return new Date((start || end)!).toLocaleDateString('en-US', opts)
  }

  if (!exhibition || dismissed) return null

  const dateRange = formatDateRange(exhibition.startDate, exhibition.endDate)
  const fullAddress = formatFullAddress(exhibition)

  // Determine if exhibition is upcoming or currently open
  const now = new Date()
  const isOngoing = exhibition.startDate && new Date(exhibition.startDate) <= now
  const statusLabel = isOngoing ? 'Now Open' : 'Upcoming Exhibition'
  const badgeColor = isOngoing ? 'bg-green-500' : 'bg-amber-500'

  // Google Maps link from address
  const mapsQuery = fullAddress ? encodeURIComponent(fullAddress.replace(/ \u2022 /g, ', ')) : null

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
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
          >
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Flyer Image - larger for flyer feel */}
              {exhibition.image && (
                <div className="relative h-56 md:h-72">
                  <Image
                    src={exhibition.image}
                    alt={getDisplayTitle(exhibition)}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge className={`${badgeColor} text-white border-0 mb-2 text-xs`}>
                      {statusLabel}
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-light text-white leading-tight">
                      {getDisplayTitle(exhibition)}
                    </h2>
                    {exhibition.venue && (
                      <p className="text-white/80 text-sm mt-1">{exhibition.venue}</p>
                    )}
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
                    {exhibition.venue && (
                      <p className="text-gray-600 mt-1">{exhibition.venue}</p>
                    )}
                  </div>
                )}

                {/* Countdown Timer */}
                {countdown && !isOngoing && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 text-center">Opens in</p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { value: countdown.days, label: 'Days' },
                        { value: countdown.hours, label: 'Hours' },
                        { value: countdown.minutes, label: 'Min' },
                        { value: countdown.seconds, label: 'Sec' },
                      ].map(({ value, label }) => (
                        <div key={label}>
                          <div className="text-2xl font-light text-gray-900 tabular-nums">
                            {String(value).padStart(2, '0')}
                          </div>
                          <div className="text-xs text-gray-500">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2.5 text-gray-600 text-sm">
                  {/* Full Address */}
                  {fullAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <span>{fullAddress}</span>
                        {mapsQuery && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 ml-2 text-xs"
                          >
                            <Navigation className="w-3 h-3" />
                            Map
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {dateRange && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{dateRange}</span>
                    </div>
                  )}

                  {exhibition.openingDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>
                        Opening: {new Date(exhibition.openingDate).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric'
                        })}
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
                    <Link href={`/exhibitions/${exhibition.slug}`}>
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
