'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight, BookOpen, Tag, Eye, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { JournalService, JournalPost } from '@/services/journal.service'

export default function JournalListPage() {
  const [posts, setPosts] = useState<JournalPost[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true)
        const [result, tags] = await Promise.all([
          JournalService.getJournalPosts({ published: true }),
          JournalService.getAllTags()
        ])
        setPosts(result.posts)
        setAllTags(tags)
      } catch (err) {
        console.error('Error loading journal:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let result = posts
    if (activeTag) {
      result = result.filter(p => p.tags.includes(activeTag))
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      result = result.filter(p =>
        (p.title.en || '').toLowerCase().includes(q) ||
        (p.title.ptBR || '').toLowerCase().includes(q) ||
        (p.excerpt?.en || '').toLowerCase().includes(q) ||
        (p.excerpt?.ptBR || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [posts, activeTag, searchTerm])

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-24 px-8">
        <div className="max-w-5xl mx-auto animate-pulse space-y-8">
          <div className="h-10 bg-gray-200 rounded w-48 mx-auto" />
          <div className="h-6 bg-gray-200 rounded w-80 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/2] bg-gray-200 rounded-lg" />
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-24 px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
            Artist Journal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Insights from the studio, creative process, and artistic exploration
            <span className="block text-lg mt-2 opacity-80">
              Diário da Artista
            </span>
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-12 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <Badge
                variant={activeTag === null ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveTag(null)}
              >
                All
              </Badge>
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={activeTag === tag ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Posts Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No entries found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {filtered.map((post, index) => {
              const isFeatured = index === 0

              return (
                <Link
                  key={post.id}
                  href={`/journal/${post.slug}`}
                  className={`group ${isFeatured ? 'md:col-span-2' : ''}`}
                >
                  <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden group-hover:scale-[1.01]">
                    {post.coverImage && (
                      <div className="relative aspect-[3/2] overflow-hidden">
                        <Image
                          src={post.coverImage}
                          alt={post.title.en || post.title.ptBR}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        {post.featured && (
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              Featured
                            </Badge>
                          </div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium text-gray-900 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {post.readingTime}min
                        </div>
                      </div>
                    )}

                    <CardContent className={isFeatured ? 'p-8' : 'p-6'}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {post.publishedAt ? formatDate(post.publishedAt) : 'Draft'}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <Eye className="w-3 h-3 mr-1" />
                          {post.viewCount}
                        </div>
                      </div>

                      <h2 className={`font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors ${
                        isFeatured ? 'text-2xl lg:text-3xl' : 'text-xl'
                      }`}>
                        {post.title.en || post.title.ptBR}
                      </h2>

                      {post.title.ptBR && post.title.en && (
                        <p className="text-gray-500 mb-3 text-sm font-medium">
                          {post.title.ptBR}
                        </p>
                      )}

                      {post.excerpt && (
                        <p className={`text-gray-600 leading-relaxed ${
                          isFeatured ? 'text-base line-clamp-4' : 'text-sm line-clamp-3'
                        }`}>
                          {post.excerpt.en || post.excerpt.ptBR}
                        </p>
                      )}

                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {post.tags.slice(0, 4).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
