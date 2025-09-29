'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import LoginForm from '@/components/auth/LoginForm'
import { useAuth } from '@/hooks/useAuth'
import { ArtworkService } from '@/services'
import { Artwork } from '@/types'

export default function LoginPageContent() {
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [artworksLoading, setArtworksLoading] = useState(true)

  // Get redirect URL from search params
  const redirectTo = searchParams.get('redirectTo') || '/admin/dashboard'

  // No client-side redirect needed - middleware handles this
  // useEffect(() => {
  //   if (!loading && user) {
  //     window.location.href = redirectTo
  //   }
  // }, [user, loading, redirectTo])

  // Fetch latest artworks for carousel
  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const response = await ArtworkService.getArtworks(
          {},
          { page: 1, limit: 6 }
        )

        if (response.artworks) {
          setArtworks(response.artworks)
        }
      } catch (error) {
        console.error('Failed to fetch artworks for login carousel:', error)
      } finally {
        setArtworksLoading(false)
      }
    }

    fetchArtworks()
  }, [])

  // Auto-advance carousel
  useEffect(() => {
    if (artworks.length === 0) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % artworks.length)
    }, 4000) // Change slide every 4 seconds

    return () => clearInterval(interval)
  }, [artworks.length])

  const handleLoginSuccess = () => {
    // Use window.location.href for a full page refresh to ensure server state is synced
    window.location.href = redirectTo
  }

  // Show loading only briefly while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, middleware should redirect, so show nothing briefly
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Artwork Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        {!artworksLoading && artworks.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <Image
                src={artworks[currentSlide]?.images[0]?.display || ''}
                alt={artworks[currentSlide]?.title?.en || 'Artwork'}
                fill
                className="object-cover"
                priority={currentSlide === 0}
                sizes="50vw"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Artwork info */}
              <div className="absolute bottom-8 left-8 text-white z-10">
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-3xl font-light mb-2"
                >
                  {artworks[currentSlide]?.title?.en}
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="text-lg opacity-90"
                >
                  {artworks[currentSlide]?.year} • {artworks[currentSlide]?.medium?.en}
                </motion.p>
              </div>

              {/* Slide indicators */}
              <div className="absolute bottom-8 right-8 flex space-x-2">
                {artworks.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'bg-white scale-125'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Loading state for artwork carousel */}
        {artworksLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-sm opacity-75">Loading artworks...</p>
            </div>
          </div>
        )}

        {/* Fallback when no artworks */}
        {!artworksLoading && artworks.length === 0 && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-white text-center">
              <h2 className="text-4xl font-light mb-4">Mai-Britt Wolthers</h2>
              <p className="text-xl opacity-75">Contemporary Artist</p>
              <p className="text-sm opacity-50 mt-2">Portfolio & Gallery Management</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <LoginForm
              onSuccess={handleLoginSuccess}
              className="border-0 shadow-lg"
            />
          </motion.div>

          {/* Mobile artwork preview */}
          <div className="lg:hidden mt-8">
            {!artworksLoading && artworks.length > 0 && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-4">
                  Latest from the studio
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {artworks.slice(0, 3).map((artwork, index) => (
                    <div key={artwork.id} className="aspect-square rounded overflow-hidden">
                      <Image
                        src={artwork.images[0]?.thumbnail || ''}
                        alt={artwork.title?.en}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}