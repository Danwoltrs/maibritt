'use client'

import { useMemo, useState } from 'react'
import { useEditorStore } from '../store'
import { EButton, Icon, PageTop } from '../ui'
import { defaultLayout, readingOrder, sectionLayoutOf, setBlockLayout, setOpeningLayout, TILE_LABEL, type ArrangeTarget } from '@/lib/story/layout'
import type { SectionLayout } from '@/lib/story/types'
import { sectionTiles } from './tiles'
import { ArrangeCanvas } from './ArrangeCanvas'

export function ArrangeScreen({ target, onBack }: { target: ArrangeTarget; onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  const content = useMemo(() => sectionTiles(document, target), [document, target])
  const stored = sectionLayoutOf(document, target)
  // null = "put it back as it was" (no layout); otherwise the layout being edited. Nothing is saved until Done.
  const [layout, setLayout] = useState<SectionLayout | null>(stored ?? (content ? defaultLayout(content.kind) : null))
  const [selected, setSelected] = useState<string | null>(null)

  if (!content) {
    return (
      <div className="min-h-[100svh]">
        <PageTop title="Move things around" onBack={onBack} />
        <p className="px-6 py-10 text-[20px]" style={{ color: 'var(--ink-2)' }}>This part cannot be moved around.</p>
      </div>
    )
  }

  const done = () => {
    apply((d) => (target.type === 'opening' ? setOpeningLayout(d, layout) : setBlockLayout(d, target.chapterId, target.blockId, layout)))
    onBack()
  }

  const shown = layout ?? defaultLayout(content.kind)
  const order = readingOrder(shown).filter((k) => content.tiles[k])

  return (
    <div className="min-h-[100svh]">
      <PageTop title="Move things around" onBack={onBack} right={<EButton variant="primary" icon={<Icon name="check" />} onClick={done}>Done</EButton>} />
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-7 px-6 py-8 md:px-8 md:py-11">
        <p className="m-0 text-[20px]" style={{ color: 'var(--ink-2)' }}>Drag a piece to move it. Pull the small corner to make it bigger or smaller. Everything snaps to the squares.</p>
        <ArrangeCanvas look={document.look} layout={shown} tiles={content.tiles} backdrop={content.backdrop} selected={selected} onSelect={setSelected} onChange={setLayout} />
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>On a phone, things stack in this order:</span>
          {order.map((k, i) => (
            <span key={k} className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[18px]" style={{ background: 'var(--white)', border: '2px solid var(--line)', color: 'var(--ink)' }}>
              <span className="font-semibold" style={{ color: 'var(--accent)' }}>{i + 1}</span>
              {TILE_LABEL[k] ?? k}
            </span>
          ))}
        </div>
        <div>
          <EButton variant="quiet" icon={<Icon name="undo" size={20} />} onClick={() => { setLayout(null); setSelected(null) }} disabled={layout === null}>Put it back as it was</EButton>
        </div>
      </div>
    </div>
  )
}
