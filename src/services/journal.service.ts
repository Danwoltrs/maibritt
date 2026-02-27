import { supabase } from '@/lib/supabase'
import { sanitizeFilterValue } from '@/lib/utils'
import { Content } from '@/types'
import { StorageService } from './storage.service'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TiptapDoc = Record<string, any>

export interface JournalPost {
  id: string
  title: Content
  slug: string
  content: { ptBR: TiptapDoc | null; en: TiptapDoc | null }
  excerpt?: Content
  coverImage?: string
  published: boolean
  publishedAt?: Date
  tags: string[]
  readingTime: number
  viewCount: number
  featured: boolean
  createdAt: Date
  updatedAt: Date
}

export interface JournalPostCreateData {
  title: Content
  content: { ptBR: TiptapDoc | null; en: TiptapDoc | null }
  excerpt?: Content
  coverImageFile?: File
  tags?: string[]
  published?: boolean
  publishedAt?: Date
  featured?: boolean
}

export interface JournalPostUpdateData {
  title?: Content
  content?: { ptBR: TiptapDoc | null; en: TiptapDoc | null }
  excerpt?: Content
  newCoverImageFile?: File
  tags?: string[]
  published?: boolean
  publishedAt?: Date
  featured?: boolean
}

export interface JournalPostFilters {
  published?: boolean
  featured?: boolean
  tag?: string
  searchTerm?: string
  year?: number
  month?: number
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface JournalPostListResponse {
  posts: JournalPost[]
  total: number
  page: number
  totalPages: number
}

export interface JournalArchive {
  year: number
  month: number
  count: number
  posts: JournalPost[]
}

export class JournalService {
  /**
   * Extract plain text from Tiptap JSON for reading time / search
   */
  private static extractTextFromTiptap(doc: TiptapDoc | null): string {
    if (!doc) return ''
    const texts: string[] = []
    const walk = (node: TiptapDoc) => {
      if (node.type === 'text' && node.text) {
        texts.push(node.text)
      }
      if (Array.isArray(node.content)) {
        node.content.forEach(walk)
      }
    }
    walk(doc)
    return texts.join(' ')
  }

  /**
   * Calculate estimated reading time from Tiptap JSON content
   */
  private static calculateReadingTime(contentEn: TiptapDoc | null, contentPt: TiptapDoc | null): number {
    const textEn = this.extractTextFromTiptap(contentEn)
    const textPt = this.extractTextFromTiptap(contentPt)
    const combined = (textEn + ' ' + textPt).trim()
    if (!combined) return 1
    const wordCount = combined.split(/\s+/).length
    return Math.max(1, Math.ceil(wordCount / 200))
  }

  /**
   * Get all journal posts with optional filtering and pagination
   */
  static async getJournalPosts(
    filters: JournalPostFilters = {},
    pagination?: PaginationOptions
  ): Promise<JournalPostListResponse> {
    try {
      let query = supabase
        .from('blog_posts')
        .select('*', { count: 'exact' })

      if (filters.published !== undefined) {
        query = query.eq('published', filters.published)
      }
      if (filters.featured !== undefined) {
        query = query.eq('featured', filters.featured)
      }
      if (filters.tag) {
        query = query.contains('tags', [filters.tag])
      }
      if (filters.searchTerm) {
        const term = sanitizeFilterValue(filters.searchTerm)
        query = query.or(`title_pt.ilike.%${term}%,title_en.ilike.%${term}%,excerpt_pt.ilike.%${term}%,excerpt_en.ilike.%${term}%`)
      }
      if (filters.year && filters.month) {
        const startDate = new Date(filters.year, filters.month - 1, 1)
        const endDate = new Date(filters.year, filters.month, 0)
        query = query.gte('published_at', startDate.toISOString())
                     .lte('published_at', endDate.toISOString())
      } else if (filters.year) {
        const startDate = new Date(filters.year, 0, 1)
        const endDate = new Date(filters.year, 11, 31)
        query = query.gte('published_at', startDate.toISOString())
                     .lte('published_at', endDate.toISOString())
      }

      if (pagination) {
        const from = (pagination.page - 1) * pagination.limit
        const to = from + pagination.limit - 1
        query = query.range(from, to)
      }

      if (filters.published !== false) {
        query = query.order('published_at', { ascending: false, nullsFirst: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error, count } = await query
      if (error) throw error

      return {
        posts: data?.map(this.transformFromDB) || [],
        total: count || 0,
        page: pagination?.page || 1,
        totalPages: pagination ? Math.ceil((count || 0) / pagination.limit) : 1
      }
    } catch (error) {
      console.error('Error fetching journal posts:', error)
      throw error
    }
  }

  static async getJournalPostById(id: string): Promise<JournalPost | null> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      return this.transformFromDB(data)
    } catch (error) {
      console.error('Error fetching journal post:', error)
      throw error
    }
  }

