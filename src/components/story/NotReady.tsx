import { WORD_DEFAULTS } from '@/lib/story/words'

export function NotReady({ text = WORD_DEFAULTS.notReady }: { text?: string }) {
  return (
    <div className="flex min-h-[100svh] items-center justify-center px-6 text-center" style={{ background: 'var(--paper)' }}>
      <p className="story-serif text-[28px] italic" style={{ color: 'var(--ink-2)' }}>
        {text}
      </p>
    </div>
  )
}
