import { supabase } from '@/lib/supabase'
import { sanitizeFilterValue } from '@/lib/utils'
import { Content } from '@/types'
import { StorageService } from './storage.service'

export interface BlogPost {
  id: string
  title: Content
  slug: string
  content: Content
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

export interface BlogPostCreateData {
  title: Content
  content: Content
  excerpt?: Content
  coverImageFile?: File
  tags?: string[]
  published?: boolean
  publishedAt?: Date
  featured?: boolean
}

export interface BlogPostUpdateData {
  title?: Content
  content?: Content
  excerpt?: Content
  newCoverImageFile?: File
  tags?: string[]
  published?: boolean
  publishedAt?: Date
  featured?: boolean
}

export interface BlogPostFilters {
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

export interface BlogPostListResponse {
  posts: BlogPost[]
  total: number
  page: number
  totalPages: number
}

export interface BlogArchive {
  year: number
  month: number
  count: number
  posts: BlogPost[]
}

export class BlogService {
  /**
   * Get all blog posts with optional filtering and pagination
   */
  static async getBlogPosts(
    filters: BlogPostFilters = {},
    pagination?: PaginationOptions
  ): Promise<BlogPostListResponse> {
    try {
      let query = supabase
        .from('blog_posts')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.published !== undefined) {
        query = query.eq('published', filters.published)
      }

      if (filters.featured !== undefined) {
        query = query.eq('featured', filters.featured)
      }

      if (filters.tag) {
        query = query.contains('tags', [filters.tag])
      }

      // Search functionality
      if (filters.searchTerm) {
        const term = sanitizeFilterValue(filters.searchTerm)
        query = query.or(`title_pt.ilike.%${term}%,title_en.ilike.%${term}%,content_pt.ilike.%${term}%,content_en.ilike.%${term}%,excerpt_pt.ilike.%${term}%,excerpt_en.ilike.%${term}%`)
      }

      // Date filtering
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

      // Apply pagination
      if (pagination) {
        const { page, limit } = pagination
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)
      }

      // Order by published date or created date
      if (filters.published !== false) {
        query = query.order('published_at', { ascending: false, nullsFirst: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error, count } = await query

      if (error) throw error

      // Transform database records to our BlogPost type
      const posts: BlogPost[] = data?.map(this.transformBlogPostFromDB) || []

      return {
        posts,
        total: count || 0,
        page: pagination?.page || 1,
        totalPages: pagination ? Math.ceil((count || 0) / pagination.limit) : 1
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      throw error
    }
  }

  /**
   * Get a single blog post by ID
   */
  static async getBlogPostById(id: string): Promise<BlogPost | null> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        throw error
      }

      return this.transformBlogPostFromDB(data)
    } catch (error) {
      console.error('Error fetching blog post:', error)
      throw error
    }
  }

