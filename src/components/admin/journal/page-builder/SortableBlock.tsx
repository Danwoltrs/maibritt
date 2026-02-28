'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, RectangleHorizontal, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BlockWidth, ContentBlock, ThumbnailSize } from './types'

interface SortableBlockProps {
  block: ContentBlock
  onWidthChange: (width: BlockWidth) => void
  onDelete: () => void
  onUpdateBlock?: (updates: Partial<ContentBlock>) => void
  children: React.ReactNode
}

const THUMB_SIZES: { value: ThumbnailSize; label: string }[] = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
]

const MAX_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1)

export function SortableBlock({ block, onWidthChange, onDelete, onUpdateBlock, children }: SortableBlockProps) {
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

  const hasThumbSettings =
    (block.type === 'series' || block.type === 'exhibition') && block.display !== 'link'

  const currentSize: ThumbnailSize =
    hasThumbSettings && 'thumbnailSize' in block ? block.thumbnailSize || 'sm' : 'sm'
  const currentMax: number =
    hasThumbSettings && 'maxThumbnails' in block ? block.maxThumbnails || 20 : 20

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

        {hasThumbSettings && onUpdateBlock && (
          <>
            <div className="w-px h-4 bg-gray-200 mx-0.5" />
            {THUMB_SIZES.map(({ value, label }) => (
              <Button
                key={value}
                variant="ghost" size="sm"
                className={`h-6 w-6 p-0 text-[10px] font-bold ${currentSize === value ? 'text-blue-600' : 'text-gray-400'}`}
                onClick={() => onUpdateBlock({ thumbnailSize: value } as Partial<ContentBlock>)}
                title={`${label === 'S' ? 'Small' : label === 'M' ? 'Medium' : 'Large'} thumbnails`}
              >
                {label}
              </Button>
            ))}
            <div className="w-px h-4 bg-gray-200 mx-0.5" />
            <select
              value={currentMax}
              onChange={(e) => onUpdateBlock({ maxThumbnails: Number(e.target.value) } as Partial<ContentBlock>)}
              className="h-6 text-[10px] bg-transparent border-0 text-gray-500 focus:ring-0 cursor-pointer px-0.5"
              title="Max thumbnails to show"
            >
              {MAX_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </>
        )}

        <div className="w-px h-4 bg-gray-200 mx-0.5" />
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
