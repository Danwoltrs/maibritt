'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import type { PageBuilderDoc, ContentBlock } from '@/components/admin/journal/page-builder/types'
import { SeriesCarousel } from './SeriesCarousel'
import { ImageLightbox } from './ImageLightbox'

const TiptapRenderer = dynamic(
  () => import('@/components/editor/TiptapRenderer').then(mod => ({ default: mod.TiptapRenderer })),
  { ssr: false, loading: () => <div className="animate-pulse h-16 bg-gray-100 rounded" /> }
)

interface BlockRendererProps {
  content: PageBuilderDoc
  className?: string
}

export function BlockRenderer({ content, className = '' }: BlockRendererProps) {
  return (
    <div className={`flex flex-wrap gap-6 ${className}`}>
      {content.blocks.map((block) => (
        <BlockItem key={block.id} block={block} />
      ))}
    </div>
  )
}

function BlockItem({ block }: { block: ContentBlock }) {
  const widthClass = block.width === 'full' ? 'w-full' : 'w-full md:w-[calc(50%-0.75rem)]'

  return (
    <div className={widthClass}>
      {block.type === 'text' && <TextBlockPublic block={block} />}
      {block.type === 'series' && (
        block.display === 'link'
          ? <SeriesLinkPublic seriesId={block.seriesId} />
          : <SeriesCarousel seriesId={block.seriesId} thumbnailSize={block.thumbnailSize} maxThumbnails={block.maxThumbnails} />
      )}
      {block.type === 'exhibition' && (
        block.display === 'link'
          ? <ExhibitionLinkPublic exhibitionId={block.exhibitionId} />
          : <ExhibitionBlockPublic exhibitionId={block.exhibitionId} thumbnailSize={block.thumbnailSize} maxThumbnails={block.maxThumbnails} />
      )}
      {block.type === 'image' && <ImageBlockPublic block={block} />}
    </div>
  )
}

function TextBlockPublic({ block }: { block: Extract<ContentBlock, { type: 'text' }> }) {
  if (!block.content?.tiptapDoc) return null
  return <TiptapRenderer content={block.content.tiptapDoc} className="prose-lg" />
}

function ImageBlockPublic({ block }: { block: Extract<ContentBlock, { type: 'image' }> }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!block.src) return null

  return (
    <>
      <figure>
        <img
          src={block.src}
          alt={block.alt || block.caption || 'Image'}
          className="w-full rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => setLightboxOpen(true)}
        />
        {block.caption && (
          <figcaption className="mt-2 text-sm text-gray-500 text-center">
            {block.caption}
          </figcaption>
        )}
      </figure>

      <ImageLightbox
        images={[{ src: block.src, alt: block.alt || '', caption: block.caption }]}
        currentIndex={0}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={() => {}}
      />
    </>
  )
}

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
}

function getArtworkUrl(artwork: SeriesArtwork, size: 'thumbnail' | 'display'): string {
  if (!artwork.images || !Array.isArray(artwork.images) || artwork.images.length === 0) return ''
  const img = artwork.images[0]
  if (typeof img === 'string') return img
  return img?.[size] || img?.display || img?.thumbnail || img?.original || ''
}

