'use client'

import { Artwork } from '@/types'

interface ArtworkCardProps {
  artwork: Artwork
  compact?: boolean
  onClick: () => void
}

export default function ArtworkCard({ artwork, compact = false, onClick }: ArtworkCardProps) {
  const title = artwork.title.en || artwork.title.ptBR
  const medium = artwork.medium.en || artwork.medium.ptBR
  const imageUrl = artwork.images?.[0]?.display || artwork.images?.[0]?.original

  return (
    <div
      onClick={onClick}
      className="bg-white overflow-hidden cursor-pointer border border-gray-200 rounded-lg shadow-sm transition-all duration-220 hover:-translate-y-[3px] hover:shadow-lg relative group"
    >
      {/* Image */}
      <div className={`w-full overflow-hidden relative ${compact ? 'h-[100px]' : 'h-[120px]'}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-xs">No image</span>
          </div>
        )}
        {/* Accent line sweep */}
        <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-blue-600 transition-[width] duration-300 group-hover:w-full" />
      </div>

      {/* Info */}
      <div className={`flex justify-between items-end ${compact ? 'p-[7px_9px]' : 'p-[9px_11px_11px]'}`}>
        <div>
          <h4 className={`font-serif font-normal leading-tight mb-0.5 group-hover:text-blue-600 transition-colors ${compact ? 'text-xs' : 'text-sm'}`}>
            {title}
          </h4>
          <p className="text-[9px] text-gray-500 tracking-[0.5px]">
            {medium}
            {artwork.dimensions && ` · ${artwork.dimensions}`}
          </p>
        </div>
      </div>
    </div>
  )
}
