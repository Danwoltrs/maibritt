'use client'

import { useState } from 'react'
import { useEditorStore } from './store'
import { EButton, Field, Icon, PageTop, TextInput } from './ui'
import { PickOnePhoto } from './PhotoPicker'
import type { ImageRef } from '@/lib/story/types'

export function OpeningEditor({ onBack }: { onBack: () => void }) {
  const opening = useEditorStore((s) => s.document!.opening)
  const apply = useEditorStore((s) => s.apply)
  const [name, setName] = useState(opening.name)
  const [title, setTitle] = useState(opening.title)
  const [portrait, setPortrait] = useState<ImageRef | null>(opening.portrait)
  const [cover, setCover] = useState<ImageRef | null>(opening.cover)

  const done = () => {
    apply((d) => ({ ...d, opening: { name: name.trim(), title: title.trim(), portrait, cover } }))
    onBack()
  }

  return (
    <div className="min-h-[100svh]">
      <PageTop title="Opening screen" onBack={onBack} right={<EButton variant="primary" icon={<Icon name="check" />} onClick={done} disabled={!name.trim()}>Done</EButton>} />
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8 px-6 py-11 md:px-0">
        <Field label="Your name" hint="Shown large on the first screen">
          <TextInput big value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="A title for your story" hint="One line, for example: A life in colour">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <div className="grid gap-8 md:grid-cols-2">
          <PickOnePhoto label="Your portrait" hint="A photo of you, shown in a circle" value={portrait} onChange={setPortrait} round />
          <PickOnePhoto label="Background photo" hint="Sits softly behind your name" value={cover} onChange={setCover} />
        </div>
      </div>
    </div>
  )
}
