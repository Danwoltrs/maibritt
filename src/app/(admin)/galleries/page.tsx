'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, MapPin, Phone, Mail, Globe, Edit, Trash2, Eye, Building } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { GalleryService, Gallery } from '@/services/gallery.service'

interface GalleryFilters {
  search: string
  country: string
  status: 'all' | 'active' | 'inactive' | 'prospective'
  featured: 'all' | 'true' | 'false'
}

export default function GalleriesPage() {
  const router = useRouter()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countries, setCountries] = useState<string[]>([])
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [filters, setFilters] = useState<GalleryFilters>({
    search: '',
    country: 'all',
    status: 'all',
    featured: 'all'
  })

  useEffect(() => {
    loadGalleries()
    loadCountries()
  }, [])

  useEffect(() => {
    loadGalleries()
  }, [filters])

  const loadGalleries = async () => {
    try {
      setLoading(true)
      setError(null)

      const options: any = {
        includeInactive: true,
        search: filters.search || undefined,
        country: filters.country !== 'all' ? filters.country : undefined,
        featured: filters.featured !== 'all' ? filters.featured === 'true' : undefined
      }

      const response = await GalleryService.getAll(options)
      
      if (response.success && response.data) {
        let filteredGalleries = response.data

        // Filter by status
        if (filters.status !== 'all') {
          filteredGalleries = response.data.filter(gallery => 
            gallery.relationship_status === filters.status
          )
        }

        setGalleries(filteredGalleries)
      } else {
        setError(response.error || 'Failed to load galleries')
      }
    } catch (error) {
      console.error('Error loading galleries:', error)
      setError('Failed to load galleries')
    } finally {
      setLoading(false)
    }
  }

  const loadCountries = async () => {
    try {
      const response = await GalleryService.getCountries()
      if (response.success && response.data) {
        setCountries(response.data)
      }
    } catch (error) {
      console.error('Error loading countries:', error)
    }
  }

  const handleDeleteGallery = async () => {
    if (!selectedGallery) return

    setIsDeleting(true)
    try {
      const response = await GalleryService.delete(selectedGallery.id)
      
      if (response.success) {
        await loadGalleries()
        setIsDeleteDialogOpen(false)
        setSelectedGallery(null)
      } else {
        setError(response.error || 'Failed to delete gallery')
      }
    } catch (error) {
      console.error('Error deleting gallery:', error)
      setError('Failed to delete gallery')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case 'prospective':
        return <Badge className="bg-blue-100 text-blue-800">Prospective</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCountryFlag = (countryCode?: string) => {
    if (!countryCode) return '🏳️'
    
    // Convert country code to flag emoji
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    
    return String.fromCodePoint(...codePoints)
  }

  const stats = {
    total: galleries.length,
    active: galleries.filter(g => g.relationship_status === 'active').length,
    prospective: galleries.filter(g => g.relationship_status === 'prospective').length,
    featured: galleries.filter(g => g.featured).length
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
            <p className="text-gray-600">Loading galleries...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
          <p className="text-gray-600">Manage your partner galleries and relationships</p>
        </div>
        <Button onClick={() => router.push('/galleries/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Gallery
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
            <div className="text-sm text-gray-600">Total Galleries</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active Partners</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.prospective}</div>
            <div className="text-sm text-gray-600">Prospective</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.featured}</div>
            <div className="text-sm text-gray-600">Featured</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter galleries by location, status, or search terms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Input
                placeholder="Search galleries..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Select 
                value={filters.country} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="prospective">Prospective</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Select 
                value={filters.featured} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, featured: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Featured status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Featured</SelectItem>
                  <SelectItem value="false">Not Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ search: '', country: 'all', status: 'all', featured: 'all' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Galleries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleries.map((gallery) => (
          <Card key={gallery.id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-4">
              {/* Gallery Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {gallery.name}
                    </h3>
                    {gallery.featured && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(gallery.relationship_status)}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{getCountryFlag(gallery.country_code)}</span>
                  <span>{gallery.city}, {gallery.country}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {gallery.address_line1}
                  {gallery.address_line2 && `, ${gallery.address_line2}`}
                </p>
              </div>

              {/* Contact Info */}
              <div className="space-y-1">
                {gallery.contact_person && (
                  <p className="text-sm text-gray-600">
                    Contact: {gallery.contact_person}
                  </p>
                )}
                
                <div className="flex items-center gap-4">
                  {gallery.email && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{gallery.email}</span>
                    </div>
                  )}
                  
                  {gallery.phone && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone className="h-3 w-3" />
                      <span>{gallery.phone}</span>
                    </div>
                  )}
                </div>

                {gallery.website && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Globe className="h-3 w-3" />
                    <a 
                      href={gallery.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {gallery.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Commission Rate */}
              {gallery.commission_rate && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    Commission: <span className="font-medium">{gallery.commission_rate}%</span>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/galleries/${gallery.slug}`)}
                    className="h-8 px-2"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/galleries/${gallery.slug}/edit`)}
                    className="h-8 px-2"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedGallery(gallery)
                      setIsDeleteDialogOpen(true)
                    }}
                    className="h-8 px-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-xs text-gray-400">
                  {gallery.slug}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {galleries.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries found</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.country !== 'all' || filters.status !== 'all'
                ? 'Try adjusting your filters to see more galleries.'
                : 'Add your first gallery partner to start managing relationships.'}
            </p>
            <Button onClick={() => router.push('/galleries/new')}>
              Add First Gallery
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Gallery</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedGallery?.name}&quot;? This action cannot be undone.
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
              onClick={handleDeleteGallery}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Gallery'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}