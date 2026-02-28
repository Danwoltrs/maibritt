'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, RectangleHorizontal, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BlockWidth, ContentBlock } from './types'

interface SortableBlockProps {
  block: ContentBlock
  onWidthChange: (width: BlockWidth) => void
  onDelete: () => void
  children: React.ReactNode
}

export function SortableBlock({ block, onWidthChange, onDelete, children }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const widthClass = block.width === 'full' ? 'w-full' : 'w-[calc(50%-0.5rem)]'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${widthClass} group relative ${isDragging ? 'opacity-50 z-50' : ''}`}
    >
      {/* Hover toolbar */}
      <div className="absolute -top-3 right-0 z-10 flex items-center gap-0.5 rounded bg-white border shadow-sm px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-0.5 text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <Button
          variant="ghost" size="sm"
          className={`h-6 w-6 p-0 ${block.width === 'full' ? 'text-blue-600' : 'text-gray-400'}`}
          onClick={() => onWidthChange('full')}
          title="Full width"
        >
          <RectangleHorizontal className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="sm"
          className={`h-6 w-6 p-0 ${block.width === 'half' ? 'text-blue-600' : 'text-gray-400'}`}
          onClick={() => onWidthChange('half')}
          title="Half width"
        >
          <Square className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost" size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
          onClick={onDelete}
          title="Delete block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {children}
    </div>
  )
}
