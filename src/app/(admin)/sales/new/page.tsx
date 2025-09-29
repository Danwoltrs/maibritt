'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, DollarSign, Building, User, FileText, CheckCircle, AlertCircle, Calculator } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { ArtworkService } from '@/services/artwork.service'
import { GalleryService, Gallery } from '@/services/gallery.service'
import { Artwork } from '@/types'

// Form validation schema
const saleSchema = z.object({
  artworkId: z.string().min(1, 'Please select an artwork'),
  galleryId: z.string().optional(),
  saleType: z.enum(['gallery', 'direct', 'online']),
  saleDate: z.string().min(1, 'Sale date is required'),
  salePrice: z.number().min(0.01, 'Sale price must be greater than 0'),
  currency: z.enum(['BRL', 'USD', 'EUR']),
  commissionRate: z.number().min(0).max(100).optional(),
  buyerName: z.string().min(1, 'Buyer name is required'),
  buyerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  buyerPhone: z.string().optional(),
  buyerCountry: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'refunded']),
  invoiceNumber: z.string().optional(),
  certificateOfAuthenticity: z.boolean(),
  notes: z.string().optional()
})

type SaleFormData = z.infer<typeof saleSchema>

interface SaleCalculation {
  salePrice: number
  commissionRate: number
  commissionAmount: number
  netAmount: number
}

