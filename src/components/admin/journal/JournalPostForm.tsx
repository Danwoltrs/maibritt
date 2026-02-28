'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DialogFooter } from '@/components/ui/dialog'
import { X, Upload, Languages, Loader2, Minimize2, Maximize2 } from 'lucide-react'
import Image from 'next/image'
import { PageBuilderEditor } from './page-builder/PageBuilderEditor'
import { AddContentMenu } from './page-builder/AddContentMenu'
import { normalizeContent, createEmptyPageBuilderDoc } from '@/lib/content-migration'
import type { PageBuilderDoc, ContentBlock } from './page-builder/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = Record<string, any>

export interface JournalFormData {
  titleEn: string
  titlePt: string
  contentEn: AnyDoc | null
  contentPt: AnyDoc | null
  excerptEn: string
  excerptPt: string
  coverImageFile: File | null
  tags: string[]
  published: boolean
  publishedAt: string
  featured: boolean
}

export const defaultJournalFormData: JournalFormData = {
  titleEn: '',
  titlePt: '',
  contentEn: null,
  contentPt: null,
  excerptEn: '',
  excerptPt: '',
  coverImageFile: null,
  tags: [],
  published: false,
  publishedAt: '',
  featured: false,
}

interface JournalPostFormProps {
  formData: JournalFormData
  setFormData: React.Dispatch<React.SetStateAction<JournalFormData>>
  onSubmit: () => void
  onCancel: () => void
  saving: boolean
  submitLabel: string
  existingCoverImage?: string
}

/**
 * Translate a single PageBuilderDoc: translate text blocks, keep embeds/images as-is.
 */
async function translatePageBuilderContent(
  doc: PageBuilderDoc,
  sourceLanguage: string,
  targetLanguage: string
): Promise<PageBuilderDoc> {
  const translatedBlocks: ContentBlock[] = []

  for (const block of doc.blocks) {
    if (block.type === 'text') {
      const text = JSON.stringify(block.content.tiptapDoc)
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLanguage, targetLanguage, format: 'tiptap' }),
      })
      if (!res.ok) throw new Error('Translation failed')
      const { translated } = await res.json()
      const tiptapDoc = JSON.parse(translated)
      translatedBlocks.push({ ...block, id: crypto.randomUUID(), content: { tiptapDoc } })
    } else {
      // Series, exhibition, image blocks stay the same (with new id)
      translatedBlocks.push({ ...block, id: crypto.randomUUID() })
    }
  }

  return { version: 2, blocks: translatedBlocks }
}

