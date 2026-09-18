'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'
import { GRID } from '@/lib/story/layout'

export type Rect = { left: number; top: number; width: number; height: number }
export type Geometry = { padX: number; padY: number; gap: number; cellW: number; cellH: number }

// Must match the grid in Arranged.
const PAD_X = 48
const PAD_Y = 40
const GAP = 16

export function geometryFor(width: number, height: number): Geometry {
  const cellW = (width - 2 * PAD_X - (GRID.cols - 1) * GAP) / GRID.cols
  const cellH = (height - 2 * PAD_Y) / GRID.rows
  return { padX: PAD_X, padY: PAD_Y, gap: GAP, cellW: Math.max(1, cellW), cellH: Math.max(1, cellH) }
}

/**
 * Where each piece actually ended up. The overlay draws on these rather than on
 * computed positions, so the handles sit on what is really on screen even when
 * a row has grown to fit her words.
 */
export function useTileRects(container: RefObject<HTMLElement | null>, dependency: unknown): { rects: Record<string, Rect>; geometry: Geometry } {
  const [rects, setRects] = useState<Record<string, Rect>>({})
  const [size, setSize] = useState({ width: 1280, height: 800 })

  const measure = useCallback(() => {
    const root = container.current
    if (!root) return
    const base = root.getBoundingClientRect()
    setSize({ width: base.width, height: base.height })
    const next: Record<string, Rect> = {}
    root.querySelectorAll<HTMLElement>('[data-tile]').forEach((el) => {
      const key = el.dataset.tile
      if (!key) return
      const r = el.getBoundingClientRect()
      next[key] = { left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height }
    })
    setRects(next)
  }, [container])

  useEffect(() => {
    measure()
    const root = container.current
    if (!root) return
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    root.querySelectorAll<HTMLElement>('[data-tile]').forEach((el) => ro.observe(el))
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure, container, dependency])

  return { rects, geometry: geometryFor(size.width, size.height) }
}
