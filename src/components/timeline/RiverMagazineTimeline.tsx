'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Artwork, Exhibition } from '@/types'
import { ArtworkService } from '@/services/artwork.service'
import { ExhibitionsService } from '@/services/exhibitions.service'
import { QuotesService, Quote } from '@/services/quotes.service'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useAuth } from '@/hooks/useAuth'
import TimelineFilters, { FilterId } from './TimelineFilters'
import ExhibitionBanner from './ExhibitionBanner'
import ArtworkCard from './ArtworkCard'
import PressClip from './PressClip'
import ExhibitionOverlay from './ExhibitionOverlay'
import ArtworkOverlay from './ArtworkOverlay'
import { ArtworkContextMenu } from '@/components/admin/ArtworkContextMenu'
import { ExhibitionContextMenu } from '@/components/admin/ExhibitionContextMenu'

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
  const { user } = useAuth()

  const loadData = useCallback(async () => {
    const [exhibitions, artworks, quotes] = await Promise.all([
      ExhibitionsService.getTimelineExhibitions(),
      ArtworkService.getTimelineArtworks(),
      QuotesService.getActiveQuotes('press').catch(() => [] as Quote[]),
    ])

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
  }, [])

  useEffect(() => { loadData() }, [loadData])

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
      <section id={id} className="bg-gray-50 py-20">
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    )
  }

  if (years.length === 0) {
    return (
      <section id={id} className="bg-gray-50 py-20">
        <div className="text-center text-gray-500">
          <p className="text-sm">No timeline items yet.</p>
        </div>
      </section>
    )
  }

  return (
    <section id={id} className="bg-gray-50">
      {/* Page Intro */}
      <div className="text-center pt-16 pb-16 px-6 border-b border-gray-200">
        <p className="text-xs tracking-[4px] uppercase text-[rgb(0,46,18)] mb-3 font-medium">Artistic Journey</p>
        <h2 className="text-[clamp(28px,6vw,52px)] font-light leading-[1.1] text-gray-900 tracking-tight">
          Exhibitions & Works
        </h2>
      </div>

      {/* Filter Bar */}
      <TimelineFilters
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        availableCategories={[...new Set(years.flatMap(ty => ty.artworks.map(a => a.category)))]}
        hasExhibitions={years.some(ty => ty.exhibitions.length > 0)}
      />

      {/* Timeline */}
      <div className="max-w-[1100px] mx-auto px-10 max-md:px-5 py-[72px] pb-[120px] relative">
        {/* Desktop spine */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgb(0,46,18) 3%, rgba(0,46,18,0.2) 50%, rgba(0,46,18,0.2) 97%, transparent 100%)',
          }}
        />

        {years.map((ty) => (
          <TimelineYearBlock
            key={ty.year}
            ty={ty}
            yearFaded={!isYearVisible(ty)}
            isExhibitionVisible={isExhibitionVisible}
            isArtworkVisible={isArtworkVisible}
            onSelectExhibition={setSelectedExhibition}
            onSelectArtwork={setSelectedArtwork}
            isAdmin={!!user}
            onUpdate={loadData}
          />
        ))}
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

/* ─── Year Block (extracted so each gets its own scroll hook) ─── */

interface TimelineYearBlockProps {
  ty: TimelineYear
  yearFaded: boolean
  isExhibitionVisible: (e: Exhibition) => boolean
  isArtworkVisible: (a: Artwork) => boolean
  onSelectExhibition: (e: Exhibition) => void
  onSelectArtwork: (a: Artwork) => void
  isAdmin: boolean
  onUpdate: () => void
}