export function JournalPostForm({
  formData, setFormData, onSubmit, onCancel, saving, submitLabel, existingCoverImage
}: JournalPostFormProps) {
  const [tagInput, setTagInput] = useState('')
  const [coverPreview, setCoverPreview] = useState<string | null>(existingCoverImage || null)
  const [translating, setTranslating] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [contentLang, setContentLang] = useState<'en' | 'pt'>('en')

  // Auto-migrate legacy content on mount
  useEffect(() => {
    let changed = false
    let newEn = formData.contentEn
    let newPt = formData.contentPt

    if (formData.contentEn && !('version' in formData.contentEn && formData.contentEn.version === 2)) {
      newEn = normalizeContent(formData.contentEn)
      changed = true
    }
    if (formData.contentPt && !('version' in formData.contentPt && formData.contentPt.version === 2)) {
      newPt = normalizeContent(formData.contentPt)
      changed = true
    }

    if (changed) {
      setFormData(prev => ({ ...prev, contentEn: newEn, contentPt: newPt }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  useEffect(() => {
    if (!isFullscreen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  const translateField = async (
    field: 'title' | 'content' | 'excerpt',
    direction: 'en-to-pt' | 'pt-to-en'
  ) => {
    const sourceIsEn = direction === 'en-to-pt'
    const sourceLanguage = sourceIsEn ? 'en' : 'pt-BR'
    const targetLanguage = sourceIsEn ? 'pt-BR' : 'en'

    if (field === 'content') {
      const raw = sourceIsEn ? formData.contentEn : formData.contentPt
      const source = normalizeContent(raw)
      if (!source) return

      const key = `content-${direction}`
      setTranslating(key)

      try {
        const translated = await translatePageBuilderContent(source, sourceLanguage, targetLanguage)
        update(sourceIsEn ? 'contentPt' : 'contentEn', translated)
      } catch (err) {
        console.error('Translation error:', err)
      } finally {
        setTranslating(null)
      }
      return
    }

    let text = ''
    if (field === 'title') {
      text = sourceIsEn ? formData.titleEn : formData.titlePt
    } else {
      text = sourceIsEn ? formData.excerptEn : formData.excerptPt
    }

    if (!text.trim()) return

    const key = `${field}-${direction}`
    setTranslating(key)

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLanguage, targetLanguage, format: 'plain' }),
      })

      if (!res.ok) throw new Error('Translation failed')
      const { translated } = await res.json()

      if (field === 'title') {
        update(sourceIsEn ? 'titlePt' : 'titleEn', translated)
      } else {
        update(sourceIsEn ? 'excerptPt' : 'excerptEn', translated)
      }
    } catch (err) {
      console.error('Translation error:', err)
    } finally {
      setTranslating(null)
    }
  }

  const update = <K extends keyof JournalFormData>(key: K, value: JournalFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      update('coverImageFile', file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag)) {
      update('tags', [...formData.tags, tag])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    update('tags', formData.tags.filter(t => t !== tag))
  }

  const addBlockToActiveContent = (block: ContentBlock) => {
    const key = contentLang === 'en' ? 'contentEn' : 'contentPt'
    const current = normalizeContent(formData[key]) || createEmptyPageBuilderDoc()
    update(key, { ...current, blocks: [...current.blocks, block] })
  }

  const isValid = formData.titleEn.trim() || formData.titlePt.trim()

  const formContent = (
    <div className={`space-y-4 ${isFullscreen ? 'flex flex-col h-full' : ''}`}>
      {isFullscreen && (
        <div className="flex items-center justify-between border-b pb-3 mb-2 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {formData.titleEn || formData.titlePt || 'Journal Entry'}
          </h2>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Minimize2 className="h-4 w-4 mr-1.5" />
            Exit Fullscreen
          </Button>
        </div>
      )}
      <Tabs defaultValue="content" className={isFullscreen ? 'flex-1 flex flex-col min-h-0' : ''}>
        <div className="flex items-center justify-between shrink-0">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="meta">Meta & Cover</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          {!isFullscreen && (
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-8 w-8 p-0" title="Fullscreen">
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content Tab */}
        <TabsContent value="content" className={`space-y-4 mt-4 ${isFullscreen ? 'flex-1 flex flex-col min-h-0' : ''}`}>
          {/* Titles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Title (English)</Label>
              <div className="flex gap-1.5">
                <Input
                  value={formData.titleEn}
                  onChange={(e) => update('titleEn', e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Enter title in English"
                  className="flex-1"
                />
                {formData.titlePt && (
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="h-9 w-9 p-0 shrink-0"
                    disabled={translating === 'title-pt-to-en'}
                    onClick={() => translateField('title', 'pt-to-en')}
                    title="Translate PT to EN"
                  >
                    {translating === 'title-pt-to-en' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Title (Portuguese)</Label>
              <div className="flex gap-1.5">
                <Input
                  value={formData.titlePt}
                  onChange={(e) => update('titlePt', e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Digite o titulo em Portugues"
                  className="flex-1"
                />
                {formData.titleEn && (
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="h-9 w-9 p-0 shrink-0"
                    disabled={translating === 'title-en-to-pt'}
                    onClick={() => translateField('title', 'en-to-pt')}
                    title="Translate EN to PT"
                  >
                    {translating === 'title-en-to-pt' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Page builder editors in language tabs */}
          <Tabs defaultValue="en" value={contentLang} onValueChange={(v) => setContentLang(v as 'en' | 'pt')} className={isFullscreen ? 'flex-1 flex flex-col min-h-0' : ''}>
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <TabsList>
                  <TabsTrigger value="en">English Content</TabsTrigger>
                  <TabsTrigger value="pt">Portuguese Content</TabsTrigger>
                </TabsList>
                <AddContentMenu onAddBlock={addBlockToActiveContent} />
              </div>
              <div className="flex gap-1">
                <Button
                  type="button" variant="outline" size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={!formData.contentEn || translating === 'content-en-to-pt'}
                  onClick={() => translateField('content', 'en-to-pt')}
                >
                  {translating === 'content-en-to-pt' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                  EN &rarr; PT
                </Button>
                <Button
                  type="button" variant="outline" size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={!formData.contentPt || translating === 'content-pt-to-en'}
                  onClick={() => translateField('content', 'pt-to-en')}
                >
                  {translating === 'content-pt-to-en' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                  PT &rarr; EN
                </Button>
              </div>
            </div>
            <TabsContent value="en" className={`mt-2 ${isFullscreen ? 'flex-1 min-h-0 overflow-y-auto' : ''}`}>
              <PageBuilderEditor
                value={normalizeContent(formData.contentEn) || createEmptyPageBuilderDoc()}
                onChange={(doc) => update('contentEn', doc)}
                hideAddMenu
              />
            </TabsContent>
            <TabsContent value="pt" className={`mt-2 ${isFullscreen ? 'flex-1 min-h-0 overflow-y-auto' : ''}`}>
              <PageBuilderEditor
                value={normalizeContent(formData.contentPt) || createEmptyPageBuilderDoc()}
                onChange={(doc) => update('contentPt', doc)}
                hideAddMenu
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Meta Tab */}
        <TabsContent value="meta" className="space-y-4 mt-4">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            {coverPreview ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                <Image src={coverPreview} alt="Cover preview" fill className="object-cover object-center" />
                <button
                  onClick={() => { setCoverPreview(null); update('coverImageFile', null) }}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Click to upload cover image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageChange} />
              </label>
            )}
          </div>

          {/* Excerpts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Excerpt (English)</Label>
                {formData.excerptPt && (
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="h-6 text-xs gap-1"
                    disabled={translating === 'excerpt-pt-to-en'}
                    onClick={() => translateField('excerpt', 'pt-to-en')}
                  >
                    {translating === 'excerpt-pt-to-en' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                    PT &rarr; EN
                  </Button>
                )}
              </div>
              <textarea
                value={formData.excerptEn}
                onChange={(e) => update('excerptEn', e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Short summary in English..."
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Excerpt (Portuguese)</Label>
                {formData.excerptEn && (
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="h-6 text-xs gap-1"
                    disabled={translating === 'excerpt-en-to-pt'}
                    onClick={() => translateField('excerpt', 'en-to-pt')}
                  >
                    {translating === 'excerpt-en-to-pt' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                    EN &rarr; PT
                  </Button>
                )}
              </div>
              <textarea
                value={formData.excerptPt}
                onChange={(e) => update('excerptPt', e.target.value)}
                placeholder="Resumo curto em Portugues..."
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Add a tag and press Enter"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label className="text-base">Published</Label>
                <p className="text-sm text-gray-500">Make this entry visible to the public</p>
              </div>
              <Switch
                checked={formData.published}
                onCheckedChange={(checked) => {
                  update('published', checked)
                  if (checked && !formData.publishedAt) {
                    update('publishedAt', new Date().toISOString().slice(0, 16))
                  }
                }}
              />
            </div>

            {formData.published && (
              <div className="space-y-2">
                <Label>Publish Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) => update('publishedAt', e.target.value)}
                />
                <p className="text-xs text-gray-500">Leave empty to use current date/time when saving</p>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label className="text-base">Featured</Label>
                <p className="text-sm text-gray-500">Highlight this entry on the homepage</p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => update('featured', checked)}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {!isFullscreen && (
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button onClick={onSubmit} disabled={saving || !isValid}>
            {saving ? 'Saving...' : submitLabel}
          </Button>
        </DialogFooter>
      )}
      {isFullscreen && (
        <div className="flex justify-end gap-2 pt-3 border-t shrink-0">
          <Button variant="outline" onClick={toggleFullscreen} size="sm">Back to Form</Button>
          <Button onClick={onSubmit} disabled={saving || !isValid} size="sm">
            {saving ? 'Saving...' : submitLabel}
          </Button>
        </div>
      )}
    </div>
  )

  if (isFullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
        <div className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col min-h-0">
          {formContent}
        </div>
      </div>,
      document.body
    )
  }

  return formContent
}
