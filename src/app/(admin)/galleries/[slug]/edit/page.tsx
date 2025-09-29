'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Building, MapPin, Users, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { GalleryService, Gallery, UpdateGalleryData } from '@/services/gallery.service'

// Form validation schema
const gallerySchema = z.object({
  name: z.string().min(1, 'Gallery name is required'),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  country_code: z.string().optional(),
  contact_person: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  instagram: z.string().optional(),
  commission_rate: z.number().min(0).max(100).optional(),
  payment_terms: z.string().optional(),
  shipping_arrangements: z.string().optional(),
  insurance_provider: z.string().optional(),
  description_pt: z.string().optional(),
  description_en: z.string().optional(),
  relationship_status: z.enum(['active', 'inactive', 'prospective']),
  first_partnership_date: z.string().optional(),
  contract_expiry_date: z.string().optional(),
  is_active: z.boolean(),
  show_on_website: z.boolean(),
  featured: z.boolean(),
  notes: z.string().optional()
})

type GalleryFormData = z.infer<typeof gallerySchema>

export default function EditGalleryPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      relationship_status: 'prospective',
      is_active: true,
      show_on_website: true,
      featured: false
    }
  })

  const watchRelationshipStatus = watch('relationship_status')
  const watchIsActive = watch('is_active')
  const watchShowOnWebsite = watch('show_on_website')
  const watchFeatured = watch('featured')

  const countries = [
    { code: 'BR', name: 'Brazil' },
    { code: 'US', name: 'United States' },
    { code: 'DK', name: 'Denmark' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'JP', name: 'Japan' },
    { code: 'AR', name: 'Argentina' },
    { code: 'MX', name: 'Mexico' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'AT', name: 'Austria' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'FI', name: 'Finland' }
  ]

  const relationshipStatuses = [
    { value: 'prospective', label: 'Prospective', description: 'Potential partner, in discussions' },
    { value: 'active', label: 'Active', description: 'Current partner with active relationship' },
    { value: 'inactive', label: 'Inactive', description: 'Former partner or paused relationship' }
  ]

  useEffect(() => {
    loadGallery()
  }, [slug])

  const loadGallery = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await GalleryService.getBySlug(slug)
      
      if (response.success && response.data) {
        const galleryData = response.data
        setGallery(galleryData)
        
        // Reset form with gallery data
        reset({
          name: galleryData.name,
          address_line1: galleryData.address_line1,
          address_line2: galleryData.address_line2 || '',
          city: galleryData.city,
          state_province: galleryData.state_province || '',
          postal_code: galleryData.postal_code || '',
          country: galleryData.country,
          country_code: galleryData.country_code || '',
          contact_person: galleryData.contact_person || '',
          email: galleryData.email || '',
          phone: galleryData.phone || '',
          website: galleryData.website || '',
          instagram: galleryData.instagram || '',
          commission_rate: galleryData.commission_rate || undefined,
          payment_terms: galleryData.payment_terms || '',
          shipping_arrangements: galleryData.shipping_arrangements || '',
          insurance_provider: galleryData.insurance_provider || '',
          description_pt: galleryData.description_pt || '',
          description_en: galleryData.description_en || '',
          relationship_status: galleryData.relationship_status,
          first_partnership_date: galleryData.first_partnership_date || '',
          contract_expiry_date: galleryData.contract_expiry_date || '',
          is_active: galleryData.is_active,
          show_on_website: galleryData.show_on_website,
          featured: galleryData.featured,
          notes: galleryData.notes || ''
        })
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

  const onSubmit = async (data: GalleryFormData) => {
    if (!gallery) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Generate new slug from name if name changed
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const updateData: UpdateGalleryData = {
        id: gallery.id,
        ...data,
        slug,
        email: data.email || undefined,
        website: data.website || undefined,
        commission_rate: data.commission_rate || undefined,
        first_partnership_date: data.first_partnership_date || undefined,
        contract_expiry_date: data.contract_expiry_date || undefined
      }

      const response = await GalleryService.update(updateData)
      
      if (response.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/galleries')
        }, 2000)
      } else {
        setError(response.error || 'Failed to update gallery')
      }
    } catch (error) {
      console.error('Failed to update gallery:', error)
      setError(error instanceof Error ? error.message : 'Failed to update gallery')
    } finally {
      setIsSubmitting(false)
    }
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

  if (error && !gallery) {
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

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Gallery Updated Successfully!</h2>
            <p className="text-gray-600 mb-4">
              The gallery information has been updated.
            </p>
            <p className="text-sm text-gray-500">Redirecting to galleries list...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Gallery</h1>
          <p className="text-gray-600">Update {gallery?.name} information</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-4 w-4" />
              Basic Information
            </CardTitle>
            <CardDescription className="text-sm">
              Essential details about the gallery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-2">
              <Label htmlFor="name">Gallery Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Gallery Name"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Relationship Status</Label>
                <Select value={watchRelationshipStatus} onValueChange={(value) => setValue('relationship_status', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship status" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div>
                          <div className="font-medium">{status.label}</div>
                          <div className="text-sm text-gray-500">{status.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.relationship_status && (
                  <p className="text-sm text-red-600">{errors.relationship_status.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...register('commission_rate', { valueAsNumber: true })}
                  placeholder="25.0"
                />
                {errors.commission_rate && (
                  <p className="text-sm text-red-600">{errors.commission_rate.message}</p>
                )}
              </div>
            </div>

            {watchRelationshipStatus === 'active' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="first_partnership_date">Partnership Start Date</Label>
                  <Input
                    id="first_partnership_date"
                    type="date"
                    {...register('first_partnership_date')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract_expiry_date">Contract Expiry Date</Label>
                  <Input
                    id="contract_expiry_date"
                    type="date"
                    {...register('contract_expiry_date')}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location & Contact Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-4 w-4" />
              Location & Contact
            </CardTitle>
            <CardDescription className="text-sm">
              Address details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1 *</Label>
              <Input
                id="address_line1"
                {...register('address_line1')}
                placeholder="123 Art Street"
              />
              {errors.address_line1 && (
                <p className="text-sm text-red-600">{errors.address_line1.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                {...register('address_line2')}
                placeholder="Suite 200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="São Paulo"
                />
                {errors.city && (
                  <p className="text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state_province">State/Province</Label>
                <Input
                  id="state_province"
                  {...register('state_province')}
                  placeholder="SP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  {...register('postal_code')}
                  placeholder="01234-567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select value={watch('country')} onValueChange={(value) => {
                  const country = countries.find(c => c.name === value)
                  setValue('country', value)
                  setValue('country_code', country?.code)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="text-sm text-red-600">{errors.country.message}</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contact Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    {...register('contact_person')}
                    placeholder="Gallery Director"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="+55 11 1234-5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="contact@gallery.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    {...register('website')}
                    placeholder="https://gallery.com"
                  />
                  {errors.website && (
                    <p className="text-sm text-red-600">{errors.website.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <Label htmlFor="instagram">Instagram Handle</Label>
                <Input
                  id="instagram"
                  {...register('instagram')}
                  placeholder="@galleryname"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Terms & Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-4 w-4" />
              Business Terms & Settings
            </CardTitle>
            <CardDescription className="text-sm">
              Partnership arrangements and display preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Business Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Textarea
                  id="payment_terms"
                  {...register('payment_terms')}
                  placeholder="Net 30 days, bank transfer..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipping_arrangements">Shipping Arrangements</Label>
                <Textarea
                  id="shipping_arrangements"
                  {...register('shipping_arrangements')}
                  placeholder="Gallery handles shipping..."
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="insurance_provider">Insurance Provider</Label>
                <Input
                  id="insurance_provider"
                  {...register('insurance_provider')}
                  placeholder="Art insurance company"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Gallery Description (optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="description_pt">Portuguese</Label>
                  <Textarea
                    id="description_pt"
                    {...register('description_pt')}
                    placeholder="Descrição da galeria..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_en">English</Label>
                  <Textarea
                    id="description_en"
                    {...register('description_en')}
                    placeholder="Gallery description..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Display Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="is_active" className="text-sm">Active Gallery</Label>
                    <p className="text-xs text-gray-500">Active in system</p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={watchIsActive}
                    onCheckedChange={(checked) => setValue('is_active', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="show_on_website" className="text-sm">Show on Website</Label>
                    <p className="text-xs text-gray-500">Public visibility</p>
                  </div>
                  <Switch
                    id="show_on_website"
                    checked={watchShowOnWebsite}
                    onCheckedChange={(checked) => setValue('show_on_website', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="featured" className="text-sm">Featured Gallery</Label>
                    <p className="text-xs text-gray-500">Prominent display</p>
                  </div>
                  <Switch
                    id="featured"
                    checked={watchFeatured}
                    onCheckedChange={(checked) => setValue('featured', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Private notes about this gallery partnership..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Updating...
              </div>
            ) : (
              'Update Gallery'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}