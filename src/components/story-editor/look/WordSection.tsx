'use client'

import { useEffect, useState } from 'react'
import type { StoryLook, WordKey } from '@/lib/story/types'
import { WORD_DEFAULTS, WORD_INFO, WORD_KEYS, setWord } from '@/lib/story/words'
import { EButton, Field, TextInput } from '../ui'

function WordField({ look, keyName, name, onCommit }: { look: StoryLook; keyName: WordKey; name: string; onCommit: (look: StoryLook) => void }) {
  const stored = look.words[keyName]
  const [value, setValue] = useState(stored ?? '')
  useEffect(() => setValue(stored ?? ''), [stored])
  const info = WORD_INFO[keyName]
  const placeholder =
    keyName === 'voiceLabel'
      ? `${name.trim().split(/\s+/)[0] || 'Mai-Britt'}, in her own voice`
      : keyName === 'chapterWord' && stored === ''
        ? 'No numbering — only your titles'
        : WORD_DEFAULTS[keyName]
  const overridden = stored !== undefined
  const commit = () => {
    if (value === (stored ?? '')) return
    onCommit(setWord(look, keyName, value))
  }
  return (
    <div className="flex flex-col gap-2">
      <Field label={info.label} hint={info.hint || undefined}>
        <TextInput value={value} placeholder={placeholder} onChange={(e) => setValue(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
      </Field>
      {overridden && (
        <div>
          <EButton variant="quiet" small onClick={() => { setValue(''); onCommit(setWord(look, keyName, WORD_DEFAULTS[keyName])) }}>Use the original</EButton>
        </div>
      )}
    </div>
  )
}

export function WordSection({ look, name, onCommit }: { look: StoryLook; name: string; onCommit: (look: StoryLook) => void }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="story-serif m-0 text-[36px] font-medium" style={{ color: 'var(--ink)' }}>Words on the page</h2>
        <p className="m-0 text-[18px]" style={{ color: 'var(--ink-2)' }}>The grey text is what the page says now. Type over it to say it your way.</p>
      </div>
      {WORD_KEYS.map((k) => (
        <WordField key={k} look={look} keyName={k} name={name} onCommit={onCommit} />
      ))}
    </section>
  )
}
