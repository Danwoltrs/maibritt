'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Artwork, Exhibition } from '@/types'
import { ArtworkService } from '@/services/artwork.service'
import { ExhibitionsService } from '@/services/exhibitions.service'
import { QuotesService, Quote } from '@/services/quotes.service'
import TimelineFilters, { FilterId } from './TimelineFilters'
import ExhibitionBanner from './ExhibitionBanner'
import ArtworkCard from './ArtworkCard'
import PressClip from './PressClip'
import ExhibitionOverlay from './ExhibitionOverlay'
import ArtworkOverlay from './ArtworkOverlay'

interface TimelineYear {
  year: number
  exhibitions: Exhibition[]
  artworks: Artwork[]
  pressQuotes: Quote[]
}

interface RiverMagazineTimelineProps {
  id?: string
}

export default function RiverMagazineTimeline({ id }: RiverMagazineTimelineProps) {
  const [years, setYears] = useState<TimelineYear[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<FilterId[]>(['all'])
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null)
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)

  useEffect(() => {
    async function load() {
      const [exhibitions, artworks, quotes] = await Promise.all([
        ExhibitionsService.getTimelineExhibitions(),
        ArtworkService.getTimelineArtworks(),
        QuotesService.getActiveQuotes('press').catch(() => [] as Quote[]),
      ])

      // Collect all unique years
      const yearSet = new Set<number>()
      exhibitions.forEach(e => yearSet.add(e.year))
      artworks.forEach(a => yearSet.add(a.year))

      const sorted = Array.from(yearSet).sort((a, b) => b - a)

      const grouped: TimelineYear[] = sorted.map(year => ({
        year,
        exhibitions: exhibitions.filter(e => e.year === year),
        artworks: artworks.filter(a => a.year === year),
        pressQuotes: quotes.filter(q => {
          if (!q.sourceDate) return false
          return new Date(q.sourceDate).getFullYear() === year
        }),
      }))

      setYears(grouped)
      setLoading(false)
    }
    load()
  }, [])

  // Check if an item passes the active filters
  const isExhibitionVisible = useCallback((e: Exhibition) => {
    if (activeFilters.includes('all')) return true
    return activeFilters.includes('exhibitions')
  }, [activeFilters])

  const isArtworkVisible = useCallback((a: Artwork) => {
    if (activeFilters.includes('all')) return true
    return activeFilters.includes(a.category)
  }, [activeFilters])

  const isYearVisible = useCallback((ty: TimelineYear) => {
    if (activeFilters.includes('all')) return true
    const hasVisibleExh = activeFilters.includes('exhibitions') && ty.exhibitions.length > 0
    const hasVisibleArt = ty.artworks.some(a => activeFilters.includes(a.category))
    return hasVisibleExh || hasVisibleArt
  }, [activeFilters])

  if (loading) {
    return (
      <section id={id} className="bg-[#faf8f4] py-20">
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-2 border-[#b8956a] border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    )
  }

  if (years.length === 0) {
    return (
      <section id={id} className="bg-[#faf8f4] py-20">
        <div className="text-center text-[#9a9080]">
          <p className="text-sm">No timeline items yet.</p>
        </div>
      </section>
    )
  }

  return (
    <section id={id} className="bg-[#faf8f4]">
      {/* Page Intro */}
      <div className="text-center py-13 px-6 border-b border-[#e8e0d5]">
        <p className="text-[9px] tracking-[4px] uppercase text-[#b8956a] mb-3">Artistic Journey</p>
        <h2 className="font-serif text-[clamp(28px,6vw,52px)] font-light leading-[1.1] mb-3">
          Exhibitions & <em className="italic">Works</em>
        </h2>
        <p className="text-xs text-[#9a9080] max-w-[400px] mx-auto leading-relaxed">
          A chronological view of exhibitions and selected works.
        </p>
      </div>

      {/* Filter Bar */}
      <TimelineFilters activeFilters={activeFilters} onFiltersChange={setActiveFilters} />

      {/* Timeline */}
      <div className="max-w-[1100px] mx-auto px-10 max-md:px-5 py-[72px] pb-[120px] relative">
        {/* Desktop spine */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, #b8956a 3%, rgba(184,149,106,0.25) 50%, rgba(184,149,106,0.25) 97%, transparent 100%)',
          }}
        />

        {years.map((ty) => {
          const yearFaded = !isYearVisible(ty)

          return (
            <div
              key={ty.year}
              className={`transition-opacity duration-500 ${yearFaded ? 'opacity-[0.15] pointer-events-none' : ''}`}
            >
              {/* Year Marker */}
              <div className="relative text-center mt-14 mb-10 max-md:mt-10 max-md:mb-7 z-[2]">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-[clamp(60px,11vw,120px)] max-md:text-[clamp(48px,15vw,80px)] font-light text-[rgba(26,22,18,0.05)] max-md:opacity-60 pointer-events-none select-none whitespace-nowrap leading-none">
                  {ty.year}
                </div>
                <div className="inline-block relative bg-[#faf8f4] border border-[#b8956a] text-[#b8956a] text-[10px] tracking-[4px] py-1 px-4.5 z-[2]">
                  {ty.year}
                </div>
              </div>

              {/* Timeline Row */}
              {/* Desktop: 3-column grid; Mobile: single column with left border */}
              <div className="
                md:grid md:grid-cols-[1fr_64px_1fr] md:items-start md:mb-12
                max-md:block max-md:pl-7 max-md:border-l max-md:border-[rgba(184,149,106,0.35)] max-md:ml-3 max-md:mb-9 max-md:relative
              ">
                {/* Mobile spine dot */}
                <div className="md:hidden absolute -left-[5px] top-5 w-[9px] h-[9px] rounded-full bg-[#b8956a] border-2 border-[#faf8f4] shadow-[0_0_0_1px_#b8956a]" />

                {/* LEFT: Exhibitions + Press */}
                <div className="md:col-start-1 md:pr-9 max-md:pr-0 max-md:mb-5">
                  {ty.exhibitions.length > 0 ? (
                    <div className="space-y-3">
                      {ty.exhibitions.map((exh) => (
                        <div
                          key={exh.id}
                          className={`transition-opacity duration-500 ${!isExhibitionVisible(exh) ? 'opacity-[0.15] pointer-events-none' : ''}`}
                        >
                          <ExhibitionBanner
                            exhibition={exh}
                            onClick={() => setSelectedExhibition(exh)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#d8d0c6] p-4.5 text-center mt-5">
                      <div className="text-[8px] tracking-[3px] uppercase text-[#c8c0b4] mb-1.5">No Exhibition</div>
                      <div className="font-serif text-[13px] text-[#9a9080] italic">Studio year</div>
                    </div>
                  )}

                  {/* Press clips */}
                  {ty.pressQuotes.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {ty.pressQuotes.map((q) => (
                        <PressClip key={q.id} quote={q} />
                      ))}
                    </div>
                  )}
                </div>

                {/* CENTER: Spine dot (desktop only) */}
                <div className="hidden md:flex md:col-start-2 flex-col items-center pt-6">
                  <div className={`rounded-full border-[3px] border-[#faf8f4] shadow-[0_0_0_1px_#b8956a] relative z-[3] ${
                    ty.exhibitions.length > 0
                      ? 'w-[11px] h-[11px] bg-[#b8956a]'
                      : 'w-[7px] h-[7px] bg-[#7a8c7e] shadow-[0_0_0_1px_#7a8c7e] border-2'
                  }`} />
                </div>

                {/* RIGHT: Artworks */}
                <div className="md:col-start-3 md:pl-9 max-md:pl-0">
                  <div className="flex flex-col gap-3">
                    {renderArtworkColumn(ty.artworks, isArtworkVisible, setSelectedArtwork)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Overlays */}
      {selectedExhibition && (
        <ExhibitionOverlay
          exhibition={selectedExhibition}
          onClose={() => setSelectedExhibition(null)}
        />
      )}
      {selectedArtwork && (
        <ArtworkOverlay
          artwork={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
        />
      )}
    </section>
  )
}

/**
 * Render artworks in a column, pairing small works side-by-side
 */
function renderArtworkColumn(
  artworks: Artwork[],
  isVisible: (a: Artwork) => boolean,
  onSelect: (a: Artwork) => void
) {
  const items: React.ReactNode[] = []
  let i = 0

  while (i < artworks.length) {
    const a = artworks[i]
    const next = artworks[i + 1]

    // Pair two artworks if both exist and neither is the last single
    if (next && i + 2 <= artworks.length) {
      // Every other pair of items, render as a side-by-side pair
      if (i % 3 === 1 && next) {
        items.push(
          <div key={`pair-${i}`} className="grid grid-cols-2 max-[420px]:grid-cols-1 gap-2.5">
            <div className={`transition-opacity duration-500 ${!isVisible(a) ? 'opacity-[0.15] pointer-events-none' : ''}`}>
              <ArtworkCard artwork={a} compact onClick={() => onSelect(a)} />
            </div>
            <div className={`transition-opacity duration-500 ${!isVisible(next) ? 'opacity-[0.15] pointer-events-none' : ''}`}>
              <ArtworkCard artwork={next} compact onClick={() => onSelect(next)} />
            </div>
          </div>
        )
        i += 2
        continue
      }
    }

    items.push(
      <div
        key={a.id}
        className={`transition-opacity duration-500 ${!isVisible(a) ? 'opacity-[0.15] pointer-events-none' : ''}`}
      >
        <ArtworkCard artwork={a} onClick={() => onSelect(a)} />
      </div>
    )
    i++
  }

  return items
}
