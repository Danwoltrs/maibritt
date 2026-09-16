'use client'

import { useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useEditorStore } from './store'
import { moveBlock, removeBlock, removeChapter, reorderBlocks, moveChapter } from '@/lib/story/document'
import type { Screen } from './screens'
import { screenForKind } from './screens'
import { TopBar } from './TopBar'
import { ChapterPills } from './ChapterPills'
import { BlockCard } from './BlockCard'
import { AddMenu } from './AddMenu'
import { ConfirmRemove } from './ConfirmRemove'
import { PublishDialog } from './PublishDialog'
import { EButton, Icon } from './ui'
import type { BlockKind } from '@/lib/story/types'

function AddBetween({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <div className="flex h-[72px] items-center gap-5">
      <div className="h-px flex-grow" style={{ background: 'var(--line)' }} />
      <button type="button" onClick={onClick} className="inline-flex h-14 items-center gap-2.5 rounded-full px-7 text-[20px] font-semibold" style={{ color: open ? 'var(--white)' : 'var(--accent)', background: open ? 'var(--accent)' : 'var(--white)', border: '2px solid var(--accent)' }}>
        <Icon name="plus" size={20} />
        <span>Add</span>
      </button>
      <div className="h-px flex-grow" style={{ background: 'var(--line)' }} />
    </div>
  )
}

export function StoryOverview({ go }: { go: (s: Screen) => void }) {
  const document = useEditorStore((s) => s.document)!
  const selectedId = useEditorStore((s) => s.selectedChapterId)
  const apply = useEditorStore((s) => s.apply)
  const chapter = document.chapters.find((c) => c.id === selectedId) ?? null
  const [addAt, setAddAt] = useState<number | null>(null)
  const [removing, setRemoving] = useState<{ kind: 'block'; id: string; label: string } | { kind: 'chapter' } | null>(null)
  const [publishing, setPublishing] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragEnd = (e: DragEndEvent) => {
    if (!chapter || !e.over || e.active.id === e.over.id) return
    const ids = chapter.blocks.map((b) => b.id)
    const next = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)))
    apply((d) => reorderBlocks(d, chapter.id, next))
  }

  const chooseKind = (kind: BlockKind) => {
    if (!chapter || addAt === null) return
    setAddAt(null)
    go(screenForKind(kind, chapter.id, addAt))
  }

  return (
    <div className="min-h-[100svh]">
      <TopBar onPublish={() => setPublishing(true)} onLook={() => go({ kind: 'look' })} />
      <ChapterPills onNewChapter={() => go({ kind: 'name-chapter' })} />
      <div className="mx-auto flex w-full max-w-[880px] flex-col px-6 pb-16 pt-10 md:px-0">
        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
          <div className="flex flex-grow flex-col gap-1">
            <span className="text-[18px] uppercase tracking-[0.08em]" style={{ color: 'var(--ink-2)' }}>Opening screen{document.opening.layout && <span className="normal-case tracking-normal" style={{ color: 'var(--accent-2)' }}> · Arranged by you</span>}</span>
            <span className="story-serif text-[28px]" style={{ color: 'var(--ink)' }}>{document.opening.name || 'Add your name and a title'}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <EButton small icon={<Icon name="pencil" size={20} />} onClick={() => go({ kind: 'opening' })}>Change the opening</EButton>
            <EButton small icon={<Icon name="grid" size={20} />} onClick={() => go({ kind: 'arrange', target: { type: 'opening' } })}>Move things around</EButton>
          </div>
        </div>

        {!chapter ? (
          <div className="flex flex-col items-center gap-6 rounded-[20px] border-2 border-dashed px-10 py-16 text-center" style={{ borderColor: 'var(--line)' }}>
            <p className="max-w-[520px] text-[22px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>Your story has no chapters yet. Start with the first one.</p>
            <EButton variant="primary" icon={<Icon name="plus" />} onClick={() => go({ kind: 'name-chapter' })}>Start a chapter</EButton>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
              <h2 className="story-serif m-0 text-[44px] font-medium" style={{ color: 'var(--ink)' }}>{chapter.title || 'Untitled chapter'}</h2>
              <div className="flex gap-2">
                <EButton variant="quiet" small icon={<Icon name="pencil" size={20} />} onClick={() => go({ kind: 'name-chapter', chapterId: chapter.id })}>Change the title</EButton>
                <EButton variant="quiet" small icon={<Icon name="up" size={20} />} onClick={() => apply((d) => moveChapter(d, chapter.id, -1))}>Earlier</EButton>
                <EButton variant="quiet" small icon={<Icon name="down" size={20} />} onClick={() => apply((d) => moveChapter(d, chapter.id, 1))}>Later</EButton>
              </div>
            </div>

            {chapter.blocks.length === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-6 rounded-[20px] border-2 border-dashed px-10 py-16 text-center" style={{ borderColor: 'var(--line)' }}>
                <p className="max-w-[520px] text-[22px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>This chapter is empty. Add the first thing — a few words, a photo, or your voice.</p>
                <button type="button" onClick={() => setAddAt(0)} className="inline-flex h-16 items-center gap-3 rounded-full px-9 text-[22px] font-semibold" style={{ background: 'var(--accent)', color: 'var(--white)' }}>
                  <Icon name="plus" size={24} />
                  <span>Add</span>
                </button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={chapter.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <AddBetween onClick={() => setAddAt(0)} open={addAt === 0} />
                  {chapter.blocks.map((block, i) => (
                    <div key={block.id} className="flex flex-col">
                      <BlockCard
                        block={block}
                        isFirst={i === 0}
                        isLast={i === chapter.blocks.length - 1}
                        onChange={() => go(screenForKind(block.kind, chapter.id, i, block.id))}
                        onRemove={(label) => setRemoving({ kind: 'block', id: block.id, label })}
                        onMove={(delta) => apply((d) => moveBlock(d, chapter.id, block.id, delta))}
                        onArrange={block.kind === 'gallery' ? undefined : () => go({ kind: 'arrange', target: { type: 'block', chapterId: chapter.id, blockId: block.id } })}
                      />
                      <AddBetween onClick={() => setAddAt(i + 1)} open={addAt === i + 1} />
                    </div>
                  ))}
                </SortableContext>
              </DndContext>
            )}

            <div className="mt-10 flex justify-center">
              <EButton variant="quiet" icon={<Icon name="trash" size={20} />} onClick={() => setRemoving({ kind: 'chapter' })}>Remove this chapter</EButton>
            </div>
          </>
        )}
      </div>

      <AddMenu open={addAt !== null} onClose={() => setAddAt(null)} onChoose={chooseKind} />
      <ConfirmRemove
        open={removing !== null}
        title={removing?.kind === 'chapter' ? 'Remove this whole chapter?' : `Remove this ${removing?.kind === 'block' ? removing.label.toLowerCase() : ''}?`}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (!chapter || !removing) return
          if (removing.kind === 'chapter') apply((d) => removeChapter(d, chapter.id))
          else apply((d) => removeBlock(d, chapter.id, removing.id))
          setRemoving(null)
        }}
      />
      <PublishDialog open={publishing} onClose={() => setPublishing(false)} />
    </div>
  )
}
