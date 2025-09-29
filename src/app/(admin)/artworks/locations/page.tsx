'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Building, Home, Package, Plane, Eye, Edit, Trash2 } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { ArtworkService } from '@/services/artwork.service'
import { Artwork } from '@/types'

interface LocationFilter {
  location: 'all' | 'studio' | 'gallery' | 'collector' | 'storage' | 'transit'
  forSale: 'all' | 'true' | 'false'
  search: string
}

interface LocationBadgeProps {
  location: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const LocationBadge = ({ location, variant = 'default' }: LocationBadgeProps) => {
  const getLocationIcon = (loc: string) => {
    switch (loc) {
      case 'gallery': return <Building className="h-3 w-3" />
      case 'studio': return <Home className="h-3 w-3" />
      case 'collector': return <Home className="h-3 w-3" />
      case 'storage': return <Package className="h-3 w-3" />
      case 'transit': return <Plane className="h-3 w-3" />
      default: return <MapPin className="h-3 w-3" />
    }
  }

  const getLocationColor = (loc: string) => {
    switch (loc) {
      case 'gallery': return 'bg-blue-100 text-blue-800'
      case 'studio': return 'bg-green-100 text-green-800'
      case 'collector': return 'bg-purple-100 text-purple-800'
      case 'storage': return 'bg-gray-100 text-gray-800'
      case 'transit': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLocationLabel = (loc: string) => {
    switch (loc) {
      case 'gallery': return 'Gallery'
      case 'studio': return 'Studio'
      case 'collector': return 'With Collector'
      case 'storage': return 'Storage'
      case 'transit': return 'In Transit'
      default: return 'Unknown'
    }
  }

  return (
    <Badge className={`flex items-center gap-1 ${getLocationColor(location)}`} variant={variant}>
      {getLocationIcon(location)}
      {getLocationLabel(location)}
    </Badge>
  )
}

export default function ArtworkLocationsPage() {
  const router = useRouter()
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const [filters, setFilters] = useState<LocationFilter>({
    location: 'all',
    forSale: 'all',
    search: ''
  })


  useEffect(() => {
    loadArtworks()
  }, [filters])

  const loadArtworks = async () => {
    try {
      setLoading(true)
      setError(null)

      const filterOptions: any = {}
      
      if (filters.forSale !== 'all') {
        filterOptions.forSale = filters.forSale === 'true'
      }
      
      if (filters.search) {
        filterOptions.searchTerm = filters.search
      }

      const response = await ArtworkService.getArtworks(filterOptions)
      
      // Filter by location (mock - in real app this would be in the database)
      let filteredArtworks = response.artworks
      if (filters.location !== 'all') {
        // For demo, randomly assign locations
        filteredArtworks = response.artworks.filter((_, index) => {
          const locations = ['studio', 'gallery', 'collector', 'storage', 'transit']
          const artworkLocation = locations[index % locations.length]
          return artworkLocation === filters.location
        })
      }

      setArtworks(filteredArtworks)
    } catch (error) {
      console.error('Error loading artworks:', error)
      setError('Failed to load artworks')
    } finally {
      setLoading(false)
    }
  }

  const handleLocationUpdate = async (artworkId: string, newLocation: string) => {
    try {
      setIsUpdating(true)
      // In real app, this would update the location in the database
      // For now, we'll just simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Refresh the artworks list
      await loadArtworks()
      setIsUpdateDialogOpen(false)
      setSelectedArtwork(null)
    } catch (error) {
      console.error('Error updating location:', error)
      setError('Failed to update artwork location')
    } finally {
      setIsUpdating(false)
    }
  }

  const getLocationCount = (location: string) => {
    return artworks.filter(artwork => {
      const artworkLocation = artwork.location?.toLowerCase() || 'studio'
      return artworkLocation === location
    }).length
  }

  const stats = {
    total: artworks.length,
    studio: getLocationCount('studio'),
    gallery: getLocationCount('gallery'),
    collector: getLocationCount('collector'),
    storage: getLocationCount('storage'),
    transit: getLocationCount('transit')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Artwork Locations</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Artwork Locations</h1>
          <p className="text-gray-600">Track and manage where your artworks are located</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Location Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Artworks</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.studio}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Home className="h-3 w-3" />
              Studio
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.gallery}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Building className="h-3 w-3" />
              Galleries
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.collector}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Home className="h-3 w-3" />
              Collectors
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.storage}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Package className="h-3 w-3" />
              Storage
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.transit}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Plane className="h-3 w-3" />
              In Transit
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter artworks by location, sale status, or search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Select 
                value={filters.location} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, location: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="gallery">Galleries</SelectItem>
                  <SelectItem value="collector">With Collectors</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="transit">In Transit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sale Status</Label>
              <Select 
                value={filters.forSale} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, forSale: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="true">For Sale</SelectItem>
                  <SelectItem value="false">Not for Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search artworks..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ location: 'all', forSale: 'all', search: '' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Artworks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {artworks.map((artwork, index) => {
          const currentLocation = artwork.location?.toLowerCase() || 'studio'
          const locationDetails = artwork.location || 'Studio'

          return (
            <Card key={artwork.id} className="group hover:shadow-lg transition-shadow">
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={artwork.images[0]?.thumbnail || '/placeholder-image.jpg'}
                  alt={artwork.title.en}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-medium text-gray-900 line-clamp-1">
                    {artwork.title.en}
                  </h3>
                  <p className="text-sm text-gray-500">{artwork.year}</p>
                </div>

                <div className="space-y-2">
                  <LocationBadge location={currentLocation} />
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {locationDetails}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  {artwork.forSale && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      For Sale
                    </Badge>
                  )}
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedArtwork(artwork)
                        setIsUpdateDialogOpen(true)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/admin/artworks/${artwork.id}`)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {artworks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No artworks found</h3>
            <p className="text-gray-600 mb-4">
              {filters.location !== 'all' || filters.forSale !== 'all' || filters.search
                ? 'Try adjusting your filters to see more artworks.'
                : 'Upload your first artwork to start tracking locations.'}
            </p>
            <Button onClick={() => router.push('/admin/artworks/new')}>
              Upload New Artwork
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Update Location Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Artwork Location</DialogTitle>
            <DialogDescription>
              Change the current location of &quot;{selectedArtwork?.title.en}&quot;
            </DialogDescription>
          </DialogHeader>
          
          {selectedArtwork && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedArtwork.images[0]?.thumbnail || '/placeholder-image.jpg'}
                  alt={selectedArtwork.title.en}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <h4 className="font-medium">{selectedArtwork.title.en}</h4>
                  <p className="text-sm text-gray-600">{selectedArtwork.year}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>New Location</Label>
                <Select onValueChange={(value) => console.log('Selected location:', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Studio
                      </div>
                    </SelectItem>
                    <SelectItem value="gallery">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Gallery
                      </div>
                    </SelectItem>
                    <SelectItem value="collector">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        With Collector
                      </div>
                    </SelectItem>
                    <SelectItem value="storage">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Storage
                      </div>
                    </SelectItem>
                    <SelectItem value="transit">
                      <div className="flex items-center gap-2">
                        <Plane className="h-4 w-4" />
                        In Transit
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsUpdateDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleLocationUpdate(selectedArtwork.id, 'gallery')}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Location'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}