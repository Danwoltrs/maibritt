'use client'

const CATEGORY_LABELS: Record<string, string> = {
  painting: 'Painting',
  sculpture: 'Sculpture',
  engraving: 'Engraving',
  video: 'Video',
  installations: 'Installations',
  'mixed-media': 'Mixed Media',
}

export type FilterId = 'all' | 'exhibitions' | string

interface TimelineFiltersProps {
  activeFilters: FilterId[]
  onFiltersChange: (filters: FilterId[]) => void
  availableCategories?: string[]
  hasExhibitions?: boolean
}

export default function TimelineFilters({ activeFilters, onFiltersChange, availableCategories = [], hasExhibitions = true }: TimelineFiltersProps) {
  const filterOptions: { id: string; label: string }[] = [
    { id: 'all', label: 'All' },
    ...(hasExhibitions ? [{ id: 'exhibitions', label: 'Exhibitions' }] : []),
    ...availableCategories.map(cat => ({
      id: cat,
      label: CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
    })),
  ]
  const toggle = (id: FilterId) => {
    if (id === 'all') {
      onFiltersChange(['all'])
      return
    }

    let next: FilterId[] = activeFilters.filter(f => f !== 'all')

    if (next.includes(id)) {
      next = next.filter(f => f !== id)
    } else {
      next = [...next, id]
    }

    if (next.length === 0) next = ['all']
    onFiltersChange(next)
  }

  return (
    <div className="flex gap-1 justify-center flex-wrap py-2.5 px-5 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-16 md:top-20 z-40">
      {filterOptions.map(opt => (
        <button
          key={opt.id}
          onClick={() => toggle(opt.id)}
          className={`
            text-[10px] font-medium tracking-wide uppercase
            py-1 px-3 border cursor-pointer transition-all duration-200 rounded-sm
            ${activeFilters.includes(opt.id)
              ? 'bg-gray-900 border-gray-900 text-white'
              : 'bg-transparent border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900'
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
