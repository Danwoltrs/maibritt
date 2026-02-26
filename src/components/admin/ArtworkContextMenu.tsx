'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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

import {
  PreviewModal,
  MarkAsSoldModal,
  AssignToGalleryModal,
  AssignToExhibitionModal,
  ConfirmActionModal,
  ForSaleModal,
} from './artwork-context-modals'

type ModalType =
  | 'preview'
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
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  const closeModal = useCallback(() => setActiveModal(null), [])

  const handleDownload = () => {
    if (artwork.images.length === 0) return
    const url = artwork.images[0].original || artwork.images[0].display
    const link = document.createElement('a')
    link.href = url
    link.download = `${artwork.title.en.replace(/\s+/g, '-').toLowerCase()}.jpg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleMoveToStudio = async () => {
    await ArtworkService.updateArtwork(artwork.id, {
      locationType: '',
      locationId: '',
    })
    onUpdate?.()
  }

  const handleToggleFeatured = async () => {
    await ArtworkService.updateArtwork(artwork.id, {
      featured: !artwork.featured,
    })
    onUpdate?.()
  }

  const handleDelete = async () => {
    await ArtworkService.deleteArtwork(artwork.id)
    onUpdate?.()
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={() => setActiveModal('preview')}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </ContextMenuItem>
          <ContextMenuItem onClick={() => router.push(`/artworks/${artwork.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => setActiveModal('markSold')}>
            <DollarSign className="mr-2 h-4 w-4" />
            Mark as Sold
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setActiveModal('toggleForSale')}>
            <Tag className="mr-2 h-4 w-4" />
            {artwork.forSale ? 'Remove from Sale' : 'Mark for Sale'}
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => setActiveModal('assignGallery')}>
            <Building className="mr-2 h-4 w-4" />
            Assign to Gallery
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setActiveModal('assignExhibition')}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Assign to Exhibition
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setActiveModal('moveStudio')}>
            <Home className="mr-2 h-4 w-4" />
            Move to Studio
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => setActiveModal('toggleFeatured')}>
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
            onClick={() => setActiveModal('delete')}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Modals */}
      <PreviewModal
        artwork={artwork}
        open={activeModal === 'preview'}
        onOpenChange={(open) => !open && closeModal()}
      />

      <MarkAsSoldModal
        artwork={artwork}
        open={activeModal === 'markSold'}
        onOpenChange={(open) => !open && closeModal()}
        onUpdate={onUpdate}
      />

      <AssignToGalleryModal
        artwork={artwork}
        open={activeModal === 'assignGallery'}
        onOpenChange={(open) => !open && closeModal()}
        onUpdate={onUpdate}
      />

      <AssignToExhibitionModal
        artwork={artwork}
        open={activeModal === 'assignExhibition'}
        onOpenChange={(open) => !open && closeModal()}
        onUpdate={onUpdate}
      />

      <ForSaleModal
        artwork={artwork}
        open={activeModal === 'toggleForSale'}
        onOpenChange={(open) => !open && closeModal()}
        onUpdate={onUpdate}
      />

      <ConfirmActionModal
        open={activeModal === 'moveStudio'}
        onOpenChange={(open) => !open && closeModal()}
        title="Move to Studio"
        description={`Move "${artwork.title.en}" back to the studio? This will clear the current gallery/exhibition assignment.`}
        confirmLabel="Move to Studio"
        onConfirm={handleMoveToStudio}
      />

      <ConfirmActionModal
        open={activeModal === 'toggleFeatured'}
        onOpenChange={(open) => !open && closeModal()}
        title={artwork.featured ? 'Remove Featured' : 'Mark as Featured'}
        description={
          artwork.featured
            ? `Remove "${artwork.title.en}" from featured artworks?`
            : `Feature "${artwork.title.en}" on the homepage?`
        }
        confirmLabel={artwork.featured ? 'Remove Featured' : 'Mark as Featured'}
        onConfirm={handleToggleFeatured}
      />

      <ConfirmActionModal
        open={activeModal === 'delete'}
        onOpenChange={(open) => !open && closeModal()}
        title="Delete Artwork"
        description={`Are you sure you want to delete "${artwork.title.en}"? This action cannot be undone and will also delete all associated images.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}
