'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Search, Quote as QuoteIcon, Edit, Trash2, Star, StarOff, Eye, EyeOff, Newspaper, User, Users, GripVertical, ExternalLink, ImageIcon, Upload, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { QuotesService, Quote, QuoteType, QuoteCreateData, QuoteUpdateData, StorageService } from '@/services'

// Quote type configuration
const quoteTypeConfig: Record<QuoteType, { label: string; labelPt: string; icon: React.ReactNode; color: string }> = {
  artist: { label: 'Artist', labelPt: 'Artista', icon: <User className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  press: { label: 'Press', labelPt: 'Imprensa', icon: <Newspaper className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  testimonial: { label: 'Testimonial', labelPt: 'Depoimento', icon: <Users className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  curator: { label: 'Curator', labelPt: 'Curador', icon: <QuoteIcon className="h-4 w-4" />, color: 'bg-amber-100 text-amber-800' }
}

// Empty form state
const emptyFormData = {
  quotePt: '',
  quoteEn: '',
  author: '',
  authorTitle: '',
  source: '',
  sourceUrl: '',
  sourceDate: '',
  quoteType: 'artist' as QuoteType,
  imageUrl: '',
  imageCaption: '',
  isActive: true,
  featured: false
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterActive, setFilterActive] = useState<string>('all')

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form state
  const [formData, setFormData] = useState(emptyFormData)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Load quotes
  useEffect(() => {
    loadQuotes()
  }, [])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedQuotes = await QuotesService.getAllQuotes()
      setQuotes(fetchedQuotes)
    } catch (err) {
      console.error('Error loading quotes:', err)
      setError('Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }

  // Filter quotes
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch =
      quote.quoteEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quotePt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.author?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (quote.source?.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === 'all' || quote.quoteType === filterType
    const matchesActive = filterActive === 'all' ||
      (filterActive === 'active' && quote.isActive) ||
      (filterActive === 'inactive' && !quote.isActive)

    return matchesSearch && matchesType && matchesActive
  })

  // Stats
  const stats = {
    total: quotes.length,
    active: quotes.filter(q => q.isActive).length,
    featured: quotes.filter(q => q.featured).length,
    press: quotes.filter(q => q.quoteType === 'press').length
  }

  // Open form for new quote
  const handleAddNew = () => {
    setSelectedQuote(null)
    setFormData(emptyFormData)
    setIsFormOpen(true)
  }

  // Open form for editing
  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote)
    setFormData({
      quotePt: quote.quotePt,
      quoteEn: quote.quoteEn,
      author: quote.author || '',
      authorTitle: quote.authorTitle || '',
      source: quote.source || '',
      sourceUrl: quote.sourceUrl || '',
      sourceDate: quote.sourceDate ? new Date(quote.sourceDate).toISOString().split('T')[0] : '',
      quoteType: quote.quoteType,
      imageUrl: quote.imageUrl || '',
      imageCaption: quote.imageCaption || '',
      isActive: quote.isActive,
      featured: quote.featured
    })
    setIsFormOpen(true)
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.quotePt || !formData.quoteEn) {
      setError('Both Portuguese and English quotes are required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const data: QuoteCreateData | QuoteUpdateData = {
        quotePt: formData.quotePt,
        quoteEn: formData.quoteEn,
        author: formData.author || undefined,
        authorTitle: formData.authorTitle || undefined,
        source: formData.source || undefined,
        sourceUrl: formData.sourceUrl || undefined,
        sourceDate: formData.sourceDate ? new Date(formData.sourceDate) : undefined,
        quoteType: formData.quoteType,
        imageUrl: formData.imageUrl || undefined,
        imageCaption: formData.imageCaption || undefined,
        isActive: formData.isActive,
        featured: formData.featured
      }

      if (selectedQuote) {
        await QuotesService.updateQuote(selectedQuote.id, data)
      } else {
        await QuotesService.createQuote(data as QuoteCreateData)
      }

      await loadQuotes()
      setIsFormOpen(false)
      setSelectedQuote(null)
      setFormData(emptyFormData)
    } catch (err) {
      console.error('Error saving quote:', err)
      setError('Failed to save quote')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedQuote) return

    setIsDeleting(true)
    try {
      await QuotesService.deleteQuote(selectedQuote.id)
      await loadQuotes()
      setIsDeleteDialogOpen(false)
      setSelectedQuote(null)
    } catch (err) {
      console.error('Error deleting quote:', err)
      setError('Failed to delete quote')
    } finally {
      setIsDeleting(false)
    }
  }

  // Toggle active status
  const handleToggleActive = async (quote: Quote) => {
    try {
      await QuotesService.toggleQuoteActive(quote.id, !quote.isActive)
      await loadQuotes()
    } catch (err) {
      console.error('Error toggling quote status:', err)
      setError('Failed to update quote status')
    }
  }

  // Toggle featured status
  const handleToggleFeatured = async (quote: Quote) => {
    try {
      await QuotesService.updateQuote(quote.id, { featured: !quote.featured })
      await loadQuotes()
    } catch (err) {
      console.error('Error toggling featured status:', err)
      setError('Failed to update featured status')
    }
  }

  // Image upload handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploadingImage(true)

    try {
      const result = await StorageService.uploadImage(file, 'quotes')
      if (result.success && result.urls) {
        setFormData(prev => ({ ...prev, imageUrl: result.urls!.display }))
      } else {
        setError('Failed to upload image')
      }
    } catch (err) {
      console.error('Error uploading image:', err)
      setError('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotes & Press</h1>
            <p className="text-gray-600">Loading quotes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes & Press</h1>
          <p className="text-gray-600">Manage artist quotes, press reviews, and testimonials</p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Quote
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Quotes</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.featured}</div>
            <div className="text-sm text-gray-600">Featured</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.press}</div>
            <div className="text-sm text-gray-600">Press Reviews</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Input
                placeholder="Search quotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="artist">Artist</SelectItem>
                  <SelectItem value="press">Press</SelectItem>
                  <SelectItem value="testimonial">Testimonial</SelectItem>
                  <SelectItem value="curator">Curator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setFilterType('all')
                  setFilterActive('all')
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes List */}
      <div className="space-y-4">
        {filteredQuotes.map((quote) => {
          const typeConfig = quoteTypeConfig[quote.quoteType]

          return (
            <Card key={quote.id} className={`${!quote.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Image preview if available */}
                  {quote.imageUrl && (
                    <div className="flex-shrink-0">
                      <div className="relative w-32 h-24 rounded-lg overflow-hidden">
                        <Image
                          src={quote.imageUrl}
                          alt={quote.imageCaption || 'Quote image'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Quote content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={typeConfig.color}>
                          {typeConfig.icon}
                          <span className="ml-1">{typeConfig.label}</span>
                        </Badge>
                        {quote.featured && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {!quote.isActive && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleFeatured(quote)}
                          title={quote.featured ? 'Remove from featured' : 'Add to featured'}
                        >
                          {quote.featured ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(quote)}
                          title={quote.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {quote.isActive ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(quote)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedQuote(quote)
                            setIsDeleteDialogOpen(true)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Quote text */}
                    <blockquote className="text-gray-700 italic mb-2 line-clamp-2">
                      &ldquo;{quote.quoteEn}&rdquo;
                    </blockquote>
                    <blockquote className="text-gray-500 italic text-sm mb-3 line-clamp-2">
                      &ldquo;{quote.quotePt}&rdquo;
                    </blockquote>

                    {/* Attribution */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {quote.author && (
                        <span className="font-medium">
                          — {quote.author}
                          {quote.authorTitle && <span className="font-normal text-gray-500">, {quote.authorTitle}</span>}
                        </span>
                      )}
                      {quote.source && (
                        <span className="flex items-center gap-1">
                          {quote.source}
                          {quote.sourceDate && (
                            <span className="text-gray-400">
                              ({new Date(quote.sourceDate).getFullYear()})
                            </span>
                          )}
                          {quote.sourceUrl && (
                            <a
                              href={quote.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredQuotes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <QuoteIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType !== 'all' || filterActive !== 'all'
                ? 'Try adjusting your filters to see more quotes.'
                : 'Add your first quote to get started.'}
            </p>
            <Button onClick={handleAddNew}>
              Add First Quote
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedQuote ? 'Edit Quote' : 'Add New Quote'}</DialogTitle>
            <DialogDescription>
              {selectedQuote
                ? 'Update the quote details below.'
                : 'Add a new quote from the artist, press, testimonial, or curator.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="attribution">Attribution</TabsTrigger>
              <TabsTrigger value="media">Media & Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Quote Type</Label>
                <Select
                  value={formData.quoteType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, quoteType: value as QuoteType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="artist">Artist - Mai-Britt Wolthers</SelectItem>
                    <SelectItem value="press">Press - Magazine/Newspaper</SelectItem>
                    <SelectItem value="testimonial">Testimonial - Collector/Client</SelectItem>
                    <SelectItem value="curator">Curator - Art Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quoteEn">Quote (English) *</Label>
                <Textarea
                  id="quoteEn"
                  value={formData.quoteEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, quoteEn: e.target.value }))}
                  placeholder="Enter the quote in English..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quotePt">Quote (Portuguese) *</Label>
                <Textarea
                  id="quotePt"
                  value={formData.quotePt}
                  onChange={(e) => setFormData(prev => ({ ...prev, quotePt: e.target.value }))}
                  placeholder="Enter the quote in Portuguese..."
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="attribution" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author Name</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="e.g., John Smith"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authorTitle">Author Title/Role</Label>
                  <Input
                    id="authorTitle"
                    value={formData.authorTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, authorTitle: e.target.value }))}
                    placeholder="e.g., Art Critic, Curator at MASP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Source/Publication</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    placeholder="e.g., Folha de São Paulo, ArtNews"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceDate">Publication Date</Label>
                  <Input
                    id="sourceDate"
                    type="date"
                    value={formData.sourceDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, sourceDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceUrl">Source URL</Label>
                <Input
                  id="sourceUrl"
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              {/* Image upload */}
              <div className="space-y-2">
                <Label>Magazine Clipping / Press Image</Label>

                {formData.imageUrl ? (
                  <div className="relative">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <Image
                        src={formData.imageUrl}
                        alt="Quote image"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    {uploadingImage ? (
                      <div className="flex flex-col items-center">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2" />
                        <p className="text-gray-600">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-1">
                          {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
                        </p>
                        <p className="text-xs text-gray-500">
                          JPG, PNG, or WebP up to 10MB
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {formData.imageUrl && (
                <div className="space-y-2">
                  <Label htmlFor="imageCaption">Image Caption</Label>
                  <Input
                    id="imageCaption"
                    value={formData.imageCaption}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageCaption: e.target.value }))}
                    placeholder="e.g., Article from Folha de São Paulo, March 2024"
                  />
                </div>
              )}

              {/* Settings */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-4">Display Settings</h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Active</Label>
                      <p className="text-sm text-gray-500">Show this quote on the website</p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Featured</Label>
                      <p className="text-sm text-gray-500">Display prominently on the homepage</p>
                    </div>
                    <Switch
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsFormOpen(false)
                setSelectedQuote(null)
                setFormData(emptyFormData)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : selectedQuote ? 'Update Quote' : 'Add Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quote? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedQuote && (
            <div className="py-4">
              <blockquote className="text-gray-700 italic border-l-4 border-gray-300 pl-4">
                &ldquo;{selectedQuote.quoteEn.substring(0, 100)}...&rdquo;
              </blockquote>
              {selectedQuote.author && (
                <p className="text-sm text-gray-500 mt-2">— {selectedQuote.author}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
