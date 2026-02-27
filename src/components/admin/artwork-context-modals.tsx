'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'

import { Artwork } from '@/types'
import { ArtworkService } from '@/services/artwork.service'
import { GalleryService, Gallery } from '@/services/gallery.service'
import { ExhibitionsService } from '@/services/exhibitions.service'
import { Exhibition } from '@/types'

// ─── Preview Modal ───────────────────────────────────────────────────────────

interface PreviewModalProps {
  artwork: Artwork
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PreviewModal({ artwork, open, onOpenChange }: PreviewModalProps) {
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    if (open) setImageIndex(0)
  }, [open])

  const hasPrev = imageIndex > 0
  const hasNext = imageIndex < artwork.images.length - 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{artwork.title.en}</DialogTitle>
          <DialogDescription>{artwork.title.ptBR}</DialogDescription>
        </DialogHeader>

        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          {artwork.images.length > 0 ? (
            <>
              <img
                src={artwork.images[imageIndex]?.display || artwork.images[imageIndex]?.original}
                alt={artwork.title.en}
                className="w-full h-auto max-h-[60vh] object-contain mx-auto"
              />
              {artwork.images.length > 1 && (
                <>
                  {hasPrev && (
                    <button
                      onClick={() => setImageIndex(i => i - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                  {hasNext && (
                    <button
                      onClick={() => setImageIndex(i => i + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        {artwork.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto py-2">
            {artwork.images.map((img, index) => (
              <button
                key={index}
                onClick={() => setImageIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                  imageIndex === index
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

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-500">Year:</span>
            <span className="ml-2">{artwork.year}</span>
          </div>
          <div>
            <span className="font-medium text-gray-500">Category:</span>
            <span className="ml-2 capitalize">{artwork.category}</span>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-gray-500">Medium:</span>
            <span className="ml-2">{artwork.medium.en}</span>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-gray-500">Dimensions:</span>
            <span className="ml-2">{artwork.dimensions}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Mark as Sold Modal ──────────────────────────────────────────────────────

interface MarkAsSoldModalProps {
  artwork: Artwork
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function MarkAsSoldModal({ artwork, open, onOpenChange, onUpdate }: MarkAsSoldModalProps) {
  const [price, setPrice] = useState(artwork.price?.toString() || '')
  const [currency, setCurrency] = useState<'BRL' | 'USD' | 'EUR'>(artwork.currency || 'BRL')
  const [soldDate, setSoldDate] = useState(new Date().toISOString().split('T')[0])
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerCity, setBuyerCity] = useState('')
  const [buyerState, setBuyerState] = useState('')
  const [buyerCountry, setBuyerCountry] = useState('')
  const [buyerZipCode, setBuyerZipCode] = useState('')
  const [galleryId, setGalleryId] = useState('')
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loadingGalleries, setLoadingGalleries] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setPrice(artwork.price?.toString() || '')
      setCurrency(artwork.currency || 'BRL')
      setSoldDate(new Date().toISOString().split('T')[0])
      setBuyerName('')
      setBuyerEmail('')
      setBuyerPhone('')
      setBuyerAddress('')
      setBuyerCity('')
      setBuyerState('')
      setBuyerCountry('')
      setBuyerZipCode('')
      setGalleryId('')
      setLoadingGalleries(true)
      GalleryService.getAll({ includeInactive: false })
        .then(res => {
          if (res.success && res.data) setGalleries(res.data)
        })
        .finally(() => setLoadingGalleries(false))
    }
  }, [open, artwork])

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await ArtworkService.updateArtwork(artwork.id, {
        isSold: true,
        soldPrice: parseFloat(price) || undefined,
        soldCurrency: currency,
        soldDate: new Date(soldDate),
        buyerName: buyerName || undefined,
        buyerEmail: buyerEmail || undefined,
        buyerPhone: buyerPhone || undefined,
        buyerAddress: buyerAddress || undefined,
        buyerCity: buyerCity || undefined,
        buyerState: buyerState || undefined,
        buyerCountry: buyerCountry || undefined,
        buyerZipCode: buyerZipCode || undefined,
        forSale: false,
        ...(galleryId ? { locationType: 'gallery', locationId: galleryId } : {}),
      })
      onOpenChange(false)
      onUpdate?.()
    } catch (error) {
      console.error('Error marking as sold:', error)
    } finally {
      setSaving(false)
    }
  }

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
          {/* Sale details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
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

          <div className="space-y-2">
            <Label>Sale Date</Label>
            <Input
              type="date"
              value={soldDate}
              onChange={(e) => setSoldDate(e.target.value)}
            />
          </div>

          {/* Gallery (optional) */}
          <div className="space-y-2">
            <Label>Sold through Gallery (optional)</Label>
            {loadingGalleries ? (
              <p className="text-sm text-gray-500">Loading galleries...</p>
            ) : (
              <Select value={galleryId} onValueChange={setGalleryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Direct sale / no gallery" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Direct sale / no gallery</SelectItem>
                  {galleries.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} — {g.city}, {g.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                    placeholder="Country"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Zip Code</Label>
                  <Input
                    value={buyerZipCode}
                    onChange={(e) => setBuyerZipCode(e.target.value)}
                    placeholder="00000-000"
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

// ─── Assign to Gallery Modal ─────────────────────────────────────────────────

interface AssignToGalleryModalProps {
  artwork: Artwork
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function AssignToGalleryModal({ artwork, open, onOpenChange, onUpdate }: AssignToGalleryModalProps) {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedId('')
      setLoading(true)
      GalleryService.getAll({ includeInactive: false })
        .then(res => {
          if (res.success && res.data) setGalleries(res.data)
        })
        .finally(() => setLoading(false))
    }
  }, [open])

  const handleSubmit = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await ArtworkService.updateArtwork(artwork.id, {
        locationType: 'gallery',
        locationId: selectedId,
      })
      onOpenChange(false)
      onUpdate?.()
    } catch (error) {
      console.error('Error assigning to gallery:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign to Gallery</DialogTitle>
          <DialogDescription>
            Choose a gallery for &quot;{artwork.title.en}&quot;
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading galleries...</div>
        ) : galleries.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No galleries found.</div>
        ) : (
          <div className="space-y-4">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a gallery" />
              </SelectTrigger>
              <SelectContent>
                {galleries.map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name} — {g.city}, {g.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedId || saving}>
            {saving ? 'Saving...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Assign to Exhibition Modal ──────────────────────────────────────────────

interface AssignToExhibitionModalProps {
  artwork: Artwork
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function AssignToExhibitionModal({ artwork, open, onOpenChange, onUpdate }: AssignToExhibitionModalProps) {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedId('')
      setLoading(true)
      ExhibitionsService.getExhibitions()
        .then(data => setExhibitions(data))
        .finally(() => setLoading(false))
    }
  }, [open])

  const handleSubmit = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await ArtworkService.updateArtwork(artwork.id, {
        locationType: 'exhibition',
        locationId: selectedId,
      })
      onOpenChange(false)
      onUpdate?.()
    } catch (error) {
      console.error('Error assigning to exhibition:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign to Exhibition</DialogTitle>
          <DialogDescription>
            Choose an exhibition for &quot;{artwork.title.en}&quot;
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading exhibitions...</div>
        ) : exhibitions.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No exhibitions found.</div>
        ) : (
          <div className="space-y-4">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an exhibition" />
              </SelectTrigger>
              <SelectContent>
                {exhibitions.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.title.en} ({e.year}) — {e.venue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedId || saving}>
            {saving ? 'Saving...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Confirm Action Modal ────────────────────────────────────────────────────

interface ConfirmActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => Promise<void>
}

export function ConfirmActionModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'default',
  onConfirm,
}: ConfirmActionModalProps) {
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    setSaving(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error('Error in confirm action:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant={variant} onClick={handleConfirm} disabled={saving}>
            {saving ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── For Sale Modal ──────────────────────────────────────────────────────────

interface ForSaleModalProps {
  artwork: Artwork
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function ForSaleModal({ artwork, open, onOpenChange, onUpdate }: ForSaleModalProps) {
  const isCurrentlyForSale = artwork.forSale
  const [price, setPrice] = useState(artwork.price?.toString() || '')
  const [currency, setCurrency] = useState<'BRL' | 'USD' | 'EUR'>(artwork.currency || 'BRL')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setPrice(artwork.price?.toString() || '')
      setCurrency(artwork.currency || 'BRL')
    }
  }, [open, artwork])

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (isCurrentlyForSale) {
        await ArtworkService.toggleSaleStatus(artwork.id, false)
      } else {
        await ArtworkService.toggleSaleStatus(artwork.id, true, parseFloat(price), currency)
      }
      onOpenChange(false)
      onUpdate?.()
    } catch (error) {
      console.error('Error toggling for sale:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCurrentlyForSale ? 'Remove from Sale' : 'Mark for Sale'}</DialogTitle>
          <DialogDescription>
            {isCurrentlyForSale
              ? `Remove "${artwork.title.en}" from sale listings?`
              : `Set a price for "${artwork.title.en}"`}
          </DialogDescription>
        </DialogHeader>

        {!isCurrentlyForSale && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
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
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || (!isCurrentlyForSale && !price)}
          >
            {saving ? 'Saving...' : isCurrentlyForSale ? 'Remove from Sale' : 'Mark for Sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
