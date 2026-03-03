'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import {
  X, Plus, Video, Image as ImageIcon, Quote, Calendar,
  Link as LinkIcon, Upload, MapPin, Loader2, Maximize2, Minimize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ExhibitionImage, ExhibitionVideo } from '@/types'
import { ExhibitionsService } from '@/services/exhibitions.service'
import { PageBuilderEditor } from '@/components/admin/journal/page-builder/PageBuilderEditor'
import { AddContentMenu } from '@/components/admin/journal/page-builder/AddContentMenu'
import { normalizeContent, createEmptyPageBuilderDoc } from '@/lib/content-migration'
import type { ContentBlock } from '@/components/admin/journal/page-builder/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = Record<string, any> | null

const COUNTRIES = [
  'Denmark', 'Brazil', 'United States', 'United Kingdom', 'Germany', 'France',
  'Spain', 'Italy', 'Portugal', 'Netherlands', 'Sweden', 'Norway', 'Finland',
  'Switzerland', 'Austria', 'Belgium', 'Japan', 'China', 'South Korea',
  'Australia', 'Canada', 'Mexico', 'Argentina', 'Colombia', 'Chile',
  'India', 'UAE', 'Israel', 'South Africa', 'Nigeria', 'Singapore',
  'Thailand', 'Indonesia', 'Turkey', 'Greece', 'Poland', 'Czech Republic',
  'Ireland', 'New Zealand', 'Iceland', 'Luxembourg', 'Monaco',
]

export interface ExhibitionFormData {
  titleEn: string
  titlePt: string
  venue: string
  street: string
  streetNumber: string
  neighborhood: string
  zipCode: string
  city: string
  state: string
  country: string
  year: number
  type: 'solo' | 'group' | 'residency' | 'installation'
  descriptionEn: string
  descriptionPt: string
  contentEn: AnyDoc
  contentPt: AnyDoc
  curatorName: string
  curatorTextEn: string
  curatorTextPt: string
  images: ExhibitionImage[]
  videos: ExhibitionVideo[]
  startDate: string
  endDate: string
  openingDate: string
  openingDetails: string
  featured: boolean
  mainImageMode: 'fixed' | 'random'
  externalUrl: string
  catalogUrl: string
  imageFile: File | null
}

interface ExhibitionRichFormProps {
  formData: ExhibitionFormData
  setFormData: React.Dispatch<React.SetStateAction<ExhibitionFormData>>
  onSubmit: () => void
  onCancel: () => void
  saving: boolean
  submitLabel: string
  existingImage?: string
}

export const defaultFormData: ExhibitionFormData = {
  titleEn: '',
  titlePt: '',
  venue: '',
  street: '',
  streetNumber: '',
  neighborhood: '',
  zipCode: '',
  city: '',
  state: '',
  country: '',
  year: new Date().getFullYear(),
  type: 'solo',
  descriptionEn: '',
  descriptionPt: '',
  contentEn: null,
  contentPt: null,
  curatorName: '',
  curatorTextEn: '',
  curatorTextPt: '',
  images: [],
  videos: [],
  startDate: '',
  endDate: '',
  openingDate: '',
  openingDetails: '',
  featured: false,
  mainImageMode: 'fixed',
  externalUrl: '',
  catalogUrl: '',
  imageFile: null
}

