'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { JournalService, JournalPost, JournalPostUpdateData } from '@/services/journal.service'
import { JournalPostForm, JournalFormData, defaultJournalFormData } from '@/components/admin/journal/JournalPostForm'

export default function EditJournalPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [post, setPost] = useState<JournalPost | null>(null)
  const [formData, setFormData] = useState<JournalFormData>(defaultJournalFormData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPost() {
      try {
        setLoading(true)
        const data = await JournalService.getJournalPostById(id)
        if (!data) {
          setError('Journal entry not found')
          return
        }
        setPost(data)
        setFormData({
          titleEn: data.title.en || '',
          titlePt: data.title.ptBR || '',
          contentEn: data.content.en,
          contentPt: data.content.ptBR,
          excerptEn: data.excerpt?.en || '',
          excerptPt: data.excerpt?.ptBR || '',
          coverImageFile: null,
          tags: data.tags || [],
          published: data.published,
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt).toISOString().slice(0, 16)
            : '',
          featured: data.featured,
        })
      } catch (err) {
        console.error('Error loading journal post:', err)
        setError('Failed to load journal entry')
      } finally {
        setLoading(false)
      }
    }
    loadPost()
  }, [id])

  const handleSubmit = async () => {
    if (!post) return
    try {
      setSaving(true)
      setError(null)

      const updateData: JournalPostUpdateData = {
        title: { en: formData.titleEn, ptBR: formData.titlePt },
        content: { en: formData.contentEn, ptBR: formData.contentPt },
        excerpt: { en: formData.excerptEn, ptBR: formData.excerptPt },
        newCoverImageFile: formData.coverImageFile || undefined,
        tags: formData.tags,
        published: formData.published,
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt) : undefined,
        featured: formData.featured,
      }

      await JournalService.updateJournalPost(post.id, updateData)
      router.push('/journal/manage')
    } catch (err) {
      console.error('Error updating journal post:', err)
      setError('Failed to update journal entry')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error && !post) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm">{error}</div>
        <Button variant="outline" onClick={() => router.push('/journal/manage')}>
          Back to Journal
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/journal/manage')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Journal Entry</h1>
          <p className="text-gray-500">
            {post ? (post.title.en || post.title.ptBR || 'Untitled') : ''}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm">{error}</div>
      )}

      <Card>
        <CardContent className="pt-6">
          <JournalPostForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/journal/manage')}
            saving={saving}
            submitLabel="Save Changes"
            existingCoverImage={post?.coverImage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
