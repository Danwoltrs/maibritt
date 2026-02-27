'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2 } from 'lucide-react'

import { JournalService, JournalPostCreateData } from '@/services/journal.service'
import { JournalPostForm, JournalFormData, defaultJournalFormData } from '@/components/admin/journal/JournalPostForm'

export default function NewJournalPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<JournalFormData>(defaultJournalFormData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    try {
      setSaving(true)
      setError(null)

      const createData: JournalPostCreateData = {
        title: { en: formData.titleEn, ptBR: formData.titlePt },
        content: { en: formData.contentEn, ptBR: formData.contentPt },
        excerpt: (formData.excerptEn || formData.excerptPt)
          ? { en: formData.excerptEn, ptBR: formData.excerptPt }
          : undefined,
        coverImageFile: formData.coverImageFile || undefined,
        tags: formData.tags,
        published: formData.published,
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt) : undefined,
        featured: formData.featured,
      }

      const post = await JournalService.createJournalPost(createData)
      setSuccess(true)
      setTimeout(() => {
        router.push(`/journal/${post.id}/edit`)
      }, 1000)
    } catch (err) {
      console.error('Error creating journal post:', err)
      setError('Failed to create journal post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/journal/manage')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Journal Entry</h1>
          <p className="text-gray-500">Create a new journal entry with rich content</p>
        </div>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Journal entry created! Redirecting to editor...
          </AlertDescription>
        </Alert>
      )}

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
            submitLabel="Create Entry"
          />
        </CardContent>
      </Card>
    </div>
  )
}
