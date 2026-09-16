'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useEditorStore } from './store'
import { EButton, Icon } from './ui'

type Phase = 'ask' | 'working' | 'done' | 'error'

export function PublishDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const status = useEditorStore((s) => s.status)
  const doc = useEditorStore((s) => s.document)
  const [phase, setPhase] = useState<Phase>('ask')
  const [copied, setCopied] = useState(false)
  const link = typeof window !== 'undefined' ? `${window.location.origin}/story` : '/story'

  useEffect(() => {
    if (open) {
      setPhase('ask')
      setCopied(false)
    }
  }, [open])

  const publish = async () => {
    setPhase('working')
    try {
      const res = await fetch('/api/story/publish', { method: 'POST' })
      if (!res.ok) throw new Error(String(res.status))
      setPhase('done')
    } catch {
      setPhase('error')
    }
  }

  // The public page shows "still being written" without a name or a chapter,
  // so say what is missing here instead of letting her publish that.
  const missingName = !doc || doc.opening.name.trim() === ''
  const missingChapters = !doc || doc.chapters.length === 0
  const notReady = missingName || missingChapters
  const askText = missingName
    ? 'Add your name on the opening screen first — visitors see that before anything else.'
    : missingChapters
      ? 'Add at least one chapter first.'
      : status === 'saving'
        ? 'Your latest change is still saving. Wait a moment, then try again.'
        : 'Everything you have now will replace what visitors see. You can publish again any time.'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="story-theme max-w-[680px] rounded-[22px] border-0 p-10 text-center [&>button]:hidden" style={{ background: 'var(--paper)' }}>
        {phase === 'done' ? (
          <div className="flex flex-col items-center gap-6">
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full" style={{ background: '#e3ebdd', color: '#3f6b3a' }}><Icon name="check" size={36} /></span>
            <DialogTitle className="story-serif text-[42px] font-medium" style={{ color: 'var(--ink)' }}>Your story is online</DialogTitle>
            <DialogDescription className="max-w-[520px] text-[20px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              Anyone with this link can read it. When you change something and publish again, the link stays the same.
            </DialogDescription>
            <div className="flex w-full flex-wrap items-center gap-3.5 rounded-xl border p-3.5 pl-5" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
              <span className="flex-grow text-left text-[20px]" style={{ color: 'var(--ink)' }}>{link}</span>
              <EButton small onClick={() => navigator.clipboard.writeText(link).then(() => setCopied(true)).catch(() => setCopied(false))}>{copied ? 'Copied' : 'Copy the link'}</EButton>
            </div>
            <div className="flex flex-wrap justify-center gap-3.5">
              <EButton icon={<Icon name="eye" />} onClick={() => window.open(link, '_blank', 'noopener,noreferrer')}>See it as visitors do</EButton>
              <EButton variant="primary" onClick={onClose}>Keep editing</EButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <DialogTitle className="story-serif text-[40px] font-medium leading-tight" style={{ color: 'var(--ink)' }}>Put your story online?</DialogTitle>
            <DialogDescription className="max-w-[520px] text-[20px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              {askText}
            </DialogDescription>
            {phase === 'error' && <p className="text-[18px]" style={{ color: 'var(--red)' }}>Could not publish. Nothing changed online. Try again in a moment.</p>}
            <div className="flex flex-wrap justify-center gap-3.5">
              <EButton onClick={onClose}>Not yet</EButton>
              <EButton variant="primary" icon={<Icon name="send" />} onClick={publish} disabled={notReady || phase === 'working' || status === 'saving'}>{phase === 'working' ? 'Publishing…' : 'Yes, publish it'}</EButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
