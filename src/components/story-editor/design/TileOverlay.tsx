'use client'

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import type { GridRect, SectionLayout } from '@/lib/story/types'
import { TILE_LABEL, moveTile, resizeTile } from '@/lib/story/layout'
import type { Geometry, Rect } from './useTileRects'

const SELECTION = '#b5623a'
const LONG_PRESS_MS = 600

type Props = {
  name: string
  rect: Rect
  cell: GridRect
  geometry: Geometry
  layout: SectionLayout
  selected: boolean
  editing: boolean
  onSelect: () => void
  onChange: (layout: SectionLayout) => void
  onMenu: (x: number, y: number) => void
  onWrite: () => void
}

export function TileOverlay({ name, rect, cell, geometry, layout, selected, editing, onSelect, onChange, onMenu, onWrite }: Props) {
  const drag = useRef<{ x: number; y: number; from: GridRect; mode: 'move' | 'resize' } | null>(null)
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null)
  const label = TILE_LABEL[name] ?? name

  const clearLongPress = () => {
    if (longPress.current) clearTimeout(longPress.current)
    longPress.current = null
  }

  useEffect(() => () => {
    if (longPress.current) clearTimeout(longPress.current)
  }, [])

  const begin = (e: ReactPointerEvent, mode: 'move' | 'resize') => {
    if (editing) return
    // A right-click must not drag: on Windows and Linux the context menu only
    // arrives on button-up, so the piece would move before the menu opened.
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, from: { ...cell }, mode }
    onSelect()
    if (mode === 'move') {
      const { clientX, clientY } = e
      clearLongPress()
      longPress.current = setTimeout(() => {
        drag.current = null
        onMenu(clientX, clientY)
      }, LONG_PRESS_MS)
    }
  }

  const move = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (longPress.current && Math.hypot(dx, dy) > 6) clearLongPress()

    const stepX = Math.round(dx / (geometry.cellW + geometry.gap))
    const stepY = Math.round(dy / geometry.cellH)
    if (d.mode === 'move') {
      const wantX = d.from.x + stepX
      const wantY = d.from.y + stepY
      if (wantX !== cell.x || wantY !== cell.y) onChange(moveTile(layout, name, wantX - cell.x, wantY - cell.y))
    } else {
      const wantW = d.from.w + stepX
      const wantH = d.from.h + stepY
      if (wantW !== cell.w || wantH !== cell.h) onChange(resizeTile(layout, name, wantW - cell.w, wantH - cell.h))
    }
  }

  const end = () => {
    clearLongPress()
    drag.current = null
  }

  const onKeyDown = (e: ReactKeyboardEvent) => {
    const step: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onWrite()
      return
    }
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      e.preventDefault()
      onMenu(rect.left + 24, rect.top + 24)
      return
    }
    const d = step[e.key]
    if (!d) return
    e.preventDefault()
    onSelect()
    onChange(moveTile(layout, name, d[0], d[1]))
  }

  return (
    <div
      className="absolute"
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height, zIndex: selected ? 52 : 50 }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label}. Drag to move it, right-click or hold for more.`}
        className="absolute inset-0 cursor-grab"
        style={{
          touchAction: 'none',
          outline: editing ? 'none' : selected ? `2px solid ${SELECTION}` : '1px dashed rgba(181,98,58,0.6)',
          outlineOffset: 2,
          pointerEvents: editing ? 'none' : 'auto',
        }}
        onKeyDown={onKeyDown}
        onFocus={onSelect}
        onPointerDown={(e) => begin(e, 'move')}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onDoubleClick={onWrite}
        onContextMenu={(e) => {
          e.preventDefault()
          clearLongPress()
          drag.current = null
          onSelect()
          onMenu(e.clientX, e.clientY)
        }}
      />
      {!editing && (
        <>
          <span
            className="pointer-events-none absolute left-0 top-0 rounded-br-[6px] px-2 py-0.5 text-[14px] font-semibold"
            style={{ background: SELECTION, color: '#fbf9f5' }}
          >
            {label}
          </span>
          <button
            type="button"
            aria-label={`Resize ${label}`}
            className="absolute -bottom-1 -right-1 h-7 w-7 cursor-nwse-resize rounded-[6px]"
            style={{ background: SELECTION, touchAction: 'none' }}
            onPointerDown={(e) => begin(e, 'resize')}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />
        </>
      )}
    </div>
  )
}
