'use client'

import React, { useState } from 'react'
import { Building, CalendarDays, Briefcase, Clock, Truck, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Artwork } from '@/types'
import { ArtworkService } from '@/services/artwork.service'
import { GalleryService, Gallery } from '@/services/gallery.service'
import { ExhibitionsService } from '@/services/exhibitions.service'
import { Exhibition } from '@/types'

type BulkModal = 'assignGallery' | 'assignExhibition' | 'setStatus' | 'freightCost' | 'delete' | null

interface BulkActionBarProps {
  selectedIds: Set<string>
  artworks: Artwork[]
  onClearSelection: () => void
  onUpdate: () => void
}

export function BulkActionBar({ selectedIds, artworks, onClearSelection, onUpdate }: BulkActionBarProps) {
  const [modal, setModal] = useState<BulkModal>(null)
  const [saving, setSaving] = useState(false)

  // Gallery assignment
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [selectedGalleryId, setSelectedGalleryId] = useState('')
  const [galleriesLoading, setGalleriesLoading] = useState(false)

  // Exhibition assignment
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [selectedExhibitionId, setSelectedExhibitionId] = useState('')
  const [exhibitionsLoading, setExhibitionsLoading] = useState(false)

  // Status
  const [selectedStatus, setSelectedStatus] = useState('')

  // Freight
  const [freightAmount, setFreightAmount] = useState('')
  const [freightCurrency, setFreightCurrency] = useState('BRL')
  const [freightNotes, setFreightNotes] = useState('')

  const count = selectedIds.size
  const selectedArtworks = artworks.filter(a => selectedIds.has(a.id))

  const openModal = async (type: BulkModal) => {
    setModal(type)
    if (type === 'assignGallery') {
      setGalleriesLoading(true)
      setSelectedGalleryId('')
      const res = await GalleryService.getAll({ includeInactive: false })
      if (res.success && res.data) setGalleries(res.data)
      setGalleriesLoading(false)
    }
    if (type === 'assignExhibition') {
      setExhibitionsLoading(true)
      setSelectedExhibitionId('')
      const data = await ExhibitionsService.getExhibitions()
      setExhibitions(data)
      setExhibitionsLoading(false)
    }
    if (type === 'setStatus') setSelectedStatus('')
    if (type === 'freightCost') {
      setFreightAmount('')
      setFreightCurrency('BRL')
      setFreightNotes('')
    }
  }

  const bulkUpdate = async (updateFn: (id: string) => Promise<unknown>) => {
    setSaving(true)
    try {
      await Promise.all(Array.from(selectedIds).map(updateFn))
      onUpdate()
      onClearSelection()
      setModal(null)
    } catch (error) {
      console.error('Bulk action error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleBulkAssignGallery = () =>
    bulkUpdate((id) => ArtworkService.updateArtwork(id, { locationType: 'gallery', locationId: selectedGalleryId }))

  const handleBulkAssignExhibition = () =>
    bulkUpdate((id) => ArtworkService.updateArtwork(id, { locationType: 'exhibition', locationId: selectedExhibitionId }))

  const handleBulkSetStatus = async () => {
    setSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      await Promise.all(Array.from(selectedIds).map(id =>
        supabase.from('artworks').update({ artwork_status: selectedStatus }).eq('id', id)
      ))
      onUpdate()
      onClearSelection()
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  const handleBulkTimeline = async (show: boolean) => {
    setSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      await Promise.all(Array.from(selectedIds).map(id =>
        supabase.from('artworks').update({ show_on_timeline: show }).eq('id', id)
      ))
      onUpdate()
      onClearSelection()
    } finally {
      setSaving(false)
    }
  }

  const handleBulkFreight = () =>
    bulkUpdate((id) => ArtworkService.updateArtwork(id, {
      freightCost: freightAmount ? parseFloat(freightAmount) : null,
      freightCurrency,
      freightNotes,
    }))

  const handleBulkDelete = async () => {
    setSaving(true)
    try {
      await Promise.all(Array.from(selectedIds).map(id => ArtworkService.deleteArtwork(id)))
      onUpdate()
      onClearSelection()
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  if (count === 0) return null

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 max-w-[95vw]">
        <span className="text-sm font-medium whitespace-nowrap">{count} selected</span>

        <div className="h-5 w-px bg-gray-600" />

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700 h-7 text-xs" onClick={() => openModal('assignGallery')}>
            <Building className="h-3.5 w-3.5 mr-1" /> Gallery
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700 h-7 text-xs" onClick={() => openModal('assignExhibition')}>
            <CalendarDays className="h-3.5 w-3.5 mr-1" /> Exhibition
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700 h-7 text-xs" onClick={() => openModal('setStatus')}>
            <Briefcase className="h-3.5 w-3.5 mr-1" /> Status
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700 h-7 text-xs" onClick={() => handleBulkTimeline(true)}>
            <Clock className="h-3.5 w-3.5 mr-1" /> Timeline On
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700 h-7 text-xs" onClick={() => handleBulkTimeline(false)}>
            <Clock className="h-3.5 w-3.5 mr-1" /> Timeline Off
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700 h-7 text-xs" onClick={() => openModal('freightCost')}>
            <Truck className="h-3.5 w-3.5 mr-1" /> Freight
          </Button>
          <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-900/50 h-7 text-xs" onClick={() => openModal('delete')}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>

        <div className="h-5 w-px bg-gray-600" />

        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-700 h-7 w-7 p-0" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Assign to Gallery */}
      <Dialog open={modal === 'assignGallery'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {count} artworks to Gallery</DialogTitle>
            <DialogDescription>Select a gallery for the selected artworks</DialogDescription>
          </DialogHeader>
          {galleriesLoading ? (
            <p className="text-center py-4 text-muted-foreground">Loading...</p>
          ) : (
            <Select value={selectedGalleryId} onValueChange={setSelectedGalleryId}>
              <SelectTrigger><SelectValue placeholder="Select gallery" /></SelectTrigger>
              <SelectContent>
                {galleries.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name} — {g.city}, {g.country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleBulkAssignGallery} disabled={!selectedGalleryId || saving}>
              {saving ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Exhibition */}
      <Dialog open={modal === 'assignExhibition'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {count} artworks to Exhibition</DialogTitle>
            <DialogDescription>Select an exhibition</DialogDescription>
          </DialogHeader>
          {exhibitionsLoading ? (
            <p className="text-center py-4 text-muted-foreground">Loading...</p>
          ) : (
            <Select value={selectedExhibitionId} onValueChange={setSelectedExhibitionId}>
              <SelectTrigger><SelectValue placeholder="Select exhibition" /></SelectTrigger>
              <SelectContent>
                {exhibitions.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.title.en} ({e.year}) — {e.venue}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleBulkAssignExhibition} disabled={!selectedExhibitionId || saving}>
              {saving ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Status */}
      <Dialog open={modal === 'setStatus'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set status for {count} artworks</DialogTitle>
          </DialogHeader>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="gallery">At Gallery</SelectItem>
              <SelectItem value="on_loan">On Loan</SelectItem>
              <SelectItem value="nfs">NFS</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleBulkSetStatus} disabled={!selectedStatus || saving}>
              {saving ? 'Updating...' : 'Set Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Freight Cost */}
      <Dialog open={modal === 'freightCost'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set freight cost for {count} artworks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" step="0.01" value={freightAmount} onChange={(e) => setFreightAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={freightCurrency} onValueChange={setFreightCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">BRL (R$)</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="DKK">DKK</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={freightNotes}
                onChange={(e) => setFreightNotes(e.target.value)}
                placeholder="Shipping details..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleBulkFreight} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={modal === 'delete'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {count} artworks?</DialogTitle>
            <DialogDescription>This action cannot be undone. The following artworks and their images will be permanently deleted:</DialogDescription>
          </DialogHeader>
          <div className="max-h-[200px] overflow-y-auto space-y-1 text-sm">
            {selectedArtworks.map(a => (
              <div key={a.id} className="text-muted-foreground">- {a.title.en} ({a.year})</div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={saving}>
              {saving ? 'Deleting...' : `Delete ${count} Artworks`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
