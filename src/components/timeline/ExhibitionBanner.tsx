'use client'

import { Exhibition } from '@/types'

interface ExhibitionBannerProps {
  exhibition: Exhibition
  onClick: () => void
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

  // Get cover image from images array or legacy image field
  const coverImage = exhibition.images?.find(i => i.isCover)?.url
    || exhibition.images?.[0]?.url
    || exhibition.image

  return (
    <div
      onClick={onClick}
      className="bg-[#1a1612] text-[#f7f2eb] cursor-pointer overflow-hidden relative border-t-2 border-[#b8956a] transition-transform duration-250 hover:-translate-y-[3px] group"
    >
      {/* Image */}
      <div className="w-full h-[160px] md:h-[160px] h-[130px] relative overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a3a2a] to-[#0d2a1a]" />
        )}
        <div className="absolute top-2.5 left-2.5 text-[7px] tracking-[3px] uppercase bg-[#b8956a] text-[#1a1612] py-0.5 px-1.5 font-medium">
          {typeLabel}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 pb-5">
        <h3 className="font-serif text-lg font-normal leading-tight mb-1">
          {title}
        </h3>
        <div className="text-[10px] text-[#9a9080] tracking-[0.5px] leading-relaxed">
          {formatDates()} · {exhibition.venue}
          {exhibition.location && `, ${exhibition.location}`}
        </div>
      </div>

      <div className="absolute bottom-3 right-3.5 text-[8px] tracking-[2px] uppercase text-[#b8956a]/50">
        View &rarr;
      </div>
    </div>
  )
}
