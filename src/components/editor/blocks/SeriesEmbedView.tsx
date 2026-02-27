'use client'

import { useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/**
 * Node view for the seriesEmbed Tiptap node.
 * Renders a compact horizontal card showing cover image, series name, and artwork count.
 * Expected node attributes: seriesId, name, artworkCount, coverImage.
 */
export default function SeriesEmbedView({ node, deleteNode }: NodeViewProps) {
  const [hovered, setHovered] = useState(false)

  const { name, artworkCount, coverImage } = node.attrs as {
    seriesId: string
    name: string
    artworkCount: number | null
    coverImage: string
  }

  return (
    <NodeViewWrapper
      data-type="series-embed"
      contentEditable={false}
      className="my-3"
    >
      <div
        className="relative flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 transition-shadow hover:shadow-sm"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Cover image */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-violet-200">
          {coverImage ? (
            <img
              src={coverImage}
              alt={name || 'Series'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-violet-400">
              No image
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800">
            {name || 'Untitled series'}
          </p>
          {artworkCount != null && (
            <div className="mt-1">
              <Badge variant="secondary" className="text-xs">
                {artworkCount} {artworkCount === 1 ? 'artwork' : 'artworks'}
              </Badge>
            </div>
          )}
        </div>

        {/* Label */}
        <span className="shrink-0 rounded bg-violet-200 px-1.5 py-0.5 text-xs font-medium text-violet-700">
          Series
        </span>

        {/* Delete button */}
        {hovered && (
          <button
            type="button"
            onClick={deleteNode}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow transition-opacity hover:bg-red-600"
            aria-label="Remove series embed"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </NodeViewWrapper>
  )
}
