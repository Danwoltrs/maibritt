'use client'
import { PageTop } from '../ui'
import type { ArrangeTarget } from '@/lib/story/layout'
export function ArrangeScreen({ target, onBack }: { target: ArrangeTarget; onBack: () => void }) {
  void target
  return (
    <div className="min-h-[100svh]">
      <PageTop title="Move things around" onBack={onBack} />
    </div>
  )
}
