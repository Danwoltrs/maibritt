'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
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
import { Progress } from '@/components/ui/progress'

import { ArtworkService } from '@/services/artwork.service'
import { SeriesService } from '@/services/series.service'
import { Artwork } from '@/types'

// Form validation schema
const artworkSchema = z.object({
  titlePt: z.string().min(1, 'Portuguese title is required'),
  titleEn: z.string().min(1, 'English title is required'),
  year: z.number().min(1800).max(new Date().getFullYear() + 1),
  mediumPt: z.string().min(1, 'Portuguese medium is required'),
  mediumEn: z.string().min(1, 'English medium is required'),
  dimensions: z.string().min(1, 'Dimensions are required'),
  descriptionPt: z.string().optional(),
  descriptionEn: z.string().optional(),
  category: z.enum(['painting', 'sculpture', 'engraving', 'video', 'mixed-media']),
  seriesId: z.string().optional(),
  forSale: z.boolean(),
  price: z.number().optional(),
  currency: z.enum(['BRL', 'USD', 'EUR']).optional(),
  featured: z.boolean()
})

type ArtworkFormData = z.infer<typeof artworkSchema>

interface SeriesOption {
  id: string
  name: { ptBR: string; en: string }
}

interface ArtworkUploadFormProps {
  artwork?: Artwork // For edit mode
  defaultSeriesId?: string
  onSuccess?: (artworkId: string) => void
  onCancel?: () => void
  isModal?: boolean
  isEditMode?: boolean
  className?: string
}

