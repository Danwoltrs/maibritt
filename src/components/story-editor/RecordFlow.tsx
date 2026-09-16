'use client'

import { useState } from 'react'
import { useEditorStore } from './store'
import { findBlock, insertBlock, newId, updateBlock } from '@/lib/story/document'
import type { Screen } from './screens'
import { EButton, Field, Icon, PageTop, TextInput } from './ui'
import { Recorder } from './Recorder'
import type { AudioBlock, AudioRef } from '@/lib/story/types'

export function RecordFlow({ screen, onBack }: { screen: Extract<Screen, { kind: 'record' }>; onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  const existing = screen.blockId ? (findBlock(document, screen.blockId)?.block as AudioBlock | undefined) : undefined
  const [heading, setHeading] = useState(existing?.heading ?? '')
  const [audio, setAudio] = useState<AudioRef | null>(existing?.audio ?? null)
  const [rerecord, setRerecord] = useState(!existing)

  const save = (a: AudioRef) => {
    const block: AudioBlock = { id: existing?.id ?? newId(), kind: 'audio', heading: heading.trim(), audio: a }
    if (existing) apply((d) => updateBlock(d, screen.chapterId, existing.id, block))
    else apply((d) => insertBlock(d, screen.chapterId, screen.insertIndex, block))
    onBack()
  }

  return (
    <div className="min-h-[100svh]">
      <PageTop title="Record my voice" onBack={onBack} />
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-10 px-6 py-10 md:px-0">
        <Field label="A short title for this part" hint="Optional, shown above the player">
          <TextInput value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="For example: The tablecloth" />
        </Field>
        {rerecord || !audio ? (
          <Recorder onKeep={save} onCancel={onBack} initialTranscript={existing?.audio.transcript ?? ''} />
        ) : (
          <div className="flex flex-col items-center gap-6">
            <audio src={audio.url} controls className="w-full" />
            <div className="flex gap-4">
              <EButton icon={<Icon name="mic" />} onClick={() => setRerecord(true)}>Record again</EButton>
              <EButton variant="primary" icon={<Icon name="check" />} onClick={() => save(audio)}>Keep it</EButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
