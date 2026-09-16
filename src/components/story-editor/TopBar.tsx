'use client'

import { useEffect, useState } from 'react'
import { useEditorStore } from './store'
import { EButton, Icon } from './ui'

function relative(savedAt: number | null, now: number): string {
  if (!savedAt) return 'Saved'
  const s = Math.round((now - savedAt) / 1000)
  if (s < 60) return 'Saved a moment ago'
  const m = Math.round(s / 60)
  return m === 1 ? 'Saved a minute ago' : `Saved ${m} minutes ago`
}

export function TopBar({ onPublish }: { onPublish: () => void }) {
  const status = useEditorStore((s) => s.status)
  const savedAt = useEditorStore((s) => s.savedAt)
  const undo = useEditorStore((s) => s.undo)
  const canUndo = useEditorStore((s) => s.undoStack.length > 0)
  const retry = useEditorStore((s) => s.retrySave)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4 md:h-24 md:px-12 md:py-0" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
      <div className="flex items-baseline gap-4">
        <span className="story-serif text-[34px] font-medium" style={{ color: 'var(--ink)' }}>My story</span>
        {status === 'error' ? (
          <span className="flex items-center gap-3 text-[18px]" style={{ color: 'var(--red)' }}>
            Could not save. Check your internet.
            <button type="button" onClick={retry} className="underline underline-offset-4">Try again</button>
          </span>
        ) : (
          <span className="flex items-center gap-2 text-[18px]" style={{ color: 'var(--ink-2)' }}>
            {status === 'saving' ? (
              <span>Saving…</span>
            ) : (
              <>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full" style={{ background: '#e3ebdd', color: '#3f6b3a' }}><Icon name="check" size={14} /></span>
                <span>{relative(savedAt, now)}</span>
              </>
            )}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <EButton onClick={undo} disabled={!canUndo} icon={<Icon name="undo" />}>Undo</EButton>
        <a href="/story/preview" className="se-btn se-btn-secondary"><Icon name="eye" /><span>Preview my story</span></a>
        <EButton variant="primary" onClick={onPublish} icon={<Icon name="send" />}>Publish</EButton>
      </div>
    </div>
  )
}
