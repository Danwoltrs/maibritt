'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { useEffect, useState } from 'react'
import {
  Bold, Italic, Heading2, Heading3,
  List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight,
  Link2, Unlink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { TiptapDoc } from '../types'

interface TextBlockEditorProps {
  content: TiptapDoc | null
  onChange: (doc: TiptapDoc) => void
}

export function TextBlockEditor({ content, onChange }: TextBlockEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [linkOpen, setLinkOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
      }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-600 underline' },
      }),
    ],
    content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as TiptapDoc)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-gray max-w-none focus:outline-none min-h-[120px] px-3 py-2',
      },
    },
  })

  useEffect(() => {
    if (editor && content) {
      const cur = JSON.stringify(editor.getJSON())
      const next = JSON.stringify(content)
      if (cur !== next) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  if (!editor) return null

  const setLink = () => {
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run()
    }
    setLinkOpen(false)
    setLinkUrl('')
  }

  const Btn = ({ onClick, active, children, title }: {
    onClick: () => void; active?: boolean; children: React.ReactNode; title: string
  }) => (
    <Button
      variant="ghost" size="sm" onClick={onClick} title={title}
      className={`h-6 w-6 p-0 ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
    >
      {children}
    </Button>
  )

  return (
    <div className="border rounded bg-white overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b bg-gray-50 flex-wrap">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className="h-3 w-3" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="h-3 w-3" />
        </Btn>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="h-3 w-3" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="h-3 w-3" />
        </Btn>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List className="h-3 w-3" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
          <ListOrdered className="h-3 w-3" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote className="h-3 w-3" />
        </Btn>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Left">
          <AlignLeft className="h-3 w-3" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">
          <AlignCenter className="h-3 w-3" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Right">
          <AlignRight className="h-3 w-3" />
        </Btn>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <Popover open={linkOpen} onOpenChange={setLinkOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 ${editor.isActive('link') ? 'bg-gray-200' : ''}`} title="Link">
              <Link2 className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="flex gap-1">
              <Input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setLink()} className="h-7 text-xs" />
              <Button size="sm" className="h-7 text-xs" onClick={setLink}>Set</Button>
            </div>
          </PopoverContent>
        </Popover>
        {editor.isActive('link') && (
          <Btn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link">
            <Unlink className="h-3 w-3" />
          </Btn>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
