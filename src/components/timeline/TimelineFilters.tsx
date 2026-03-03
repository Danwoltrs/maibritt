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
    <div className="flex gap-1 justify-center flex-wrap py-2.5 px-5 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-16 md:top-20 z-[90]">
      {FILTER_OPTIONS.map(opt => (
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
