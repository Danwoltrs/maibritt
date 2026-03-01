'use client'

import React, { useState, useEffect } from 'react'
import { Save, Upload, X, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
  { value: 'engraving', label: 'Engravings / Gravuras' },
  { value: 'video', label: 'Video / Vídeo' },
  { value: 'installations', label: 'Installations / Instalações' },
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

interface EditArtworkModalProps {
  artwork: Artwork
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function EditArtworkModal({ artwork, open, onOpenChange, onUpdate }: EditArtworkModalProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  const [showNewSeries, setShowNewSeries] = useState(false)
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

  // Medium/dimensions dropdowns
  const [knownMediums, setKnownMediums] = useState<{ ptBR: string; en: string }[]>([])
  const [knownDimensions, setKnownDimensions] = useState<string[]>([])
  const [showNewMedium, setShowNewMedium] = useState(false)
  const [newMediumPtVal, setNewMediumPtVal] = useState('')
  const [newMediumEnVal, setNewMediumEnVal] = useState('')
  const [showNewDimension, setShowNewDimension] = useState(false)
  const [newDimensionVal, setNewDimensionVal] = useState('')

  // Images
  const [existingImages, setExistingImages] = useState<Artwork['images']>([])
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])

  // Load full artwork data + options when modal opens
  useEffect(() => {
    if (!open) return

    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [data, seriesData, galleriesRes, exhibitionsData, mediums, dims] = await Promise.all([
          ArtworkService.getArtworkById(artwork.id),
          SeriesService.getSeries(),
          GalleryService.getAll({ includeInactive: false }),
          ExhibitionsService.getExhibitions(),
          ArtworkService.getDistinctMediums(),
          ArtworkService.getDistinctDimensions(),
        ])
        setKnownMediums(mediums)
        setKnownDimensions(dims)

        if (!data) {
          setError('Artwork not found')
          return
        }

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

        const artworkData = data as any
        setLocationType(artworkData.locationType || artworkData.location_type || 'studio')
        setLocationId(artworkData.locationId || artworkData.location_id || undefined)
        setLocationNotes(artworkData.locationNotes || artworkData.location_notes || '')

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

        // Options
        setSeries(seriesData.map(s => ({ id: s.id, name: s.name })))
        if (galleriesRes.success && galleriesRes.data) setGalleries(galleriesRes.data)
        setExhibitions(exhibitionsData)

        // Reset transient state
        setNewImages([])
        setImagesToDelete([])
      } catch (err) {
        console.error('Error loading artwork:', err)
        setError('Failed to load artwork')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [open, artwork.id])

  // Dropzone
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
      setShowNewSeries(false)
      setNewSeriesNamePt('')
      setNewSeriesNameEn('')
    } catch (err) {
      console.error('Failed to create series:', err)
      setError('Failed to create new series')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      await ArtworkService.updateArtwork(artwork.id, {
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

      onOpenChange(false)
      onUpdate?.()
    } catch (err) {
      console.error('Error updating artwork:', err)
      setError(err instanceof Error ? err.message : 'Failed to update artwork')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Artwork</DialogTitle>
          <DialogDescription>{artwork.title.en}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
            <p className="text-gray-500">Loading artwork data...</p>
          </div>
        ) : error && !titleEn ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Images */}
            <ImageSection
              existingImages={existingImages}
              newImages={newImages}
              onDeleteExisting={markExistingImageForDeletion}
              onDeleteNew={removeNewImage}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
            />

            {/* Titles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title (Portuguese)</Label>
                <Input value={titlePt} onChange={(e) => setTitlePt(e.target.value)} placeholder="Título da obra" />
              </div>
              <div className="space-y-2">
                <Label>Title (English)</Label>
                <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Artwork title" />
              </div>
            </div>

            {/* Category and Year/}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {generateYearOptions().map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
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
                      <SelectItem key={s.id} value={s.id}>{s.name.en} / {s.name.ptBR}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setShowNewSeries(!showNewSeries)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {showNewSeries && (
                <div className="p-4 border rounded-lg space-y-3 bg-gray-50">
                  <p className="text-sm font-medium">Create New Series</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={newSeriesNamePt} onChange={(e) => setNewSeriesNamePt(e.target.value)} placeholder="Nome da série" />
                    <Input value={newSeriesNameEn} onChange={(e) => setNewSeriesNameEn(e.target.value)} placeholder="Series name" />
                  </div>
                  <div className="flex gap-2 items-end">
                    <Select value={newSeriesYear.toString()} onValueChange={(v) => setNewSeriesYear(parseInt(v))}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {generateYearOptions().map((y) => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleCreateNewSeries}>Create</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNewSeries(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Medium - Dropdown */}
            <div className="space-y-2">
              <Label>Medium</Label>
              <div className="flex gap-2">
                <Select
                  value={knownMediums.find(m => m.en === mediumEn && m.ptBR === mediumPt)?.en || ''}
                  onValueChange={(v) => {
                    if (v === '__new__') { setShowNewMedium(true); return }
                    const m = knownMediums.find(m => m.en === v)
                    if (m) { setMediumPt(m.ptBR); setMediumEn(m.en) }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select medium" />
                  </SelectTrigger>
                  <SelectContent>
                    {knownMediums.map((m, i) => (
                      <SelectItem key={i} value={m.en}>{m.en} / {m.ptBR}</SelectItem>
                    ))}
                    <SelectItem value="__new__">
                      <span className="flex items-center gap-1"><Plus className="h-3 w-3" /> Add new medium</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setShowNewMedium(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {showNewMedium && (
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">English</Label>
                    <Input value={newMediumEnVal} onChange={(e) => setNewMediumEnVal(e.target.value)} placeholder="Acrylic on canvas" autoFocus />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Portuguese</Label>
                    <Input value={newMediumPtVal} onChange={(e) => setNewMediumPtVal(e.target.value)} placeholder="Acrílica sobre tela" />
                  </div>
                  <Button size="sm" onClick={() => {
                    if (!newMediumEnVal.trim() && !newMediumPtVal.trim()) return
                    const nm = { ptBR: newMediumPtVal.trim(), en: newMediumEnVal.trim() }
                    setKnownMediums(prev => [...prev, nm].sort((a, b) => a.en.localeCompare(b.en)))
                    setMediumPt(nm.ptBR); setMediumEn(nm.en)
                    setNewMediumPtVal(''); setNewMediumEnVal(''); setShowNewMedium(false)
                  }}>Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowNewMedium(false); setNewMediumPtVal(''); setNewMediumEnVal('') }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {(mediumEn || mediumPt) && !knownMediums.find(m => m.en === mediumEn && m.ptBR === mediumPt) && (
                <p className="text-xs text-muted-foreground">Current: {mediumEn} / {mediumPt}</p>
              )}
            </div>

            {/* Dimensions - Dropdown */}
            <div className="space-y-2">
              <Label>Dimensions</Label>
              <div className="flex gap-2">
                <Select
                  value={knownDimensions.includes(dimensions) ? dimensions : ''}
                  onValueChange={(v) => {
                    if (v === '__new__') { setShowNewDimension(true); return }
                    setDimensions(v)
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select dimensions" />
                  </SelectTrigger>
                  <SelectContent>
                    {knownDimensions.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                    <SelectItem value="__new__">
                      <span className="flex items-center gap-1"><Plus className="h-3 w-3" /> Add new dimensions</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setShowNewDimension(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {showNewDimension && (
                <div className="flex gap-2">
                  <Input
                    value={newDimensionVal}
                    onChange={(e) => setNewDimensionVal(e.target.value)}
                    placeholder="100 x 80 cm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newDimensionVal.trim()) {
                        const d = newDimensionVal.trim()
                        if (!knownDimensions.includes(d)) setKnownDimensions(prev => [...prev, d].sort())
                        setDimensions(d); setNewDimensionVal(''); setShowNewDimension(false)
                      }
                    }}
                  />
                  <Button size="sm" onClick={() => {
                    if (!newDimensionVal.trim()) return
                    const d = newDimensionVal.trim()
                    if (!knownDimensions.includes(d)) setKnownDimensions(prev => [...prev, d].sort())
                    setDimensions(d); setNewDimensionVal(''); setShowNewDimension(false)
                  }}>Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowNewDimension(false); setNewDimensionVal('') }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {dimensions && !knownDimensions.includes(dimensions) && (
                <p className="text-xs text-muted-foreground">Current: {dimensions}</p>
              )}
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description (Portuguese)</Label>
                <Textarea value={descriptionPt} onChange={(e) => setDescriptionPt(e.target.value)} placeholder="Descrição da obra..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Description (English)</Label>
                <Textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} placeholder="Artwork description..." rows={3} />
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">Availability</h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Available for Sale</Label>
                  <p className="text-xs text-gray-500">This artwork is available for purchase</p>
                </div>
                <Switch checked={forSale} onCheckedChange={setForSale} />
              </div>
              {forSale && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Asking Price</Label>
                    <Input type="number" step="0.01" value={price || ''} onChange={(e) => setPrice(parseFloat(e.target.value) || undefined)} placeholder="5000.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Featured Artwork</Label>
                  <p className="text-xs text-gray-500">Show on homepage carousel</p>
                </div>
                <Switch checked={featured} onCheckedChange={setFeatured} />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location Type</Label>
                  <Select value={locationType} onValueChange={(v) => {
                    setLocationType(v)
                    if (v !== 'gallery' && v !== 'exhibition') setLocationId(undefined)
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select location type" /></SelectTrigger>
                    <SelectContent>
                      {locationTypes.map((loc) => (
                        <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {locationType === 'gallery' && (
                  <div className="space-y-2">
                    <Label>Gallery</Label>
                    <Select value={locationId || 'none'} onValueChange={(v) => setLocationId(v === 'none' ? undefined : v)}>
                      <SelectTrigger><SelectValue placeholder="Select gallery" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific gallery</SelectItem>
                        {galleries.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.name} - {g.city}, {g.country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {locationType === 'exhibition' && (
                  <div className="space-y-2">
                    <Label>Exhibition</Label>
                    <Select value={locationId || 'none'} onValueChange={(v) => setLocationId(v === 'none' ? undefined : v)}>
                      <SelectTrigger><SelectValue placeholder="Select exhibition" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific exhibition</SelectItem>
                        {exhibitions.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.title.en || e.title.ptBR} ({e.year}) - {e.venue}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Location Notes</Label>
                <Textarea value={locationNotes} onChange={(e) => setLocationNotes(e.target.value)} placeholder="Additional location details..." rows={2} />
              </div>
            </div>

            {/* Sold Tracking */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">Sale Record</h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mark as Sold</Label>
                  <p className="text-xs text-gray-500">This artwork has been sold</p>
                </div>
                <Switch checked={isSold} onCheckedChange={setIsSold} />
              </div>
              {isSold && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Sale Price</Label>
                      <Input type="number" step="0.01" value={soldPrice || ''} onChange={(e) => setSoldPrice(parseFloat(e.target.value) || undefined)} placeholder="5000.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={soldCurrency} onValueChange={(v) => setSoldCurrency(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {currencies.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sale Date</Label>
                      <Input type="date" value={soldDate} onChange={(e) => setSoldDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs font-medium text-gray-700 mb-3">Buyer Information (Optional)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Buyer's name" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="buyer@email.com" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phone</Label>
                        <Input type="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="+1 234 567 8900" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Country</Label>
                        <Input value={buyerCountry} onChange={(e) => setBuyerCountry(e.target.value)} placeholder="Country" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs">Address</Label>
                        <Input value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} placeholder="Street address" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">City</Label>
                        <Input value={buyerCity} onChange={(e) => setBuyerCity(e.target.value)} placeholder="City" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="space-y-1">
                        <Label className="text-xs">State/Province</Label>
                        <Input value={buyerState} onChange={(e) => setBuyerState(e.target.value)} placeholder="State" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">ZIP/Postal Code</Label>
                        <Input value={buyerZipCode} onChange={(e) => setBuyerZipCode(e.target.value)} placeholder="12345" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Image Section (extracted to keep main component readable) ───────────────

interface ImageSectionProps {
  existingImages: Artwork['images']
  newImages: { file: File; preview: string }[]
  onDeleteExisting: (index: number) => void
  onDeleteNew: (index: number) => void
  getRootProps: any
  getInputProps: any
  isDragActive: boolean
}

function ImageSection({ existingImages, newImages, onDeleteExisting, onDeleteNew, getRootProps, getInputProps, isDragActive }: ImageSectionProps) {
  return (
    <div className="space-y-3">
      <Label>Images</Label>
      <div className="flex gap-2 flex-wrap">
        {existingImages.map((image, index) => (
          <div key={index} className="relative group w-20 h-20">
            <img
              src={image.thumbnail || image.display}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={() => onDeleteExisting(index)}
              className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {newImages.map((image, index) => (
          <div key={`new-${index}`} className="relative group w-20 h-20">
            <img
              src={image.preview}
              alt={`New ${index + 1}`}
              className="w-full h-full object-cover rounded-lg border border-green-300"
            />
            <button
              type="button"
              onClick={() => onDeleteNew(index)}
              className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div
          {...getRootProps()}
          className={`w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <input {...getInputProps()} />
          <Upload className="h-5 w-5 text-gray-400" />
          <span className="text-[10px] text-gray-400 mt-1">Add</span>
        </div>
      </div>
    </div>
  )
}
