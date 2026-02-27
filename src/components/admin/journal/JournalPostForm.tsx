'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DialogFooter } from '@/components/ui/dialog'
import { X, Upload, Languages, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { TiptapEditor } from '@/components/editor/TiptapEditor'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TiptapDoc = Record<string, any>

export interface JournalFormData {
  titleEn: string
  titlePt: string
  contentEn: TiptapDoc | null
  contentPt: TiptapDoc | null
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

export function JournalPostForm({
  formData, setFormData, onSubmit, onCancel, saving, submitLabel, existingCoverImage
}: JournalPostFormProps) {
  const [tagInput, setTagInput] = useState('')
  const [coverPreview, setCoverPreview] = useState<string | null>(existingCoverImage || null)
  const [translating, setTranslating] = useState<string | null>(null)

  const translateField = async (
    field: 'title' | 'content' | 'excerpt',
    direction: 'en-to-pt' | 'pt-to-en'
  ) => {
    const sourceIsEn = direction === 'en-to-pt'
    const sourceLanguage = sourceIsEn ? 'en' : 'pt-BR'
    const targetLanguage = sourceIsEn ? 'pt-BR' : 'en'

    let text = ''
    let format: 'plain' | 'tiptap' = 'plain'

    if (field === 'title') {
      text = sourceIsEn ? formData.titleEn : formData.titlePt
    } else if (field === 'excerpt') {
      text = sourceIsEn ? formData.excerptEn : formData.excerptPt
    } else {
      const content = sourceIsEn ? formData.contentEn : formData.contentPt
      if (!content) return
      text = JSON.stringify(content)
      format = 'tiptap'
    }

    if (!text.trim()) return

    const key = `${field}-${direction}`
    setTranslating(key)

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLanguage, targetLanguage, format }),
      })

      if (!res.ok) throw new Error('Translation failed')
      const { translated } = await res.json()

      if (field === 'title') {
        update(sourceIsEn ? 'titlePt' : 'titleEn', translated)
      } else if (field === 'excerpt') {
        update(sourceIsEn ? 'excerptPt' : 'excerptEn', translated)
      } else {
        const doc = JSON.parse(translated)
        update(sourceIsEn ? 'contentPt' : 'contentEn', doc)
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

  const isValid = formData.titleEn.trim() || formData.titlePt.trim()

  return (
    <div className="space-y-4">
      <Tabs defaultValue="content">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="meta">Meta & Cover</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4 mt-4">
          {/* Titles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Title (English)</Label>
                {formData.titlePt && (
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="h-6 text-xs gap-1"
                    disabled={translating === 'title-pt-to-en'}
                    onClick={() => translateField('title', 'pt-to-en')}
                  >
                    {translating === 'title-pt-to-en' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                    PT → EN
                  </Button>
                )}
              </div>
              <Input
                value={formData.titleEn}
                onChange={(e) => update('titleEn', e.target.value)}
                placeholder="Enter title in English"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Title (Portuguese)</Label>
                {formData.titleEn && (
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="h-6 text-xs gap-1"
                    disabled={translating === 'title-en-to-pt'}
                    onClick={() => translateField('title', 'en-to-pt')}
                  >
                    {translating === 'title-en-to-pt' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                    EN → PT
                  </Button>
                )}
              </div>
              <Input
                value={formData.titlePt}
                onChange={(e) => update('titlePt', e.target.value)}
                placeholder="Digite o titulo em Portugues"
              />
            </div>
          </div>

          {/* Rich text editors in language tabs */}
          <Tabs defaultValue="en">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="en">English Content</TabsTrigger>
                <TabsTrigger value="pt">Portuguese Content</TabsTrigger>
              </TabsList>
              <div className="flex gap-1">
                <Button
                  type="button" variant="outline" size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={!formData.contentEn || translating === 'content-en-to-pt'}
                  onClick={() => translateField('content', 'en-to-pt')}
                >
                  {translating === 'content-en-to-pt' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                  EN → PT
                </Button>
                <Button
                  type="button" variant="outline" size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={!formData.contentPt || translating === 'content-pt-to-en'}
                  onClick={() => translateField('content', 'pt-to-en')}
                >
                  {translating === 'content-pt-to-en' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                  PT → EN
                </Button>
              </div>
            </div>
            <TabsContent value="en" className="mt-2">
              <TiptapEditor
                content={formData.contentEn}
                onChange={(json) => update('contentEn', json)}
                placeholder="Write your journal entry in English..."
                language="en"
              />
            </TabsContent>
            <TabsContent value="pt" className="mt-2">
              <TiptapEditor
                content={formData.contentPt}
                onChange={(json) => update('contentPt', json)}
                placeholder="Escreva sua entrada no diario em Portugues..."
                language="ptBR"
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
                <Image src={coverPreview} alt="Cover preview" fill className="object-cover" />
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
                    PT → EN
                  </Button>
                )}
              </div>
              <textarea
                value={formData.excerptEn}
                onChange={(e) => update('excerptEn', e.target.value)}
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
                    EN → PT
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
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
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
                onCheckedChange={(checked) => update('published', checked)}
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

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={onSubmit} disabled={saving || !isValid}>
          {saving ? 'Saving...' : submitLabel}
        </Button>
      </DialogFooter>
    </div>
  )
}
