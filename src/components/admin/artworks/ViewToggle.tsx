'use client'

import { LayoutGrid, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ViewMode = 'table' | 'grid'

interface ViewToggleProps {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 border rounded-md p-0.5">
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2"
        onClick={() => onChange('table')}
      >
        <Table2 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2"
        onClick={() => onChange('grid')}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  )
}
