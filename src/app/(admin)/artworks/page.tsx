'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Grid3X3, List, Eye, Edit, Trash2, Star, DollarSign, Calendar, Tag, Image as ImageIcon, AlertCircle } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

import { ArtworkService, ArtworkFilters } from '@/services/artwork.service'
import { Artwork } from '@/types'

interface ArtworkPageFilters extends ArtworkFilters {
  sortBy: 'created_at' | 'year' | 'title' | 'display_order'
  sortOrder: 'asc' | 'desc'
  viewMode: 'grid' | 'list'
}

export default function ArtworksPage() {
  const router = useRouter()
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewArtwork, setPreviewArtwork] = useState<Artwork | null>(null)
  const [previewImageIndex, setPreviewImageIndex] = useState(0)
  
  const [filters, setFilters] = useState<ArtworkPageFilters>({
    searchTerm: '',
    category: undefined,
    year: undefined,
    forSale: undefined,
    featured: undefined,
    sortBy: 'display_order',
    sortOrder: 'asc',
    viewMode: 'grid'
  })

  const [stats, setStats] = useState({
    total: 0,
    forSale: 0,
    featured: 0,
    recentUploads: 0
  })

  useEffect(() => {
    loadArtworks()
  }, [filters.category, filters.year, filters.forSale, filters.featured, filters.searchTerm, filters.sortBy, filters.sortOrder])

  const loadArtworks = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ArtworkService.getArtworks({
        category: filters.category,
        year: filters.year,
        forSale: filters.forSale,
        featured: filters.featured,
        searchTerm: filters.searchTerm || undefined
      })

      setArtworks(response.artworks)
      
      // Calculate stats
      const total = response.artworks.length
      const forSale = response.artworks.filter(a => a.forSale).length
      const featured = response.artworks.filter(a => a.featured).length
      const recent = response.artworks.filter(a => {
        const createdAt = new Date(a.createdAt)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return createdAt > thirtyDaysAgo
      }).length

      setStats({
        total,
        forSale,
        featured,
        recentUploads: recent
      })

    } catch (error) {
      console.error('Error loading artworks:', error)
      setError('Failed to load artworks')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteArtwork = async () => {
    if (!selectedArtwork) return

    setIsDeleting(true)
    try {
      await ArtworkService.deleteArtwork(selectedArtwork.id)
      await loadArtworks()
      setIsDeleteDialogOpen(false)
      setSelectedArtwork(null)
    } catch (error) {
      console.error('Error deleting artwork:', error)
      setError('Failed to delete artwork')
    } finally {
      setIsDeleting(false)
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      painting: 'bg-blue-100 text-blue-800',
      sculpture: 'bg-green-100 text-green-800',
      engraving: 'bg-purple-100 text-purple-800',
      video: 'bg-red-100 text-red-800',
      'mixed-media': 'bg-orange-100 text-orange-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (artwork: Artwork) => {
    if (!artwork.forSale) return <Badge variant="secondary">Not for Sale</Badge>
    if (!artwork.isAvailable) return <Badge variant="destructive">Sold</Badge>
    return <Badge className="bg-green-100 text-green-800">Available</Badge>
  }

  const formatPrice = (artwork: Artwork) => {
    if (!artwork.price) return null
    const symbol = artwork.currency === 'BRL' ? 'R$' : artwork.currency === 'USD' ? '$' : '€'
    return `${symbol} ${artwork.price.toLocaleString()}`
  }

  const sortedArtworks = [...artworks].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (filters.sortBy) {
      case 'created_at':
        aValue = new Date(a.createdAt)
        bValue = new Date(b.createdAt)
        break
      case 'year':
        aValue = a.year
        bValue = b.year
        break
      case 'title':
        aValue = a.title.en.toLowerCase()
        bValue = b.title.en.toLowerCase()
        break
      case 'display_order':
      default:
        aValue = a.displayOrder
        bValue = b.displayOrder
        break
    }

    if (filters.sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1
    }
    return aValue > bValue ? 1 : -1
  })

  const categories = [
    { value: 'painting', label: 'Painting' },
    { value: 'sculpture', label: 'Sculpture' },
    { value: 'engraving', label: 'Engraving' },
    { value: 'video', label: 'Video Art' },
    { value: 'mixed-media', label: 'Mixed Media' }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Artworks</h1>
            <p className="text-gray-600">Loading your portfolio...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Artworks</h1>
          <p className="text-gray-600">Manage your art portfolio</p>
        </div>
        <Button 
          onClick={() => router.push('/artworks/new')} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Upload New Artwork
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Artworks</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.forSale}</div>
            <div className="text-sm text-gray-600">For Sale</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.featured}</div>
            <div className="text-sm text-gray-600">Featured</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.recentUploads}</div>
            <div className="text-sm text-gray-600">Recent (30d)</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & View Options
          </CardTitle>
          <CardDescription>Filter and organize your artwork portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Input
                placeholder="Search artworks..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full"
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Select 
                value={filters.category || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  category: value === 'all' ? undefined : value as any 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* For Sale Filter */}
            <div className="space-y-2">
              <Select 
                value={filters.forSale === undefined ? 'all' : filters.forSale.toString()} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  forSale: value === 'all' ? undefined : value === 'true' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sale Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">For Sale</SelectItem>
                  <SelectItem value="false">Not for Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Featured Filter */}
            <div className="space-y-2">
              <Select 
                value={filters.featured === undefined ? 'all' : filters.featured.toString()} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  featured: value === 'all' ? undefined : value === 'true' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Featured" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Featured</SelectItem>
                  <SelectItem value="false">Not Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Select 
                value={filters.sortBy} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  sortBy: value as any 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="display_order">Display Order</SelectItem>
                  <SelectItem value="created_at">Date Added</SelectItem>
                  <SelectItem value="year">Year Created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-2">
              <Button
                variant={filters.viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, viewMode: 'grid' }))}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={filters.viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, viewMode: 'list' }))}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({
                searchTerm: '',
                category: undefined,
                year: undefined,
                forSale: undefined,
                featured: undefined,
                sortBy: 'display_order',
                sortOrder: 'asc',
                viewMode: 'grid'
              })}
            >
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Artworks Grid/List */}
      <div className={
        filters.viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
      }>
        {sortedArtworks.map((artwork) => (
          <Card key={artwork.id} className="group hover:shadow-lg transition-shadow">
            <div className={
              filters.viewMode === 'grid' 
                ? "aspect-square overflow-hidden rounded-t-lg"
                : "aspect-video md:aspect-[2/1] overflow-hidden rounded-t-lg"
            }>
              {artwork.images.length > 0 ? (
                <img
                  src={artwork.images[0]?.thumbnail || artwork.images[0]?.display}
                  alt={artwork.title.en}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Title and Year */}
              <div>
                <h3 className="font-semibold text-gray-900 line-clamp-1">
                  {artwork.title.en}
                </h3>
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3" />
                  {artwork.year}
                </p>
              </div>

              {/* Category and Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getCategoryBadge(artwork.category)}>
                  {artwork.category}
                </Badge>
                {getStatusBadge(artwork)}
                {artwork.featured && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>

              {/* Price */}
              {artwork.forSale && artwork.price && (
                <div className="flex items-center gap-1 text-sm font-medium text-green-700">
                  <DollarSign className="h-3 w-3" />
                  {formatPrice(artwork)}
                </div>
              )}

              {/* Medium */}
              <p className="text-sm text-gray-500 line-clamp-1">
                {artwork.medium.en}
              </p>

              {/* Dimensions */}
              <p className="text-xs text-gray-400">
                {artwork.dimensions}
              </p>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPreviewArtwork(artwork)
                      setPreviewImageIndex(0)
                    }}
                    className="h-8 px-2"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/artworks/${artwork.id}/edit`)}
                    className="h-8 px-2"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedArtwork(artwork)
                      setIsDeleteDialogOpen(true)
                    }}
                    className="h-8 px-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-xs text-gray-400">
                  #{artwork.displayOrder}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedArtworks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No artworks found</h3>
            <p className="text-gray-600 mb-4">
              {filters.searchTerm || filters.category || filters.forSale !== undefined
                ? 'Try adjusting your filters to see more artworks.'
                : 'Start building your portfolio by uploading your first artwork.'}
            </p>
            <Button onClick={() => router.push('/artworks/new')}>
              Upload Your First Artwork
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Artwork</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedArtwork?.title.en}&quot;? This action cannot be undone and will also delete all associated images.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteArtwork}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Artwork'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Artwork Preview Dialog */}
      <Dialog open={!!previewArtwork} onOpenChange={() => setPreviewArtwork(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {previewArtwork && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {previewArtwork.title.en}
                </DialogTitle>
                <DialogDescription>
                  {previewArtwork.title.ptBR}
                </DialogDescription>
              </DialogHeader>

              {/* Main Image */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                {previewArtwork.images.length > 0 ? (
                  <img
                    src={previewArtwork.images[previewImageIndex]?.display || previewArtwork.images[previewImageIndex]?.original}
                    alt={previewArtwork.title.en}
                    className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Image Thumbnails */}
              {previewArtwork.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto py-2">
                  {previewArtwork.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setPreviewImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                        previewImageIndex === index
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={img.thumbnail || img.display}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Artwork Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Year:</span>
                  <span className="ml-2">{previewArtwork.year}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Category:</span>
                  <span className="ml-2 capitalize">{previewArtwork.category}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-500">Medium:</span>
                  <span className="ml-2">{previewArtwork.medium.en}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-500">Dimensions:</span>
                  <span className="ml-2">{previewArtwork.dimensions}</span>
                </div>
                {previewArtwork.description?.en && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-500 block mb-1">Description:</span>
                    <p className="text-gray-700">{previewArtwork.description.en}</p>
                  </div>
                )}
                <div className="col-span-2 flex gap-2">
                  {previewArtwork.forSale && (
                    <Badge className="bg-green-100 text-green-800">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Available at Gallery
                    </Badge>
                  )}
                  {previewArtwork.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setPreviewArtwork(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    router.push(`/artworks/${previewArtwork.id}/edit`)
                    setPreviewArtwork(null)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Artwork
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}