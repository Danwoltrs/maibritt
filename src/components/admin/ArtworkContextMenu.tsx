'use client'

import React, { useState, useCallback } from 'react'
import {
  Eye, Pencil, DollarSign, Building, CalendarDays, Home,
  Star, Tag, Download, Trash2,
} from 'lucide-react'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
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
  ForSaleModal,
} from './artwork-context-modals'
import { EditArtworkModal } from './EditArtworkModal'

type ModalType =
  | 'preview'
  | 'edit'
  | 'markSold'
  | 'assignGallery'
  | 'assignExhibition'
  | 'moveStudio'
  | 'toggleFeatured'
  | 'toggleForSale'
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
  // Snapshot the artwork when a modal opens so carousel rotation doesn't change it
  const [snapshotArtwork, setSnapshotArtwork] = useState<Artwork>(artwork)

  const openModal = useCallback((modal: ModalType) => {
    setSnapshotArtwork(artwork)
    setActiveModal(modal)
  }, [artwork])

  const closeModal = useCallback(() => setActiveModal(null), [])

  // If not authenticated, just render children without context menu
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

  const handleMoveToStudio = async () => {
    await ArtworkService.updateArtwork(snapshotArtwork.id, {
      locationType: '',
      locationId: '',
    })
    onUpdate?.()
  }

  const handleToggleFeatured = async () => {
    await ArtworkService.updateArtwork(snapshotArtwork.id, {
      featured: !snapshotArtwork.featured,
    })
    onUpdate?.()
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
          <ContextMenuItem onClick={() => openModal('toggleForSale')}>
            <Tag className="mr-2 h-4 w-4" />
            {artwork.forSale ? 'Remove from Sale' : 'Mark for Sale'}
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => openModal('assignGallery')}>
            <Building className="mr-2 h-4 w-4" />
            Assign to Gallery
          </ContextMenuItem>
          <ContextMenuItem onClick={() => openModal('assignExhibition')}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Assign to Exhibition
          </ContextMenuItem>
          <ContextMenuItem onClick={() => openModal('moveStudio')}>
            <Home className="mr-2 h-4 w-4" />
            Move to Studio
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => openModal('toggleFeatured')}>
            <Star className="mr-2 h-4 w-4" />
            {artwork.featured ? 'Remove Featured' : 'Mark as Featured'}
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

      {/* Modals — use snapshotArtwork so carousel rotation doesn't change the target */}
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

      <ForSaleModal
        artwork={snapshotArtwork}
        open={activeModal === 'toggleForSale'}
        onOpenChange={(open) => !open && closeModal()}
        onUpdate={onUpdate}
      />

      <ConfirmActionModal
        open={activeModal === 'moveStudio'}
        onOpenChange={(open) => !open && closeModal()}
        title="Move to Studio"
        description={`Move "${snapshotArtwork.title.en}" back to the studio? This will clear the current gallery/exhibition assignment.`}
        confirmLabel="Move to Studio"
        onConfirm={handleMoveToStudio}
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
