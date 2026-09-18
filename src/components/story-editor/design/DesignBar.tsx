'use client'

import { EButton, Icon } from '../ui'

export function DesignBar({ title, grid, onGrid, onBack, onReset, onDone, canReset }: {
  title: string
  grid: boolean
  onGrid: () => void
  onBack: () => void
  onReset: () => void
  onDone: () => void
  canReset: boolean
}) {
  return (
    <div
      className="absolute left-0 right-0 top-0 z-[65] flex flex-wrap items-center justify-between gap-3 px-4 py-3 backdrop-blur-sm md:px-6"
      style={{ background: 'rgba(251,249,245,0.92)', borderBottom: '1px solid var(--line)' }}
    >
      <div className="flex items-center gap-3">
        <EButton variant="quiet" small icon={<Icon name="chevronLeft" />} onClick={onBack}>Back to my story</EButton>
        <span className="hidden text-[18px] md:inline" style={{ color: 'var(--ink-2)' }}>{title}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <EButton variant="quiet" small icon={<Icon name="grid" size={20} />} onClick={onGrid}>{grid ? 'Hide the squares' : 'Show the squares'}</EButton>
        <EButton variant="quiet" small icon={<Icon name="undo" size={20} />} onClick={onReset} disabled={!canReset}>Put it back as it was</EButton>
        <EButton variant="primary" small icon={<Icon name="check" />} onClick={onDone}>Done</EButton>
      </div>
    </div>
  )
}
