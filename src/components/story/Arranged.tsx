'use client'

import type { ReactNode } from 'react'
import type { SectionLayout } from '@/lib/story/types'
import { alignmentFor, readingOrder } from '@/lib/story/layout'
import { TILE_ROLE, styleOf, tileCss } from '@/lib/story/tileStyle'
import { useIsPhone } from './useIsPhone'

const ALIGN_ITEMS = { left: 'flex-start', center: 'center', right: 'flex-end' } as const

/** A tile's own look, layered over what the grid position implies. */
function Tile({ layout, name, children, className, style }: { layout: SectionLayout; name: string; children: ReactNode; className: string; style?: React.CSSProperties }) {
  const tileStyle = styleOf(layout, name)
  const role = TILE_ROLE[name] ?? 'text'
  const { css, boxCss } = tileCss(tileStyle, role)
  return (
    <div data-tile={name} className={className} style={{ ...style, ...css }}>
      {boxCss ? <div style={boxCss}>{children}</div> : children}
    </div>
  )
}

/**
 * Without a layout: renders `children` (the block's hand-tuned markup).
 * With a layout on a wide screen: a 12 × 8 grid of the named tiles.
 * With a layout on a phone: the tiles stacked in reading order.
 */
export function Arranged({ layout, tiles, children, stackJustify = 'center' }: { layout?: SectionLayout; tiles: Record<string, ReactNode>; children: ReactNode; stackJustify?: 'center' | 'end' }) {
  const isPhone = useIsPhone()
  if (!layout) return <>{children}</>
  const keys = readingOrder(layout).filter((k) => tiles[k])

  if (isPhone) {
    return (
      <div className={`relative z-10 flex min-h-[100svh] flex-col gap-7 px-6 py-16 ${stackJustify === 'end' ? 'justify-end' : 'justify-center'}`}>
        {keys.map((k) => (
          <Tile key={k} layout={layout} name={k} className="min-w-0">
            {tiles[k]}
          </Tile>
        ))}
      </div>
    )
  }

  return (
    <div
      className="relative z-10 grid min-h-[100svh]"
      style={{
        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
        gridTemplateRows: 'repeat(8, minmax(calc((100svh - 80px) / 8), auto))',
        padding: '40px 48px',
        columnGap: 16,
      }}
    >
      {keys.map((k) => {
        const r = layout.tiles[k]
        const align = alignmentFor(r)
        return (
          <Tile
            key={k}
            layout={layout}
            name={k}
            className="flex min-w-0 flex-col justify-center"
            style={{ gridColumn: `${r.x + 1} / span ${r.w}`, gridRow: `${r.y + 1} / span ${r.h}`, textAlign: align, alignItems: ALIGN_ITEMS[align] }}
          >
            {tiles[k]}
          </Tile>
        )
      })}
    </div>
  )
}
