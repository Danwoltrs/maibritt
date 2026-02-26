'use client'

import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  Maximize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UploadedImage {
  file: File
  preview: string
}

export interface ArtworkDetails {
  titlePt: string
  titleEn: string
  mediumPt: string
  mediumEn: string
  dimensions: string
  descriptionPt: string
  descriptionEn: string
  featured: boolean
  // Per-image overrides (when not "apply to all")
  category?: string
  seriesId?: string
  year?: number
}

interface CommonApplied {
  category?: string
  seriesName?: string
  year?: number
  seriesId?: string
}

const currencies = [
  { value: 'BRL', label: 'R$ BRL' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
]

interface PerImageDetailsStepProps {
  images: UploadedImage[]
  artworkDetails: Record<number, ArtworkDetails>
  onUpdateDetails: (index: number, updates: Partial<ArtworkDetails>) => void
  commonApplied: CommonApplied
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
  uploadProgress: number
  error: string | null
}

export function PerImageDetailsStep({
  images,
  artworkDetails,
  onUpdateDetails,
  commonApplied,
  onBack,
  onSubmit,
  isSubmitting,
  uploadProgress,
  error,
}: PerImageDetailsStepProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const current = artworkDetails[currentIndex] || {
    titlePt: '', titleEn: '', mediumPt: '', mediumEn: '',
    dimensions: '', descriptionPt: '', descriptionEn: '', featured: false,
  }

  const handlePrev = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1) }
  const handleNext = () => { if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1) }

  const handleAiSuggest = async () => {
    if (!images[currentIndex]) return
    setAiLoading(true)
    try {
      const file = images[currentIndex].file
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/suggest-artwork-title`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            image: base64,
            mimeType: file.type,
          }),
        }
      )

      if (!res.ok) throw new Error('Failed to get suggestions')
      const data = await res.json()
      if (data.titleEn || data.titlePt) {
        onUpdateDetails(currentIndex, {
          titleEn: data.titleEn || current.titleEn,
          titlePt: data.titlePt || current.titlePt,
        })
      }
    } catch (err) {
      console.error('AI suggestion failed:', err)
    } finally {
      setAiLoading(false)
    }
  }

  const progressPercent = ((currentIndex + 1) / images.length) * 100

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 border-b px-6 py-3 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              Artwork {currentIndex + 1} of {images.length}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Common applied badges */}
          {commonApplied.category && (
            <Badge variant="secondary">{commonApplied.category}</Badge>
          )}
          {commonApplied.seriesName && (
            <Badge variant="secondary">{commonApplied.seriesName}</Badge>
          )}
          {commonApplied.year && (
            <Badge variant="secondary">{commonApplied.year}</Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="shrink-0 h-1 bg-gray-100">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {error && (
        <div className="shrink-0 px-6 pt-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main content: image top, form bottom */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          {/* Image preview */}
          <div className="relative mx-auto w-fit">
            <img
              src={images[currentIndex]?.preview}
              alt={`Artwork ${currentIndex + 1}`}
              className="max-h-[20vh] w-auto mx-auto object-contain rounded-lg border"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 h-7 w-7 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
              onClick={() => setLightboxOpen(true)}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Titles + AI button */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Title (Portuguese) *</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAiSuggest}
                    disabled={aiLoading}
                    className="h-7 text-xs gap-1"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    AI Suggest
                  </Button>
                </div>
                <Input
                  value={current.titlePt}
                  onChange={(e) => onUpdateDetails(currentIndex, { titlePt: e.target.value })}
                  placeholder="Título da obra"
                />
              </div>
              <div className="space-y-2">
                <Label>Title (English) *</Label>
                <Input
                  value={current.titleEn}
                  onChange={(e) => onUpdateDetails(currentIndex, { titleEn: e.target.value })}
                  placeholder="Artwork title"
                />
              </div>
            </div>

            {/* Medium */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Medium (Portuguese) *</Label>
                <Input
                  value={current.mediumPt}
                  onChange={(e) => onUpdateDetails(currentIndex, { mediumPt: e.target.value })}
                  placeholder="Acrílica sobre tela"
                />
              </div>
              <div className="space-y-2">
                <Label>Medium (English) *</Label>
                <Input
                  value={current.mediumEn}
                  onChange={(e) => onUpdateDetails(currentIndex, { mediumEn: e.target.value })}
                  placeholder="Acrylic on canvas"
                />
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <Label>Dimensions *</Label>
              <Input
                value={current.dimensions}
                onChange={(e) => onUpdateDetails(currentIndex, { dimensions: e.target.value })}
                placeholder="100 x 80 cm"
              />
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description (Portuguese)</Label>
                <Textarea
                  value={current.descriptionPt}
                  onChange={(e) => onUpdateDetails(currentIndex, { descriptionPt: e.target.value })}
                  placeholder="Descrição da obra..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (English)</Label>
                <Textarea
                  value={current.descriptionEn}
                  onChange={(e) => onUpdateDetails(currentIndex, { descriptionEn: e.target.value })}
                  placeholder="Artwork description..."
                  rows={3}
                />
              </div>
            </div>

            {/* Featured toggle */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <Label>Featured Artwork</Label>
                <p className="text-sm text-gray-500">Highlight this on the homepage</p>
              </div>
              <Switch
                checked={current.featured}
                onCheckedChange={(checked) => onUpdateDetails(currentIndex, { featured: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer: thumbnail strip + navigation */}
      <div className="shrink-0 border-t bg-gray-50">
        {/* Thumbnail strip */}
        <div className="px-6 py-3 overflow-x-auto">
          <div className="flex gap-2 min-w-0">
            {images.map((img, i) => {
              const details = artworkDetails[i]
              const hasTitle = details?.titleEn || details?.titlePt
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`relative shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                    i === currentIndex
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : hasTitle
                        ? 'border-green-400'
                        : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center">
                    {i + 1}
                  </span>
                  {hasTitle && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-green-400 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="px-6 py-3 border-t flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {images.length}
          </span>

          <div className="flex gap-2">
            {currentIndex < images.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="min-w-[160px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading {uploadProgress}%
                  </div>
                ) : (
                  `Upload All ${images.length} Artworks`
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Artwork Preview</DialogTitle>
          </DialogHeader>
          <img
            src={images[currentIndex]?.preview}
            alt={`Artwork ${currentIndex + 1}`}
            className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
