'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ArtworkUploadForm from '@/components/artwork/ArtworkUploadForm'

export default function NewArtworkPage() {
  const router = useRouter()

  const handleSuccess = (artworkId: string) => {
    // Redirect to artwork view or dashboard after successful upload
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
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
          
          <h1 className="text-3xl font-bold text-gray-900">Upload New Artwork</h1>
          <p className="text-gray-600 mt-2">
            Add a new piece to your portfolio with images, details, and pricing information.
          </p>
        </div>

        {/* Upload Form */}
        <ArtworkUploadForm 
          onSuccess={handleSuccess}
          className="max-w-none"
        />
      </div>
    </div>
  )
}