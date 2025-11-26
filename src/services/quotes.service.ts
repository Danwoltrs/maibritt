import { supabase } from '@/lib/supabase'

export type QuoteType = 'artist' | 'press' | 'testimonial' | 'curator'

export interface Quote {
  id: string
  quotePt: string
  quoteEn: string
  author?: string
  authorTitle?: string       // e.g., "Art Critic", "Curator at Museum X"
  source?: string            // e.g., "Folha de São Paulo", "Art Magazine"
  sourceUrl?: string         // Link to original article
  sourceDate?: Date          // Publication date
  quoteType: QuoteType
  imageUrl?: string          // Magazine clipping or press photo
  imageCaption?: string      // Caption for the image
  isActive: boolean
  featured: boolean          // Show prominently on homepage
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface QuoteCreateData {
  quotePt: string
  quoteEn: string
  author?: string
  authorTitle?: string
  source?: string
  sourceUrl?: string
  sourceDate?: Date
  quoteType?: QuoteType
  imageUrl?: string
  imageCaption?: string
  isActive?: boolean
  featured?: boolean
}

export interface QuoteUpdateData {
  quotePt?: string
  quoteEn?: string
  author?: string
  authorTitle?: string
  source?: string
  sourceUrl?: string
  sourceDate?: Date
  quoteType?: QuoteType
  imageUrl?: string
  imageCaption?: string
  isActive?: boolean
  featured?: boolean
  displayOrder?: number
}

export class QuotesService {
  /**
   * Get all active quotes, optionally filtered by type
   */
  static async getActiveQuotes(quoteType?: QuoteType): Promise<Quote[]> {
    try {
      let query = supabase
        .from('quotes')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (quoteType) {
        query = query.eq('quote_type', quoteType)
      }

      const { data, error } = await query

      if (error) throw error

      return data?.map(this.transformQuoteFromDB) || []
    } catch (error) {
      console.error('Error fetching quotes:', error)
      throw error
    }
  }

  /**
   * Get featured quotes for homepage display
   */
  static async getFeaturedQuotes(): Promise<Quote[]> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('is_active', true)
        .eq('featured', true)
        .order('display_order', { ascending: true })

      if (error) throw error

