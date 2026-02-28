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
      {block.type === 'series' && <SeriesCarousel seriesId={block.seriesId} />}
      {block.type === 'exhibition' && <ExhibitionBlockPublic exhibitionId={block.exhibitionId} />}
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

interface ExhibitionData {
  title_en: string
  title_pt: string
  year: number | null
  venue: string
  image: string
}

function ExhibitionBlockPublic({ exhibitionId }: { exhibitionId: string }) {
  const [exhibition, setExhibition] = useState<ExhibitionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!exhibitionId) return
    let cancelled = false

    async function load() {
      try {
        const { data } = await supabase
          .from('exhibitions')
          .select('title_en, title_pt, year, venue, image')
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
        <div className="flex gap-4">
          <div className="h-20 w-20 bg-gray-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!exhibition) return null

  const title = exhibition.title_en || exhibition.title_pt || 'Untitled'
  const subtitle = [exhibition.year, exhibition.venue].filter(Boolean).join(' · ')

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 flex items-center gap-4">
      {exhibition.image && (
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
          <img src={exhibition.image} alt={title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-amber-700 border-amber-300 text-xs">Exhibition</Badge>
        </div>
        <h4 className="text-base font-medium text-gray-900 truncate">{title}</h4>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  )
}
