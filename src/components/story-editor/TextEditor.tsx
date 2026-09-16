'use client'

import { useState } from 'react'
import { useEditorStore } from './store'
import { findBlock, insertBlock, newId, updateBlock } from '@/lib/story/document'
import type { Screen } from './screens'
import { EButton, Field, Icon, PageTop, TextArea, TextInput } from './ui'
import type { TextBlock } from '@/lib/story/types'

export function TextEditor({ screen, onBack }: { screen: Extract<Screen, { kind: 'text' }>; onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  const existing = screen.blockId ? (findBlock(document, screen.blockId)?.block as TextBlock | undefined) : undefined
  const [heading, setHeading] = useState(existing?.heading ?? '')
  const [body, setBody] = useState(existing?.body ?? '')

  const done = () => {
    const block: TextBlock = { id: existing?.id ?? newId(), kind: 'text', heading: heading.trim(), body: body.trim() }
    if (existing) apply((d) => updateBlock(d, screen.chapterId, existing.id, block))
    else apply((d) => insertBlock(d, screen.chapterId, screen.insertIndex, block))
    onBack()
  }

  return (
    <div className="min-h-[100svh]">
      <PageTop title="Text" onBack={onBack} right={<EButton variant="primary" icon={<Icon name="check" />} onClick={done} disabled={!heading.trim() && !body.trim()}>Done</EButton>} />
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8 px-6 py-11 md:px-0">
        <Field label="Heading">
          <TextInput big value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="For example: How it all began" />
        </Field>
        <Field label="Your words" hint="Leave an empty line between paragraphs">
          <TextArea value={body} onChange={(e) => setBody(e.target.value)} rows={12} placeholder="Write here…" />
        </Field>
        <p className="text-[18px]" style={{ color: 'var(--ink-2)' }}>Press <strong>Done</strong> when you are finished. It is saved to your story straight away.</p>
      </div>
    </div>
  )
}
