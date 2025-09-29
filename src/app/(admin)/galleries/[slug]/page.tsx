'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Building, MapPin, Users, FileText, AlertCircle, Loader, Edit, Trash2, Globe, Mail, Phone, Instagram } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { GalleryService, Gallery } from '@/services/gallery.service'

export default function ViewGalleryPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadGallery()
  }, [slug])

  const loadGallery = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await GalleryService.getBySlug(slug)
      
      if (response.success && response.data) {
        setGallery(response.data)
      } else {
        setError(response.error || 'Gallery not found')
      }
    } catch (error) {
      console.error('Error loading gallery:', error)
      setError('Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGallery = async () => {
    if (!gallery) return

    setIsDeleting(true)
    try {
      const response = await GalleryService.delete(gallery.id)
      
      if (response.success) {
        router.push('/galleries')
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Loader className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2">Loading Gallery...</h2>
            <p className="text-sm text-gray-500">Please wait while we fetch the gallery details.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !gallery) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Gallery Not Found</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/galleries')}>
              Back to Galleries
            </Button>
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
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{gallery.name}</h1>
              {gallery.featured && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  Featured
                </Badge>
              )}
              {getStatusBadge(gallery.relationship_status)}
            </div>
            <p className="text-gray-600 flex items-center gap-2">
              <span>{getCountryFlag(gallery.country_code)}</span>
              <span>{gallery.city}, {gallery.country}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/galleries/${gallery.slug}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Gallery Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Gallery Name</label>
              <p className="text-gray-900">{gallery.name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Relationship Status</label>
              <div className="mt-1">
                {getStatusBadge(gallery.relationship_status)}
              </div>
            </div>

            {gallery.commission_rate && (
              <div>
                <label className="text-sm font-medium text-gray-500">Commission Rate</label>
                <p className="text-gray-900">{gallery.commission_rate}%</p>
              </div>
            )}

            {gallery.relationship_status === 'active' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {gallery.first_partnership_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Partnership Started</label>
                    <p className="text-gray-900">
                      {new Date(gallery.first_partnership_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {gallery.contract_expiry_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contract Expires</label>
                    <p className="text-gray-900">
                      {new Date(gallery.contract_expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Display Settings */}
            <div className="pt-4 border-t">
              <label className="text-sm font-medium text-gray-500 mb-3 block">Display Settings</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active in System</span>
                  <Badge variant={gallery.is_active ? "default" : "secondary"}>
                    {gallery.is_active ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Show on Website</span>
                  <Badge variant={gallery.show_on_website ? "default" : "secondary"}>
                    {gallery.show_on_website ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Featured Gallery</span>
                  <Badge variant={gallery.featured ? "default" : "secondary"}>
                    {gallery.featured ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Address</label>
              <div className="text-gray-900">
                <p>{gallery.address_line1}</p>
                {gallery.address_line2 && <p>{gallery.address_line2}</p>}
                <p>
                  {gallery.city}
                  {gallery.state_province && `, ${gallery.state_province}`}
                  {gallery.postal_code && ` ${gallery.postal_code}`}
                </p>
                <p className="flex items-center gap-2">
                  <span>{getCountryFlag(gallery.country_code)}</span>
                  <span>{gallery.country}</span>
                </p>
              </div>
            </div>

            {(gallery.latitude && gallery.longitude) && (
              <div>
                <label className="text-sm font-medium text-gray-500">Coordinates</label>
                <p className="text-gray-900">{gallery.latitude}, {gallery.longitude}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {gallery.contact_person && (
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Person</label>
                <p className="text-gray-900">{gallery.contact_person}</p>
              </div>
            )}

            {gallery.email && (
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a 
                    href={`mailto:${gallery.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {gallery.email}
                  </a>
                </div>
              </div>
            )}

            {gallery.phone && (
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a 
                    href={`tel:${gallery.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {gallery.phone}
                  </a>
                </div>
              </div>
            )}

            {gallery.website && (
              <div>
                <label className="text-sm font-medium text-gray-500">Website</label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a 
                    href={gallery.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {gallery.website}
                  </a>
                </div>
              </div>
            )}

            {gallery.instagram && (
              <div>
                <label className="text-sm font-medium text-gray-500">Instagram</label>
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-gray-400" />
                  <a 
                    href={`https://instagram.com/${gallery.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {gallery.instagram}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Business Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {gallery.payment_terms && (
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                <p className="text-gray-900 whitespace-pre-wrap">{gallery.payment_terms}</p>
              </div>
            )}

            {gallery.shipping_arrangements && (
              <div>
                <label className="text-sm font-medium text-gray-500">Shipping Arrangements</label>
                <p className="text-gray-900 whitespace-pre-wrap">{gallery.shipping_arrangements}</p>
              </div>
            )}

            {gallery.insurance_provider && (
              <div>
                <label className="text-sm font-medium text-gray-500">Insurance Provider</label>
                <p className="text-gray-900">{gallery.insurance_provider}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Descriptions */}
      {(gallery.description_pt || gallery.description_en) && (
        <Card>
          <CardHeader>
            <CardTitle>Gallery Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gallery.description_pt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Portuguese</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{gallery.description_pt}</p>
                </div>
              )}

              {gallery.description_en && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">English</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{gallery.description_en}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Internal Notes */}
      {gallery.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Internal Notes</CardTitle>
            <CardDescription>Private notes visible only to you</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900 whitespace-pre-wrap">{gallery.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Gallery Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <label className="font-medium">Gallery ID</label>
              <p className="font-mono">{gallery.id}</p>
            </div>
            <div>
              <label className="font-medium">URL Slug</label>
              <p className="font-mono">{gallery.slug}</p>
            </div>
            <div>
              <label className="font-medium">Display Order</label>
              <p>{gallery.display_order}</p>
            </div>
            <div>
              <label className="font-medium">Created</label>
              <p>{new Date(gallery.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="font-medium">Last Updated</label>
              <p>{new Date(gallery.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Gallery</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{gallery.name}&quot;? This action cannot be undone.
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