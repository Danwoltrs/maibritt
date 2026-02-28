'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ExhibitionBlockEditorProps {
  exhibitionId: string
  title?: string
  imageUrl?: string
  subtitle?: string
}

export function ExhibitionBlockEditor({ exhibitionId, title, imageUrl, subtitle }: ExhibitionBlockEditorProps) {
  const [exTitle, setExTitle] = useState(title || '')
  const [exImage, setExImage] = useState(imageUrl || '')
  const [exSubtitle, setExSubtitle] = useState(subtitle || '')
  const [loading, setLoading] = useState(!title)

  useEffect(() => {
    if (!exhibitionId || title) return

    let cancelled = false

    async function load() {
      try {
        const { data } = await supabase
          .from('exhibitions')
          .select('title_en, title_pt, year, venue, image')
          .eq('id', exhibitionId)
          .single()

        if (!cancelled && data) {
          setExTitle(data.title_en || data.title_pt || '')
          setExImage(data.image || '')
          setExSubtitle([data.year, data.venue].filter(Boolean).join(' · '))
        }
      } catch (err) {
        console.error('ExhibitionBlockEditor: fetch error', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [exhibitionId, title])

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50">
      <div className="flex items-center justify-between border-b border-amber-200 px-3 py-1.5">
        <span className="text-xs font-medium text-amber-600">Exhibition</span>
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-amber-200">
          {exImage ? (
            <img src={exImage} alt={exTitle} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-amber-400">
              No image
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800">
            {loading ? 'Loading...' : exTitle || 'Untitled exhibition'}
          </p>
          {exSubtitle && (
            <p className="text-xs text-stone-500 mt-0.5">{exSubtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
