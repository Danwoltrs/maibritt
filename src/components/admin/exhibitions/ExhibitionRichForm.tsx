'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { X, Plus, Video, Image as ImageIcon, Quote, Calendar, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { ExhibitionImage, ExhibitionVideo } from '@/types'

export interface ExhibitionFormData {
  titleEn: string
  titlePt: string
  venue: string
  location: string
  year: number
  type: 'solo' | 'group' | 'residency'
  descriptionEn: string
  descriptionPt: string
  contentEn: string
  contentPt: string
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
  showPopup: boolean
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
  location: '',
  year: new Date().getFullYear(),
  type: 'solo',
  descriptionEn: '',
  descriptionPt: '',
  contentEn: '',
  contentPt: '',
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
  showPopup: false,
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
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageCaptionEn, setNewImageCaptionEn] = useState('')
  const [newImageCaptionPt, setNewImageCaptionPt] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newVideoTitleEn, setNewVideoTitleEn] = useState('')
  const [newVideoTitlePt, setNewVideoTitlePt] = useState('')

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

  const addGalleryImage = () => {
    if (!newImageUrl) return
    const newImage: ExhibitionImage = {
      url: newImageUrl,
      captionEn: newImageCaptionEn || undefined,
      captionPt: newImageCaptionPt || undefined,
      isCover: formData.images.length === 0
    }
    setFormData(prev => ({ ...prev, images: [...prev.images, newImage] }))
    setNewImageUrl('')
    setNewImageCaptionEn('')
    setNewImageCaptionPt('')
  }

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="dates">Dates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titleEn">Title (English) *</Label>
              <Input
                id="titleEn"
                value={formData.titleEn}
                onChange={(e) => setFormData(prev => ({ ...prev, titleEn: e.target.value }))}
                placeholder="e.g., Fragments of Memory"
              />
            </div>
            <div>
              <Label htmlFor="titlePt">Title (Português)</Label>
              <Input
                id="titlePt"
                value={formData.titlePt}
                onChange={(e) => setFormData(prev => ({ ...prev, titlePt: e.target.value }))}
                placeholder="e.g., Fragmentos da Memória"
              />
            </div>
            <div>
              <Label htmlFor="venue">Venue *</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                placeholder="e.g., Museum of Modern Art"
              />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., New York, USA"
              />
            </div>
            <div>
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                min={1950}
                max={2100}
              />
            </div>
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'solo' | 'group' | 'residency') =>
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo Exhibition</SelectItem>
                  <SelectItem value="group">Group Exhibition</SelectItem>
                  <SelectItem value="residency">Artist Residency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <Label htmlFor="image">Cover Image</Label>
            <div className="mt-2 space-y-4">
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
                        setFormData(prev => ({ ...prev, imageFile: null }))
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
          </div>

          {/* Short Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="descriptionEn">Short Description (English)</Label>
              <Textarea
                id="descriptionEn"
                value={formData.descriptionEn}
                onChange={(e) => setFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
                placeholder="Brief description for cards/previews..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="descriptionPt">Short Description (Português)</Label>
              <Textarea
                id="descriptionPt"
                value={formData.descriptionPt}
                onChange={(e) => setFormData(prev => ({ ...prev, descriptionPt: e.target.value }))}
                placeholder="Breve descrição para cartões/previews..."
                rows={3}
              />
            </div>
          </div>
        </TabsContent>

        {/* Content Tab - Rich text body */}
        <TabsContent value="content" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="contentEn">Full Content (English)</Label>
              <p className="text-sm text-gray-500 mb-2">
                Write detailed content about the exhibition (like a blog post)
              </p>
              <Textarea
                id="contentEn"
                value={formData.contentEn}
                onChange={(e) => setFormData(prev => ({ ...prev, contentEn: e.target.value }))}
                placeholder="Write about the exhibition, the works shown, the concept behind it..."
                rows={8}
              />
            </div>
            <div>
              <Label htmlFor="contentPt">Full Content (Português)</Label>
              <Textarea
                id="contentPt"
                value={formData.contentPt}
                onChange={(e) => setFormData(prev => ({ ...prev, contentPt: e.target.value }))}
                placeholder="Escreva sobre a exposição, as obras exibidas, o conceito por trás..."
                rows={8}
              />
            </div>
          </div>

          {/* Curator Quote Section */}
          <div className="border-t pt-4 mt-4">
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
                  onChange={(e) => setFormData(prev => ({ ...prev, curatorName: e.target.value }))}
                  placeholder="e.g., John Smith, Art Critic"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="curatorTextEn">Quote (English)</Label>
                  <Textarea
                    id="curatorTextEn"
                    value={formData.curatorTextEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, curatorTextEn: e.target.value }))}
                    placeholder="Quote or review text..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="curatorTextPt">Quote (Português)</Label>
                  <Textarea
                    id="curatorTextPt"
                    value={formData.curatorTextPt}
                    onChange={(e) => setFormData(prev => ({ ...prev, curatorTextPt: e.target.value }))}
                    placeholder="Texto da citação ou resenha..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Media Tab - Images & Videos */}
        <TabsContent value="media" className="space-y-6 mt-4">
          {/* Gallery Images */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium">Gallery Images</h3>
            </div>

            {/* Existing Images */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={img.url}
                        alt={img.captionEn || `Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeGalleryImage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {img.captionEn && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{img.captionEn}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add New Image */}
            <div className="border rounded-lg p-4 space-y-3">
              <Label>Add Gallery Image</Label>
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Image URL (from Supabase storage)"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newImageCaptionEn}
                  onChange={(e) => setNewImageCaptionEn(e.target.value)}
                  placeholder="Caption (English)"
                />
                <Input
                  value={newImageCaptionPt}
                  onChange={(e) => setNewImageCaptionPt(e.target.value)}
                  placeholder="Legenda (Português)"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGalleryImage}
                disabled={!newImageUrl}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Image
              </Button>
            </div>
          </div>

          {/* Videos */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium">Videos</h3>
            </div>

            {/* Existing Videos */}
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

            {/* Add New Video */}
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
                  placeholder="Título (Português)"
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
        </TabsContent>

        {/* Dates Tab */}
        <TabsContent value="dates" className="space-y-4 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium">Exhibition Dates</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-3">Opening Event</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="openingDate">Opening Date & Time</Label>
                <Input
                  id="openingDate"
                  type="datetime-local"
                  value={formData.openingDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, openingDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="openingDetails">Opening Details</Label>
                <Input
                  id="openingDetails"
                  value={formData.openingDetails}
                  onChange={(e) => setFormData(prev => ({ ...prev, openingDetails: e.target.value }))}
                  placeholder="e.g., Free entry, RSVP required"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Featured Exhibition</Label>
                <p className="text-sm text-gray-500">Show prominently on homepage</p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Show as Popup</Label>
                <p className="text-sm text-gray-500">Display popup for upcoming exhibition</p>
              </div>
              <Switch
                checked={formData.showPopup}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showPopup: checked }))}
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
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
                  onChange={(e) => setFormData(prev => ({ ...prev, externalUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="catalogUrl">Catalog URL</Label>
                <Input
                  id="catalogUrl"
                  type="url"
                  value={formData.catalogUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, catalogUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={saving || !formData.titleEn || !formData.venue || !formData.location}
        >
          {saving ? 'Saving...' : submitLabel}
        </Button>
      </DialogFooter>
    </div>
  )
}
