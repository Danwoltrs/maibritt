'use client'

import { useEditorStore } from './store'
import { Icon } from './ui'

export function ChapterPills({ onNewChapter }: { onNewChapter: () => void }) {
  const chapters = useEditorStore((s) => s.document?.chapters ?? [])
  const selected = useEditorStore((s) => s.selectedChapterId)
  const select = useEditorStore((s) => s.selectChapter)

  return (
    <div className="flex flex-wrap items-center gap-3 border-b px-6 py-5 md:px-12" style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}>
      <span className="mr-2 text-[18px] uppercase tracking-[0.1em]" style={{ color: 'var(--ink-2)' }}>Chapters</span>
      {chapters.map((c) => {
        const active = c.id === selected
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => select(c.id)}
            className="inline-flex h-14 items-center rounded-full px-5 text-[19px]"
            style={{
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--white)' : 'var(--ink)',
              background: active ? 'var(--ink)' : 'transparent',
              border: `2px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
            }}
          >
            {c.title || 'Untitled chapter'}
          </button>
        )
      })}
      <button type="button" onClick={onNewChapter} className="inline-flex h-14 items-center gap-2 rounded-full px-4 text-[19px]" style={{ color: 'var(--accent)', border: '2px dashed var(--accent)' }}>
        <Icon name="plus" size={18} />
        <span>New chapter</span>
      </button>
    </div>
  )
}