  /**
   * Get a single blog post by slug
   */
  static async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        throw error
      }

      // Increment view count
      await this.incrementViewCount(data.id)

      return this.transformBlogPostFromDB(data)
    } catch (error) {
      console.error('Error fetching blog post by slug:', error)
      throw error
    }
  }

  /**
   * Create a new blog post
   */
  static async createBlogPost(
    postData: BlogPostCreateData
  ): Promise<BlogPost> {
    try {
      // Upload cover image if provided
      let coverImageUrl = ''

      if (postData.coverImageFile) {
        const uploadResult = await StorageService.uploadSingleImage(
          postData.coverImageFile,
          'series' // Using series bucket for blog images
        )
        coverImageUrl = uploadResult.urls.display
      }

      // Generate unique slug from title
      const slug = await this.generateUniqueSlug(postData.title.en)

      // Calculate reading time
      const readingTime = this.calculateReadingTime(
        postData.content.ptBR + ' ' + postData.content.en
      )

      // Create blog post record
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          title_pt: postData.title.ptBR,
          title_en: postData.title.en,
          slug,
          content_pt: postData.content.ptBR,
          content_en: postData.content.en,
          excerpt_pt: postData.excerpt?.ptBR || '',
          excerpt_en: postData.excerpt?.en || '',
          cover_image: coverImageUrl,
          published: postData.published || false,
          published_at: postData.published ? (postData.publishedAt || new Date()) : null,
          tags: postData.tags || [],
          reading_time: readingTime,
          featured: postData.featured || false
        })
        .select()
        .single()

      if (error) throw error

      return this.transformBlogPostFromDB(data)
    } catch (error) {
      console.error('Error creating blog post:', error)
      throw error
    }
  }

  /**
   * Update an existing blog post
   */
  static async updateBlogPost(
    id: string,
    updateData: BlogPostUpdateData
  ): Promise<BlogPost> {
    try {
      // Prepare update object
      const updateObject: any = {}

      if (updateData.title) {
        updateObject.title_pt = updateData.title.ptBR
        updateObject.title_en = updateData.title.en
        // Regenerate slug if title changed
        updateObject.slug = await this.generateUniqueSlug(updateData.title.en, id)
      }

      if (updateData.content) {
        updateObject.content_pt = updateData.content.ptBR
        updateObject.content_en = updateData.content.en
        // Recalculate reading time
        updateObject.reading_time = this.calculateReadingTime(
          updateData.content.ptBR + ' ' + updateData.content.en
        )
      }

      if (updateData.excerpt) {
        updateObject.excerpt_pt = updateData.excerpt.ptBR
        updateObject.excerpt_en = updateData.excerpt.en
      }

      if (updateData.tags !== undefined) updateObject.tags = updateData.tags
      if (updateData.featured !== undefined) updateObject.featured = updateData.featured

      // Handle publishing status
      if (updateData.published !== undefined) {
        updateObject.published = updateData.published
        if (updateData.published && !updateData.publishedAt) {
          // Set published_at to now if publishing for the first time
          updateObject.published_at = new Date().toISOString()
        } else if (updateData.publishedAt) {
          updateObject.published_at = updateData.publishedAt.toISOString()
        }
      }

      // Upload new cover image if provided
      if (updateData.newCoverImageFile) {
        const uploadResult = await StorageService.uploadSingleImage(
          updateData.newCoverImageFile,
          'series'
        )
        updateObject.cover_image = uploadResult.urls.display
      }

      // Update blog post record
      const { data, error } = await supabase
        .from('blog_posts')
        .update(updateObject)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return this.transformBlogPostFromDB(data)
    } catch (error) {
      console.error('Error updating blog post:', error)
      throw error
    }
  }

  /**
   * Delete a blog post
   */
  static async deleteBlogPost(id: string): Promise<void> {
    try {
      // Get blog post to delete associated image
      const post = await this.getBlogPostById(id)
      if (post && post.coverImage) {
        try {
          // Extract filename from URL and delete from storage
          const imageUrl = post.coverImage
          const urlParts = imageUrl.split('/')
          const fileName = urlParts[urlParts.length - 1].split('.')[0]

          await StorageService.deleteImages('series', fileName)
        } catch (storageError) {
          console.warn('Failed to delete blog post image:', storageError)
        }
      }

      // Delete blog post record
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting blog post:', error)
      throw error
    }
  }

  /**
   * Get featured blog posts
   */
  static async getFeaturedBlogPosts(limit = 3): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .eq('featured', true)
        .order('published_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data?.map(this.transformBlogPostFromDB) || []
    } catch (error) {
      console.error('Error fetching featured blog posts:', error)
      throw error
    }
  }

  /**
   * Get recent blog posts
   */
  static async getRecentBlogPosts(limit = 5): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data?.map(this.transformBlogPostFromDB) || []
    } catch (error) {
      console.error('Error fetching recent blog posts:', error)
      throw error
    }
  }

  /**
   * Get blog posts by tag
   */
  static async getBlogPostsByTag(tag: string, limit?: number): Promise<BlogPost[]> {
    try {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .contains('tags', [tag])
        .order('published_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error

      return data?.map(this.transformBlogPostFromDB) || []
    } catch (error) {
      console.error('Error fetching blog posts by tag:', error)
      throw error
    }
  }

  /**
   * Get all unique tags
   */
  static async getAllTags(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('tags')
        .eq('published', true)

      if (error) throw error

      // Flatten and deduplicate tags
      const allTags = data?.flatMap(post => post.tags || []) || []
      const uniqueTags = [...new Set(allTags)]

      return uniqueTags.sort()
    } catch (error) {
      console.error('Error fetching tags:', error)
      throw error
    }
  }

  /**
   * Get blog archive by month/year
   */
  static async getBlogArchive(): Promise<BlogArchive[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title_pt, title_en, slug, published_at')
        .eq('published', true)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })

      if (error) throw error

      // Group by year and month
      const archiveMap = new Map<string, BlogArchive>()

      data?.forEach(post => {
        const date = new Date(post.published_at)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const key = `${year}-${month}`

        if (!archiveMap.has(key)) {
          archiveMap.set(key, {
            year,
            month,
            count: 0,
            posts: []
          })
        }

        const archive = archiveMap.get(key)!
        archive.count++
        archive.posts.push({
          id: post.id,
          title: {
            ptBR: post.title_pt,
            en: post.title_en
          },
          slug: post.slug,
          content: { ptBR: '', en: '' }, // Not needed for archive
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
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year
          return b.month - a.month
        })
    } catch (error) {
      console.error('Error fetching blog archive:', error)
      throw error
    }
  }

  /**
   * Increment view count for a blog post
   */
  static async incrementViewCount(id: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_blog_post_views', {
        post_id: id
      })

      if (error) {
        console.warn('Failed to increment view count:', error)
      }
    } catch (error) {
      console.warn('Failed to increment view count:', error)
    }
  }

  /**
   * Get blog statistics
   */
  static async getBlogStats(): Promise<{
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

      if (!data) {
        return {
          totalPosts: 0,
          publishedPosts: 0,
          draftPosts: 0,
          totalViews: 0,
          featuredPosts: 0,
          uniqueTags: 0
        }
      }

      const publishedPosts = data.filter(post => post.published).length
      const featuredPosts = data.filter(post => post.featured).length
      const totalViews = data.reduce((sum, post) => sum + (post.view_count || 0), 0)

      // Get unique tags
      const allTags = data.flatMap(post => post.tags || [])
      const uniqueTags = new Set(allTags).size

      return {
        totalPosts: data.length,
        publishedPosts,
        draftPosts: data.length - publishedPosts,
        totalViews,
        featuredPosts,
        uniqueTags
      }
    } catch (error) {
      console.error('Error fetching blog stats:', error)
      throw error
    }
  }

  /**
   * Generate URL-friendly slug from title
   */
  private static async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    let slug = baseSlug
    let suffix = 2

    while (true) {
      let query = supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .limit(1)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data } = await query
      if (!data || data.length === 0) break

      slug = `${baseSlug}-${suffix}`
      suffix++
    }

    return slug
  }

  /**
   * Calculate estimated reading time in minutes
   */
  private static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200 // Average reading speed
    const wordCount = content.trim().split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  /**
   * Transform database record to BlogPost type
   */
  private static transformBlogPostFromDB(data: any): BlogPost {
    return {
      id: data.id,
      title: {
        ptBR: data.title_pt,
        en: data.title_en
      },
      slug: data.slug,
      content: {
        ptBR: data.content_pt,
        en: data.content_en
      },
      excerpt: data.excerpt_pt || data.excerpt_en ? {
        ptBR: data.excerpt_pt || '',
        en: data.excerpt_en || ''
      } : undefined,
      coverImage: data.cover_image || undefined,
      published: data.published,
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
      tags: data.tags || [],
      readingTime: data.reading_time || 0,
      viewCount: data.view_count || 0,
      featured: data.featured,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}