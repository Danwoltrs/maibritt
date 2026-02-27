'use client'

import { useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { X } from 'lucide-react'

/**
 * Node view for the exhibitionEmbed Tiptap node.
 * Renders a compact horizontal card showing image, title, year, and venue.
 * Attributes are stored on the node by ExhibitionEmbedNode.ts.
 */
export default function ExhibitionEmbedView({ node, deleteNode }: NodeViewProps) {
  const [hovered, setHovered] = useState(false)

  const { title, year, venue, imageUrl } = node.attrs as {
    exhibitionId: string
    title: string
    year: number | null
    venue: string
    imageUrl: string
  }

  return (
    <NodeViewWrapper
      data-type="exhibition-embed"
      contentEditable={false}
      className="my-3"
    >
      <div
        className="relative flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 transition-shadow hover:shadow-sm"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Thumbnail */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-amber-200">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title || 'Exhibition'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-amber-500">
              No image
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800">
            {title || 'Untitled exhibition'}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            {[year, venue].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Label */}
        <span className="shrink-0 rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-700">
          Exhibition
        </span>

        {/* Delete button */}
        {hovered && (
          <button
            type="button"
            onClick={deleteNode}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow transition-opacity hover:bg-red-600"
            aria-label="Remove exhibition embed"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </NodeViewWrapper>
  )
}
