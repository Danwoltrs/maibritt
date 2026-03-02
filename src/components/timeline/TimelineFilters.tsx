'use client'

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'exhibitions', label: 'Exhibitions' },
  { id: 'painting', label: 'Painting' },
  { id: 'sculpture', label: 'Sculpture' },
  { id: 'engraving', label: 'Engraving' },
  { id: 'video', label: 'Video' },
  { id: 'installations', label: 'Installations' },
  { id: 'mixed-media', label: 'Mixed Media' },
] as const

export type FilterId = (typeof FILTER_OPTIONS)[number]['id']

interface TimelineFiltersProps {
  activeFilters: FilterId[]
  onFiltersChange: (filters: FilterId[]) => void
}

export default function TimelineFilters({ activeFilters, onFiltersChange }: TimelineFiltersProps) {
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
    <div className="flex gap-1.5 justify-center flex-wrap py-4 px-5 border-b border-gray-200 bg-white sticky top-[52px] z-[90]">
      {FILTER_OPTIONS.map(opt => (
        <button
          key={opt.id}
          onClick={() => toggle(opt.id)}
          className={`
            font-display text-[9px] tracking-[2px] uppercase
            py-1 px-3.5 border cursor-pointer transition-all duration-200 rounded-sm
            ${activeFilters.includes(opt.id)
              ? 'bg-gray-900 border-gray-900 text-white'
              : 'bg-transparent border-gray-300 text-gray-500 hover:border-blue-600 hover:text-blue-600'
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
