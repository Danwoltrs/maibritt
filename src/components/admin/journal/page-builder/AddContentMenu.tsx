'use client'

import { useState } from 'react'
import { Plus, Type, GalleryVerticalEnd, CalendarDays, ImageIcon, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import EmbedSearchModal from '@/components/editor/blocks/EmbedSearchModal'
import type { ContentBlock, EmbedDisplay } from './types'

interface AddContentMenuProps {
  onAddBlock: (block: ContentBlock) => void
}

export function AddContentMenu({ onAddBlock }: AddContentMenuProps) {
  const [embedModal, setEmbedModal] = useState<{
    open: boolean
    type: 'series' | 'exhibition'
    display: EmbedDisplay
  }>({ open: false, type: 'series', display: 'card' })

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

  const openEmbed = (type: 'series' | 'exhibition', display: EmbedDisplay) => {
    setEmbedModal({ open: true, type, display })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEmbedSelect = (data: Record<string, any>) => {
    const { type, display } = embedModal
    setEmbedModal({ open: false, type: 'series', display: 'card' })

    if (type === 'series') {
      onAddBlock({
        id: crypto.randomUUID(),
        type: 'series',
        width: display === 'link' ? 'half' : 'full',
        seriesId: data.seriesId,
        name: data.name,
        coverImage: data.coverImage,
        artworkCount: data.artworkCount,
        display,
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
        display,
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openEmbed('series', 'card')}>
            <GalleryVerticalEnd className="h-4 w-4 mr-2" />
            Works
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openEmbed('series', 'link')}>
            <Link2 className="h-4 w-4 mr-2" />
            Works (Link)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openEmbed('exhibition', 'card')}>
            <CalendarDays className="h-4 w-4 mr-2" />
            Exhibition
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openEmbed('exhibition', 'link')}>
            <Link2 className="h-4 w-4 mr-2" />
            Exhibition (Link)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
