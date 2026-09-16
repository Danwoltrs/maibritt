'use client'

import { useState } from 'react'
import { useEditorStore } from '../store'
import { setLook } from '@/lib/story/look'
import type { StoryLook } from '@/lib/story/types'
import { PageTop } from '../ui'
import { LookPreview } from './LookPreview'
import { FontSection } from './FontSection'
import { ColourSection } from './ColourSection'
import { WordSection } from './WordSection'

export function LookScreen({ onBack }: { onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  // Local copy so the preview follows every tap immediately; each discrete change is also committed to the store.
  const [look, setLocal] = useState<StoryLook>(document.look)

  const commit = (next: StoryLook) => {
    setLocal(next)
    apply((d) => setLook(d, next))
  }

  return (
    <div className="min-h-[100svh]">
      <PageTop title="The look of my story" onBack={onBack} />
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-6 py-8 md:flex-row md:items-start md:gap-12 md:px-8 md:py-11">
        <div className="sticky top-0 z-20 -mx-6 px-6 py-3 md:order-2 md:mx-0 md:w-[480px] md:shrink-0 md:px-0 md:py-0" style={{ background: 'var(--paper)' }}>
          <span className="mb-2 block text-[18px] uppercase tracking-[0.08em]" style={{ color: 'var(--ink-2)' }}>How it will look</span>
          <LookPreview document={document} look={look} />
        </div>
        <div className="flex min-w-0 flex-grow flex-col gap-12 md:order-1">
          <FontSection look={look} name={document.opening.name} onChange={(fonts) => commit({ ...look, fonts })} />
          <ColourSection colors={look.colors} onPreview={(colors) => setLocal({ ...look, colors })} onChange={(colors) => commit({ ...look, colors })} />
          <WordSection look={look} name={document.opening.name} onCommit={commit} />
        </div>
      </div>
    </div>
  )
}
