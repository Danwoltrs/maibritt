'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ArtworkUploadForm from '@/components/artwork/ArtworkUploadForm'
import { ArtworkService } from '@/services/artwork.service'
import { Artwork } from '@/types'

export default function EditArtworkPage() {
  const router = useRouter()
  const params = useParams()
  const artworkId = params.id as string

  const [artwork, setArtwork] = useState<Artwork | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadArtwork = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const data = await ArtworkService.getArtworkById(artworkId)
        if (!data) {
          setError('Artwork not found')
          return
        }
        
        setArtwork(data)
      } catch (err) {
        console.error('Error loading artwork:', err)
        setError('Failed to load artwork details')
      } finally {
        setLoading(false)
      }
    }

    if (artworkId) {
      loadArtwork()
    }
  }, [artworkId])

  const handleSuccess = (updatedArtworkId: string) => {
    // Redirect back to artworks page after successful update
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            <span className="ml-2 text-gray-600">Loading artwork...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Artwork not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">Edit Artwork</h1>
          <p className="text-gray-600 mt-2">
            Update details and information for "{artwork.title.en}"
          </p>
        </div>

        {/* Edit Form */}
        <ArtworkUploadForm 
          artwork={artwork}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          className="max-w-none"
          isEditMode={true}
        />
      </div>
    </div>
  )
}