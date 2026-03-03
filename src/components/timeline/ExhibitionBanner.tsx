'use client'

import { Exhibition } from '@/types'
import { Badge } from '@/components/ui/badge'

interface ExhibitionBannerProps {
  exhibition: Exhibition
  onClick: () => void
}

const TYPE_COLORS: Record<string, string> = {
  solo: 'bg-blue-100 text-blue-800',
  group: 'bg-green-100 text-green-800',
  residency: 'bg-purple-100 text-purple-800',
  installation: 'bg-amber-100 text-amber-800',
}

const TYPE_LABELS: Record<string, string> = {
  solo: 'Solo Exhibition',
  group: 'Group Exhibition',
  residency: 'Residency',
  installation: 'Installation',
}

export default function ExhibitionBanner({ exhibition, onClick }: ExhibitionBannerProps) {
  const title = exhibition.title.en || exhibition.title.ptBR
  const typeLabel = TYPE_LABELS[exhibition.type] || exhibition.type
  const typeColor = TYPE_COLORS[exhibition.type] || 'bg-gray-100 text-gray-800'

  const formatDates = () => {
    const parts: string[] = []
    if (exhibition.startDate) {
      parts.push(exhibition.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }))
    }
    if (exhibition.endDate) {
      parts.push(exhibition.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
    }
    if (parts.length === 2) return `${parts[0]} – ${parts[1]}`
    if (parts.length === 1) return parts[0]
    return String(exhibition.year)
  }

  const coverImage = exhibition.images?.find(i => i.isCover)?.url
    || exhibition.images?.[0]?.url
    || exhibition.image

  return (
    <div
      onClick={onClick}
      className="bg-white text-gray-900 cursor-pointer overflow-hidden relative border border-gray-200 rounded-lg shadow-sm transition-all duration-250 hover:-translate-y-[3px] hover:shadow-lg group"
    >
      {/* Image */}
      <div className="w-full h-[160px] md:h-[160px] relative overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
        )}
        <div className="absolute top-2.5 left-2.5">
          <Badge variant="outline" className={`${typeColor} capitalize text-[10px] border-0`}>
            {typeLabel}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 pb-5">
        <h3 className="text-lg font-medium leading-tight mb-1 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <div className="text-[10px] text-gray-500 tracking-[0.5px] leading-relaxed">
          {formatDates()} · {exhibition.venue}
          {exhibition.location && `, ${exhibition.location}`}
        </div>
      </div>

      <div className="absolute bottom-3 right-3.5 text-[8px] tracking-[2px] uppercase text-gray-400 font-medium">
        View &rarr;
      </div>
    </div>
  )
}
