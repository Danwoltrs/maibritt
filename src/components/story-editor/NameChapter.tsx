'use client'

import { useState } from 'react'
import { useEditorStore } from './store'
import { addChapter, renameChapter } from '@/lib/story/document'
import { EButton, Field, Icon, PageTop, TextInput } from './ui'

export function NameChapter({ chapterId, onBack }: { chapterId?: string; onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  const select = useEditorStore((s) => s.selectChapter)
  const existing = chapterId ? document.chapters.find((c) => c.id === chapterId) : undefined
  const [title, setTitle] = useState(existing?.title ?? '')

  const done = () => {
    const t = title.trim()
    if (!t) return
    if (existing) apply((d) => renameChapter(d, existing.id, t))
    else {
      let newId = ''
      apply((d) => {
        const r = addChapter(d, t)
        newId = r.chapterId
        return r.doc
      })
      select(newId)
    }
    onBack()
  }

  return (
    <div className="min-h-[100svh]">
      <PageTop title={existing ? 'Chapter title' : 'New chapter'} onBack={onBack} />
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-9 px-6 py-16 text-center md:px-0">
        <div className="flex flex-col gap-2.5">
          <h2 className="story-serif m-0 text-[46px] font-medium" style={{ color: 'var(--ink)' }}>{existing ? 'Change the title' : 'Let’s start a new chapter'}</h2>
          <p className="text-[20px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>Give this part of your story a name. You can always change it later.</p>
        </div>
        <Field label="What is this part of your story called?">
          <TextInput big autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && done()} placeholder="For example: Childhood" />
        </Field>
        <div className="flex gap-3.5">
          <EButton variant="quiet" onClick={onBack}>Not now</EButton>
          <EButton variant="primary" icon={<Icon name="arrowRight" />} onClick={done} disabled={!title.trim()}>{existing ? 'Save the title' : 'Start this chapter'}</EButton>
        </div>
      </div>
    </div>
  )
}
