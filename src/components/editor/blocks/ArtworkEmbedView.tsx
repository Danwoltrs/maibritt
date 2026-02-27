'use client'

import { useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { X } from 'lucide-react'

/**
 * Node view for the artworkEmbed Tiptap node.
 * Renders a compact horizontal card showing thumbnail, title, year, and medium.
 * Attributes are stored on the node by ArtworkEmbedNode.ts.
 */
export default function ArtworkEmbedView({ node, deleteNode }: NodeViewProps) {
  const [hovered, setHovered] = useState(false)

  const { title, year, medium, imageUrl } = node.attrs as {
    artworkId: string
    title: string
    year: number | null
    medium: string
    imageUrl: string
  }

  return (
    <NodeViewWrapper
      data-type="artwork-embed"
      contentEditable={false}
      className="my-3"
    >
      <div
        className="relative flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 transition-shadow hover:shadow-sm"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Thumbnail */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-stone-200">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title || 'Artwork'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
              No image
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800">
            {title || 'Untitled artwork'}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            {[year, medium].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Label */}
        <span className="shrink-0 rounded bg-stone-200 px-1.5 py-0.5 text-xs font-medium text-stone-600">
          Artwork
        </span>

        {/* Delete button */}
        {hovered && (
          <button
            type="button"
            onClick={deleteNode}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow transition-opacity hover:bg-red-600"
            aria-label="Remove artwork embed"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </NodeViewWrapper>
  )
}