function TimelineYearBlock({
  ty, yearFaded, isExhibitionVisible, isArtworkVisible,
  onSelectExhibition, onSelectArtwork, isAdmin, onUpdate,
}: TimelineYearBlockProps) {
  const [ref, isVisible] = useScrollAnimation(0.1)

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${yearFaded ? '!opacity-[0.15] pointer-events-none' : ''}`}
    >
      {/* Year Marker */}
      <div className="relative text-center mt-14 mb-10 max-md:mt-10 max-md:mb-7 z-[2]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(60px,11vw,120px)] max-md:text-[clamp(48px,15vw,80px)] font-light text-gray-900/5 max-md:opacity-60 pointer-events-none select-none whitespace-nowrap leading-none tracking-tight">
          {ty.year}
        </div>
        <div className="inline-block relative bg-gray-50 border border-[rgb(0,46,18)] text-[rgb(0,46,18)] text-[11px] font-medium tracking-[4px] py-1.5 px-5 z-[2]">
          {ty.year}
        </div>
      </div>

      {/* Timeline Row */}
      <div className="
        md:grid md:grid-cols-[1fr_64px_1fr] md:items-start md:mb-12
        max-md:block max-md:pl-7 max-md:border-l max-md:border-[rgb(0,46,18)]/30 max-md:ml-3 max-md:mb-9 max-md:relative
      ">
        {/* Mobile spine dot */}
        <div className="md:hidden absolute -left-[5px] top-5 w-[9px] h-[9px] rounded-full bg-[rgb(0,46,18)] border-2 border-gray-50 shadow-[0_0_0_1px_rgb(0,46,18)]" />

        {/* LEFT: Exhibitions + Press */}
        <div className="md:col-start-1 md:pr-9 max-md:pr-0 max-md:mb-5">
          {ty.exhibitions.length > 0 ? (
            <div className="space-y-3">
              {ty.exhibitions.map((exh, idx) => {
                const card = (
                  <div
                    className={`transition-all duration-700 ease-out ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    } ${!isExhibitionVisible(exh) ? '!opacity-[0.15] pointer-events-none' : ''}`}
                    style={{ transitionDelay: isVisible ? `${idx * 50}ms` : '0ms' }}
                  >
                    <ExhibitionBanner
                      exhibition={exh}
                      onClick={() => onSelectExhibition(exh)}
                    />
                  </div>
                )

                return isAdmin ? (
                  <ExhibitionContextMenu key={exh.id} exhibition={exh} onUpdate={onUpdate}>
                    {card}
                  </ExhibitionContextMenu>
                ) : (
                  <div key={exh.id}>{card}</div>
                )
              })}
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 p-4.5 text-center mt-5">
              <div className="text-[8px] tracking-[3px] uppercase text-gray-400 mb-1.5 font-medium">No Exhibition</div>
              <div className="text-[13px] text-gray-500 italic">Studio year</div>
            </div>
          )}

          {/* Press clips */}
          {ty.pressQuotes.length > 0 && (
            <div className="mt-3 space-y-3">
              {ty.pressQuotes.map((q, idx) => (
                <div
                  key={q.id}
                  className={`transition-all duration-700 ease-out ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: isVisible ? `${(ty.exhibitions.length + idx) * 50}ms` : '0ms' }}
                >
                  <PressClip quote={q} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CENTER: Spine dot (desktop only) */}
        <div className="hidden md:flex md:col-start-2 flex-col items-center pt-6">
          <div className={`rounded-full border-[3px] border-gray-50 shadow-[0_0_0_1px_rgb(0,46,18)] relative z-[3] ${
            ty.exhibitions.length > 0
              ? 'w-[11px] h-[11px] bg-[rgb(0,46,18)]'
              : 'w-[7px] h-[7px] bg-[rgb(0,46,18)]/60 shadow-[0_0_0_1px_rgb(0,46,18)] border-2'
          }`} />
        </div>

        {/* RIGHT: Artworks */}
        <div className="md:col-start-3 md:pl-9 max-md:pl-0">
          <div className="flex flex-col gap-3">
            {renderArtworkColumn(ty.artworks, isArtworkVisible, onSelectArtwork, isAdmin, onUpdate, isVisible)}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Artwork column helper ─── */

function renderArtworkColumn(
  artworks: Artwork[],
  isVisible: (a: Artwork) => boolean,
  onSelect: (a: Artwork) => void,
  isAdmin: boolean,
  onUpdate: () => void,
  isRevealed: boolean,
) {
  const items: React.ReactNode[] = []
  let i = 0
  let itemIndex = 0

  while (i < artworks.length) {
    const a = artworks[i]
    const next = artworks[i + 1]

    if (next && i + 2 <= artworks.length && i % 3 === 1) {
      const pairCard = (
        <div
          key={`pair-${i}`}
          className={`grid grid-cols-2 max-[420px]:grid-cols-1 gap-2.5 transition-all duration-700 ease-out ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: isRevealed ? `${itemIndex * 50}ms` : '0ms' }}
        >
          {[a, next].map((artwork) => {
            const inner = (
              <div className={`transition-opacity duration-500 ${!isVisible(artwork) ? 'opacity-[0.15] pointer-events-none' : ''}`}>
                <ArtworkCard artwork={artwork} compact onClick={() => onSelect(artwork)} />
              </div>
            )
            return isAdmin ? (
              <ArtworkContextMenu key={artwork.id} artwork={artwork} onUpdate={onUpdate}>
                {inner}
              </ArtworkContextMenu>
            ) : (
              <div key={artwork.id}>{inner}</div>
            )
          })}
        </div>
      )
      items.push(pairCard)
      i += 2
      itemIndex++
      continue
    }

    const singleCard = (
      <div
        key={a.id}
        className={`transition-all duration-700 ease-out ${
          isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        } ${!isVisible(a) ? '!opacity-[0.15] pointer-events-none' : ''}`}
        style={{ transitionDelay: isRevealed ? `${itemIndex * 50}ms` : '0ms' }}
      >
        {isAdmin ? (
          <ArtworkContextMenu artwork={a} onUpdate={onUpdate}>
            <ArtworkCard artwork={a} onClick={() => onSelect(a)} />
          </ArtworkContextMenu>
        ) : (
          <ArtworkCard artwork={a} onClick={() => onSelect(a)} />
        )}
      </div>
    )
    items.push(singleCard)
    i++
    itemIndex++
  }

  return items
}