function SeriesLinkPublic({ seriesId }: { seriesId: string }) {
  const [seriesName, setSeriesName] = useState('')
  const [artworks, setArtworks] = useState<SeriesArtwork[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })

  useEffect(() => {
    if (!seriesId) return
    let cancelled = false

    async function load() {
      try {
        const [{ data: series }, { data: works }] = await Promise.all([
          supabase.from('series').select('name_en, name_pt').eq('id', seriesId).single(),
          supabase.from('artworks').select('id, title_en, title_pt, year, images')
            .eq('series_id', seriesId)
            .order('display_order', { ascending: true })
            .limit(20),
        ])

        if (!cancelled) {
          setSeriesName(series?.name_en || series?.name_pt || '')
          setArtworks((works || []) as SeriesArtwork[])
        }
      } catch (err) {
        console.error('SeriesLinkPublic: fetch error', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [seriesId])

  const lightboxImages = artworks.map(a => ({
    src: getArtworkUrl(a, 'display'),
    alt: a.title_en || a.title_pt || 'Artwork',
    caption: [a.title_en || a.title_pt, a.year].filter(Boolean).join(', '),
  }))

  if (loading) return <span className="text-sm text-gray-400">Loading...</span>

  return (
    <>
      <button
        type="button"
        onClick={() => artworks.length > 0 && setLightbox({ open: true, index: 0 })}
        className="inline-flex items-center gap-1 text-violet-700 hover:text-violet-900 font-medium underline underline-offset-2 decoration-violet-300 hover:decoration-violet-500 transition-colors"
      >
        {seriesName || 'Untitled works'}
        {artworks.length > 0 && <span className="text-violet-400 no-underline text-xs">({artworks.length})</span>}
      </button>

      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightbox.index}
        open={lightbox.open}
        onClose={() => setLightbox({ open: false, index: 0 })}
        onNavigate={(index) => setLightbox({ open: true, index })}
      />
    </>
  )
}

interface ExhibitionImageData {
  url: string
  captionPt?: string
  captionEn?: string
  isCover?: boolean
}

function getExhibitionImages(data: ExhibitionData): ExhibitionImageData[] {
  const imgs: ExhibitionImageData[] = []
  if (data.images && Array.isArray(data.images)) {
    imgs.push(...(data.images as ExhibitionImageData[]))
  }
  if (imgs.length === 0 && data.image) {
    imgs.push({ url: data.image })
  }
  return imgs
}

function ExhibitionLinkPublic({ exhibitionId }: { exhibitionId: string }) {
  const [exhibition, setExhibition] = useState<ExhibitionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })

  useEffect(() => {
    if (!exhibitionId) return
    let cancelled = false

    async function load() {
      try {
        const { data } = await supabase
          .from('exhibitions')
          .select('title_en, title_pt, year, venue, image, images')
          .eq('id', exhibitionId)
          .single()

        if (!cancelled && data) setExhibition(data)
      } catch (err) {
        console.error('ExhibitionLinkPublic: fetch error', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [exhibitionId])

  if (loading) return <span className="text-sm text-gray-400">Loading...</span>
  if (!exhibition) return null

  const title = exhibition.title_en || exhibition.title_pt || 'Untitled exhibition'
  const subtitle = [exhibition.year, exhibition.venue].filter(Boolean).join(' · ')
  const imgs = getExhibitionImages(exhibition)
  const lightboxImages = imgs.map(img => ({
    src: img.url,
    alt: img.captionEn || title,
    caption: img.captionEn || img.captionPt,
  }))

  return (
    <>
      <button
        type="button"
        onClick={() => imgs.length > 0 && setLightbox({ open: true, index: 0 })}
        className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-medium underline underline-offset-2 decoration-amber-300 hover:decoration-amber-500 transition-colors"
      >
        {title}
        {subtitle && <span className="text-amber-400 no-underline text-xs">({subtitle})</span>}
      </button>

      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightbox.index}
        open={lightbox.open}
        onClose={() => setLightbox({ open: false, index: 0 })}
        onNavigate={(index) => setLightbox({ open: true, index })}
      />
    </>
  )
}

interface ExhibitionData {
  title_en: string
  title_pt: string
  year: number | null
  venue: string
  image: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  images?: any[]
}

type ThumbnailSize = 'sm' | 'md' | 'lg'

const THUMB_PX: Record<ThumbnailSize, { box: string }> = {
  sm: { box: 'h-32 w-32' },
  md: { box: 'h-48 w-48' },
  lg: { box: 'h-64 w-64' },
}

function ExhibitionBlockPublic({ exhibitionId, thumbnailSize = 'md', maxThumbnails = 20 }: { exhibitionId: string; thumbnailSize?: ThumbnailSize; maxThumbnails?: number }) {
  const [exhibition, setExhibition] = useState<ExhibitionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })

  useEffect(() => {
    if (!exhibitionId) return
    let cancelled = false

    async function load() {
      try {
        const { data } = await supabase
          .from('exhibitions')
          .select('title_en, title_pt, year, venue, image, images')
          .eq('id', exhibitionId)
          .single()

        if (!cancelled && data) setExhibition(data)
      } catch (err) {
        console.error('ExhibitionBlockPublic: fetch error', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [exhibitionId])

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`${THUMB_PX[thumbnailSize].box} shrink-0 bg-gray-200 rounded-lg`} />
          ))}
        </div>
      </div>
    )
  }

  if (!exhibition) return null

  const title = exhibition.title_en || exhibition.title_pt || 'Untitled'
  const subtitle = [exhibition.year, exhibition.venue].filter(Boolean).join(' · ')
  const imgs = getExhibitionImages(exhibition)
  const visibleImgs = imgs.slice(0, maxThumbnails)
  const lightboxImages = imgs.map(img => ({
    src: img.url,
    alt: img.captionEn || title,
    caption: img.captionEn || img.captionPt,
  }))
  const sz = THUMB_PX[thumbnailSize]

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-amber-700 border-amber-300 text-xs">Exhibition</Badge>
            </div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <span className="text-sm text-gray-400">{imgs.length} {imgs.length === 1 ? 'image' : 'images'}</span>
        </div>

        {visibleImgs.length > 0 && (
          <div
            className="flex gap-4 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {visibleImgs.map((img, i) => (
              <button
                key={i}
                type="button"
                className="shrink-0 cursor-pointer group"
                onClick={() => setLightbox({ open: true, index: i })}
              >
                <div className={`${sz.box} overflow-hidden rounded-lg bg-gray-200`}>
                  <img
                    src={img.url}
                    alt={img.captionEn || title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightbox.index}
        open={lightbox.open}
        onClose={() => setLightbox({ open: false, index: 0 })}
        onNavigate={(index) => setLightbox({ open: true, index })}
      />
    </>
  )
}