  static async getJournalPostBySlug(slug: string): Promise<JournalPost | null> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      // Fire and forget — don't block page load
      this.incrementViewCount(data.id).catch(() => {})
      return this.transformFromDB(data)
    } catch (error) {
      console.error('Error fetching journal post by slug:', error)
      throw error
    }
  }

  static async createJournalPost(postData: JournalPostCreateData): Promise<JournalPost> {
    try {
      let coverImageUrl = ''
      if (postData.coverImageFile) {
        const uploadResult = await StorageService.uploadSingleImage(postData.coverImageFile, 'journal')
        coverImageUrl = uploadResult.urls.display
      }

      const slug = await this.generateUniqueSlug(postData.title.en || postData.title.ptBR)
      const readingTime = this.calculateReadingTime(postData.content.en, postData.content.ptBR)

      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          title_pt: postData.title.ptBR || '',
          title_en: postData.title.en || '',
          slug,
          content_pt: postData.content.ptBR ?? '',
          content_en: postData.content.en ?? '',
          excerpt_pt: postData.excerpt?.ptBR || '',
          excerpt_en: postData.excerpt?.en || '',
          cover_image: coverImageUrl,
          published: postData.published || false,
          published_at: postData.published ? (postData.publishedAt?.toISOString() || new Date().toISOString()) : null,
          tags: postData.tags || [],
          reading_time: readingTime,
          featured: postData.featured || false
        })
        .select()
        .single()

      if (error) throw error
      return this.transformFromDB(data)
    } catch (error) {
      console.error('Error creating journal post:', error)
      throw error
    }
  }

  static async updateJournalPost(id: string, updateData: JournalPostUpdateData): Promise<JournalPost> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateObject: any = {}

      if (updateData.title) {
        updateObject.title_pt = updateData.title.ptBR
        updateObject.title_en = updateData.title.en
        updateObject.slug = await this.generateUniqueSlug(updateData.title.en || updateData.title.ptBR, id)
      }

      if (updateData.content) {
        updateObject.content_pt = updateData.content.ptBR ?? ''
        updateObject.content_en = updateData.content.en ?? ''
        updateObject.reading_time = this.calculateReadingTime(updateData.content.en, updateData.content.ptBR)
      }

      if (updateData.excerpt) {
        updateObject.excerpt_pt = updateData.excerpt.ptBR
        updateObject.excerpt_en = updateData.excerpt.en
      }

      if (updateData.tags !== undefined) updateObject.tags = updateData.tags
      if (updateData.featured !== undefined) updateObject.featured = updateData.featured

      if (updateData.published !== undefined) {
        updateObject.published = updateData.published
        if (updateData.published && !updateData.publishedAt) {
          updateObject.published_at = new Date().toISOString()
        } else if (updateData.publishedAt) {
          updateObject.published_at = updateData.publishedAt.toISOString()
        }
      }

      if (updateData.newCoverImageFile) {
        const uploadResult = await StorageService.uploadSingleImage(updateData.newCoverImageFile, 'journal')
        updateObject.cover_image = uploadResult.urls.display
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updateObject)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return this.transformFromDB(data)
    } catch (error) {
      console.error('Error updating journal post:', error)
      throw error
    }
  }

  static async deleteJournalPost(id: string): Promise<void> {
    try {
      const post = await this.getJournalPostById(id)
      if (post?.coverImage) {
        try {
          const urlParts = post.coverImage.split('/')
          const fileName = urlParts[urlParts.length - 1].split('.')[0]
          await StorageService.deleteImages('journal', fileName)
        } catch (storageError) {
          console.warn('Failed to delete journal post image:', storageError)
        }
      }

      const { error } = await supabase.from('blog_posts').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
      console.error('Error deleting journal post:', error)
      throw error
    }
  }

  static async getFeaturedJournalPosts(limit = 3): Promise<JournalPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .eq('featured', true)
        .order('published_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data?.map(this.transformFromDB) || []
    } catch (error) {
      console.error('Error fetching featured journal posts:', error)
      throw error
    }
  }

  static async getRecentJournalPosts(limit = 5): Promise<JournalPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data?.map(this.transformFromDB) || []
    } catch (error) {
      console.error('Error fetching recent journal posts:', error)
      throw error
    }
  }

  static async getJournalPostsByTag(tag: string, limit?: number): Promise<JournalPost[]> {
    try {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .contains('tags', [tag])
        .order('published_at', { ascending: false })

      if (limit) query = query.limit(limit)

      const { data, error } = await query
      if (error) throw error
      return data?.map(this.transformFromDB) || []
    } catch (error) {
      console.error('Error fetching journal posts by tag:', error)
      throw error
    }
  }

  static async getAllTags(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('tags')
        .eq('published', true)

      if (error) throw error

      const allTags = data?.flatMap(post => post.tags || []) || []
      return [...new Set(allTags)].sort()
    } catch (error) {
      console.error('Error fetching tags:', error)
      throw error
    }
  }

  static async getJournalArchive(): Promise<JournalArchive[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title_pt, title_en, slug, published_at')
        .eq('published', true)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })

      if (error) throw error

      const archiveMap = new Map<string, JournalArchive>()

      data?.forEach(post => {
        const date = new Date(post.published_at)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const key = `${year}-${month}`

        if (!archiveMap.has(key)) {
          archiveMap.set(key, { year, month, count: 0, posts: [] })
        }

        const archive = archiveMap.get(key)!
        archive.count++
        archive.posts.push({
          id: post.id,
          title: { ptBR: post.title_pt, en: post.title_en },
          slug: post.slug,
          content: { ptBR: null, en: null },
          published: true,
          publishedAt: new Date(post.published_at),
          tags: [],
          readingTime: 0,
          viewCount: 0,
          featured: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      })

      return Array.from(archiveMap.values())
        .sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
    } catch (error) {
      console.error('Error fetching journal archive:', error)
      throw error
    }
  }

  static async incrementViewCount(id: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_blog_post_views', { post_id: id })
      if (error) console.warn('Failed to increment view count:', error)
    } catch (error) {
      console.warn('Failed to increment view count:', error)
    }
  }

  static async getJournalStats(): Promise<{
    totalPosts: number
    publishedPosts: number
    draftPosts: number
    totalViews: number
    featuredPosts: number
    uniqueTags: number
  }> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('published, view_count, featured, tags')

      if (error) throw error
      if (!data) return { totalPosts: 0, publishedPosts: 0, draftPosts: 0, totalViews: 0, featuredPosts: 0, uniqueTags: 0 }

      const publishedPosts = data.filter(p => p.published).length
      const featuredPosts = data.filter(p => p.featured).length
      const totalViews = data.reduce((sum, p) => sum + (p.view_count || 0), 0)
      const uniqueTags = new Set(data.flatMap(p => p.tags || [])).size

      return { totalPosts: data.length, publishedPosts, draftPosts: data.length - publishedPosts, totalViews, featuredPosts, uniqueTags }
    } catch (error) {
      console.error('Error fetching journal stats:', error)
      throw error
    }
  }

  static async togglePublished(id: string, published: boolean): Promise<JournalPost> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = { published }
    if (published) update.published_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('blog_posts')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return this.transformFromDB(data)
  }

  static async toggleFeatured(id: string, featured: boolean): Promise<JournalPost> {
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ featured })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return this.transformFromDB(data)
  }

  private static async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const baseSlug = title
      .toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    let slug = baseSlug
    let suffix = 2

    while (true) {
      let query = supabase.from('blog_posts').select('id').eq('slug', slug).limit(1)
      if (excludeId) query = query.neq('id', excludeId)
      const { data } = await query
      if (!data || data.length === 0) break
      slug = `${baseSlug}-${suffix}`
      suffix++
    }

    return slug
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static parseContent(raw: any): TiptapDoc | null {
    if (!raw) return null
    if (typeof raw === 'object') return raw
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        return typeof parsed === 'object' ? parsed : null
      } catch {
        return null
      }
    }
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static transformFromDB(data: any): JournalPost {
    return {
      id: data.id,
      title: { ptBR: data.title_pt || '', en: data.title_en || '' },
      slug: data.slug || '',
      content: {
        ptBR: this.parseContent(data.content_pt),
        en: this.parseContent(data.content_en),
      },
      excerpt: data.excerpt_pt || data.excerpt_en ? {
        ptBR: data.excerpt_pt || '',
        en: data.excerpt_en || ''
      } : undefined,
      coverImage: data.cover_image || undefined,
      published: data.published || false,
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
      tags: data.tags || [],
      readingTime: data.reading_time || 0,
      viewCount: data.view_count || 0,
      featured: data.featured || false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}

// Backward compatibility re-exports
export { JournalService as BlogService }
export type {
  JournalPost as BlogPost,
  JournalPostCreateData as BlogPostCreateData,
  JournalPostUpdateData as BlogPostUpdateData,
  JournalPostFilters as BlogPostFilters,
  JournalPostListResponse as BlogPostListResponse,
  JournalArchive as BlogArchive
}
