'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Story } from '@/components/story/Story'
import { StoryService } from '@/services/story.service'
import type { StoryDocument } from '@/lib/story/types'

export default function StoryPreviewPage() {
  const [doc, setDoc] = useState<StoryDocument | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    StoryService.getDraft().then(setDoc).catch(() => setError('Could not load your story. Check your internet and try again.'))
  }, [])

  return (
    <AuthGuard redirectTo="/login">
      {error ? (
        <div className="flex min-h-[100svh] items-center justify-center px-6 text-[20px]" style={{ color: 'var(--ink)' }}>{error}</div>
      ) : doc ? (
        <Story document={doc} preview />
      ) : (
        <div className="flex min-h-[100svh] items-center justify-center text-[20px]" style={{ color: 'var(--ink-2)' }}>Loading your story…</div>
      )}
    </AuthGuard>
  )
}
