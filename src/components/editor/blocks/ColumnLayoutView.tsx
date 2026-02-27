'use client'

import { useState } from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { X, Columns2, Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const COLUMN_GRID: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
}

export default function ColumnLayoutView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const [hovered, setHovered] = useState(false)

  const columns: 2 | 3 = node.attrs.columns === 3 ? 3 : 2
  const gridClass = COLUMN_GRID[columns]
  const isEditable = editor?.isEditable ?? false

  // Public/read-only: just render the grid, no toolbar or borders
  if (!isEditable) {
    return (
      <NodeViewWrapper data-type="column-layout" className="my-6">
        <NodeViewContent className={`grid ${gridClass} gap-6`} />
      </NodeViewWrapper>
    )
  }

  // Editor: show toolbar with column controls
  return (
    <NodeViewWrapper data-type="column-layout" className="my-4">
      <div
        className="relative rounded-lg border border-stone-200"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b border-stone-200 bg-stone-50 px-2 py-1">
          <span className="mr-1 text-xs text-stone-400">Columns</span>

          <Button
            type="button"
            size="sm"
            variant={columns === 2 ? 'default' : 'outline'}
            className="h-6 gap-1 px-2 text-xs"
            onClick={() => updateAttributes({ columns: 2 })}
            aria-pressed={columns === 2}
          >
            <Columns2 className="h-3 w-3" />2
          </Button>

          <Button
            type="button"
            size="sm"
            variant={columns === 3 ? 'default' : 'outline'}
            className="h-6 gap-1 px-2 text-xs"
            onClick={() => updateAttributes({ columns: 3 })}
            aria-pressed={columns === 3}
          >
            <Columns3 className="h-3 w-3" />3
          </Button>

          <div className="flex-1" />

          {hovered && (
            <button
              type="button"
              onClick={deleteNode}
              className="flex h-5 w-5 items-center justify-center rounded text-stone-400 hover:bg-red-50 hover:text-red-500"
              aria-label="Remove column layout"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Content area rendered as a grid */}
        <NodeViewContent
          className={`grid ${gridClass} divide-x divide-stone-200 p-0`}
        />
      </div>
    </NodeViewWrapper>
  )
}
