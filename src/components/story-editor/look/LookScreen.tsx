'use client'
import { PageTop } from '../ui'
export function LookScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-[100svh]">
      <PageTop title="The look of my story" onBack={onBack} />
    </div>
  )
}
