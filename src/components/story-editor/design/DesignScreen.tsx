'use client'

import { useMemo, useRef, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { useEditorStore } from '../store'
import { defaultLayout, readingOrder, sectionLayoutOf, setBlockLayout, setOpeningLayout, TILE_LABEL, type ArrangeTarget } from '@/lib/story/layout'
import { TILE_ROLE } from '@/lib/story/tileStyle'
import { plainFromRich, richFromElement, richFromPlain, richToHtml } from '@/lib/story/rich'
import { updateBlock } from '@/lib/story/document'
import type { SectionLayout, StoryDocument, TextBlock } from '@/lib/story/types'
import { StoryTheme } from '@/components/story/StoryTheme'
import { SoundProvider } from '@/components/story/SoundProvider'
import { EButton, Icon, PageTop } from '../ui'
import { SectionRender, findSection, sectionName, type Section } from './SectionRender'
import { TileOverlay } from './TileOverlay'
import { useTileRects } from './useTileRects'
import { PieceMenu } from './PieceMenu'
import { TextEditing } from './TextEditing'
import { DesignBar } from './DesignBar'

/** The words a piece is showing, so writing starts from what is on screen. */
function textOf(doc: StoryDocument, section: Section, key: string): { html: string; marks: boolean } | null {
  if (section.kind === 'opening') {
    if (key === 'name') return { html: doc.opening.name, marks: false }
    if (key === 'title') return { html: doc.opening.title, marks: false }
    return null
  }
  const block = section.block
  if (block.kind === 'text' && key === 'heading') return { html: block.heading, marks: false }
  if (block.kind === 'text' && key === 'body') return { html: richToHtml(block.rich ?? richFromPlain(block.body)), marks: true }
  if (block.kind === 'audio' && key === 'heading') return { html: block.heading, marks: false }
  if ((block.kind === 'photo' || block.kind === 'video') && key === 'caption') return { html: block.caption, marks: false }
  return null
}

export function DesignScreen({ target, onBack }: { target: ArrangeTarget; onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  const section = useMemo(() => findSection(document, target), [document, target])
  const stored = sectionLayoutOf(document, target)
  const kind = section?.kind === 'opening' ? 'opening' : section?.block.kind

  const [layout, setLayout] = useState<SectionLayout | null>(stored ?? (kind ? defaultLayout(kind) : null))
  const [selected, setSelected] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ key: string; x: number; y: number } | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [grid, setGrid] = useState(true)
  const surface = useRef<HTMLDivElement>(null)
  const shown = layout ?? (kind ? defaultLayout(kind) : null)
  const { rects, geometry } = useTileRects(surface, shown)

  if (!section || !kind || !shown) {
    return (
      <div className="min-h-[100svh]">
        <PageTop title="Move things around" onBack={onBack} />
        <p className="px-6 py-10 text-[20px]" style={{ color: 'var(--ink-2)' }}>This part cannot be designed.</p>
      </div>
    )
  }

  if (kind === 'gallery') {
    return (
      <div className="min-h-[100svh]">
        <PageTop title="Move things around" onBack={onBack} />
        <p className="px-6 py-10 text-[20px]" style={{ color: 'var(--ink-2)' }}>A photo gallery arranges itself. Nothing to move here.</p>
      </div>
    )
  }

  const done = () => {
    apply((d) => (target.type === 'opening' ? setOpeningLayout(d, layout) : setBlockLayout(d, target.chapterId, target.blockId, layout)))
    onBack()
  }

  const commitText = (key: string, el: HTMLElement) => {
    const rich = richFromElement(el)
    const plain = plainFromRich(rich)
    if (section.kind === 'opening') {
      apply((d) => ({ ...d, opening: { ...d.opening, [key === 'name' ? 'name' : 'title']: plain.replace(/\n+/g, ' ').trim() } }))
      return
    }
    const block = section.block
    if (target.type !== 'block') return
    if (block.kind === 'text' && key === 'body') {
      const next: TextBlock = { ...block, rich, body: plain }
      apply((d) => updateBlock(d, target.chapterId, block.id, next))
      return
    }
    const flat = plain.replace(/\n+/g, ' ').trim()
    if (block.kind === 'text' && key === 'heading') apply((d) => updateBlock(d, target.chapterId, block.id, { ...block, heading: flat }))
    else if (block.kind === 'audio' && key === 'heading') apply((d) => updateBlock(d, target.chapterId, block.id, { ...block, heading: flat }))
    else if ((block.kind === 'photo' || block.kind === 'video') && key === 'caption') apply((d) => updateBlock(d, target.chapterId, block.id, { ...block, caption: flat }))
  }

  const startWriting = (key: string) => {
    if (!textOf(document, section, key)) return
    setMenu(null)
    setEditing(key)
  }

  const editable = editing ? textOf(document, section, editing) : null
  const order = readingOrder(shown).filter((k) => rects[k])

  return (
    <div className="relative h-[100svh] w-full overflow-hidden">
      <MotionConfig reducedMotion="always">
        <SoundProvider>
          <StoryTheme look={document.look} className="relative h-[100svh] w-full" >
            <div ref={surface} className="relative h-[100svh] w-full">
              <SectionRender doc={document} section={section} layout={shown} />

              {grid && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: geometry.padX,
                    top: geometry.padY,
                    right: geometry.padX,
                    bottom: geometry.padY,
                    background: `linear-gradient(to right, rgba(181,98,58,0.3) 1px, transparent 1px) 0 0 / ${geometry.cellW + geometry.gap}px ${geometry.cellH}px, linear-gradient(to bottom, rgba(181,98,58,0.3) 1px, transparent 1px) 0 0 / ${geometry.cellW + geometry.gap}px ${geometry.cellH}px`,
                  }}
                  aria-hidden="true"
                />
              )}

              {Object.entries(shown.tiles).map(([key, cell]) =>
                rects[key] ? (
                  <TileOverlay
                    key={key}
                    name={key}
                    rect={rects[key]}
                    cell={cell}
                    geometry={geometry}
                    layout={shown}
                    selected={selected === key}
                    editing={editing === key}
                    onSelect={() => setSelected(key)}
                    onChange={setLayout}
                    onMenu={(x, y) => setMenu({ key, x, y })}
                    onWrite={() => startWriting(key)}
                  />
                ) : null
              )}

              {editing && editable && rects[editing] && (
                <TextEditing
                  rect={rects[editing]}
                  html={editable.html}
                  marks={editable.marks}
                  onCommit={(el) => commitText(editing, el)}
                  onClose={() => setEditing(null)}
                />
              )}
            </div>
          </StoryTheme>
        </SoundProvider>
      </MotionConfig>

      <DesignBar
        title={sectionName(section)}
        grid={grid}
        onGrid={() => setGrid((g) => !g)}
        onBack={onBack}
        onReset={() => { setLayout(null); setSelected(null); setMenu(null) }}
        onDone={done}
        canReset={layout !== null}
      />

      <div className="absolute bottom-0 left-0 right-0 z-[65] flex flex-wrap items-center gap-2 px-4 py-2 backdrop-blur-sm" style={{ background: 'rgba(251,249,245,0.92)', borderTop: '1px solid var(--line)' }}>
        <span className="text-[17px]" style={{ color: 'var(--ink-2)' }}>Right-click or hold a piece to change it. On a phone things stack in this order:</span>
        {order.map((k, i) => (
          <span key={k} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[16px]" style={{ background: 'var(--white)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
            <span className="font-semibold" style={{ color: 'var(--accent)' }}>{i + 1}</span>
            {TILE_LABEL[k] ?? k}
          </span>
        ))}
        {selected && TILE_ROLE[selected] && (
          <EButton variant="quiet" small icon={<Icon name="pencil" size={18} />} onClick={(e) => { const r = (e.target as HTMLElement).getBoundingClientRect(); setMenu({ key: selected, x: r.left, y: Math.max(12, r.top - 360) }) }}>
            Change {TILE_LABEL[selected] ?? selected}
          </EButton>
        )}
      </div>

      {menu && (
        <PieceMenu
          name={menu.key}
          at={{ x: menu.x, y: menu.y }}
          layout={shown}
          onChange={setLayout}
          onWrite={() => startWriting(menu.key)}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  )
}