export default function ArtworkUploadForm({
  artwork,
  defaultSeriesId,
  onSuccess,
  onCancel,
  isModal = false,
  isEditMode = false,
  className = ""
}: ArtworkUploadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<{ original: string; display: string; thumbnail: string }[]>([])
  const [series, setSeries] = useState<SeriesOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ArtworkFormData>({
    resolver: zodResolver(artworkSchema),
    defaultValues: isEditMode && artwork ? {
      titlePt: artwork.title.ptBR,
      titleEn: artwork.title.en,
      year: artwork.year,
      mediumPt: artwork.medium.ptBR,
      mediumEn: artwork.medium.en,
      dimensions: artwork.dimensions,
      descriptionPt: artwork.description?.ptBR || '',
      descriptionEn: artwork.description?.en || '',
      category: artwork.category,
      seriesId: artwork.series || defaultSeriesId || 'none',
      forSale: artwork.forSale,
      price: artwork.price,
      currency: artwork.currency,
      featured: artwork.featured
    } : {
      forSale: false,
      featured: false,
      currency: 'BRL',
      year: new Date().getFullYear(),
      seriesId: defaultSeriesId || 'none'
    }
  })

  const watchForSale = watch('forSale')

  // Load series options
  useEffect(() => {
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

  // Set default series if provided
  useEffect(() => {
    if (defaultSeriesId) {
      setValue('seriesId', defaultSeriesId)
    }
  }, [defaultSeriesId, setValue])

  // Load existing images in edit mode
  useEffect(() => {
    if (isEditMode && artwork?.images) {
      setExistingImages(artwork.images)
    }
  }, [isEditMode, artwork])

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 5,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: (acceptedFiles) => {
      setSelectedFiles(prev => [...prev, ...acceptedFiles])
      
      // Create preview URLs
      const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file))
      setPreviewUrls(prev => [...prev, ...newPreviews])
    },
    onDropRejected: (rejectedFiles) => {
      const errors = rejectedFiles.map(file => file.errors.map(error => error.message).join(', '))
      setError(`File rejected: ${errors.join('; ')}`)
    }
  })

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = previewUrls.filter((_, i) => i !== index)
    
    // Revoke URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index])
    
    setSelectedFiles(newFiles)
    setPreviewUrls(newPreviews)
  }

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ArtworkFormData) => {
    // For edit mode, check if there are either existing images or new uploads
    // For create mode, at least one image is required
    if (!isEditMode && selectedFiles.length === 0) {
      setError('Please upload at least one image')
      return
    }
    
    if (isEditMode && existingImages.length === 0 && selectedFiles.length === 0) {
      setError('Please keep at least one existing image or upload new images')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      let resultArtwork;
      
      const artworkData = {
        title: {
          ptBR: data.titlePt,
          en: data.titleEn
        },
        year: data.year,
        medium: {
          ptBR: data.mediumPt,
          en: data.mediumEn
        },
        dimensions: data.dimensions,
        description: {
          ptBR: data.descriptionPt || '',
          en: data.descriptionEn || ''
        },
        category: data.category,
        seriesId: data.seriesId === 'none' ? undefined : data.seriesId,
        forSale: data.forSale,
        price: data.forSale ? data.price : undefined,
        currency: data.forSale ? data.currency : undefined,
        featured: data.featured
      }

      if (isEditMode && artwork) {
        // Update existing artwork
        resultArtwork = await ArtworkService.updateArtwork(artwork.id, {
          ...artworkData,
          images: selectedFiles.length > 0 ? selectedFiles : undefined, // Only update images if new ones provided
          existingImages: existingImages // Pass existing images to keep
        }, (progress) => {
          setUploadProgress(progress.percentage)
        })
      } else {
        // Create new artwork
        resultArtwork = await ArtworkService.createArtwork({
          ...artworkData,
          images: selectedFiles
        }, (progress) => {
          setUploadProgress(progress.percentage)
        })
      }

      setSuccess(true)
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(resultArtwork.id)
      }

      // Reset form if not a modal or after delay
      if (!isModal && !isEditMode) {
        setTimeout(() => {
          reset()
          setSelectedFiles([])
          setPreviewUrls([])
          setSuccess(false)
        }, 2000)
      }

    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} artwork:`, error)
      setError(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} artwork`)
    } finally {
      setIsSubmitting(false)
    }
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

  if (success && !isModal) {
    return (
      <Card className={`text-center py-12 ${className}`}>
        <CardContent>
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Artwork Created Successfully!</h3>
          <p className="text-gray-600">Your artwork has been uploaded and saved to your portfolio.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Artwork' : 'Upload New Artwork'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Update artwork details and information' : 'Add a new piece to your portfolio'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Image Upload */}
          <div>
            <Label>Images *</Label>
            <div
              {...getRootProps()}
              className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : isDragReject
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? 'Drop files here...'
                  : 'Drag & drop images here, or click to select'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Support JPG, PNG, WebP (max 50MB, up to 5 files)
              </p>
            </div>

            {/* Existing Images (Edit Mode) */}
            {isEditMode && existingImages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {existingImages.map((image, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <img
                        src={image.display}
                        alt={`Existing image ${index + 1}`}
                        className="w-full h-24 object-cover rounded border-2 border-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <Badge className="absolute bottom-1 left-1 text-xs bg-blue-100 text-blue-800">
                        Current
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Image Previews */}
            {previewUrls.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {isEditMode ? 'New Images' : 'Preview Images'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded border-2 border-green-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {isEditMode && (
                        <Badge className="absolute bottom-1 left-1 text-xs bg-green-100 text-green-800">
                          New
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titlePt">Title (Portuguese) *</Label>
              <Input
                id="titlePt"
                {...register('titlePt')}
                placeholder="Título em português"
                className={errors.titlePt ? 'border-red-500' : ''}
              />
              {errors.titlePt && (
                <p className="text-sm text-red-500 mt-1">{errors.titlePt.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="titleEn">Title (English) *</Label>
              <Input
                id="titleEn"
                {...register('titleEn')}
                placeholder="Title in English"
                className={errors.titleEn ? 'border-red-500' : ''}
              />
              {errors.titleEn && (
                <p className="text-sm text-red-500 mt-1">{errors.titleEn.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                {...register('year', { valueAsNumber: true })}
                placeholder="2024"
                className={errors.year ? 'border-red-500' : ''}
              />
              {errors.year && (
                <p className="text-sm text-red-500 mt-1">{errors.year.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select onValueChange={(value) => setValue('category', value as any)}>
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dimensions">Dimensions *</Label>
              <Input
                id="dimensions"
                {...register('dimensions')}
                placeholder="100 x 80 cm"
                className={errors.dimensions ? 'border-red-500' : ''}
              />
              {errors.dimensions && (
                <p className="text-sm text-red-500 mt-1">{errors.dimensions.message}</p>
              )}
            </div>
          </div>

          {/* Medium */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mediumPt">Medium (Portuguese) *</Label>
              <Input
                id="mediumPt"
                {...register('mediumPt')}
                placeholder="Acrílica sobre tela"
                className={errors.mediumPt ? 'border-red-500' : ''}
              />
              {errors.mediumPt && (
                <p className="text-sm text-red-500 mt-1">{errors.mediumPt.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="mediumEn">Medium (English) *</Label>
              <Input
                id="mediumEn"
                {...register('mediumEn')}
                placeholder="Acrylic on canvas"
                className={errors.mediumEn ? 'border-red-500' : ''}
              />
              {errors.mediumEn && (
                <p className="text-sm text-red-500 mt-1">{errors.mediumEn.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="descriptionPt">Description (Portuguese)</Label>
              <Textarea
                id="descriptionPt"
                {...register('descriptionPt')}
                placeholder="Descrição da obra..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="descriptionEn">Description (English)</Label>
              <Textarea
                id="descriptionEn"
                {...register('descriptionEn')}
                placeholder="Artwork description..."
                rows={3}
              />
            </div>
          </div>

          {/* Series Selection */}
          <div>
            <Label htmlFor="seriesId">Series (Optional)</Label>
            <Select 
              value={watch('seriesId') || ''} 
              onValueChange={(value) => setValue('seriesId', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a series" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Series</SelectItem>
                {series.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name.en} / {s.name.ptBR}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sale Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="forSale"
                checked={watchForSale}
                onCheckedChange={(checked) => setValue('forSale', checked)}
              />
              <Label htmlFor="forSale">Available for sale</Label>
            </div>

            {watchForSale && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                    placeholder="5000.00"
                    className={errors.price ? 'border-red-500' : ''}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="currency">Currency *</Label>
                  <Select onValueChange={(value) => setValue('currency', value as any)}>
                    <SelectTrigger className={errors.currency ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.currency && (
                    <p className="text-sm text-red-500 mt-1">{errors.currency.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Featured */}
          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={watch('featured')}
              onCheckedChange={(checked) => setValue('featured', checked)}
            />
            <Label htmlFor="featured">Featured artwork</Label>
          </div>

          {/* Upload Progress */}
          {isSubmitting && (
            <div>
              <Label>Upload Progress</Label>
              <Progress value={uploadProgress} className="mt-2" />
              <p className="text-sm text-gray-600 mt-1">{uploadProgress}% complete</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={
                isSubmitting || 
                (!isEditMode && selectedFiles.length === 0) ||
                (isEditMode && existingImages.length === 0 && selectedFiles.length === 0)
              }
              className="flex-1"
            >
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Artwork' : 'Create Artwork')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}