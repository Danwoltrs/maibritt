'use client'

import React, { useState, useCallback } from 'react'
import {
  Eye, Pencil, DollarSign, Building, CalendarDays,
  Star, Download, Trash2, Clock, Briefcase, Truck,
} from 'lucide-react'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

import { Artwork } from '@/types'
import { ArtworkService } from '@/services/artwork.service'
import { useAuth } from '@/hooks/useAuth'

import {
  PreviewModal,
  MarkAsSoldModal,
  AssignToGalleryModal,
  AssignToExhibitionModal,
  ConfirmActionModal,
  FreightCostModal,
} from './artwork-context-modals'
import { EditArtworkModal } from './EditArtworkModal'

type ModalType =
  | 'preview'
  | 'edit'
  | 'markSold'
  | 'assignGallery'
  | 'assignExhibition'
  | 'freightCost'
  | 'toggleFeatured'
  | 'delete'
  | null

interface ArtworkContextMenuProps {
  artwork: Artwork
  children: React.ReactNode
  onUpdate?: () => void
}

export function ArtworkContextMenu({ artwork, children, onUpdate }: ArtworkContextMenuProps) {
  const { isAuthenticated } = useAuth()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [snapshotArtwork, setSnapshotArtwork] = useState<Artwork>(artwork)

  const openModal = useCallback((modal: ModalType) => {
    setSnapshotArtwork(artwork)
    setActiveModal(modal)
  }, [artwork])

  const closeModal = useCallback(() => setActiveModal(null), [])

  if (!isAuthenticated) {
    return <>{children}</>
  }

  const handleDownload = () => {
    if (snapshotArtwork.images.length === 0) return
    const url = snapshotArtwork.images[0].original || snapshotArtwork.images[0].display
    const link = document.createElement('a')
    link.href = url
    link.download = `${snapshotArtwork.title.en.replace(/\s+/g, '-').toLowerCase()}.jpg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleToggleFeatured = async () => {
    await ArtworkService.updateArtwork(snapshotArtwork.id, {
      featured: !snapshotArtwork.featured,
    })
    onUpdate?.()
  }

  const handleToggleTimeline = async () => {
    const { error } = await (await import('@/lib/supabase')).supabase
      .from('artworks')
      .update({ show_on_timeline: !snapshotArtwork.showOnTimeline })
      .eq('id', snapshotArtwork.id)
    if (!error) onUpdate?.()
  }

  const handleSetStatus = async (status: string) => {
    const { error } = await (await import('@/lib/supabase')).supabase
      .from('artworks')
      .update({ artwork_status: status })
      .eq('id', snapshotArtwork.id)
    if (!error) onUpdate?.()
  }

  const handleDelete = async () => {
    await ArtworkService.deleteArtwork(snapshotArtwork.id)
    onUpdate?.()
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={() => openModal('preview')}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </ContextMenuItem>
          <ContextMenuItem onClick={() => openModal('edit')}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => openModal('markSold')}>
            <DollarSign className="mr-2 h-4 w-4" />
            Mark as Sold
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Briefcase className="mr-2 h-4 w-4" />
              Set Status
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {[
                { value: 'studio', label: 'Studio' },
                { value: 'gallery', label: 'At Gallery' },
                { value: 'on_loan', label: 'On Loan' },
                { value: 'nfs', label: 'NFS' },
              ].map(s => (
                <ContextMenuItem key={s.value} onClick={() => handleSetStatus(s.value)}>
                  {s.label}
                  {artwork.artworkStatus === s.value && <span className="ml-auto text-xs">&#10003;</span>}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => openModal('assignGallery')}>
            <Building className="mr-2 h-4 w-4" />
            Assign to Gallery
          </ContextMenuItem>
          <ContextMenuItem onClick={() => openModal('assignExhibition')}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Assign to Exhibition
          </ContextMenuItem>
          <ContextMenuItem onClick={() => openModal('freightCost')}>
            <Truck className="mr-2 h-4 w-4" />
            {artwork.freightCost ? 'Edit Freight Cost' : 'Add Freight Cost'}
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => openModal('toggleFeatured')}>
            <Star className="mr-2 h-4 w-4" />
            {artwork.featured ? 'Remove Featured' : 'Mark as Featured'}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleToggleTimeline}>
            <Clock className="mr-2 h-4 w-4" />
            {artwork.showOnTimeline ? 'Hide from Timeline' : 'Show on Timeline'}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleDownload}
            disabled={artwork.images.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Image
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            onClick={() => openModal('delete')}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Modals */}
      <PreviewModal
        artwork={snapshotArtwork}
        open={activeModal === 'preview'}
        onOpenChange={(open) => !open && closeModal()}
      />

      <EditArtworkModal
        artwork={snapshotArtwork}
        open={activeModal === 'edit'}
        onOpenChange={(open) => !open && closeModal()}
        onUpdate={onUpdate}
      />

      <MarkAsSoldModal
        artwork={snapshotArtwork}
        open={activeModal === 'markSold'}
        onOpenChange={(open) => !open && closeModal()}
        onUpdate={onUpdate}
      />

      <AssignToGalleryModal
        artwork={snapshotArtwork}
        open={activeModal === 'assignGallery'}
        onOpenChange={(open) => !open && closeModal()}
        onUpdate={onUpdate}
      />

      <AssignToExhibitionModal
        artwork={snapshotArtwork}
        open={activeModal === 'assignExhibition'}
        onOpenChange={(open) => !open && closeModal()}
        onUpdate={onUpdate}
      />

      <FreightCostModal
        artwork={snapshotArtwork}
        open={activeModal === 'freightCost'}
        onOpenChange={(open) => !open && closeModal()}
        onUpdate={onUpdate}
      />

      <ConfirmActionModal
        open={activeModal === 'toggleFeatured'}
        onOpenChange={(open) => !open && closeModal()}
        title={snapshotArtwork.featured ? 'Remove Featured' : 'Mark as Featured'}
        description={
          snapshotArtwork.featured
            ? `Remove "${snapshotArtwork.title.en}" from featured artworks?`
            : `Feature "${snapshotArtwork.title.en}" on the homepage?`
        }
        confirmLabel={snapshotArtwork.featured ? 'Remove Featured' : 'Mark as Featured'}
        onConfirm={handleToggleFeatured}
      />

      <ConfirmActionModal
        open={activeModal === 'delete'}
        onOpenChange={(open) => !open && closeModal()}
        title="Delete Artwork"
        description={`Are you sure you want to delete "${snapshotArtwork.title.en}"? This action cannot be undone and will also delete all associated images.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}
