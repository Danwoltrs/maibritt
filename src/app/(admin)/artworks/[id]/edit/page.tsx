'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload, X, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { ArtworkService } from '@/services/artwork.service'
import { SeriesService } from '@/services/series.service'
import { GalleryService, Gallery } from '@/services/gallery.service'
import { ExhibitionsService } from '@/services/exhibitions.service'
import { Artwork, Exhibition } from '@/types'

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

const locationTypes = [
  { value: 'studio', label: 'Studio / Ateliê' },
  { value: 'gallery', label: 'Gallery / Galeria' },
  { value: 'exhibition', label: 'Exhibition / Exposição' },
  { value: 'sold', label: 'Sold / Vendido' },
  { value: 'private', label: 'Private Collection / Coleção Privada' }
]

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = 0; i <= 60; i++) {
    years.push(currentYear - i)
  }
  return years
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditArtworkPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [artwork, setArtwork] = useState<Artwork | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [titlePt, setTitlePt] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [mediumPt, setMediumPt] = useState('')
  const [mediumEn, setMediumEn] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [descriptionPt, setDescriptionPt] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [category, setCategory] = useState<string>('')
  const [seriesId, setSeriesId] = useState<string | undefined>()
  const [forSale, setForSale] = useState(false)
  const [price, setPrice] = useState<number | undefined>()
  const [currency, setCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL')
  const [featured, setFeatured] = useState(false)

  // Series
  const [series, setSeries] = useState<SeriesOption[]>([])
  const [showNewSeriesDialog, setShowNewSeriesDialog] = useState(false)
  const [newSeriesNamePt, setNewSeriesNamePt] = useState('')
  const [newSeriesNameEn, setNewSeriesNameEn] = useState('')
  const [newSeriesYear, setNewSeriesYear] = useState(new Date().getFullYear())

  // Location
  const [locationType, setLocationType] = useState<string>('studio')
  const [locationId, setLocationId] = useState<string | undefined>()
  const [locationNotes, setLocationNotes] = useState('')
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])

  // Sold tracking
  const [isSold, setIsSold] = useState(false)
  const [soldPrice, setSoldPrice] = useState<number | undefined>()
  const [soldCurrency, setSoldCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL')
  const [soldDate, setSoldDate] = useState<string>('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerCity, setBuyerCity] = useState('')
  const [buyerState, setBuyerState] = useState('')
  const [buyerCountry, setBuyerCountry] = useState('')
  const [buyerZipCode, setBuyerZipCode] = useState('')

  // Images
  const [existingImages, setExistingImages] = useState<Artwork['images']>([])
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])

  // Load artwork data
  useEffect(() => {
    const loadArtwork = async () => {
      try {
        setLoading(true)
        const data = await ArtworkService.getArtworkById(id)
        if (!data) {
          setError('Artwork not found')
          return
        }

        setArtwork(data)

        // Populate form
        setTitlePt(data.title.ptBR)
        setTitleEn(data.title.en)
        setYear(data.year)
        setMediumPt(data.medium.ptBR)
        setMediumEn(data.medium.en)
        setDimensions(data.dimensions)
        setDescriptionPt(data.description?.ptBR || '')
        setDescriptionEn(data.description?.en || '')
        setCategory(data.category)
        setSeriesId(data.series || undefined)
        setForSale(data.forSale)
        setPrice(data.price)
        setCurrency(data.currency || 'BRL')
        setFeatured(data.featured)
        setExistingImages(data.images)
        // Location fields (cast to any since these might not be in type yet)
        const artworkData = data as any
        setLocationType(artworkData.locationType || artworkData.location_type || 'studio')
        setLocationId(artworkData.locationId || artworkData.location_id || undefined)
        setLocationNotes(artworkData.locationNotes || artworkData.location_notes || '')
        // Sold tracking fields
        setIsSold(artworkData.isSold || artworkData.is_sold || false)
        setSoldPrice(artworkData.soldPrice || artworkData.sold_price || undefined)
        setSoldCurrency(artworkData.soldCurrency || artworkData.sold_currency || 'BRL')
        setSoldDate(artworkData.soldDate || artworkData.sold_date ? new Date(artworkData.soldDate || artworkData.sold_date).toISOString().split('T')[0] : '')
        setBuyerName(artworkData.buyerName || artworkData.buyer_name || '')
        setBuyerEmail(artworkData.buyerEmail || artworkData.buyer_email || '')
        setBuyerPhone(artworkData.buyerPhone || artworkData.buyer_phone || '')
        setBuyerAddress(artworkData.buyerAddress || artworkData.buyer_address || '')
        setBuyerCity(artworkData.buyerCity || artworkData.buyer_city || '')
        setBuyerState(artworkData.buyerState || artworkData.buyer_state || '')
        setBuyerCountry(artworkData.buyerCountry || artworkData.buyer_country || '')
        setBuyerZipCode(artworkData.buyerZipCode || artworkData.buyer_zip_code || '')
      } catch (err) {
        console.error('Error loading artwork:', err)
        setError('Failed to load artwork')
      } finally {
        setLoading(false)
      }
    }

    loadArtwork()
  }, [id])

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

  // Load galleries and exhibitions for location selection
  useEffect(() => {
    const loadLocationOptions = async () => {
      try {
        // Load galleries
        const galleriesResponse = await GalleryService.getAll({ includeInactive: false })
        if (galleriesResponse.success && galleriesResponse.data) {
          setGalleries(galleriesResponse.data)
        }

        // Load exhibitions
        const exhibitionsData = await ExhibitionsService.getExhibitions()
        setExhibitions(exhibitionsData)
      } catch (error) {
        console.error('Failed to load location options:', error)
      }
    }
    loadLocationOptions()
  }, [])

  // Dropzone for new images
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024,
    onDrop: (acceptedFiles) => {
      const images = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }))
      setNewImages(prev => [...prev, ...images])
    }
  })

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImages[index].preview)
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const markExistingImageForDeletion = (imageIndex: number) => {
    const image = existingImages[imageIndex]
    if (image) {
      setImagesToDelete(prev => [...prev, image.original])
      setExistingImages(prev => prev.filter((_, i) => i !== imageIndex))
    }
  }

  const handleCreateNewSeries = async () => {
    if (!newSeriesNamePt || !newSeriesNameEn) {
      setError('Please fill in both Portuguese and English series names')
      return
    }

    try {
      const newSeries = await SeriesService.createSeries({
        name: { ptBR: newSeriesNamePt, en: newSeriesNameEn },
        description: { ptBR: '', en: '' },
        year: newSeriesYear,
        isSeasonal: false
      })

      setSeries(prev => [...prev, { id: newSeries.id, name: newSeries.name }])
      setSeriesId(newSeries.id)
      setShowNewSeriesDialog(false)
      setNewSeriesNamePt('')
      setNewSeriesNameEn('')
    } catch (error) {
      console.error('Failed to create series:', error)
      setError('Failed to create new series')
    }
  }

  const handleSave = async () => {
    if (!titlePt || !titleEn || !mediumPt || !mediumEn || !dimensions || !category) {
      setError('Please fill in all required fields')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await ArtworkService.updateArtwork(id, {
        title: { ptBR: titlePt, en: titleEn },
        year,
        medium: { ptBR: mediumPt, en: mediumEn },
        dimensions,
        description: { ptBR: descriptionPt, en: descriptionEn },
        category: category as any,
        seriesId: seriesId || null,
        forSale,
        price: forSale ? price : undefined,
        currency: forSale ? currency : undefined,
        featured,
        locationType: locationType || 'studio',
        locationId: (locationType === 'gallery' || locationType === 'exhibition') ? locationId : undefined,
        locationNotes: locationNotes || undefined,
        newImages: newImages.map(img => img.file),
        imagesToDelete,
        // Sold tracking
        isSold,
        soldPrice: isSold ? soldPrice : undefined,
        soldCurrency: isSold ? soldCurrency : undefined,
        soldDate: isSold && soldDate ? new Date(soldDate) : undefined,
        buyerName: isSold ? buyerName : undefined,
        buyerEmail: isSold ? buyerEmail : undefined,
        buyerPhone: isSold ? buyerPhone : undefined,
        buyerAddress: isSold ? buyerAddress : undefined,
        buyerCity: isSold ? buyerCity : undefined,
        buyerState: isSold ? buyerState : undefined,
        buyerCountry: isSold ? buyerCountry : undefined,
        buyerZipCode: isSold ? buyerZipCode : undefined
      } as any)

      setSuccess(true)
      setTimeout(() => {
        router.push('/artworks')
      }, 1500)
    } catch (err) {
      console.error('Error updating artwork:', err)
      setError(err instanceof Error ? err.message : 'Failed to update artwork')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Artwork</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error && !artwork) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Save className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Artwork Updated!</h2>
            <p className="text-gray-600">Redirecting to artworks list...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Artwork</h1>
            <p className="text-gray-600">{artwork?.title.en}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Images Section */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>Manage artwork images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="space-y-2">
                <Label>Current Images</Label>
                <div className="grid grid-cols-2 gap-2">
                  {existingImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.thumbnail || image.display}
                        alt={`Image ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => markExistingImageForDeletion(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {newImages.length > 0 && (
              <div className="space-y-2">
                <Label>New Images to Add</Label>
                <div className="grid grid-cols-2 gap-2">
                  {newImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview}
                        alt={`New ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border border-green-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Add more images</p>
            </div>
          </CardContent>
        </Card>

        {/* Details Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Artwork Details</CardTitle>
            <CardDescription>Edit artwork information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Titles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title (Portuguese) *</Label>
                <Input
                  value={titlePt}
                  onChange={(e) => setTitlePt(e.target.value)}
                  placeholder="Título da obra"
                />
              </div>
              <div className="space-y-2">
                <Label>Title (English) *</Label>
                <Input
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Artwork title"
                />
              </div>
            </div>

            {/* Category and Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
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
              </div>
              <div className="space-y-2">
                <Label>Year *</Label>
                <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {generateYearOptions().map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Series */}
            <div className="space-y-2">
              <Label>Series / Collection</Label>
              <div className="flex gap-2">
                <Select value={seriesId || 'none'} onValueChange={(v) => setSeriesId(v === 'none' ? undefined : v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select series (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No series</SelectItem>
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
                      <DialogDescription>Add a new series/collection</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Name (Portuguese)</Label>
                        <Input
                          value={newSeriesNamePt}
                          onChange={(e) => setNewSeriesNamePt(e.target.value)}
                          placeholder="Nome da série"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Name (English)</Label>
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
                          onValueChange={(v) => setNewSeriesYear(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {generateYearOptions().map((y) => (
                              <SelectItem key={y} value={y.toString()}>
                                {y}
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

            {/* Medium */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Medium (Portuguese) *</Label>
                <Input
                  value={mediumPt}
                  onChange={(e) => setMediumPt(e.target.value)}
                  placeholder="Acrílica sobre tela"
                />
              </div>
              <div className="space-y-2">
                <Label>Medium (English) *</Label>
                <Input
                  value={mediumEn}
                  onChange={(e) => setMediumEn(e.target.value)}
                  placeholder="Acrylic on canvas"
                />
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <Label>Dimensions *</Label>
              <Input
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="100 x 80 cm"
              />
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description (Portuguese)</Label>
                <Textarea
                  value={descriptionPt}
                  onChange={(e) => setDescriptionPt(e.target.value)}
                  placeholder="Descrição da obra..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (English)</Label>
                <Textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="Artwork description..."
                  rows={4}
                />
              </div>
            </div>

            {/* Availability Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Availability / Disponibilidade</h3>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Available at Gallery</Label>
                  <p className="text-sm text-gray-500">This artwork is available for viewing/purchase at a gallery</p>
                </div>
                <Switch checked={forSale} onCheckedChange={setForSale} />
              </div>

              {forSale && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Asking Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={price || ''}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || undefined)}
                      placeholder="5000.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
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
                  <p className="text-sm text-gray-500">Highlight this on the homepage carousel</p>
                </div>
                <Switch checked={featured} onCheckedChange={setFeatured} />
              </div>
            </div>

            {/* Location Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Location / Localização</h3>
              <p className="text-sm text-gray-500 -mt-2">Track where this artwork is currently located</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location Type</Label>
                  <Select value={locationType} onValueChange={(v) => {
                    setLocationType(v)
                    // Clear locationId when changing type
                    if (v !== 'gallery' && v !== 'exhibition') {
                      setLocationId(undefined)
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location type" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationTypes.map((loc) => (
                        <SelectItem key={loc.value} value={loc.value}>
                          {loc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gallery Selection */}
                {locationType === 'gallery' && (
                  <div className="space-y-2">
                    <Label>Gallery</Label>
                    <Select value={locationId || 'none'} onValueChange={(v) => setLocationId(v === 'none' ? undefined : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gallery" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific gallery</SelectItem>
                        {galleries.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name} - {g.city}, {g.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Exhibition Selection */}
                {locationType === 'exhibition' && (
                  <div className="space-y-2">
                    <Label>Exhibition</Label>
                    <Select value={locationId || 'none'} onValueChange={(v) => setLocationId(v === 'none' ? undefined : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select exhibition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific exhibition</SelectItem>
                        {exhibitions.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.title.en || e.title.ptBR} ({e.year}) - {e.venue}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Location Notes</Label>
                <Textarea
                  value={locationNotes}
                  onChange={(e) => setLocationNotes(e.target.value)}
                  placeholder="Additional details about the artwork's location..."
                  rows={2}
                />
              </div>
            </div>

            {/* Sold Tracking */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Sale Record / Registro de Venda</h3>
              <p className="text-sm text-gray-500 -mt-2">Track when this artwork has been sold</p>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mark as Sold</Label>
                  <p className="text-sm text-gray-500">This artwork has been sold</p>
                </div>
                <Switch checked={isSold} onCheckedChange={setIsSold} />
              </div>

              {isSold && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  {/* Sale Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Sale Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={soldPrice || ''}
                        onChange={(e) => setSoldPrice(parseFloat(e.target.value) || undefined)}
                        placeholder="5000.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={soldCurrency} onValueChange={(v) => setSoldCurrency(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sale Date</Label>
                      <Input
                        type="date"
                        value={soldDate}
                        onChange={(e) => setSoldDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Buyer Information */}
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Buyer Information (Optional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="Buyer's name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="buyer@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          type="tel"
                          value={buyerPhone}
                          onChange={(e) => setBuyerPhone(e.target.value)}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                          value={buyerCountry}
                          onChange={(e) => setBuyerCountry(e.target.value)}
                          placeholder="Country"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Address</Label>
                        <Input
                          value={buyerAddress}
                          onChange={(e) => setBuyerAddress(e.target.value)}
                          placeholder="Street address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={buyerCity}
                          onChange={(e) => setBuyerCity(e.target.value)}
                          placeholder="City"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>State/Province</Label>
                        <Input
                          value={buyerState}
                          onChange={(e) => setBuyerState(e.target.value)}
                          placeholder="State or Province"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ZIP/Postal Code</Label>
                        <Input
                          value={buyerZipCode}
                          onChange={(e) => setBuyerZipCode(e.target.value)}
                          placeholder="12345"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
