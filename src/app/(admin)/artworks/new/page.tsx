'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { ArtworkService } from '@/services/artwork.service'
import { SeriesService } from '@/services/series.service'

interface UploadedImage {
  file: File
  preview: string
}

interface CommonMetadata {
  seriesId?: string
  category?: 'painting' | 'sculpture' | 'engraving' | 'video' | 'mixed-media'
  year?: number
}

interface ArtworkDetails {
  titlePt: string
  titleEn: string
  mediumPt: string
  mediumEn: string
  dimensions: string
  descriptionPt: string
  descriptionEn: string
  forSale: boolean
  price?: number
  currency: 'BRL' | 'USD' | 'EUR'
  featured: boolean
}

interface SeriesOption {
  id: string
  name: { ptBR: string; en: string }
}

const categories = [
  { value: 'painting', label: 'Painting / Pintura' },
  { value: 'sculpture', label: 'Sculpture / Escultura' },
  { value: 'engraving', label: 'Engraving / Gravura' },
  { value: 'video', label: 'Video / Vídeo' },
  { value: 'mixed-media', label: 'Mixed Media / Mídia Mista' }
]

const currencies = [
  { value: 'BRL', label: 'R$ BRL' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' }
]

// Generate year options (current year + 40 years back)
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = 0; i <= 40; i++) {
    years.push(currentYear - i)
  }
  return years
}

