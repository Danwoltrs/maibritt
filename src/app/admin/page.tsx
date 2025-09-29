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
  const redirectTo = searchParams.get('redirectTo') || '/admin/dashboard'

  // Show login modal for non-authenticated users
  useEffect(() => {
    if (!loading && !user) {
      setShowLoginModal(true)
    }
  }, [user, loading])

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

      {/* Content for authenticated users */}
      {!loading && user && (
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center text-white max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <div className="text-green-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome Back, Mai-Britt</h2>
              <p className="text-white/80 mb-6">You're authenticated and ready to manage your portfolio.</p>
              <div className="space-y-3">
                <a 
                  href={redirectTo}
                  className="block w-full bg-white text-gray-900 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium"
                >
                  {redirectTo === '/admin/dashboard' ? 'Go to Dashboard' : 'Continue to Admin Area'}
                </a>
                <a 
                  href="/" 
                  className="block w-full bg-white/10 text-white px-4 py-2 rounded-md hover:bg-white/20 transition-colors border border-white/30"
                >
                  Return to Portfolio
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
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