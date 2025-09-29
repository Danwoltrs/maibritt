'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import LoginForm from '@/components/auth/LoginForm'
import { useAuth } from '@/hooks/useAuth'
import { ArtworkService } from '@/services'
import { Artwork } from '@/types'
import Image from 'next/image'

function AdminPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)

  // Get redirect destination  
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  // Redirect authenticated users, show login modal for non-authenticated users
  useEffect(() => {
    if (!loading) {
      if (user) {
        // Auto-redirect authenticated users
        router.push(redirectTo)
      } else {
        // Show login modal for non-authenticated users
        setShowLoginModal(true)
      }
    }
  }, [user, loading, router, redirectTo])

  // Fetch latest artworks for background
  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const response = await ArtworkService.getArtworks({}, { page: 1, limit: 6 })
        if (response.artworks) {
          setArtworks(response.artworks)
        }
      } catch (error) {
        console.error('Failed to fetch artworks:', error)
      }
    }
    fetchArtworks()
  }, [])

  // Auto-advance background carousel
  useEffect(() => {
    if (artworks.length === 0) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % artworks.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [artworks.length])

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    router.push(redirectTo)
  }

  const handleCloseModal = () => {
    setShowLoginModal(false)
    router.push('/') // Redirect to main site if they close modal
  }

  // Show loading while checking auth
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with artworks */}
      <div className="absolute inset-0">
        {artworks.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <Image
                src={artworks[currentSlide]?.images[0]?.display || ''}
                alt={artworks[currentSlide]?.title?.en || 'Artwork'}
                fill
                className="object-cover"
                priority={currentSlide === 0}
              />
              <div className="absolute inset-0 bg-black/60" />
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Fallback background */}
        {artworks.length === 0 && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
      </div>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={handleCloseModal}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-md relative">
                {/* Close button */}
                <button
                  onClick={handleCloseModal}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Login form */}
                <div className="p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h2>
                    <p className="text-gray-600">Sign in to manage your portfolio</p>
                  </div>
                  
                  <LoginForm 
                    onSuccess={handleLoginSuccess}
                    className="border-0 shadow-none"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AdminPageContent />
    </Suspense>
  )
}