export default function NewArtworkPage() {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'details' | 'success'>('upload')

  // Step 1: Upload & Common Metadata
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [commonMetadata, setCommonMetadata] = useState<CommonMetadata>({
    year: new Date().getFullYear()
  })
  const [applyToAll, setApplyToAll] = useState(true)
  const [series, setSeries] = useState<SeriesOption[]>([])
  const [showNewSeriesDialog, setShowNewSeriesDialog] = useState(false)
  const [newSeriesNamePt, setNewSeriesNamePt] = useState('')
  const [newSeriesNameEn, setNewSeriesNameEn] = useState('')
  const [newSeriesYear, setNewSeriesYear] = useState(new Date().getFullYear())

  // Step 2: Individual Details
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [artworkDetails, setArtworkDetails] = useState<Record<number, ArtworkDetails>>({})

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Load series options
  React.useEffect(() => {
    const loadSeries = async () => {
      try {
        const seriesData = await SeriesService.getSeries()
        setSeries(seriesData.map(s => ({
          id: s.id,
          name: s.name
        })))
      } catch (error) {
        console.error('Failed to load series:', error)
      }
    }
    loadSeries()
  }, [])

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 20,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: (acceptedFiles) => {
      const newImages = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }))
      setUploadedImages(prev => [...prev, ...newImages])
    },
    onDropRejected: (rejectedFiles) => {
      const errors = rejectedFiles.map(file =>
        file.errors.map(error => error.message).join(', ')
      )
      setError(`File rejected: ${errors.join('; ')}`)
    }
  })

  const removeImage = (index: number) => {
    URL.revokeObjectURL(uploadedImages[index].preview)
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreateNewSeries = async () => {
    if (!newSeriesNamePt || !newSeriesNameEn) {
      setError('Please fill in both Portuguese and English series names')
      return
    }

    try {
      const newSeries = await SeriesService.createSeries({
        name: {
          ptBR: newSeriesNamePt,
          en: newSeriesNameEn
        },
        description: {
          ptBR: '',
          en: ''
        },
        year: newSeriesYear,
        coverImage: '',
        displayOrder: 0,
        isActive: true,
        isSeasonal: false
      })

      setSeries(prev => [...prev, {
        id: newSeries.id,
        name: newSeries.name
      }])
      setCommonMetadata(prev => ({ ...prev, seriesId: newSeries.id }))
      setShowNewSeriesDialog(false)
      setNewSeriesNamePt('')
      setNewSeriesNameEn('')
    } catch (error) {
      console.error('Failed to create series:', error)
      setError('Failed to create new series')
    }
  }

  const handleProceedToDetails = () => {
    if (uploadedImages.length === 0) {
      setError('Please upload at least one image')
      return
    }

    if (applyToAll && (!commonMetadata.category || !commonMetadata.year)) {
      setError('Please select category and year when applying to all images')
      return
    }

    // Initialize artwork details with common metadata
    const initialDetails: Record<number, ArtworkDetails> = {}
    uploadedImages.forEach((_, index) => {
      initialDetails[index] = {
        titlePt: '',
        titleEn: '',
        mediumPt: '',
        mediumEn: '',
        dimensions: '',
        descriptionPt: '',
        descriptionEn: '',
        forSale: false,
        currency: 'BRL',
        featured: false
      }
    })
    setArtworkDetails(initialDetails)
    setStep('details')
  }

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const handleNextImage = () => {
    if (currentImageIndex < uploadedImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const updateCurrentArtworkDetails = (updates: Partial<ArtworkDetails>) => {
    setArtworkDetails(prev => ({
      ...prev,
      [currentImageIndex]: {
        ...prev[currentImageIndex],
        ...updates
      }
    }))
  }

  const currentDetails = artworkDetails[currentImageIndex] || {
    titlePt: '',
    titleEn: '',
    mediumPt: '',
    mediumEn: '',
    dimensions: '',
    descriptionPt: '',
    descriptionEn: '',
    forSale: false,
    currency: 'BRL' as const,
    featured: false
  }

  const handleSubmitAll = async () => {
    // Validate all artworks have required fields
    for (let i = 0; i < uploadedImages.length; i++) {
      const details = artworkDetails[i]
      if (!details?.titlePt || !details?.titleEn || !details?.mediumPt ||
          !details?.mediumEn || !details?.dimensions) {
        setError(`Please fill in all required fields for image ${i + 1}`)
        setCurrentImageIndex(i)
        return
      }
    }

    if (!applyToAll && !commonMetadata.category) {
      setError('Please select a category')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Create all artworks
      const totalArtworks = uploadedImages.length
      for (let i = 0; i < totalArtworks; i++) {
        const image = uploadedImages[i]
        const details = artworkDetails[i]

        await ArtworkService.createArtwork({
          title: {
            ptBR: details.titlePt,
            en: details.titleEn
          },
          year: commonMetadata.year!,
          medium: {
            ptBR: details.mediumPt,
            en: details.mediumEn
          },
          dimensions: details.dimensions,
          description: {
            ptBR: details.descriptionPt,
            en: details.descriptionEn
          },
          category: commonMetadata.category!,
          seriesId: commonMetadata.seriesId,
          images: [image.file],
          forSale: details.forSale,
          price: details.forSale ? details.price : undefined,
          currency: details.forSale ? details.currency : undefined,
          featured: details.featured
        }, (progress) => {
          const overallProgress = ((i / totalArtworks) * 100) + (progress.percentage / totalArtworks)
          setUploadProgress(Math.round(overallProgress))
        })
      }

      setStep('success')
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Failed to create artworks:', error)
      setError(error instanceof Error ? error.message : 'Failed to create artworks')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success Screen
  if (step === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              {uploadedImages.length} Artwork{uploadedImages.length > 1 ? 's' : ''} Created Successfully!
            </h2>
            <p className="text-gray-600 mb-4">
              Your artworks have been uploaded and added to your portfolio.
            </p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 1: Upload & Common Metadata
  if (step === 'upload') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload Artworks</h1>
            <p className="text-gray-600">Upload multiple artworks at once</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Upload */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Upload high-quality images of your artworks. You can upload up to 20 images at once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50' : ''}
                  ${isDragReject ? 'border-red-500 bg-red-50' : ''}
                  ${!isDragActive ? 'border-gray-300 hover:border-gray-400' : ''}
                `}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600">Drop the images here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag & drop images here, or click to select files
                    </p>
                    <p className="text-sm text-gray-500">
                      JPG, PNG, WebP up to 50MB each (max 20 files)
                    </p>
                  </div>
                )}
              </div>

              {/* Image Previews */}
              {uploadedImages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">
                      {uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''} selected
                    </p>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full
                                   opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Common Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Common Information</CardTitle>
              <CardDescription>
                Set properties that apply to all uploaded artworks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Apply to All Checkbox */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <Checkbox
                  id="applyToAll"
                  checked={applyToAll}
                  onCheckedChange={(checked) => setApplyToAll(checked as boolean)}
                />
                <Label htmlFor="applyToAll" className="text-sm font-medium cursor-pointer">
                  Same category, series, and year for all
                </Label>
              </div>

              {applyToAll && (
                <>
                  {/* Series & Collections */}
                  <div className="space-y-2">
                    <Label>Series & Collections (Optional)</Label>
                    <div className="flex gap-2">
                      <Select
                        value={commonMetadata.seriesId}
                        onValueChange={(value) =>
                          setCommonMetadata(prev => ({ ...prev, seriesId: value }))
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select series" />
                        </SelectTrigger>
                        <SelectContent>
                          {series.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name.en} / {s.name.ptBR}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Dialog open={showNewSeriesDialog} onOpenChange={setShowNewSeriesDialog}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Series</DialogTitle>
                            <DialogDescription>
                              Add a new series/collection to organize your artworks
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Series Name (Portuguese)</Label>
                              <Input
                                value={newSeriesNamePt}
                                onChange={(e) => setNewSeriesNamePt(e.target.value)}
                                placeholder="Nome da série"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Series Name (English)</Label>
                              <Input
                                value={newSeriesNameEn}
                                onChange={(e) => setNewSeriesNameEn(e.target.value)}
                                placeholder="Series name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Year</Label>
                              <Select
                                value={newSeriesYear.toString()}
                                onValueChange={(value) => setNewSeriesYear(parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {generateYearOptions().map(year => (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={handleCreateNewSeries} className="w-full">
                              Create Series
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={commonMetadata.category}
                      onValueChange={(value) =>
                        setCommonMetadata(prev => ({
                          ...prev,
                          category: value as any
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Year */}
                  <div className="space-y-2">
                    <Label>Year *</Label>
                    <Select
                      value={commonMetadata.year?.toString()}
                      onValueChange={(value) =>
                        setCommonMetadata(prev => ({
                          ...prev,
                          year: parseInt(value)
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {generateYearOptions().map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {!applyToAll && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    You'll be able to set individual categories, series, and years for each artwork in the next step.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleProceedToDetails}
            disabled={uploadedImages.length === 0}
            size="lg"
          >
            Continue to Details
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // Step 2: Individual Details
  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('upload')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Upload
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Artwork Details ({currentImageIndex + 1} of {uploadedImages.length})
            </h1>
            <p className="text-gray-600">Fill in the details for each artwork</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(((currentImageIndex + 1) / uploadedImages.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentImageIndex + 1) / uploadedImages.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Image Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={uploadedImages[currentImageIndex].preview}
              alt={`Artwork ${currentImageIndex + 1}`}
              className="w-full aspect-square object-cover rounded-lg"
            />
            <div className="mt-4 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevImage}
                disabled={currentImageIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                {currentImageIndex + 1} / {uploadedImages.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextImage}
                disabled={currentImageIndex === uploadedImages.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Artwork Details Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Artwork Information</CardTitle>
            <CardDescription>
              {applyToAll
                ? `Category: ${commonMetadata.category}, Year: ${commonMetadata.year}`
                : 'Enter details for this artwork'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Titles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title (Portuguese) *</Label>
                <Input
                  value={currentDetails.titlePt}
                  onChange={(e) => updateCurrentArtworkDetails({ titlePt: e.target.value })}
                  placeholder="Título da obra"
                />
              </div>
              <div className="space-y-2">
                <Label>Title (English) *</Label>
                <Input
                  value={currentDetails.titleEn}
                  onChange={(e) => updateCurrentArtworkDetails({ titleEn: e.target.value })}
                  placeholder="Artwork title"
                />
              </div>
            </div>

            {/* Medium */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Medium (Portuguese) *</Label>
                <Input
                  value={currentDetails.mediumPt}
                  onChange={(e) => updateCurrentArtworkDetails({ mediumPt: e.target.value })}
                  placeholder="Acrílica sobre tela"
                />
              </div>
              <div className="space-y-2">
                <Label>Medium (English) *</Label>
                <Input
                  value={currentDetails.mediumEn}
                  onChange={(e) => updateCurrentArtworkDetails({ mediumEn: e.target.value })}
                  placeholder="Acrylic on canvas"
                />
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <Label>Dimensions *</Label>
              <Input
                value={currentDetails.dimensions}
                onChange={(e) => updateCurrentArtworkDetails({ dimensions: e.target.value })}
                placeholder="100 x 80 cm"
              />
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description (Portuguese)</Label>
                <Textarea
                  value={currentDetails.descriptionPt}
                  onChange={(e) => updateCurrentArtworkDetails({ descriptionPt: e.target.value })}
                  placeholder="Descrição da obra..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (English)</Label>
                <Textarea
                  value={currentDetails.descriptionEn}
                  onChange={(e) => updateCurrentArtworkDetails({ descriptionEn: e.target.value })}
                  placeholder="Artwork description..."
                  rows={3}
                />
              </div>
            </div>

            {/* Sale Information */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Available for Sale</Label>
                  <p className="text-sm text-gray-500">Mark this artwork as available for purchase</p>
                </div>
                <Switch
                  checked={currentDetails.forSale}
                  onCheckedChange={(checked) => updateCurrentArtworkDetails({ forSale: checked })}
                />
              </div>

              {currentDetails.forSale && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentDetails.price || ''}
                      onChange={(e) => updateCurrentArtworkDetails({
                        price: parseFloat(e.target.value) || undefined
                      })}
                      placeholder="5000.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={currentDetails.currency}
                      onValueChange={(value) => updateCurrentArtworkDetails({
                        currency: value as any
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Featured Artwork</Label>
                  <p className="text-sm text-gray-500">Highlight this on the homepage</p>
                </div>
                <Switch
                  checked={currentDetails.featured}
                  onCheckedChange={(checked) => updateCurrentArtworkDetails({ featured: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation and Submit */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevImage}
          disabled={currentImageIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Artwork
        </Button>

        <div className="flex gap-3">
          {currentImageIndex < uploadedImages.length - 1 ? (
            <Button onClick={handleNextImage}>
              Next Artwork
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmitAll}
              disabled={isSubmitting}
              size="lg"
              className="min-w-[180px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Uploading {uploadProgress}%
                </div>
              ) : (
                `Upload All ${uploadedImages.length} Artworks`
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
