'use client'

import { type Editor } from '@tiptap/react'
import { useState } from 'react'
import {
  Bold, Italic, Strikethrough, Code,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight,
  Link2, Unlink,
  Image as ImageIcon, Columns2, Columns3,
  Palette, GalleryVerticalEnd, CalendarDays,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import EmbedSearchModal from './blocks/EmbedSearchModal'

interface EditorToolbarProps {
  editor: Editor
  language: 'en' | 'ptBR'
}

export function EditorToolbar({ editor, language }: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
  const [embedModal, setEmbedModal] = useState<{
    open: boolean
    type: 'artwork' | 'exhibition' | 'series'
  }>({ open: false, type: 'artwork' })

  const setLink = () => {
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run()
    }
    setLinkPopoverOpen(false)
    setLinkUrl('')
  }

  const handleImageUpload = () => {
    // Insert an empty image upload node - the view component handles the actual upload
    editor.chain().focus().insertContent({
      type: 'imageUpload',
      attrs: { src: '', alt: '', caption: '', width: 'full' }
    }).run()
  }

  const handleInsertColumns = (cols: 2 | 3) => {
    const content = Array.from({ length: cols }, () => ({
      type: 'columnContent',
      content: [{ type: 'paragraph' }]
    }))
    editor.chain().focus().insertContent({
      type: 'columnLayout',
      attrs: { columns: cols },
      content
    }).run()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEmbedSelect = (data: any) => {
    const type = embedModal.type
    if (type === 'artwork') {
      editor.chain().focus().insertContent({
        type: 'artworkEmbed',
        attrs: {
          artworkId: data.id,
          title: data.title?.en || data.title?.ptBR || '',
          year: data.year,
          medium: data.medium?.en || '',
          imageUrl: data.images?.[0]?.thumbnail || data.images?.[0]?.display || '',
        }
      }).run()
    } else if (type === 'exhibition') {
      editor.chain().focus().insertContent({
        type: 'exhibitionEmbed',
        attrs: {
          exhibitionId: data.id,
          title: data.title?.en || data.title?.ptBR || '',
          year: data.year,
          venue: data.venue || '',
          imageUrl: data.image || '',
        }
      }).run()
    } else if (type === 'series') {
      editor.chain().focus().insertContent({
        type: 'seriesEmbed',
        attrs: {
          seriesId: data.id,
          name: data.name || '',
          coverImage: data.coverImage || '',
          artworkCount: data.artworkCount || 0,
        }
      }).run()
    }
    setEmbedModal({ open: false, type: 'artwork' })
  }

  const ToolbarButton = ({ onClick, isActive, children, title }: {
    onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`h-7 w-7 p-0 ${isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
      title={title}
    >
      {children}
    </Button>
  )

  const Separator = () => <div className="w-px h-5 bg-gray-200 mx-0.5" />

  return (
    <>
      <div className="flex items-center gap-0.5 py-1 flex-wrap">
        {/* Text formatting */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Code">
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator />

        {/* Headings */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator />

        {/* Lists & quotes */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator />

        {/* Alignment */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align left">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align center">
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align right">
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator />

        {/* Link */}
        <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
              title="Link"
            >
              <Link2 className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2">
            <div className="flex gap-1">
              <Input
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setLink()}
                className="h-8 text-sm"
              />
              <Button size="sm" className="h-8" onClick={setLink}>Set</Button>
            </div>
          </PopoverContent>
        </Popover>
        {editor.isActive('link') && (
          <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link">
            <Unlink className="h-3.5 w-3.5" />
          </ToolbarButton>
        )}

        <Separator />

        {/* Embeds & Media */}
        <ToolbarButton onClick={() => setEmbedModal({ open: true, type: 'artwork' })} title="Insert artwork">
          <Palette className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => setEmbedModal({ open: true, type: 'exhibition' })} title="Insert exhibition">
          <CalendarDays className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => setEmbedModal({ open: true, type: 'series' })} title="Insert works">
          <GalleryVerticalEnd className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={handleImageUpload} title="Insert image">
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleInsertColumns(2)} title="2-column layout">
          <Columns2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleInsertColumns(3)} title="3-column layout">
          <Columns3 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <EmbedSearchModal
        open={embedModal.open}
        onOpenChange={(open: boolean) => setEmbedModal(prev => ({ ...prev, open }))}
        type={embedModal.type}
        onSelect={handleEmbedSelect}
      />
    </>
  )
}
