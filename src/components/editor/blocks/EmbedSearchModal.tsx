'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ArtworkService } from '@/services/artwork.service'
import { ExhibitionsService } from '@/services/exhibitions.service'
import { SeriesService } from '@/services/series.service'
import type { Artwork, ArtSeries } from '@/types'
import type { Exhibition } from '@/types'
import { Loader2, Search } from 'lucide-react'

/* ---------- Shape helpers ---------- */

interface ArtworkResult {
  id: string
  title: string
  subtitle: string
  imageUrl: string
}

interface ExhibitionResult {
  id: string
  title: string
  subtitle: string
  imageUrl: string
}

interface SeriesResult {
  id: string
  title: string
  subtitle: string
  imageUrl: string
  artworkCount?: number
}

type AnyResult = ArtworkResult | ExhibitionResult | SeriesResult

/* ---------- Props ---------- */

export interface EmbedSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'artwork' | 'exhibition' | 'series'
  onSelect: (data: Record<string, unknown>) => void
}

/* ---------- Data mappers ---------- */

function mapArtwork(a: Artwork): ArtworkResult {
  return {
    id: a.id,
    title: a.title.en || a.title.ptBR,
    subtitle: [a.year, a.medium.en || a.medium.ptBR].filter(Boolean).join(' · '),
    imageUrl: a.images[0]?.thumbnail || a.images[0]?.display || '',
  }
}

function mapExhibition(e: Exhibition): ExhibitionResult {
  return {
    id: e.id,
    title: e.title.en || e.title.ptBR,
    subtitle: [e.year, e.venue].filter(Boolean).join(' · '),
    imageUrl: e.image || '',
  }
}

function mapSeries(s: ArtSeries): SeriesResult {
  return {
    id: s.id,
    title: s.name.en || s.name.ptBR,
    subtitle: String(s.year),
    imageUrl: s.coverImage || '',
    artworkCount: s.artworks?.length ?? 0,
  }
}

/* ---------- Component ---------- */

export default function EmbedSearchModal({
  open,
  onOpenChange,
  type,
  onSelect,
}: EmbedSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AnyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all items when the modal opens or type changes
  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setQuery('')

    async function load() {
      try {
        if (type === 'artwork') {
          const { artworks } = await ArtworkService.getArtworks()
          if (!cancelled) setResults(artworks.map(mapArtwork))
        } else if (type === 'exhibition') {
          const exhibitions = await ExhibitionsService.getExhibitions()
          if (!cancelled) setResults(exhibitions.map(mapExhibition))
        } else {
          const series = await SeriesService.getSeries()
          if (!cancelled) setResults(series.map(mapSeries))
        }
      } catch {
        if (!cancelled) setError('Failed to load items. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [open, type])

  // Client-side search filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return results
    return results.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q)
    )
  }, [query, results])

  const TITLES: Record<EmbedSearchModalProps['type'], string> = {
    artwork: 'Insert Artwork',
    exhibition: 'Insert Exhibition',
    series: 'Insert Series',
  }

  function handleSelect(item: AnyResult) {
    if (type === 'artwork') {
      const r = item as ArtworkResult
      onSelect({ artworkId: r.id, title: r.title, imageUrl: r.imageUrl })
    } else if (type === 'exhibition') {
      const r = item as ExhibitionResult
      onSelect({ exhibitionId: r.id, title: r.title, imageUrl: r.imageUrl })
    } else {
      const r = item as SeriesResult
      onSelect({ seriesId: r.id, name: r.title, coverImage: r.imageUrl, artworkCount: r.artworkCount ?? 0 })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-hidden p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-base">{TITLES[type]}</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="pl-8"
              autoFocus
            />
          </div>
        </div>

        {/* Results list */}
        <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: '50vh' }}>
          {loading && (
            <div className="flex items-center justify-center py-8 text-stone-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}

          {!loading && error && (
            <p className="py-6 text-center text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-stone-400">No results found.</p>
          )}

          {!loading && !error && filtered.length > 0 && (
            <ul className="space-y-1">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-stone-100"
                  >
                    {/* Thumbnail */}
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-stone-200">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-800">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-stone-500">{item.subtitle}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
