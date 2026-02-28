'use client'

import { useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { AddContentMenu } from './AddContentMenu'
import { SortableBlock } from './SortableBlock'
import { TextBlockEditor } from './blocks/TextBlockEditor'
import { SeriesBlockEditor } from './blocks/SeriesBlockEditor'
import { ExhibitionBlockEditor } from './blocks/ExhibitionBlockEditor'
import { ImageBlockEditor } from './blocks/ImageBlockEditor'
import type { PageBuilderDoc, ContentBlock, BlockWidth } from './types'

interface PageBuilderEditorProps {
  value: PageBuilderDoc
  onChange: (doc: PageBuilderDoc) => void
  hideAddMenu?: boolean
}

export function PageBuilderEditor({ value, onChange, hideAddMenu }: PageBuilderEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const updateBlocks = useCallback(
    (blocks: ContentBlock[]) => {
      onChange({ ...value, blocks })
    },
    [value, onChange]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = value.blocks.findIndex(b => b.id === active.id)
      const newIndex = value.blocks.findIndex(b => b.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      updateBlocks(arrayMove(value.blocks, oldIndex, newIndex))
    },
    [value.blocks, updateBlocks]
  )

  const addBlock = useCallback(
    (block: ContentBlock) => {
      updateBlocks([...value.blocks, block])
    },
    [value.blocks, updateBlocks]
  )

  const updateBlock = useCallback(
    (id: string, updates: Partial<ContentBlock>) => {
      updateBlocks(
        value.blocks.map(b => (b.id === id ? { ...b, ...updates } as ContentBlock : b))
      )
    },
    [value.blocks, updateBlocks]
  )

  const deleteBlock = useCallback(
    (id: string) => {
      updateBlocks(value.blocks.filter(b => b.id !== id))
    },
    [value.blocks, updateBlocks]
  )

  const changeWidth = useCallback(
    (id: string, width: BlockWidth) => {
      updateBlock(id, { width } as Partial<ContentBlock>)
    },
    [updateBlock]
  )

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <TextBlockEditor
            content={block.content.tiptapDoc}
            onChange={(tiptapDoc) =>
              updateBlock(block.id, { content: { tiptapDoc } } as Partial<ContentBlock>)
            }
          />
        )
      case 'series':
        return (
          <SeriesBlockEditor
            seriesId={block.seriesId}
            name={block.name}
            coverImage={block.coverImage}
            artworkCount={block.artworkCount}
          />
        )
      case 'exhibition':
        return (
          <ExhibitionBlockEditor
            exhibitionId={block.exhibitionId}
            title={block.title}
            imageUrl={block.imageUrl}
            subtitle={block.subtitle}
          />
        )
      case 'image':
        return (
          <ImageBlockEditor
            src={block.src}
            alt={block.alt}
            caption={block.caption}
            onChange={(updates) => updateBlock(block.id, updates as Partial<ContentBlock>)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {!hideAddMenu && <AddContentMenu onAddBlock={addBlock} />}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={value.blocks.map(b => b.id)}
          strategy={rectSortingStrategy}
        >
          <div className="flex flex-wrap gap-4 min-h-[100px]">
            {value.blocks.length === 0 && (
              <div className="w-full flex items-center justify-center py-12 text-sm text-gray-400 border-2 border-dashed rounded-lg">
                Click &quot;Add Content&quot; to start building your page
              </div>
            )}
            {value.blocks.map(block => (
              <SortableBlock
                key={block.id}
                block={block}
                onWidthChange={(width) => changeWidth(block.id, width)}
                onDelete={() => deleteBlock(block.id)}
              >
                {renderBlock(block)}
              </SortableBlock>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
