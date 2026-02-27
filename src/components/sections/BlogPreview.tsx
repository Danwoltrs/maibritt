'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight, BookOpen, Tag, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BlogService, BlogPost } from '@/services'
import { useParallax } from '@/hooks/useScrollAnimation'
import { JournalContextMenu } from '@/components/admin/JournalContextMenu'

interface BlogPreviewProps {
  id?: string
  className?: string
  limit?: number
}

const BlogPreview = ({ id = "blog", className = "", limit = 3 }: BlogPreviewProps) => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [parallaxRef, parallaxY] = useParallax(25)
  const ref = useRef<HTMLElement>(null)

  const handleUpdate = () => setRefreshKey(k => k + 1)

  // Fetch blog posts
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setIsLoading(true)
        const response = await BlogService.getRecentJournalPosts(limit)
        setBlogPosts(response)
      } catch (err) {
        console.warn('Failed to fetch journal posts:', err)
        setError(err instanceof Error ? err.message : 'Failed to load journal')
        setBlogPosts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlogPosts()
  }, [limit, refreshKey])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDatePt = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <section id={id} className={`py-24 px-8 bg-gray-50 ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/2] bg-gray-200 rounded-lg"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id={id} ref={ref} className={`relative py-24 px-8 bg-gray-50 overflow-hidden ${className}`}>
      {/* Parallax background elements */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 opacity-5"
        style={{ transform: `translateY(${parallaxY}px)` }}
      >
        <div className="absolute top-1/4 left-10 w-80 h-80 bg-gradient-to-br from-orange-200 to-red-200 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-7xl mx-auto"
      >
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl font-light text-gray-900 mb-4"
          >
            Artist Journal
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Insights from the studio, creative process, and artistic exploration
            <span className="block text-lg mt-2 opacity-80">
              Diário da Artista • Reflexões do ateliê e processo criativo
            </span>
          </motion.p>
        </div>

        {blogPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {blogPosts.map((post, index) => {
                const delay = index * 0.2
                const isFeatured = index === 0

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 60, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.8,
                      delay: delay,
                      ease: "easeOut"
                    }}
                    className={`group cursor-pointer ${isFeatured ? 'md:col-span-2 md:row-span-2' : ''}`}
                  >
                    <JournalContextMenu post={post} onUpdate={handleUpdate}>
                    <Link href={`/journal/${post.slug}`}>
                      <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden group-hover:scale-[1.01]">
                        {/* Blog post image */}
                        {post.coverImage && (
                          <div className={`relative overflow-hidden ${isFeatured ? 'aspect-[3/2]' : 'aspect-[3/2]'}`}>
                            <Image
                              src={post.coverImage}
                              alt={post.title.en}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />

                            {/* Featured badge */}
                            {post.featured && (
                              <div className="absolute top-4 left-4">
                                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                  Featured
                                </Badge>
                              </div>
                            )}

                            {/* Reading time */}
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium text-gray-900 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {post.readingTime}min
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute bottom-4 left-4 text-white">
                                <div className="flex items-center space-x-4 text-sm">
                                  <div className="flex items-center">
                                    <Eye className="w-4 h-4 mr-1" />
                                    {post.viewCount}
                                  </div>
                                  <div className="flex items-center">
                                    <BookOpen className="w-4 h-4 mr-1" />
                                    Read more
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <CardContent className={`${isFeatured ? 'p-8' : 'p-6'}`}>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: delay + 0.3 }}
                          >
                            {/* Date and tags */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>{post.publishedAt ? formatDate(post.publishedAt) : 'Draft'}</span>
                              </div>
                              {post.tags.length > 0 && (
                                <div className="flex items-center">
                                  <Tag className="w-3 h-3 mr-1 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    {post.tags[0]}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className={`font-medium text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 ${
                              isFeatured ? 'text-2xl lg:text-3xl' : 'text-xl'
                            }`}>
                              {post.title.en}
                            </h3>

                            {/* Portuguese title */}
                            <p className={`text-gray-600 mb-4 ${isFeatured ? 'text-lg' : 'text-sm'} font-medium`}>
                              {post.title.ptBR}
                            </p>

                            {/* Excerpt */}
                            {post.excerpt && (
                              <div className="space-y-3">
                                <p className={`text-gray-600 leading-relaxed ${
                                  isFeatured ? 'text-base line-clamp-4' : 'text-sm line-clamp-3'
                                }`}>
                                  {post.excerpt.en}
                                </p>
                                <p className={`text-gray-500 leading-relaxed ${
                                  isFeatured ? 'text-sm line-clamp-3' : 'text-xs line-clamp-2'
                                }`}>
                                  {post.excerpt.ptBR}
                                </p>
                              </div>
                            )}

                            {/* Tags */}
                            {post.tags.length > 1 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: delay + 0.5 }}
                                className="flex flex-wrap gap-2 mt-4"
                              >
                                {post.tags.slice(0, isFeatured ? 4 : 3).map((tag, tagIndex) => (
                                  <Badge
                                    key={tagIndex}
                                    variant="outline"
                                    className="text-xs bg-gray-50 hover:bg-gray-100 transition-colors"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </motion.div>
                            )}

                            {/* Date in Portuguese */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-xs text-gray-500">
                                {post.publishedAt ? formatDatePt(post.publishedAt) : 'Rascunho'}
                              </p>
                            </div>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </Link>
                    </JournalContextMenu>
                  </motion.div>
                )
              })}
            </div>

            {/* View all blog button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-center mt-12"
            >
              <Button
                size="lg"
                className="group bg-gray-900 hover:bg-gray-800 text-white"
                asChild
              >
                <Link href="/journal">
                  Read All Journal Entries
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-4">
              Journal Coming Soon
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Mai-Britt will be sharing insights from her studio and creative process.
              Stay tuned for the first entries.
            </p>
            <Button variant="outline" asChild>
              <Link href="/contact">
                Get notified when published
              </Link>
            </Button>
          </div>
        )}
      </motion.div>

      {/* Floating decorative elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: [0, -12, 0],
          rotate: [0, 3, 0]
        }}
        transition={{
          opacity: { delay: 1.2, duration: 1 },
          scale: { delay: 1.2, duration: 1 },
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute top-20 right-20 w-12 h-12 bg-orange-100 rounded-full opacity-30 hidden lg:block"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: [0, 18, 0],
          rotate: [0, -5, 0]
        }}
        transition={{
          opacity: { delay: 1.4, duration: 1 },
          scale: { delay: 1.4, duration: 1 },
          y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute bottom-20 left-20 w-16 h-16 bg-yellow-100 rounded-full opacity-30 hidden lg:block"
      />
    </section>
  )
}

export default BlogPreview