'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { DndContext, PointerSensor, useDraggable, useSensor, useSensors, type DragEndEvent, type Modifier } from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { MotionConfig } from 'framer-motion'
import type { GridRect, SectionLayout, StoryLook } from '@/lib/story/types'
import { GRID, TILE_LABEL, moveTile, resizeTile } from '@/lib/story/layout'
import { StoryTheme } from '@/components/story/StoryTheme'
import { SoundProvider } from '@/components/story/SoundProvider'

const FRAME_WIDTH = 1280
const ASPECT = 10 / 16

type Cell = { w: number; h: number }

type Props = {
  look: StoryLook
  layout: SectionLayout
  tiles: Record<string, ReactNode>
  backdrop: { image: string | null; dark: boolean }
  selected: string | null
  onSelect: (key: string | null) => void
  onChange: (layout: SectionLayout) => void
}

function Tile({ id, rect, cell, scale, selected, onSelect, onResize, children }: { id: string; rect: GridRect; cell: Cell; scale: number; selected: boolean; onSelect: () => void; onResize: (dw: number, dh: number) => void; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const [grow, setGrow] = useState({ w: 0, h: 0 })
  const start = useRef<{ x: number; y: number } | null>(null)
  const width = Math.max(cell.w, rect.w * cell.w + grow.w)
  const height = Math.max(cell.h, rect.h * cell.h + grow.h)
  const name = TILE_LABEL[id] ?? id

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDownCapture={onSelect}
      className="absolute cursor-grab select-none"
      style={{
        left: rect.x * cell.w,
        top: rect.y * cell.h,
        width,
        height,
        touchAction: 'none',
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        outline: selected ? '2px solid var(--accent)' : '1px dashed rgba(181,98,58,0.55)',
        outlineOffset: -1,
        zIndex: isDragging || selected ? 3 : 2,
        opacity: isDragging ? 0.85 : 1,
      }}
      aria-label={`${name}. Drag to move, use the arrow keys to nudge.`}
    >
      <div className="pointer-events-none flex flex-col justify-center overflow-hidden" style={{ width: width / scale, height: height / scale, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
      <span className="pointer-events-none absolute left-1 top-1 rounded px-1.5 py-0.5 text-[12px] font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>{name}</span>
      <button
        type="button"
        aria-label={`Resize ${name}`}
        className="absolute bottom-0 right-0 h-7 w-7 cursor-nwse-resize rounded-tl-[8px]"
        style={{ background: 'var(--accent)', touchAction: 'none' }}
        onPointerDown={(e) => {
          e.stopPropagation()
          e.currentTarget.setPointerCapture(e.pointerId)
          start.current = { x: e.clientX, y: e.clientY }
        }}
        onPointerMove={(e) => {
          if (!start.current) return
          setGrow({ w: e.clientX - start.current.x, h: e.clientY - start.current.y })
        }}
        onPointerUp={(e) => {
          if (!start.current) return
          const dw = Math.round((e.clientX - start.current.x) / cell.w)
          const dh = Math.round((e.clientY - start.current.y) / cell.h)
          start.current = null
          setGrow({ w: 0, h: 0 })
          if (dw || dh) onResize(dw, dh)
        }}
      />
    </div>
  )
}

export function ArrangeCanvas({ look, layout, tiles, backdrop, selected, onSelect, onChange }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(960)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const height = width * ASPECT
  const cell: Cell = { w: width / GRID.cols, h: height / GRID.rows }
  const scale = width / FRAME_WIDTH
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const snap: Modifier = ({ transform }) => ({
    ...transform,
    x: Math.round(transform.x / cell.w) * cell.w,
    y: Math.round(transform.y / cell.h) * cell.h,
  })

  const onDragEnd = (e: DragEndEvent) => {
    const dx = Math.round(e.delta.x / cell.w)
    const dy = Math.round(e.delta.y / cell.h)
    if (dx || dy) onChange(moveTile(layout, String(e.active.id), dx, dy))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!selected) return
    if (e.key === 'Escape') {
      onSelect(null)
      return
    }
    const step: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const d = step[e.key]
    if (!d) return
    e.preventDefault()
    onChange(moveTile(layout, selected, d[0], d[1]))
  }

  const gridLines = `linear-gradient(to right, rgba(181,98,58,0.35) 1px, transparent 1px) 0 0 / ${cell.w}px ${cell.h}px, linear-gradient(to bottom, rgba(181,98,58,0.35) 1px, transparent 1px) 0 0 / ${cell.w}px ${cell.h}px`

  return (
    <div ref={box} className="w-full outline-none" tabIndex={0} onKeyDown={onKeyDown} onPointerDown={(e) => e.target === e.currentTarget && onSelect(null)}>
      <MotionConfig reducedMotion="always">
        <SoundProvider>
          <StoryTheme look={look} className="relative overflow-hidden rounded-[14px]" style={{ width, height, background: backdrop.dark ? 'var(--backdrop)' : 'var(--paper)', border: '2px solid var(--line)' }}>
            {backdrop.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={backdrop.image} alt="" className="story-photo absolute inset-0 h-full w-full object-cover" style={{ opacity: 0.55 }} />
            )}
            <div className="absolute inset-0" style={{ background: gridLines, backgroundRepeat: 'repeat' }} aria-hidden="true" />
            <DndContext sensors={sensors} modifiers={[snap, restrictToParentElement]} onDragEnd={onDragEnd}>
              {Object.entries(layout.tiles).map(([key, rect]) =>
                tiles[key] ? (
                  <Tile key={key} id={key} rect={rect} cell={cell} scale={scale} selected={selected === key} onSelect={() => onSelect(key)} onResize={(dw, dh) => onChange(resizeTile(layout, key, dw, dh))}>
                    {tiles[key]}
                  </Tile>
                ) : null
              )}
            </DndContext>
          </StoryTheme>
        </SoundProvider>
      </MotionConfig>
    </div>
  )
}
