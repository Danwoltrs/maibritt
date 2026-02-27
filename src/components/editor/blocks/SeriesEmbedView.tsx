'use client'

import { useState, useEffect } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface SeriesArtwork {
  id: string
  title_en: string
  title_pt: string
  year: number
  images: Array<{ original: string; display: string; thumbnail: string } | string>
  slug: string
}

export default function SeriesEmbedView({ node, deleteNode, editor }: NodeViewProps) {
  const [hovered, setHovered] = useState(false)
  const [artworks, setArtworks] = useState<SeriesArtwork[]>([])
  const [loading, setLoading] = useState(true)

  const { seriesId, name, artworkCount, coverImage } = node.attrs as {
    seriesId: string
    name: string
    artworkCount: number | null
    coverImage: string
  }

  const isEditable = editor?.isEditable ?? false

  useEffect(() => {
    if (!seriesId) return

    async function fetchArtworks() {
      try {
        const { data, error } = await supabase
          .from('artworks')
          .select('id, title_en, title_pt, year, images, slug')
          .eq('series_id', seriesId)
          .order('display_order', { ascending: true })
          .limit(12)

        if (error) throw error
        setArtworks(data || [])
      } catch (err) {
        console.error('Failed to fetch series artworks:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchArtworks()
  }, [seriesId])

  // In the editor: show compact card
  if (isEditable) {
    return (
      <NodeViewWrapper data-type="series-embed" contentEditable={false} className="my-3">
        <div
          className="relative flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 transition-shadow hover:shadow-sm"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-violet-200">
            {coverImage ? (
              <img src={coverImage} alt={name || 'Series'} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-violet-400">No image</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-800">{name || 'Untitled series'}</p>
            <Badge variant="secondary" className="text-xs mt-1">
              {artworks.length > 0 ? artworks.length : (artworkCount ?? 0)} artworks
            </Badge>
          </div>
          <span className="shrink-0 rounded bg-violet-200 px-1.5 py-0.5 text-xs font-medium text-violet-700">Series</span>
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
    <NodeViewWrapper data-type="series-embed" contentEditable={false} className="my-8">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        {/* Series header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{name || 'Untitled series'}</h3>
            <p className="text-sm text-gray-500">
              {artworks.length} {artworks.length === 1 ? 'artwork' : 'artworks'}
            </p>
          </div>
          <Badge variant="outline" className="text-violet-700 border-violet-300">Series</Badge>
        </div>

        {/* Artwork grid */}
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : artworks.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {artworks.map((artwork) => {
              const imgs = artwork.images || []
              const firstImg = imgs[0]
              const imageUrl = firstImg
                ? (typeof firstImg === 'string' ? firstImg : firstImg.thumbnail || firstImg.display || '')
                : ''
              const title = artwork.title_en || artwork.title_pt || 'Untitled'

              return (
                <Link
                  key={artwork.id}
                  href={`/artworks/series/${artwork.slug || artwork.id}`}
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
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-xs text-white font-medium truncate">{title}</p>
                    {artwork.year && <p className="text-xs text-white/70">{artwork.year}</p>}
                  </div>
                </Link>
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