export function ExhibitionRichForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  saving,
  submitLabel,
  existingImage
}: ExhibitionRichFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newVideoTitleEn, setNewVideoTitleEn] = useState('')
  const [newVideoTitlePt, setNewVideoTitlePt] = useState('')
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)
  const [editingCaption, setEditingCaption] = useState({ en: '', pt: '' })
  const [lookingUpZip, setLookingUpZip] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [contentLang, setContentLang] = useState<'en' | 'pt'>('en')
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const update = <K extends keyof ExhibitionFormData>(key: K, value: ExhibitionFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  // Auto-migrate legacy string content on mount
  useEffect(() => {
    let changed = false
    let newEn = formData.contentEn
    let newPt = formData.contentPt

    if (formData.contentEn && typeof formData.contentEn === 'object' &&
        !('version' in formData.contentEn && formData.contentEn.version === 2)) {
      newEn = normalizeContent(formData.contentEn)
      changed = true
    }
    if (formData.contentPt && typeof formData.contentPt === 'object' &&
        !('version' in formData.contentPt && formData.contentPt.version === 2)) {
      newPt = normalizeContent(formData.contentPt)
      changed = true
    }

    if (changed) {
      setFormData(prev => ({ ...prev, contentEn: newEn, contentPt: newPt }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  useEffect(() => {
    if (!isFullscreen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  const lookupZipCode = async () => {
    const zip = formData.zipCode.trim()
    if (!zip) return
    setLookingUpZip(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(zip)}&addressdetails=1&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data.length > 0) {
        const addr = data[0].address
        const city = addr.city || addr.town || addr.village || ''
        const state = addr.state || ''
        const country = addr.country || ''
        const matchedCountry = COUNTRIES.find(
          (c) => c.toLowerCase() === country.toLowerCase()
        )
        setFormData(prev => ({
          ...prev,
          city: city || prev.city,
          state: state || prev.state,
          country: matchedCountry || prev.country,
        }))
      }
    } catch (error) {
      console.error('ZIP lookup failed:', error)
    } finally {
      setLookingUpZip(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingGallery(true)
    try {
      const fileArray = Array.from(files)
      const uploadedImages = await ExhibitionsService.uploadGalleryImages(fileArray)

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }))
    } catch (error) {
      console.error('Error uploading gallery images:', error)
    } finally {
      setUploadingGallery(false)
      if (galleryInputRef.current) {
        galleryInputRef.current.value = ''
      }
    }
  }

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    if (editingImageIndex === index) {
      setEditingImageIndex(null)
    }
  }

  const openCaptionEditor = (index: number) => {
    const img = formData.images[index]
    setEditingCaption({
      en: img.captionEn || '',
      pt: img.captionPt || ''
    })
    setEditingImageIndex(index)
  }

  const saveCaptions = () => {
    if (editingImageIndex === null) return
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === editingImageIndex
          ? { ...img, captionEn: editingCaption.en || undefined, captionPt: editingCaption.pt || undefined }
          : img
      )
    }))
    setEditingImageIndex(null)
  }

  const addVideo = () => {
    if (!newVideoUrl) return
    const newVideo: ExhibitionVideo = {
      url: newVideoUrl,
      titleEn: newVideoTitleEn || undefined,
      titlePt: newVideoTitlePt || undefined
    }
    setFormData(prev => ({ ...prev, videos: [...prev.videos, newVideo] }))
    setNewVideoUrl('')
    setNewVideoTitleEn('')
    setNewVideoTitlePt('')
  }

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }))
  }

  const addBlockToActiveContent = (block: ContentBlock) => {
    const key = contentLang === 'en' ? 'contentEn' : 'contentPt'
    const current = normalizeContent(formData[key]) || createEmptyPageBuilderDoc()
    update(key, { ...current, blocks: [...current.blocks, block] })
  }

  const formContent = (
    <div className={`space-y-4 ${isFullscreen ? 'flex flex-col h-full' : ''}`}>
      {isFullscreen && (
        <div className="flex items-center justify-between border-b pb-3 mb-2 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {formData.titleEn || formData.titlePt || 'Exhibition'}
          </h2>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Minimize2 className="h-4 w-4 mr-1.5" />
            Exit Fullscreen
          </Button>
        </div>
      )}

      <Tabs defaultValue="details" className={isFullscreen ? 'flex-1 flex flex-col min-h-0' : 'w-full'}>
        <div className="flex items-center justify-between shrink-0">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="content">Content & Media</TabsTrigger>
          </TabsList>
          {!isFullscreen && (
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-8 w-8 p-0" title="Fullscreen">
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* ========== Tab 1: Details ========== */}
        <TabsContent value="details" className={`space-y-4 mt-4 ${isFullscreen ? 'flex-1 overflow-y-auto min-h-0' : ''}`}>
          {/* Titles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titleEn">Title (English) *</Label>
              <Input
                id="titleEn"
                value={formData.titleEn}
                onChange={(e) => update('titleEn', e.target.value)}
                placeholder="e.g., Fragments of Memory"
              />
            </div>
            <div>
              <Label htmlFor="titlePt">Title (Portugues)</Label>
              <Input
                id="titlePt"
                value={formData.titlePt}
                onChange={(e) => update('titlePt', e.target.value)}
                placeholder="e.g., Fragmentos da Memoria"
              />
            </div>
          </div>

          {/* Venue + Year + Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="venue">Venue *</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => update('venue', e.target.value)}
                placeholder="e.g., Museum of Modern Art"
              />
            </div>
            <div>
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => update('year', parseInt(e.target.value))}
                min={1950}
                max={2100}
              />
            </div>
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'solo' | 'group' | 'residency' | 'installation') =>
                  update('type', value)
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo Exhibition</SelectItem>
                  <SelectItem value="group">Group Exhibition</SelectItem>
                  <SelectItem value="residency">Artist Residency</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address Section */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium">Location Address</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="street">Street</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => update('street', e.target.value)}
                  placeholder="e.g., Rua Augusta"
                />
              </div>
              <div>
                <Label htmlFor="streetNumber">Number</Label>
                <Input
                  id="streetNumber"
                  value={formData.streetNumber}
                  onChange={(e) => update('streetNumber', e.target.value)}
                  placeholder="e.g., 1234"
                />
              </div>
              <div>
                <Label htmlFor="neighborhood">Neighborhood</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => update('neighborhood', e.target.value)}
                  placeholder="e.g., Consolacao"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => update('zipCode', e.target.value)}
                    onBlur={lookupZipCode}
                    placeholder="e.g., 01310-100"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={lookupZipCode}
                    disabled={lookingUpZip || !formData.zipCode.trim()}
                    title="Lookup address from ZIP code"
                  >
                    {lookingUpZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="e.g., Sao Paulo"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => update('state', e.target.value)}
                  placeholder="e.g., SP"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => update('country', value)}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium">Dates</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => update('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => update('endDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="openingDate">Opening Date & Time</Label>
                <Input
                  id="openingDate"
                  type="datetime-local"
                  value={formData.openingDate}
                  onChange={(e) => update('openingDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="openingDetails">Opening Details</Label>
                <Input
                  id="openingDetails"
                  value={formData.openingDetails}
                  onChange={(e) => update('openingDetails', e.target.value)}
                  placeholder="e.g., Free entry, RSVP required"
                />
              </div>
            </div>
          </div>

          {/* Featured + Links */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between p-4 border rounded-lg mb-4">
              <div>
                <Label>Featured Exhibition</Label>
                <p className="text-sm text-gray-500">Show prominently on homepage</p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => update('featured', checked)}
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium">External Links</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="externalUrl">External URL</Label>
                <Input
                  id="externalUrl"
                  type="url"
                  value={formData.externalUrl}
                  onChange={(e) => update('externalUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="catalogUrl">Catalog URL</Label>
                <Input
                  id="catalogUrl"
                  type="url"
                  value={formData.catalogUrl}
                  onChange={(e) => update('catalogUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ========== Tab 2: Content & Media ========== */}
        <TabsContent value="content" className={`space-y-6 mt-4 ${isFullscreen ? 'flex-1 overflow-y-auto min-h-0' : ''}`}>
          {/* Cover Image Mode */}
          <div>
            <Label className="text-base font-medium mb-3 block">Cover Image</Label>
            <RadioGroup
              value={formData.mainImageMode}
              onValueChange={(v) => update('mainImageMode', v as 'fixed' | 'random')}
              className="flex gap-6 mb-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="mode-fixed" />
                <Label htmlFor="mode-fixed" className="cursor-pointer">Fixed image</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="random" id="mode-random" />
                <Label htmlFor="mode-random" className="cursor-pointer">Random from gallery</Label>
              </div>
            </RadioGroup>

            {formData.mainImageMode === 'fixed' && (
              <div className="space-y-4">
                {(imagePreview || existingImage) && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={imagePreview || existingImage || ''}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    {imagePreview && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview(null)
                          update('imageFile', null)
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            )}

            {formData.mainImageMode === 'random' && (
              <p className="text-sm text-gray-500 italic">
                The cover image will be randomly chosen from the gallery images below each time the page loads.
              </p>
            )}
          </div>

          {/* Gallery Images */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium">Gallery Images</h3>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={img.url}
                        alt={img.captionEn || `Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openCaptionEditor(index)}
                        >
                          <Quote className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeGalleryImage(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {(img.captionEn || img.captionPt) && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{img.captionEn || img.captionPt}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {editingImageIndex !== null && (
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-3">Edit Caption for Image {editingImageIndex + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Caption (English)</Label>
                    <Textarea
                      value={editingCaption.en}
                      onChange={(e) => setEditingCaption(prev => ({ ...prev, en: e.target.value }))}
                      placeholder="Write a caption..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Legenda (Portugues)</Label>
                    <Textarea
                      value={editingCaption.pt}
                      onChange={(e) => setEditingCaption(prev => ({ ...prev, pt: e.target.value }))}
                      placeholder="Escreva uma legenda..."
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={saveCaptions}>Save Caption</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingImageIndex(null)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryUpload}
                className="hidden"
                id="gallery-upload"
              />
              <label htmlFor="gallery-upload" className="cursor-pointer">
                {uploadingGallery ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    <p className="text-sm text-gray-500">Uploading images...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Click to upload images or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">
                      You can select multiple images at once
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Videos */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium">Videos</h3>
            </div>

            {formData.videos.length > 0 && (
              <div className="space-y-2 mb-4">
                {formData.videos.map((video, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <Video className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{video.titleEn || video.url}</p>
                      <p className="text-xs text-gray-500 truncate">{video.url}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVideo(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="border rounded-lg p-4 space-y-3">
              <Label>Add Video (YouTube/Vimeo)</Label>
              <Input
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="Video URL (YouTube or Vimeo)"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newVideoTitleEn}
                  onChange={(e) => setNewVideoTitleEn(e.target.value)}
                  placeholder="Title (English)"
                />
                <Input
                  value={newVideoTitlePt}
                  onChange={(e) => setNewVideoTitlePt(e.target.value)}
                  placeholder="Titulo (Portugues)"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVideo}
                disabled={!newVideoUrl}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Video
              </Button>
            </div>
          </div>

          {/* Short Description */}
          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">Short Description</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="descriptionEn">English</Label>
                <Textarea
                  id="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={(e) => update('descriptionEn', e.target.value)}
                  placeholder="Brief description for cards/previews..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="descriptionPt">Portugues</Label>
                <Textarea
                  id="descriptionPt"
                  value={formData.descriptionPt}
                  onChange={(e) => update('descriptionPt', e.target.value)}
                  placeholder="Breve descricao para cartoes/previews..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Block Editor Content */}
          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">Full Content</h3>
            <Tabs defaultValue="en" value={contentLang} onValueChange={(v) => setContentLang(v as 'en' | 'pt')}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TabsList>
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="pt">Portugues</TabsTrigger>
                  </TabsList>
                  <AddContentMenu onAddBlock={addBlockToActiveContent} />
                </div>
              </div>
              <TabsContent value="en" className="mt-2">
                <PageBuilderEditor
                  value={normalizeContent(formData.contentEn) || createEmptyPageBuilderDoc()}
                  onChange={(doc) => update('contentEn', doc)}
                  hideAddMenu
                />
              </TabsContent>
              <TabsContent value="pt" className="mt-2">
                <PageBuilderEditor
                  value={normalizeContent(formData.contentPt) || createEmptyPageBuilderDoc()}
                  onChange={(doc) => update('contentPt', doc)}
                  hideAddMenu
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Curator Quote */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Quote className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium">Curator / Press Quote</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="curatorName">Curator / Reviewer Name</Label>
                <Input
                  id="curatorName"
                  value={formData.curatorName}
                  onChange={(e) => update('curatorName', e.target.value)}
                  placeholder="e.g., John Smith, Art Critic"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="curatorTextEn">Quote (English)</Label>
                  <Textarea
                    id="curatorTextEn"
                    value={formData.curatorTextEn}
                    onChange={(e) => update('curatorTextEn', e.target.value)}
                    placeholder="Quote or review text..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="curatorTextPt">Quote (Portugues)</Label>
                  <Textarea
                    id="curatorTextPt"
                    value={formData.curatorTextPt}
                    onChange={(e) => update('curatorTextPt', e.target.value)}
                    placeholder="Texto da citacao ou resenha..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sticky footer */}
      <div className={`flex justify-end gap-2 border-t pt-3 bg-white ${isFullscreen ? 'shrink-0' : 'sticky bottom-0 z-10 pb-1'}`}>
        <Button variant="outline" onClick={isFullscreen ? toggleFullscreen : onCancel} disabled={saving}>
          {isFullscreen ? 'Back to Form' : 'Cancel'}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={saving || !formData.titleEn || !formData.venue}
        >
          {saving ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </div>
  )

  if (isFullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
        <div className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col min-h-0">
          {formContent}
        </div>
      </div>,
      document.body
    )
  }

  return formContent
}
