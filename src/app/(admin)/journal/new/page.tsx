'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, PenTool, Smile, MapPin, Palette, Eye, Save, CheckCircle, AlertCircle, Globe } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ArtworkService } from '@/services/artwork.service'
import { Artwork } from '@/types'

// Form validation schema
const journalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  mood: z.string().optional(),
  weather: z.string().optional(),
  location: z.string().optional(),
  inspiration_source: z.string().optional(),
  artwork_references: z.array(z.string()).optional(),
  is_public: z.boolean(),
  tags: z.string().optional()
})

type JournalFormData = z.infer<typeof journalSchema>

export default function NewJournalPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [selectedArtworks, setSelectedArtworks] = useState<string[]>([])
  const [wordCount, setWordCount] = useState(0)
  const [activeTab, setActiveTab] = useState('write')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<JournalFormData>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      is_public: false,
      artwork_references: []
    }
  })

  const watchContent = watch('content')
  const watchIsPublic = watch('is_public')
  const watchTitle = watch('title')

  useEffect(() => {
    loadArtworks()
  }, [])

  useEffect(() => {
    setWordCount(watchContent ? watchContent.split(/\s+/).filter(word => word.length > 0).length : 0)
  }, [watchContent])

  useEffect(() => {
    setValue('artwork_references', selectedArtworks)
  }, [selectedArtworks, setValue])

  const loadArtworks = async () => {
    try {
      const response = await ArtworkService.getArtworks({}, { page: 1, limit: 50 })
      setArtworks(response.artworks)
    } catch (error) {
      console.error('Error loading artworks:', error)
    }
  }

  const handleArtworkToggle = (artworkId: string) => {
    setSelectedArtworks(prev => 
      prev.includes(artworkId) 
        ? prev.filter(id => id !== artworkId)
        : [...prev, artworkId]
    )
  }

  const generateExcerpt = (content: string) => {
    const sentences = content.split(/[.!?]+/)
    const firstTwoSentences = sentences.slice(0, 2).join('. ')
    return firstTwoSentences.length > 150 
      ? firstTwoSentences.substring(0, 150) + '...'
      : firstTwoSentences
  }

  const onSubmit = async (data: JournalFormData, saveAsDraft = false) => {
    setIsSubmitting(true)
    setIsDraft(saveAsDraft)
    setError(null)

    try {
      // Auto-generate excerpt if not provided
      if (!data.excerpt && data.content) {
        data.excerpt = generateExcerpt(data.content)
      }

      // Convert tags string to array
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []

      const journalData = {
        ...data,
        tags,
        is_draft: saveAsDraft,
        published_at: !saveAsDraft && data.is_public ? new Date().toISOString() : null
      }

      console.log('Saving journal entry:', journalData)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/journal')
      }, 2000)

    } catch (error) {
      console.error('Failed to save journal entry:', error)
      setError(error instanceof Error ? error.message : 'Failed to save journal entry')
    } finally {
      setIsSubmitting(false)
      setIsDraft(false)
    }
  }

  const handleSaveAsDraft = () => {
    handleSubmit(data => onSubmit(data, true))()
  }

  const moods = [
    { value: 'inspired', label: '✨ Inspired', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'contemplative', label: '🤔 Contemplative', color: 'bg-blue-100 text-blue-800' },
    { value: 'energetic', label: '⚡ Energetic', color: 'bg-orange-100 text-orange-800' },
    { value: 'peaceful', label: '🕊️ Peaceful', color: 'bg-green-100 text-green-800' },
    { value: 'melancholic', label: '🌧️ Melancholic', color: 'bg-gray-100 text-gray-800' },
    { value: 'frustrated', label: '😤 Frustrated', color: 'bg-red-100 text-red-800' },
    { value: 'excited', label: '🎉 Excited', color: 'bg-purple-100 text-purple-800' },
    { value: 'focused', label: '🎯 Focused', color: 'bg-indigo-100 text-indigo-800' }
  ]

  const weatherOptions = [
    '☀️ Sunny',
    '⛅ Partly Cloudy',
    '☁️ Cloudy',
    '🌧️ Rainy',
    '⛈️ Stormy',
    '🌫️ Foggy',
    '🌬️ Windy',
    '❄️ Snowy'
  ]

  const locations = [
    'Studio',
    'Gallery',
    'Home',
    'Beach',
    'Park',
    'Coffee Shop',
    'Travel',
    'Exhibition',
    'Art Fair',
    'Residency'
  ]

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              {isDraft ? 'Draft Saved!' : 'Journal Entry Created!'}
            </h2>
            <p className="text-gray-600 mb-4">
              {isDraft 
                ? 'Your draft has been saved and can be published later.'
                : watchIsPublic
                  ? 'Your journal entry has been saved and is ready for publication.'
                  : 'Your private journal entry has been saved.'
              }
            </p>
            <p className="text-sm text-gray-500">Redirecting to journal...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">New Journal Entry</h1>
          <p className="text-gray-600">Document your creative process and thoughts</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(data => onSubmit(data, false))} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Journal Entry
              </CardTitle>
              <CardDescription>
                Write about your creative process, inspirations, and artistic journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Today's inspiration..."
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="write" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="content">Content *</Label>
                      <span className="text-sm text-gray-500">{wordCount} words</span>
                    </div>
                    <Textarea
                      id="content"
                      {...register('content')}
                      placeholder="Write your thoughts, experiences, creative process..."
                      rows={12}
                      className="resize-none"
                    />
                    {errors.content && (
                      <p className="text-sm text-red-600">{errors.content.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt (Auto-generated if empty)</Label>
                    <Textarea
                      id="excerpt"
                      {...register('excerpt')}
                      placeholder="Brief excerpt for previews..."
                      rows={2}
                    />
                    <p className="text-xs text-gray-500">
                      Leave empty to auto-generate from the first two sentences
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <div className="border rounded-lg p-6 bg-gray-50 min-h-[400px]">
                    <h3 className="text-xl font-semibold mb-4">
                      {watchTitle || 'Untitled Entry'}
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      {watchContent ? (
                        <div className="whitespace-pre-wrap">{watchContent}</div>
                      ) : (
                        <p className="text-gray-500 italic">Start writing to see preview...</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Metadata & Settings */}
          <div className="space-y-6">
            {/* Context */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smile className="h-5 w-5" />
                  Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Mood</Label>
                  <Select onValueChange={(value) => setValue('mood', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="How are you feeling?" />
                    </SelectTrigger>
                    <SelectContent>
                      {moods.map((mood) => (
                        <SelectItem key={mood.value} value={mood.value}>
                          {mood.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Weather</Label>
                  <Select onValueChange={(value) => setValue('weather', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="What's the weather like?" />
                    </SelectTrigger>
                    <SelectContent>
                      {weatherOptions.map((weather) => (
                        <SelectItem key={weather} value={weather}>
                          {weather}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select onValueChange={(value) => setValue('location', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Where are you writing?" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {location}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inspiration_source">Inspiration Source</Label>
                  <Input
                    id="inspiration_source"
                    {...register('inspiration_source')}
                    placeholder="What inspired this entry?"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Referenced Artworks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Referenced Artworks
                </CardTitle>
                <CardDescription>
                  Link artworks mentioned in this entry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {artworks.slice(0, 10).map((artwork) => (
                    <div key={artwork.id} className="flex items-center gap-3 p-2 rounded border">
                      <input
                        type="checkbox"
                        checked={selectedArtworks.includes(artwork.id)}
                        onChange={() => handleArtworkToggle(artwork.id)}
                        className="rounded"
                      />
                      <img
                        src={artwork.images[0]?.thumbnail || '/placeholder-image.jpg'}
                        alt={artwork.title.en}
                        className="w-8 h-8 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{artwork.title.en}</p>
                        <p className="text-xs text-gray-500">{artwork.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedArtworks.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      {selectedArtworks.length} artwork{selectedArtworks.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Publishing Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Publishing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_public">Public Entry</Label>
                    <p className="text-sm text-gray-500">
                      Share this entry on your public blog
                    </p>
                  </div>
                  <Switch
                    id="is_public"
                    checked={watchIsPublic}
                    onCheckedChange={(checked) => setValue('is_public', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    {...register('tags')}
                    placeholder="art, inspiration, process"
                  />
                  <p className="text-xs text-gray-500">
                    Separate tags with commas
                  </p>
                </div>

                {watchIsPublic && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      This entry will be visible on your public blog when published.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveAsDraft}
              disabled={isSubmitting}
            >
              {isDraft ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                  Saving Draft...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save as Draft
                </div>
              )}
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting && !isDraft ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Publishing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  {watchIsPublic ? 'Publish Entry' : 'Save Entry'}
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}