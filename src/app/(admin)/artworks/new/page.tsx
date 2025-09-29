'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
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

import { ArtworkService } from '@/services/artwork.service'
import { SeriesService } from '@/services/series.service'
import { StorageService } from '@/services/storage.service'

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

export default function NewArtworkPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
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
    defaultValues: {
      forSale: false,
      featured: false,
      currency: 'BRL',
      year: new Date().getFullYear()
    }
  })

  const watchForSale = watch('forSale')

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

  const onSubmit = async (data: ArtworkFormData) => {
    if (selectedFiles.length === 0) {
      setError('Please upload at least one image')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      await ArtworkService.createArtwork({
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
        seriesId: data.seriesId,
        images: selectedFiles,
        forSale: data.forSale,
        price: data.forSale ? data.price : undefined,
        currency: data.forSale ? data.currency : undefined,
        featured: data.featured
      }, (progress) => {
        setUploadProgress(progress.percentage)
      })

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Failed to create artwork:', error)
      setError(error instanceof Error ? error.message : 'Failed to create artwork')
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

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Artwork Created Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your artwork has been uploaded and added to your portfolio.
            </p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Upload New Artwork</h1>
          <p className="text-gray-600">Add a new piece to your portfolio</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Upload */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Upload high-quality images of your artwork. The first image will be used as the cover.
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
                      JPG, PNG, WebP up to 50MB each (max 5 files)
                    </p>
                  </div>
                )}
              </div>

              {/* Image Previews */}
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full 
                                 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <Badge className="absolute bottom-2 left-2 bg-blue-500">
                          Cover
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Progress */}
              {isSubmitting && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading images...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titlePt">Title (Portuguese)</Label>
                <Input
                  id="titlePt"
                  {...register('titlePt')}
                  placeholder="Título da obra"
                />
                {errors.titlePt && (
                  <p className="text-sm text-red-600">{errors.titlePt.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="titleEn">Title (English)</Label>
                <Input
                  id="titleEn"
                  {...register('titleEn')}
                  placeholder="Artwork title"
                />
                {errors.titleEn && (
                  <p className="text-sm text-red-600">{errors.titleEn.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  placeholder="2024"
                />
                {errors.year && (
                  <p className="text-sm text-red-600">{errors.year.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => setValue('category', value as any)}>
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
                {errors.category && (
                  <p className="text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  {...register('dimensions')}
                  placeholder="100 x 80 cm"
                />
                {errors.dimensions && (
                  <p className="text-sm text-red-600">{errors.dimensions.message}</p>
                )}
              </div>

              {series.length > 0 && (
                <div className="space-y-2">
                  <Label>Series (Optional)</Label>
                  <Select onValueChange={(value) => setValue('seriesId', value)}>
                    <SelectTrigger>
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Medium & Description */}
        <Card>
          <CardHeader>
            <CardTitle>Medium & Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mediumPt">Medium (Portuguese)</Label>
                <Input
                  id="mediumPt"
                  {...register('mediumPt')}
                  placeholder="Acrílica sobre tela"
                />
                {errors.mediumPt && (
                  <p className="text-sm text-red-600">{errors.mediumPt.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mediumEn">Medium (English)</Label>
                <Input
                  id="mediumEn"
                  {...register('mediumEn')}
                  placeholder="Acrylic on canvas"
                />
                {errors.mediumEn && (
                  <p className="text-sm text-red-600">{errors.mediumEn.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="descriptionPt">Description (Portuguese)</Label>
                <Textarea
                  id="descriptionPt"
                  {...register('descriptionPt')}
                  placeholder="Descrição da obra..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionEn">Description (English)</Label>
                <Textarea
                  id="descriptionEn"
                  {...register('descriptionEn')}
                  placeholder="Artwork description..."
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sale Information */}
        <Card>
          <CardHeader>
            <CardTitle>Sale Information</CardTitle>
            <CardDescription>
              Configure if this artwork is available for purchase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="forSale">Available for Sale</Label>
                <p className="text-sm text-gray-500">
                  Mark this artwork as available for purchase
                </p>
              </div>
              <Switch
                id="forSale"
                checked={watchForSale}
                onCheckedChange={(checked) => setValue('forSale', checked)}
              />
            </div>

            {watchForSale && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                    placeholder="5000.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select onValueChange={(value) => setValue('currency', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
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

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <Label htmlFor="featured">Featured Artwork</Label>
                <p className="text-sm text-gray-500">
                  Highlight this artwork on the homepage
                </p>
              </div>
              <Switch
                id="featured"
                {...register('featured')}
                onCheckedChange={(checked) => setValue('featured', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || selectedFiles.length === 0}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating...
              </div>
            ) : (
              'Create Artwork'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}