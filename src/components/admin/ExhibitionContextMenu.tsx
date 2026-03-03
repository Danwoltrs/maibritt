'use client'

import React, { useState, useCallback } from 'react'
import {
  Eye, Pencil, Star, StarOff, Megaphone, MegaphoneOff,
  Plus, Trash2, ExternalLink,
} from 'lucide-react'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { Exhibition } from '@/types'
import { ExhibitionsService, ExhibitionCreateData, ExhibitionUpdateData } from '@/services/exhibitions.service'
import { useAuth } from '@/hooks/useAuth'
import { ExhibitionRichForm, ExhibitionFormData, defaultFormData } from './exhibitions/ExhibitionRichForm'

type ModalType =
  | 'preview'
  | 'edit'
  | 'create'
  | 'toggleFeatured'
  | 'togglePopup'
  | 'delete'
  | null

interface ExhibitionContextMenuProps {
  exhibition: Exhibition
  children: React.ReactNode
  onUpdate?: () => void
}

export function ExhibitionContextMenu({ exhibition, children, onUpdate }: ExhibitionContextMenuProps) {
  const { isAuthenticated } = useAuth()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [formData, setFormData] = useState<ExhibitionFormData>(defaultFormData)
  const [saving, setSaving] = useState(false)

  const closeModal = useCallback(() => {
    setActiveModal(null)
    setSaving(false)
  }, [])

  if (!isAuthenticated) {
    return <>{children}</>
  }

  const getDisplayTitle = (ex: Exhibition) => ex.title.en || ex.title.ptBR

  const formatDateForInput = (date?: Date) => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  const formatDateTimeForInput = (date?: Date) => {
    if (!date) return ''
    return new Date(date).toISOString().slice(0, 16)
  }

  const openEditModal = () => {
    setFormData({
      titleEn: exhibition.title.en || '',
      titlePt: exhibition.title.ptBR || '',
      venue: exhibition.venue,
      street: exhibition.address?.street || '',
      streetNumber: exhibition.address?.streetNumber || '',
      neighborhood: exhibition.address?.neighborhood || '',
      zipCode: exhibition.address?.zipCode || '',
      city: exhibition.address?.city || '',
      state: exhibition.address?.state || '',
      country: exhibition.address?.country || '',
      year: exhibition.year,
      type: exhibition.type,
      descriptionEn: exhibition.description?.en || '',
      descriptionPt: exhibition.description?.ptBR || '',
      contentEn: exhibition.content?.en || null,
      contentPt: exhibition.content?.ptBR || null,
      curatorName: exhibition.curatorName || '',
      curatorTextEn: exhibition.curatorText?.en || '',
      curatorTextPt: exhibition.curatorText?.ptBR || '',
      images: exhibition.images || [],
      videos: exhibition.videos || [],
      startDate: formatDateForInput(exhibition.startDate),
      endDate: formatDateForInput(exhibition.endDate),
      openingDate: formatDateTimeForInput(exhibition.openingDate),
      openingDetails: exhibition.openingDetails || '',
      featured: exhibition.featured,
      mainImageMode: exhibition.mainImageMode || 'fixed',
      externalUrl: exhibition.externalUrl || '',
      catalogUrl: exhibition.catalogUrl || '',
      imageFile: null
    })
    setActiveModal('edit')
  }

  const openCreateModal = () => {
    setFormData({ ...defaultFormData, year: new Date().getFullYear() })
    setActiveModal('create')
  }

  const handleToggleFeatured = async () => {
    setSaving(true)
    try {
      await ExhibitionsService.toggleFeatured(exhibition.id, !exhibition.featured)
      closeModal()
      onUpdate?.()
    } catch (error) {
      console.error('Error toggling featured:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePopup = async () => {
    setSaving(true)
    try {
      await ExhibitionsService.togglePopup(exhibition.id, !exhibition.showPopup)
      closeModal()
      onUpdate?.()
    } catch (error) {
      console.error('Error toggling popup:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await ExhibitionsService.deleteExhibition(exhibition.id)
      closeModal()
      onUpdate?.()
    } catch (error) {
      console.error('Error deleting exhibition:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      const updateData: ExhibitionUpdateData = {
        title: { en: formData.titleEn, ptBR: formData.titlePt },
        venue: formData.venue,
        address: {
          street: formData.street || undefined,
          streetNumber: formData.streetNumber || undefined,
          neighborhood: formData.neighborhood || undefined,
          zipCode: formData.zipCode || undefined,
          city: formData.city,
          state: formData.state || undefined,
          country: formData.country
        },
        year: formData.year,
        type: formData.type,
        description: { en: formData.descriptionEn, ptBR: formData.descriptionPt },
        content: { en: formData.contentEn, ptBR: formData.contentPt },
        curatorName: formData.curatorName || undefined,
        curatorText: formData.curatorTextEn || formData.curatorTextPt
          ? { en: formData.curatorTextEn, ptBR: formData.curatorTextPt }
          : undefined,
        images: formData.images,
        videos: formData.videos,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        openingDate: formData.openingDate ? new Date(formData.openingDate) : null,
        openingDetails: formData.openingDetails || undefined,
        featured: formData.featured,
        externalUrl: formData.externalUrl || undefined,
        catalogUrl: formData.catalogUrl || undefined,
        newImageFile: formData.imageFile || undefined
      }

      await ExhibitionsService.updateExhibition(exhibition.id, updateData)
      closeModal()
      onUpdate?.()
    } catch (error) {
      console.error('Error updating exhibition:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      const createData: ExhibitionCreateData = {
        title: { en: formData.titleEn, ptBR: formData.titlePt },
        venue: formData.venue,
        address: {
          street: formData.street || undefined,
          streetNumber: formData.streetNumber || undefined,
          neighborhood: formData.neighborhood || undefined,
          zipCode: formData.zipCode || undefined,
          city: formData.city,
          state: formData.state || undefined,
          country: formData.country
        },
        year: formData.year,
        type: formData.type,
        description: { en: formData.descriptionEn, ptBR: formData.descriptionPt },
        content: { en: formData.contentEn, ptBR: formData.contentPt },
        curatorName: formData.curatorName || undefined,
        curatorText: formData.curatorTextEn || formData.curatorTextPt
          ? { en: formData.curatorTextEn, ptBR: formData.curatorTextPt }
          : undefined,
        images: formData.images,
        videos: formData.videos,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        openingDate: formData.openingDate ? new Date(formData.openingDate) : undefined,
        openingDetails: formData.openingDetails || undefined,
        featured: formData.featured,
        externalUrl: formData.externalUrl || undefined,
        catalogUrl: formData.catalogUrl || undefined,
        imageFile: formData.imageFile || undefined
      }

      await ExhibitionsService.createExhibition(createData)
      closeModal()
      onUpdate?.()
    } catch (error) {
      console.error('Error creating exhibition:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={() => {
            window.open(`/exhibitions/${exhibition.slug}`, '_blank')
          }}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </ContextMenuItem>
          <ContextMenuItem onClick={openEditModal}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => setActiveModal('toggleFeatured')}>
            {exhibition.featured ? (
              <StarOff className="mr-2 h-4 w-4" />
            ) : (
              <Star className="mr-2 h-4 w-4" />
            )}
            {exhibition.featured ? 'Remove from Timeline' : 'Feature on Timeline'}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setActiveModal('togglePopup')}>
            {exhibition.showPopup ? (
              <MegaphoneOff className="mr-2 h-4 w-4" />
            ) : (
              <Megaphone className="mr-2 h-4 w-4" />
            )}
            {exhibition.showPopup ? 'Disable Flyer Popup' : 'Enable Flyer Popup'}
          </ContextMenuItem>

          {exhibition.externalUrl && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => window.open(exhibition.externalUrl, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open External Link
              </ContextMenuItem>
            </>
          )}

          <ContextMenuSeparator />

          <ContextMenuItem onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Exhibition
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

      {/* Toggle Featured Confirmation */}
      <Dialog open={activeModal === 'toggleFeatured'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{exhibition.featured ? 'Remove from Timeline' : 'Feature on Timeline'}</DialogTitle>
            <DialogDescription>
              {exhibition.featured
                ? `Remove "${getDisplayTitle(exhibition)}" from the homepage timeline?`
                : `Feature "${getDisplayTitle(exhibition)}" on the homepage timeline?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button onClick={handleToggleFeatured} disabled={saving}>
              {saving ? 'Saving...' : exhibition.featured ? 'Remove' : 'Feature'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Popup Confirmation */}
      <Dialog open={activeModal === 'togglePopup'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{exhibition.showPopup ? 'Disable Flyer Popup' : 'Enable Flyer Popup'}</DialogTitle>
            <DialogDescription>
              {exhibition.showPopup
                ? `Stop showing the popup flyer for "${getDisplayTitle(exhibition)}" on the homepage?`
                : `Show a popup flyer for "${getDisplayTitle(exhibition)}" when visitors open the homepage? The exhibition must be upcoming or ongoing.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button onClick={handleTogglePopup} disabled={saving}>
              {saving ? 'Saving...' : exhibition.showPopup ? 'Disable' : 'Enable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={activeModal === 'delete'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exhibition</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{getDisplayTitle(exhibition)}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={activeModal === 'edit'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Exhibition</DialogTitle>
            <DialogDescription>Update exhibition details</DialogDescription>
          </DialogHeader>
          <ExhibitionRichForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            onCancel={closeModal}
            saving={saving}
            submitLabel="Save Changes"
            existingImage={exhibition.image}
          />
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={activeModal === 'create'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Exhibition</DialogTitle>
            <DialogDescription>Create a new exhibition</DialogDescription>
          </DialogHeader>
          <ExhibitionRichForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreate}
            onCancel={closeModal}
            saving={saving}
            submitLabel="Create Exhibition"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
