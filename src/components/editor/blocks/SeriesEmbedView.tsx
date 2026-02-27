'use client'

import { useState, useEffect } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { X, AlignLeft, AlignCenter, AlignRight, Maximize2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { SeriesLayout } from '../extensions/SeriesEmbedNode'

interface ArtworkImage {
  original: string
  display: string
  thumbnail: string
}

interface SeriesArtwork {
  id: string
  title_en: string
  title_pt: string
  year: number
  images: ArtworkImage[]
  slug: string
}

function getImageUrl(artwork: SeriesArtwork): string {
  if (!artwork.images || !Array.isArray(artwork.images) || artwork.images.length === 0) return ''
  const img = artwork.images[0]
  if (typeof img === 'string') return img
  return img?.thumbnail || img?.display || img?.original || ''
}

export default function SeriesEmbedView({ node, deleteNode, editor, updateAttributes }: NodeViewProps) {
  const [hovered, setHovered] = useState(false)
  const [artworks, setArtworks] = useState<SeriesArtwork[]>([])
  const [loading, setLoading] = useState(true)

  const { seriesId, name, artworkCount, coverImage, layout = 'full' } = node.attrs as {
    seriesId: string
    name: string
    artworkCount: number | null
    coverImage: string
    layout: SeriesLayout
  }

  const isEditable = editor?.isEditable ?? false

  useEffect(() => {
    if (!seriesId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchArtworks() {
      try {
        const { data, error } = await supabase
          .from('artworks')
          .select('*')
          .eq('series_id', seriesId)
          .order('display_order', { ascending: true })
          .limit(12)

        if (error) {
          console.error('Series embed: query error', error)
          return
        }
        if (!cancelled) {
          setArtworks((data || []) as SeriesArtwork[])
        }
      } catch (err) {
        console.error('Series embed: fetch error', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchArtworks()
    return () => { cancelled = true }
  }, [seriesId])

  const layoutButtons = [
    { value: 'left' as const, icon: AlignLeft, label: 'Left' },
    { value: 'center' as const, icon: AlignCenter, label: 'Center' },
    { value: 'right' as const, icon: AlignRight, label: 'Right' },
    { value: 'full' as const, icon: Maximize2, label: 'Full width' },
  ]

  // Layout CSS classes for the public view
  const layoutClasses: Record<SeriesLayout, string> = {
    full: 'w-full',
    center: 'mx-auto max-w-xl',
    left: 'mr-auto max-w-md float-left mr-6 mb-4',
    right: 'ml-auto max-w-md float-right ml-6 mb-4',
  }

  const gridCols: Record<SeriesLayout, string> = {
    full: 'grid-cols-3 md:grid-cols-4',
    center: 'grid-cols-2 md:grid-cols-3',
    left: 'grid-cols-2',
    right: 'grid-cols-2',
  }

  // In the editor: show compact card with layout controls
  if (isEditable) {
    return (
      <NodeViewWrapper data-type="series-embed" contentEditable={false} className="my-3">
        <div
          className="relative rounded-lg border border-violet-200 bg-violet-50 transition-shadow hover:shadow-sm"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Layout controls */}
          <div className="flex items-center justify-between border-b border-violet-200 px-3 py-1.5">
            <span className="text-xs font-medium text-violet-600">Series Embed</span>
            <div className="flex items-center gap-0.5">
              {layoutButtons.map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 ${layout === value ? 'bg-violet-200 text-violet-800' : 'text-violet-400 hover:text-violet-600'}`}
                  onClick={() => updateAttributes({ layout: value })}
                  title={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-violet-200">
              {coverImage ? (
                <img src={coverImage} alt={name || 'Series'} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-violet-400">No image</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-800">{name || 'Untitled series'}</p>
              <Badge variant="secondary" className="text-xs mt-1">
                {loading ? '...' : artworks.length} artworks · {layout}
              </Badge>
            </div>
          </div>

          {hovered && (
            <button
              type="button"
              onClick={deleteNode}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow transition-opacity hover:bg-red-600"
              aria-label="Remove series embed"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </NodeViewWrapper>
    )
  }

  // Public/read-only: show series with artwork grid
  return (
    <NodeViewWrapper data-type="series-embed" contentEditable={false} className="my-8 clear-both">
      <div className={`rounded-xl border border-gray-200 bg-gray-50 p-6 ${layoutClasses[layout]}`}>
        {/* Series header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{name || 'Untitled series'}</h3>
            {!loading && (
              <p className="text-sm text-gray-500">
                {artworks.length} {artworks.length === 1 ? 'artwork' : 'artworks'}
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-violet-700 border-violet-300">Series</Badge>
        </div>

        {/* Artwork grid */}
        {loading ? (
          <div className={`grid ${gridCols[layout]} gap-3`}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : artworks.length > 0 ? (
          <div className={`grid ${gridCols[layout]} gap-3`}>
            {artworks.map((artwork) => {
              const imageUrl = getImageUrl(artwork)
              const title = artwork.title_en || artwork.title_pt || 'Untitled'

              return (
                <div
                  key={artwork.id}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-gray-200"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No image</div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-xs text-white font-medium truncate">{title}</p>
                    {artwork.year && <p className="text-xs text-white/70">{artwork.year}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">No artworks in this series yet.</p>
        )}
      </div>
    </NodeViewWrapper>
  )
}
