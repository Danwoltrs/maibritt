'use client'

import React, { useState } from 'react'
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
import { Edit2, Eye, EyeOff, Star, StarOff, Trash2, Plus, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { JournalService, JournalPost, JournalPostCreateData } from '@/services/journal.service'
import { JournalPostForm, JournalFormData, defaultJournalFormData } from '@/components/admin/journal/JournalPostForm'

type ModalType = 'edit' | 'create' | 'delete' | null

interface JournalContextMenuProps {
  post: JournalPost
  children: React.ReactNode
  onUpdate?: () => void
}

export function JournalContextMenu({ post, children, onUpdate }: JournalContextMenuProps) {
  const { isAuthenticated } = useAuth()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [formData, setFormData] = useState<JournalFormData>(defaultJournalFormData)
  const [saving, setSaving] = useState(false)

  if (!isAuthenticated) return <>{children}</>

  const formatDateForInput = (date?: Date) => {
    if (!date) return ''
    return new Date(date).toISOString().slice(0, 16)
  }

  const openEdit = () => {
    setFormData({
      titleEn: post.title.en || '',
      titlePt: post.title.ptBR || '',
      contentEn: post.content.en,
      contentPt: post.content.ptBR,
      excerptEn: post.excerpt?.en || '',
      excerptPt: post.excerpt?.ptBR || '',
      coverImageFile: null,
      tags: post.tags || [],
      published: post.published,
      publishedAt: formatDateForInput(post.publishedAt),
      featured: post.featured,
    })
    setActiveModal('edit')
  }

  const openCreate = () => {
    setFormData({ ...defaultJournalFormData })
    setActiveModal('create')
  }

  const handleTogglePublished = async () => {
    try {
      await JournalService.togglePublished(post.id, !post.published)
      onUpdate?.()
    } catch (err) {
      console.error('Error toggling published:', err)
    }
  }

  const handleToggleFeatured = async () => {
    try {
      await JournalService.toggleFeatured(post.id, !post.featured)
      onUpdate?.()
    } catch (err) {
      console.error('Error toggling featured:', err)
    }
  }

  const handleEdit = async () => {
    try {
      setSaving(true)
      await JournalService.updateJournalPost(post.id, {
        title: { en: formData.titleEn, ptBR: formData.titlePt },
        content: { en: formData.contentEn, ptBR: formData.contentPt },
        excerpt: { en: formData.excerptEn, ptBR: formData.excerptPt },
        newCoverImageFile: formData.coverImageFile || undefined,
        tags: formData.tags,
        published: formData.published,
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt) : undefined,
        featured: formData.featured,
      })
      setActiveModal(null)
      onUpdate?.()
    } catch (err) {
      console.error('Error updating journal post:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    try {
      setSaving(true)
      const createData: JournalPostCreateData = {
        title: { en: formData.titleEn, ptBR: formData.titlePt },
        content: { en: formData.contentEn, ptBR: formData.contentPt },
        excerpt: (formData.excerptEn || formData.excerptPt)
          ? { en: formData.excerptEn, ptBR: formData.excerptPt }
          : undefined,
        coverImageFile: formData.coverImageFile || undefined,
        tags: formData.tags,
        published: formData.published,
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt) : undefined,
        featured: formData.featured,
      }
      await JournalService.createJournalPost(createData)
      setActiveModal(null)
      onUpdate?.()
    } catch (err) {
      console.error('Error creating journal post:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setSaving(true)
      await JournalService.deleteJournalPost(post.id)
      setActiveModal(null)
      onUpdate?.()
    } catch (err) {
      console.error('Error deleting journal post:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => window.open(`/journal/${post.slug}`, '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Public Page
          </ContextMenuItem>
          <ContextMenuItem onClick={openEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleTogglePublished}>
            {post.published ? (
              <><EyeOff className="mr-2 h-4 w-4" />Unpublish</>
            ) : (
              <><Eye className="mr-2 h-4 w-4" />Publish</>
            )}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleToggleFeatured}>
            {post.featured ? (
              <><StarOff className="mr-2 h-4 w-4" />Unfeature</>
            ) : (
              <><Star className="mr-2 h-4 w-4" />Feature</>
            )}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => setActiveModal('delete')} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Edit Dialog */}
      <Dialog open={activeModal === 'edit'} onOpenChange={(v) => !v && setActiveModal(null)}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Journal Entry</DialogTitle>
          </DialogHeader>
          <JournalPostForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEdit}
            onCancel={() => setActiveModal(null)}
            saving={saving}
            submitLabel="Save Changes"
            existingCoverImage={post.coverImage}
          />
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={activeModal === 'create'} onOpenChange={(v) => !v && setActiveModal(null)}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Journal Entry</DialogTitle>
          </DialogHeader>
          <JournalPostForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreate}
            onCancel={() => setActiveModal(null)}
            saving={saving}
            submitLabel="Create Entry"
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={activeModal === 'delete'} onOpenChange={(v) => !v && setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Journal Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{post.title.en || post.title.ptBR}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
