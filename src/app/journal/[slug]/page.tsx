'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Eye, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'
import { JournalService, JournalPost } from '@/services/journal.service'
import { isPageBuilderDoc } from '@/components/admin/journal/page-builder/types'
import { BlockRenderer } from '@/components/journal/BlockRenderer'
import { normalizeContent } from '@/lib/content-migration'
import type { PageBuilderDoc } from '@/components/admin/journal/page-builder/types'

const TiptapRenderer = dynamic(
  () => import('@/components/editor/TiptapRenderer').then(mod => ({ default: mod.TiptapRenderer })),
  { ssr: false, loading: () => <div className="animate-pulse h-32 bg-gray-100 rounded" /> }
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ContentRenderer({ content }: { content: Record<string, any> }) {
  if (isPageBuilderDoc(content)) {
    return <BlockRenderer content={content as PageBuilderDoc} className="prose-lg" />
  }
  // Auto-migrate legacy content for display
  const migrated = normalizeContent(content)
  if (migrated) {
    return <BlockRenderer content={migrated} className="prose-lg" />
  }
  // Fallback: render as legacy Tiptap
  return <TiptapRenderer content={content} className="prose-lg" />
}

export default function JournalPostPage() {
  const params = useParams()
  const slug = params.slug as string

  const [post, setPost] = useState<JournalPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await JournalService.getJournalPostBySlug(slug)
        if (!data) {
          setError('Entry not found')
          return
        }
        setPost(data)
      } catch (err) {
        console.error('Error loading journal post:', err)
        setError('Failed to load entry')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-24 px-8">
        <div className="max-w-3xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-24" />
          <div className="aspect-[2/1] bg-gray-200 rounded-xl" />
          <div className="h-10 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white py-24 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-light text-gray-900 mb-4">{error || 'Entry not found'}</h1>
          <Button variant="outline" asChild>
            <Link href="/journal">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Journal
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-24 px-8">
      <article className="max-w-3xl mx-auto">
        {/* Back link */}
        <Button variant="ghost" size="sm" asChild className="mb-8">
          <Link href="/journal">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Journal
          </Link>
        </Button>

        {/* Cover image */}
        {post.coverImage && (
          <div className="relative aspect-[2/1] rounded-xl overflow-hidden mb-8">
            <Image
              src={post.coverImage}
              alt={post.title.en || post.title.ptBR}
              fill
              className="object-cover object-center"
              priority
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-2">
          {post.title.en || post.title.ptBR}
        </h1>
        {post.title.ptBR && post.title.en && (
          <p className="text-xl text-gray-500 font-light mb-6">
            {post.title.ptBR}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b">
          {post.publishedAt && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1.5" />
              {formatDate(post.publishedAt)}
            </div>
          )}
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1.5" />
            {post.readingTime} min read
          </div>
          <div className="flex items-center">
            <Eye className="w-4 h-4 mr-1.5" />
            {post.viewCount} views
          </div>
        </div>

        {/* Content - English */}
        {post.content.en && (
          <div className="mb-12">
            <ContentRenderer content={post.content.en} />
          </div>
        )}

        {/* Content - Portuguese */}
        {post.content.ptBR && (
          <div className="mb-12">
            {post.content.en && (
              <div className="border-t pt-8 mb-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-4">Portugues</p>
              </div>
            )}
            <ContentRenderer content={post.content.ptBR} />
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="border-t pt-8 mt-8">
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-sm">
                  <Tag className="w-3 h-3 mr-1.5" />{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
