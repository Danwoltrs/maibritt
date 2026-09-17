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
// The page grid (Arranged.tsx) pads 40px/48px and gaps columns by 16px on a
// 1280 × 800 screen. The canvas mirrors that, scaled, so a tile lands where
// she put it.
const PAD_X = 48
const PAD_Y = 40
const GAP = 16
const SELECTION = '#b5623a'

type Cell = { w: number; h: number; gap: number; padX: number; padY: number }

function tileBox(rect: GridRect, cell: Cell) {
  return {
    left: cell.padX + rect.x * (cell.w + cell.gap),
    top: cell.padY + rect.y * cell.h,
    width: rect.w * cell.w + (rect.w - 1) * cell.gap,
    height: rect.h * cell.h,
  }
}

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
  const box = tileBox(rect, cell)
  const width = Math.max(cell.w, box.width + grow.w)
  const height = Math.max(cell.h, box.height + grow.h)
  const name = TILE_LABEL[id] ?? id
  const endResize = () => {
    start.current = null
    setGrow({ w: 0, h: 0 })
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDownCapture={onSelect}
      className="absolute cursor-grab select-none"
      style={{
        left: box.left,
        top: box.top,
        width,
        height,
        touchAction: 'none',
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        outline: selected ? `2px solid ${SELECTION}` : '1px dashed rgba(181,98,58,0.55)',
        outlineOffset: -1,
        zIndex: isDragging || selected ? 3 : 2,
        opacity: isDragging ? 0.85 : 1,
      }}
      aria-label={`${name}. Drag to move, use the arrow keys to nudge.`}
    >
      <div className="pointer-events-none flex flex-col justify-center overflow-hidden" style={{ width: width / scale, height: height / scale, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
      <span className="pointer-events-none absolute left-1 top-1 rounded px-1.5 py-0.5 text-[12px] font-semibold" style={{ background: SELECTION, color: '#fbf9f5' }}>{name}</span>
      <button
        type="button"
        aria-label={`Resize ${name}`}
        className="absolute bottom-0 right-0 h-7 w-7 cursor-nwse-resize rounded-tl-[8px]"
        style={{ background: SELECTION, touchAction: 'none' }}
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
          const dw = Math.round((e.clientX - start.current.x) / (cell.w + cell.gap))
          const dh = Math.round((e.clientY - start.current.y) / cell.h)
          endResize()
          if (dw || dh) onResize(dw, dh)
        }}
        onPointerCancel={endResize}
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
  const scale = width / FRAME_WIDTH
  const padX = PAD_X * scale
  const padY = PAD_Y * scale
  const gap = GAP * scale
  const cell: Cell = { w: (width - 2 * padX - (GRID.cols - 1) * gap) / GRID.cols, h: (height - 2 * padY) / GRID.rows, gap, padX, padY }
  const pitchX = cell.w + cell.gap
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const snap: Modifier = ({ transform }) => ({
    ...transform,
    x: Math.round(transform.x / pitchX) * pitchX,
    y: Math.round(transform.y / cell.h) * cell.h,
  })

  const onDragEnd = (e: DragEndEvent) => {
    const dx = Math.round(e.delta.x / pitchX)
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

  const gridLines = `linear-gradient(to right, rgba(181,98,58,0.35) 1px, transparent 1px) 0 0 / ${pitchX}px ${cell.h}px, linear-gradient(to bottom, rgba(181,98,58,0.35) 1px, transparent 1px) 0 0 / ${pitchX}px ${cell.h}px`

  return (
    <div ref={box} className="w-full outline-none" tabIndex={0} onKeyDown={onKeyDown}>
      <MotionConfig reducedMotion="always">
        <SoundProvider>
          <StoryTheme look={look} className="relative overflow-hidden rounded-[14px]" style={{ width, height, background: backdrop.dark ? 'var(--backdrop)' : 'var(--paper)', border: '2px solid var(--line)' }}>
            {backdrop.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={backdrop.image} alt="" className="story-photo absolute inset-0 h-full w-full object-cover" style={{ opacity: 0.55 }} />
            )}
            <div className="absolute" style={{ left: padX, top: padY, right: padX, bottom: padY, background: gridLines }} aria-hidden="true" />
            <div className="absolute inset-0" onPointerDown={() => onSelect(null)} aria-hidden="true" />
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