      return data?.map(this.transformQuoteFromDB) || []
    } catch (error) {
      console.error('Error fetching featured quotes:', error)
      throw error
    }
  }

  /**
   * Get press quotes (from magazines/newspapers)
   */
  static async getPressQuotes(): Promise<Quote[]> {
    return this.getActiveQuotes('press')
  }

  /**
   * Get all quotes (including inactive) for admin
   */
  static async getAllQuotes(): Promise<Quote[]> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error

      return data?.map(this.transformQuoteFromDB) || []
    } catch (error) {
      console.error('Error fetching all quotes:', error)
      throw error
    }
  }

  /**
   * Get a random active quote, optionally filtered by type
   */
  static async getRandomQuote(quoteType?: QuoteType): Promise<Quote | null> {
    try {
      let query = supabase
        .from('quotes')
        .select('*')
        .eq('is_active', true)

      if (quoteType) {
        query = query.eq('quote_type', quoteType)
      }

      const { data, error } = await query

      if (error) throw error

      if (!data || data.length === 0) return null

      // Pick a random quote
      const randomIndex = Math.floor(Math.random() * data.length)
      return this.transformQuoteFromDB(data[randomIndex])
    } catch (error) {
      console.error('Error fetching random quote:', error)
      throw error
    }
  }

  /**
   * Get quote by ID
   */
  static async getQuoteById(id: string): Promise<Quote | null> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return this.transformQuoteFromDB(data)
    } catch (error) {
      console.error('Error fetching quote:', error)
      throw error
    }
  }

  /**
   * Create a new quote
   */
  static async createQuote(quoteData: QuoteCreateData): Promise<Quote> {
    try {
      // Get the next display order
      const { data: maxOrderData } = await supabase
        .from('quotes')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)

      const nextDisplayOrder = (maxOrderData?.[0]?.display_order || 0) + 1

      const { data, error } = await supabase
        .from('quotes')
        .insert({
          quote_pt: quoteData.quotePt,
          quote_en: quoteData.quoteEn,
          author: quoteData.author || null,
          author_title: quoteData.authorTitle || null,
          source: quoteData.source || null,
          source_url: quoteData.sourceUrl || null,
          source_date: quoteData.sourceDate ? quoteData.sourceDate.toISOString().split('T')[0] : null,
          quote_type: quoteData.quoteType || 'artist',
          image_url: quoteData.imageUrl || null,
          image_caption: quoteData.imageCaption || null,
          is_active: quoteData.isActive ?? true,
          featured: quoteData.featured ?? false,
          display_order: nextDisplayOrder
        })
        .select()
        .single()

      if (error) throw error

      return this.transformQuoteFromDB(data)
    } catch (error) {
      console.error('Error creating quote:', error)
      throw error
    }
  }

  /**
   * Update an existing quote
   */
  static async updateQuote(id: string, updateData: QuoteUpdateData): Promise<Quote> {
    try {
      const updateObject: Record<string, unknown> = {}

      if (updateData.quotePt !== undefined) updateObject.quote_pt = updateData.quotePt
      if (updateData.quoteEn !== undefined) updateObject.quote_en = updateData.quoteEn
      if (updateData.author !== undefined) updateObject.author = updateData.author
      if (updateData.authorTitle !== undefined) updateObject.author_title = updateData.authorTitle
      if (updateData.source !== undefined) updateObject.source = updateData.source
      if (updateData.sourceUrl !== undefined) updateObject.source_url = updateData.sourceUrl
      if (updateData.sourceDate !== undefined) {
        updateObject.source_date = updateData.sourceDate ? updateData.sourceDate.toISOString().split('T')[0] : null
      }
      if (updateData.quoteType !== undefined) updateObject.quote_type = updateData.quoteType
      if (updateData.imageUrl !== undefined) updateObject.image_url = updateData.imageUrl
      if (updateData.imageCaption !== undefined) updateObject.image_caption = updateData.imageCaption
      if (updateData.isActive !== undefined) updateObject.is_active = updateData.isActive
      if (updateData.featured !== undefined) updateObject.featured = updateData.featured
      if (updateData.displayOrder !== undefined) updateObject.display_order = updateData.displayOrder

      updateObject.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('quotes')
        .update(updateObject)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return this.transformQuoteFromDB(data)
    } catch (error) {
      console.error('Error updating quote:', error)
      throw error
    }
  }

  /**
   * Delete a quote
   */
  static async deleteQuote(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting quote:', error)
      throw error
    }
  }

  /**
   * Toggle quote active status
   */
  static async toggleQuoteActive(id: string, isActive: boolean): Promise<Quote> {
    return this.updateQuote(id, { isActive })
  }

  /**
   * Reorder quotes
   */
  static async reorderQuotes(quoteIds: string[]): Promise<void> {
    try {
      for (let i = 0; i < quoteIds.length; i++) {
        const { error } = await supabase
          .from('quotes')
          .update({ display_order: i + 1 })
          .eq('id', quoteIds[i])

        if (error) throw error
      }
    } catch (error) {
      console.error('Error reordering quotes:', error)
      throw error
    }
  }

  /**
   * Transform database record to Quote type
   */
  private static transformQuoteFromDB(data: Record<string, unknown>): Quote {
    return {
      id: data.id as string,
      quotePt: data.quote_pt as string,
      quoteEn: data.quote_en as string,
      author: data.author as string | undefined,
      authorTitle: data.author_title as string | undefined,
      source: data.source as string | undefined,
      sourceUrl: data.source_url as string | undefined,
      sourceDate: data.source_date ? new Date(data.source_date as string) : undefined,
      quoteType: (data.quote_type as QuoteType) || 'artist',
      imageUrl: data.image_url as string | undefined,
      imageCaption: data.image_caption as string | undefined,
      isActive: data.is_active as boolean,
      featured: data.featured as boolean,
      displayOrder: data.display_order as number,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string)
    }
  }
}
