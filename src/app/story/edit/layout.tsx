'use client'

import type { ReactNode } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function StoryEditLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard redirectTo="/login">
      <div className="min-h-[100svh]" style={{ background: 'var(--paper)' }}>{children}</div>
    </AuthGuard>
  )
}
