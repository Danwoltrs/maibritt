'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
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

interface TiptapRendererProps {
  content: TiptapDoc | null
  className?: string
}

export function TiptapRenderer({ content, className = '' }: TiptapRendererProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { class: 'text-blue-600 underline', target: '_blank', rel: 'noopener noreferrer' },
      }),
      ImageExtension,
      ArtworkEmbedNode,
      ExhibitionEmbedNode,
      SeriesEmbedNode,
      ImageUploadNode,
      ColumnLayoutNode,
      ColumnContentNode,
    ],
    content: content || { type: 'doc', content: [] },
    editable: false,
    editorProps: {
      attributes: {
        class: `prose prose-gray max-w-none ${className}`,
      },
    },
  })

  if (!editor) return null

  return <EditorContent editor={editor} />
}
