'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Artwork } from '@/types'
import { ArtworkService } from '@/services/artwork.service'
import { GalleryService, Gallery } from '@/services/gallery.service'
import { formatZipCode, getZipPlaceholder } from '@/lib/zip-format'

interface MarkAsSoldModalProps {
  artwork: Artwork
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function MarkAsSoldModal({ artwork, open, onOpenChange, onUpdate }: MarkAsSoldModalProps) {
  // Sale details
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL')
  const [soldDate, setSoldDate] = useState('')
  const [saleType, setSaleType] = useState<'gallery' | 'direct' | 'online'>('direct')

  // Gallery & commission
  const [galleryId, setGalleryId] = useState('')
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loadingGalleries, setLoadingGalleries] = useState(false)
  const [commissionRate, setCommissionRate] = useState('')

  // Buyer info
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerCity, setBuyerCity] = useState('')
  const [buyerState, setBuyerState] = useState('')
  const [buyerCountry, setBuyerCountry] = useState('')
  const [buyerZipCode, setBuyerZipCode] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Commission calculations
  const priceNum = parseFloat(price) || 0
  const rateNum = parseFloat(commissionRate) || 0
  const commissionAmount = useMemo(() => priceNum * (rateNum / 100), [priceNum, rateNum])
  const netAmount = useMemo(() => priceNum - commissionAmount, [priceNum, commissionAmount])

  // Reset form on open
  useEffect(() => {
    if (open) {
      setPrice(artwork.price?.toString() || '')
      setCurrency(artwork.currency || 'BRL')
      setSoldDate(new Date().toISOString().split('T')[0])
      setSaleType('direct')
      setGalleryId('')
      setCommissionRate('')
      setBuyerName('')
      setBuyerEmail('')
      setBuyerPhone('')
      setBuyerAddress('')
      setBuyerCity('')
      setBuyerState('')
      setBuyerCountry('')
      setBuyerZipCode('')
      setError('')

      setLoadingGalleries(true)
      GalleryService.getAll({ includeInactive: false })
        .then(res => {
          if (res.success && res.data) setGalleries(res.data)
        })
        .finally(() => setLoadingGalleries(false))
    }
  }, [open, artwork])

  // Auto-fill commission rate when gallery changes
  useEffect(() => {
    if (galleryId) {
      const gallery = galleries.find(g => g.id === galleryId)
      if (gallery?.commission_rate) {
        setCommissionRate(gallery.commission_rate.toString())
      }
      setSaleType('gallery')
    } else {
      if (saleType === 'gallery') setSaleType('direct')
    }
  }, [galleryId, galleries])

  // Format zip on country change
  useEffect(() => {
    if (buyerZipCode && buyerCountry) {
      setBuyerZipCode(formatZipCode(buyerZipCode, buyerCountry))
    }
  }, [buyerCountry])

  const handleZipChange = (value: string) => {
    setBuyerZipCode(formatZipCode(value, buyerCountry))
  }

  const handleSubmit = async () => {
    if (!price || priceNum <= 0) {
      setError('Price is required')
      return
    }
    setError('')
    setSaving(true)
    try {
      await ArtworkService.updateArtwork(artwork.id, {
        isSold: true,
        forSale: false,
        soldPrice: priceNum,
        soldCurrency: currency,
        soldDate: new Date(soldDate + 'T12:00:00'),
        saleType,
        soldThroughGalleryId: galleryId || null,
        commissionRate: rateNum,
        commissionAmount: commissionAmount,
        netAmount: netAmount,
        buyerName: buyerName || undefined,
        buyerEmail: buyerEmail || undefined,
        buyerPhone: buyerPhone || undefined,
        buyerAddress: buyerAddress || undefined,
        buyerCity: buyerCity || undefined,
        buyerState: buyerState || undefined,
        buyerCountry: buyerCountry || undefined,
        buyerZipCode: buyerZipCode || undefined,
      })
      onOpenChange(false)
      onUpdate?.()
    } catch (err) {
      console.error('Error marking as sold:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '\u20AC'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark as Sold</DialogTitle>
          <DialogDescription>
            Record the sale of &quot;{artwork.title.en}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}

          {/* Sale details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price *</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as 'BRL' | 'USD' | 'EUR')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (&euro;)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sale Date</Label>
              <Input
                type="date"
                value={soldDate}
                onChange={(e) => setSoldDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sale Type</Label>
              <Select value={saleType} onValueChange={(v) => setSaleType(v as 'gallery' | 'direct' | 'online')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct Sale</SelectItem>
                  <SelectItem value="gallery">Through Gallery</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gallery & Commission */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Gallery &amp; Commission</p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Gallery (optional)</Label>
                {loadingGalleries ? (
                  <p className="text-sm text-gray-500">Loading galleries...</p>
                ) : (
                  <Select value={galleryId || 'none'} onValueChange={(v) => setGalleryId(v === 'none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="No gallery" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No gallery</SelectItem>
                      {galleries.map(g => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name} — {g.city}, {g.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Commission Rate (%)</Label>
                <Input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>

              {priceNum > 0 && rateNum > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sale price</span>
                    <span>{currencySymbol} {priceNum.toLocaleString('en', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Commission ({rateNum}%)</span>
                    <span>- {currencySymbol} {commissionAmount.toLocaleString('en', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Net amount</span>
                    <span>{currencySymbol} {netAmount.toLocaleString('en', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buyer info */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Buyer Information (optional)</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Buyer name"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="buyer@email.com"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="+55 11 99999-9999"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Address</Label>
                <Input
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">City</Label>
                  <Input
                    value={buyerCity}
                    onChange={(e) => setBuyerCity(e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">State</Label>
                  <Input
                    value={buyerState}
                    onChange={(e) => setBuyerState(e.target.value)}
                    placeholder="State"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Country</Label>
                  <Input
                    value={buyerCountry}
                    onChange={(e) => setBuyerCountry(e.target.value)}
                    placeholder="Country code (BR, US, DK...)"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Zip Code</Label>
                  <Input
                    value={buyerZipCode}
                    onChange={(e) => handleZipChange(e.target.value)}
                    placeholder={getZipPlaceholder(buyerCountry)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Mark as Sold'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
