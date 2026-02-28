'use client'

import { useState } from 'react'
import { Plus, Type, GalleryVerticalEnd, CalendarDays, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import EmbedSearchModal from '@/components/editor/blocks/EmbedSearchModal'
import type { ContentBlock } from './types'

interface AddContentMenuProps {
  onAddBlock: (block: ContentBlock) => void
}

export function AddContentMenu({ onAddBlock }: AddContentMenuProps) {
  const [embedModal, setEmbedModal] = useState<{
    open: boolean
    type: 'series' | 'exhibition'
  }>({ open: false, type: 'series' })

  const addTextBlock = () => {
    onAddBlock({
      id: crypto.randomUUID(),
      type: 'text',
      width: 'full',
      content: { tiptapDoc: { type: 'doc', content: [{ type: 'paragraph' }] } },
    })
  }

  const addImageBlock = () => {
    onAddBlock({
      id: crypto.randomUUID(),
      type: 'image',
      width: 'full',
      src: '',
      alt: '',
      caption: '',
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEmbedSelect = (data: Record<string, any>) => {
    const type = embedModal.type
    setEmbedModal({ open: false, type: 'series' })

    if (type === 'series') {
      onAddBlock({
        id: crypto.randomUUID(),
        type: 'series',
        width: 'full',
        seriesId: data.seriesId,
        name: data.name,
        coverImage: data.coverImage,
        artworkCount: data.artworkCount,
      })
    } else {
      onAddBlock({
        id: crypto.randomUUID(),
        type: 'exhibition',
        width: 'half',
        exhibitionId: data.exhibitionId,
        title: data.title,
        imageUrl: data.imageUrl,
        subtitle: data.subtitle,
      })
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Content
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={addTextBlock}>
            <Type className="h-4 w-4 mr-2" />
            Text
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEmbedModal({ open: true, type: 'series' })}>
            <GalleryVerticalEnd className="h-4 w-4 mr-2" />
            Works
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEmbedModal({ open: true, type: 'exhibition' })}>
            <CalendarDays className="h-4 w-4 mr-2" />
            Exhibition
          </DropdownMenuItem>
          <DropdownMenuItem onClick={addImageBlock}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Picture
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EmbedSearchModal
        open={embedModal.open}
        onOpenChange={(open) => setEmbedModal(prev => ({ ...prev, open }))}
        type={embedModal.type}
        onSelect={handleEmbedSelect}
      />
    </>
  )
}