export default function NewSalePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null)
  const [saleCalculation, setSaleCalculation] = useState<SaleCalculation>({
    salePrice: 0,
    commissionRate: 0,
    commissionAmount: 0,
    netAmount: 0
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      saleType: 'direct',
      currency: 'BRL',
      paymentStatus: 'pending',
      certificateOfAuthenticity: false,
      saleDate: new Date().toISOString().split('T')[0]
    }
  })

  const watchSaleType = watch('saleType')
  const watchSalePrice = watch('salePrice')
  const watchCommissionRate = watch('commissionRate')
  const watchArtworkId = watch('artworkId')
  const watchGalleryId = watch('galleryId')

  useEffect(() => {
    loadArtworks()
    loadGalleries()
  }, [])

  useEffect(() => {
    const artwork = artworks.find(a => a.id === watchArtworkId)
    setSelectedArtwork(artwork || null)
    
    if (artwork && artwork.price) {
      setValue('salePrice', artwork.price)
      setValue('currency', artwork.currency)
    }
  }, [watchArtworkId, artworks, setValue])

  useEffect(() => {
    const gallery = galleries.find(g => g.id === watchGalleryId)
    setSelectedGallery(gallery || null)
    
    if (gallery && gallery.commission_rate) {
      setValue('commissionRate', gallery.commission_rate)
    }
  }, [watchGalleryId, galleries, setValue])

  useEffect(() => {
    calculateSale()
  }, [watchSalePrice, watchCommissionRate])

  const loadArtworks = async () => {
    try {
      const response = await ArtworkService.getArtworks({ forSale: true })
      setArtworks(response.artworks)
    } catch (error) {
      console.error('Error loading artworks:', error)
    }
  }

  const loadGalleries = async () => {
    try {
      const response = await GalleryService.getAll({ includeInactive: false })
      if (response.success && response.data) {
        setGalleries(response.data.filter(g => g.relationship_status === 'active'))
      }
    } catch (error) {
      console.error('Error loading galleries:', error)
    }
  }

  const calculateSale = () => {
    const salePrice = watchSalePrice || 0
    const commissionRate = watchCommissionRate || 0
    const commissionAmount = (salePrice * commissionRate) / 100
    const netAmount = salePrice - commissionAmount

    setSaleCalculation({
      salePrice,
      commissionRate,
      commissionAmount,
      netAmount
    })
  }

  const onSubmit = async (data: SaleFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Here you would call a sales service to record the sale
      // For now, we'll simulate the API call
      
      console.log('Recording sale:', {
        ...data,
        commissionAmount: saleCalculation.commissionAmount,
        netAmount: saleCalculation.netAmount
      })

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mark artwork as sold
      if (selectedArtwork) {
        await ArtworkService.updateArtwork(selectedArtwork.id, {
          forSale: false,
          price: undefined,
          currency: undefined
        })
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/sales')
      }, 2000)

    } catch (error) {
      console.error('Failed to record sale:', error)
      setError(error instanceof Error ? error.message : 'Failed to record sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currencies = [
    { value: 'BRL', label: 'R$ BRL', symbol: 'R$' },
    { value: 'USD', label: '$ USD', symbol: '$' },
    { value: 'EUR', label: '€ EUR', symbol: '€' }
  ]

  const paymentMethods = [
    'Bank Transfer',
    'Credit Card',
    'PayPal',
    'Check',
    'Cash',
    'Cryptocurrency',
    'Art Trade',
    'Installments'
  ]

  const saleTypes = [
    { value: 'direct', label: 'Direct Sale', description: 'Sale directly to collector' },
    { value: 'gallery', label: 'Gallery Sale', description: 'Sale through gallery partner' },
    { value: 'online', label: 'Online Sale', description: 'Sale through website or online platform' }
  ]

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Sale Recorded Successfully!</h2>
            <p className="text-gray-600 mb-4">
              The sale has been recorded and the artwork status updated.
            </p>
            <p className="text-sm text-gray-500">Redirecting to sales dashboard...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Record New Sale</h1>
          <p className="text-gray-600">Log a completed artwork sale</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sale Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Sale Details
              </CardTitle>
              <CardDescription>
                Information about the artwork sale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Artwork Selection */}
              <div className="space-y-2">
                <Label>Artwork *</Label>
                <Select onValueChange={(value) => setValue('artworkId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select artwork to sell" />
                  </SelectTrigger>
                  <SelectContent>
                    {artworks.map((artwork) => (
                      <SelectItem key={artwork.id} value={artwork.id}>
                        <div className="flex items-center gap-3">
                          <img
                            src={artwork.images[0]?.thumbnail || '/placeholder-image.jpg'}
                            alt={artwork.title.en}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium">{artwork.title.en}</div>
                            <div className="text-sm text-gray-500">
                              {artwork.year} • {artwork.price ? `${artwork.currency === 'BRL' ? 'R$' : artwork.currency === 'USD' ? '$' : '€'} ${artwork.price.toLocaleString()}` : 'Price not set'}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.artworkId && (
                  <p className="text-sm text-red-600">{errors.artworkId.message}</p>
                )}
              </div>

              {/* Selected Artwork Preview */}
              {selectedArtwork && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedArtwork.images[0]?.thumbnail || '/placeholder-image.jpg'}
                      alt={selectedArtwork.title.en}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <h4 className="font-medium">{selectedArtwork.title.en}</h4>
                      <p className="text-sm text-gray-600">{selectedArtwork.title.ptBR}</p>
                      <p className="text-sm text-gray-500">
                        {selectedArtwork.year} • {selectedArtwork.medium.en} • {selectedArtwork.dimensions}
                      </p>
                      {selectedArtwork.forSale && (
                        <Badge className="bg-green-100 text-green-800 mt-1">For Sale</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sale Type */}
              <div className="space-y-2">
                <Label>Sale Type</Label>
                <Select onValueChange={(value) => setValue('saleType', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sale type" />
                  </SelectTrigger>
                  <SelectContent>
                    {saleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.saleType && (
                  <p className="text-sm text-red-600">{errors.saleType.message}</p>
                )}
              </div>

              {/* Gallery Selection (if gallery sale) */}
              {watchSaleType === 'gallery' && (
                <div className="space-y-2">
                  <Label>Gallery</Label>
                  <Select onValueChange={(value) => setValue('galleryId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gallery" />
                    </SelectTrigger>
                    <SelectContent>
                      {galleries.map((gallery) => (
                        <SelectItem key={gallery.id} value={gallery.id}>
                          <div>
                            <div className="font-medium">{gallery.name}</div>
                            <div className="text-sm text-gray-500">
                              {gallery.city}, {gallery.country} • {gallery.commission_rate}% commission
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Price and Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="saleDate">Sale Date *</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    {...register('saleDate')}
                  />
                  {errors.saleDate && (
                    <p className="text-sm text-red-600">{errors.saleDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salePrice">Sale Price *</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    {...register('salePrice', { valueAsNumber: true })}
                    placeholder="5000.00"
                  />
                  {errors.salePrice && (
                    <p className="text-sm text-red-600">{errors.salePrice.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select onValueChange={(value) => setValue('currency', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Commission Rate (if gallery sale) */}
              {watchSaleType === 'gallery' && (
                <div className="space-y-2">
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    {...register('commissionRate', { valueAsNumber: true })}
                    placeholder="25.0"
                  />
                  {errors.commissionRate && (
                    <p className="text-sm text-red-600">{errors.commissionRate.message}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sale Calculation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Sale Calculation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sale Price:</span>
                  <span className="font-medium">
                    {saleCalculation.salePrice > 0 ? 
                      `${currencies.find(c => c.value === watch('currency'))?.symbol || 'R$'} ${saleCalculation.salePrice.toLocaleString()}` : 
                      '-'
                    }
                  </span>
                </div>

                {watchSaleType === 'gallery' && saleCalculation.commissionRate > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Commission ({saleCalculation.commissionRate}%):</span>
                      <span className="text-red-600">
                        -{currencies.find(c => c.value === watch('currency'))?.symbol || 'R$'} {saleCalculation.commissionAmount.toLocaleString()}
                      </span>
                    </div>
                    <hr className="border-gray-200" />
                  </>
                )}

                <div className="flex justify-between items-center">
                  <span className="font-medium">Net Amount:</span>
                  <span className="font-bold text-green-600">
                    {saleCalculation.netAmount > 0 ? 
                      `${currencies.find(c => c.value === watch('currency'))?.symbol || 'R$'} ${saleCalculation.netAmount.toLocaleString()}` : 
                      '-'
                    }
                  </span>
                </div>
              </div>

              {saleCalculation.salePrice > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {watchSaleType === 'gallery' ? 
                      `You will receive ${((saleCalculation.netAmount / saleCalculation.salePrice) * 100).toFixed(1)}% of the sale price` :
                      'You will receive 100% of the sale price'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Buyer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Buyer Information
            </CardTitle>
            <CardDescription>
              Details about the art collector/buyer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyerName">Buyer Name *</Label>
                <Input
                  id="buyerName"
                  {...register('buyerName')}
                  placeholder="Collector name"
                />
                {errors.buyerName && (
                  <p className="text-sm text-red-600">{errors.buyerName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerEmail">Buyer Email</Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  {...register('buyerEmail')}
                  placeholder="collector@email.com"
                />
                {errors.buyerEmail && (
                  <p className="text-sm text-red-600">{errors.buyerEmail.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyerPhone">Buyer Phone</Label>
                <Input
                  id="buyerPhone"
                  {...register('buyerPhone')}
                  placeholder="+55 11 1234-5678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerCountry">Buyer Country</Label>
                <Input
                  id="buyerCountry"
                  {...register('buyerCountry')}
                  placeholder="Brazil"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payment Information
            </CardTitle>
            <CardDescription>
              Payment method and status details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select onValueChange={(value) => setValue('paymentMethod', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select onValueChange={(value) => setValue('paymentStatus', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                {...register('invoiceNumber')}
                placeholder="INV-2024-001"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="certificateOfAuthenticity">Certificate of Authenticity</Label>
                <p className="text-sm text-gray-500">
                  Has the certificate been sent to the buyer?
                </p>
              </div>
              <Switch
                id="certificateOfAuthenticity"
                {...register('certificateOfAuthenticity')}
                onCheckedChange={(checked) => setValue('certificateOfAuthenticity', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes about this sale..."
                rows={3}
              />
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
            disabled={isSubmitting || !selectedArtwork}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Recording...
              </div>
            ) : (
              'Record Sale'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}