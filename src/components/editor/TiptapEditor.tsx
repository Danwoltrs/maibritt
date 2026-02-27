'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
import CharacterCount from '@tiptap/extension-character-count'
import { useEffect, useState, useCallback } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditorToolbar } from './EditorToolbar'
import {
  ArtworkEmbedNode,
  ExhibitionEmbedNode,
  SeriesEmbedNode,
  ImageUploadNode,
  ColumnLayoutNode,
  ColumnContentNode,
} from './extensions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TiptapDoc = Record<string, any>

interface TiptapEditorProps {
  content: TiptapDoc | null
  onChange: (json: TiptapDoc) => void
  placeholder?: string
  language: 'en' | 'ptBR'
}

export function TiptapEditor({ content, onChange, placeholder, language }: TiptapEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-600 underline' },
      }),
      ImageExtension,
      CharacterCount,
      ArtworkEmbedNode,
      ExhibitionEmbedNode,
      SeriesEmbedNode,
      ImageUploadNode,
      ColumnLayoutNode,
      ColumnContentNode,
    ],
    content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as TiptapDoc)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-gray max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  })

  // Update content when switching languages
  useEffect(() => {
    if (editor && content) {
      const currentJson = JSON.stringify(editor.getJSON())
      const newJson = JSON.stringify(content)
      if (currentJson !== newJson) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  if (!editor) return null

  const wordCount = editor.storage.characterCount?.words() ?? 0

  const editorContent = (
    <div className={`border rounded-lg overflow-hidden bg-white ${isFullscreen ? 'flex flex-col h-full' : ''}`}>
      <div className="flex items-center justify-between border-b bg-gray-50 px-2">
        <EditorToolbar editor={editor} language={language} />
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="text-xs text-gray-400">{wordCount} words</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-7 w-7 p-0"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className={`overflow-y-auto ${isFullscreen ? 'flex-1' : 'max-h-[600px]'}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col">
          {editorContent}
        </div>
      </div>
    )
  }

  return editorContent
}
