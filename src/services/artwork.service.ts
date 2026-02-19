import { supabase } from '@/lib/supabase'
import { sanitizeFilterValue } from '@/lib/utils'
import { Artwork, Content } from '@/types'
import { StorageService, ImageVariant } from './storage.service'

export interface ArtworkFilters {
  category?: 'painting' | 'sculpture' | 'engraving' | 'video' | 'mixed-media'
  year?: number
  series?: string
  forSale?: boolean
  featured?: boolean
  searchTerm?: string
}

export interface ArtworkCreateData {
  title: Content
  year: number
  medium: Content
  dimensions: string
  description?: Content
  category: 'painting' | 'sculpture' | 'engraving' | 'video' | 'mixed-media'
  seriesId?: string
  images: File[]
  forSale?: boolean
  price?: number
  currency?: 'BRL' | 'USD' | 'EUR'
  featured?: boolean
}

export interface ArtworkUpdateData {
  title?: Content
  year?: number
  medium?: Content
  dimensions?: string
  description?: Content
  category?: 'painting' | 'sculpture' | 'engraving' | 'video' | 'mixed-media'
  seriesId?: string | null
  newImages?: File[]
  imagesToDelete?: string[]
  forSale?: boolean
  price?: number
  currency?: 'BRL' | 'USD' | 'EUR'
  featured?: boolean
  displayOrder?: number
  locationType?: string
  locationId?: string
  locationNotes?: string
  // Sold tracking
  isSold?: boolean
  soldPrice?: number
  soldCurrency?: 'BRL' | 'USD' | 'EUR'
  soldDate?: Date
  buyerName?: string
  buyerEmail?: string
  buyerPhone?: string
  buyerAddress?: string
  buyerCity?: string
  buyerState?: string
  buyerCountry?: string
  buyerZipCode?: string
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface ArtworkListResponse {
  artworks: Artwork[]
  total: number
  page: number
  totalPages: number
}

export interface ArtworkStats {
  totalArtworks: number
  artworksInGalleries: number
  artworksInStudio: number
  artworksSold: number
}

export class ArtworkService {
  /**
   * Get lightweight artwork stats without fetching full records
   */
  static async getArtworkStats(): Promise<ArtworkStats> {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('id, location, status')

      if (error) throw error

      const artworks = data || []
      return {
        totalArtworks: artworks.length,
        artworksInGalleries: artworks.filter(a => a.location && a.location !== 'studio').length,
        artworksInStudio: artworks.filter(a => !a.location || a.location === 'studio').length,
        artworksSold: artworks.filter(a => a.status === 'sold').length
      }
    } catch (error) {
      console.error('Error fetching artwork stats:', error)
      throw error
    }
  }

  /**
   * Get all artworks with optional filtering and pagination
   */
  static async getArtworks(
    filters: ArtworkFilters = {},
    pagination?: PaginationOptions
  ): Promise<ArtworkListResponse> {
    try {
      let query = supabase
        .from('artworks')
        .select(`
          *,
          art_series:series_id (
            id,
            name_pt,
            name_en
          )
        `, { count: 'exact' })

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.year) {
        query = query.eq('year', filters.year)
      }

      if (filters.series) {
        query = query.eq('series_id', filters.series)
      }

      if (filters.forSale !== undefined) {
        query = query.eq('for_sale', filters.forSale)
      }

      if (filters.featured !== undefined) {
        query = query.eq('featured', filters.featured)
      }

      // Search functionality
      if (filters.searchTerm) {
        const term = sanitizeFilterValue(filters.searchTerm)
        query = query.or(`title_pt.ilike.%${term}%,title_en.ilike.%${term}%,description_pt.ilike.%${term}%,description_en.ilike.%${term}%,medium_pt.ilike.%${term}%,medium_en.ilike.%${term}%`)
      }

      // Apply pagination
      if (pagination) {
        const { page, limit } = pagination
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)
      }

      // Order by display_order, then by created_at
      query = query.order('display_order', { ascending: true })
                   .order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      // Transform database records to our Artwork type
      const artworks: Artwork[] = data?.map(this.transformArtworkFromDB) || []

      return {
        artworks,
        total: count || 0,
        page: pagination?.page || 1,
        totalPages: pagination ? Math.ceil((count || 0) / pagination.limit) : 1
      }
    } catch (error) {
      console.error('Error fetching artworks:', error)
      throw error
    }
  }

  /**
   * Get a single artwork by ID
   */
  static async getArtworkById(id: string): Promise<Artwork | null> {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select(`
          *,
          art_series:series_id (
            id,
            name_pt,
            name_en
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        throw error
      }

      return this.transformArtworkFromDB(data)
    } catch (error) {
      console.error('Error fetching artwork:', error)
      throw error
    }
  }

  /**
   * Create a new artwork
   */
  static async createArtwork(
    artworkData: ArtworkCreateData,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<Artwork> {
    try {
      // Upload images first
      let imageUrls: ImageVariant[] = []

      if (artworkData.images && artworkData.images.length > 0) {
        const uploadResults = await StorageService.uploadImages(
          artworkData.images,
          'artworks',
          onProgress
        )
        imageUrls = uploadResults.map(result => result.urls)
      }

      // Get the next display order
      const { data: maxOrderData } = await supabase
        .from('artworks')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)

      const nextDisplayOrder = (maxOrderData?.[0]?.display_order || 0) + 1

      // Create artwork record
      const { data, error } = await supabase
        .from('artworks')
        .insert({
          title_pt: artworkData.title.ptBR,
          title_en: artworkData.title.en,
          year: artworkData.year,
          medium_pt: artworkData.medium.ptBR,
          medium_en: artworkData.medium.en,
          dimensions: artworkData.dimensions,
          description_pt: artworkData.description?.ptBR || '',
          description_en: artworkData.description?.en || '',
          category: artworkData.category,
          series_id: artworkData.seriesId || null,
          images: imageUrls,
          for_sale: artworkData.forSale || false,
          price: artworkData.price || null,
          currency: artworkData.currency || null,
          featured: artworkData.featured || false,
          display_order: nextDisplayOrder
        })
        .select()
        .single()

      if (error) throw error

      return this.transformArtworkFromDB(data)
    } catch (error) {
      console.error('Error creating artwork:', error)
      throw error
    }
  }

  /**
   * Update an existing artwork
   */
  static async updateArtwork(
    id: string,
    updateData: ArtworkUpdateData,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<Artwork> {
    try {
      // Get current artwork
      const currentArtwork = await this.getArtworkById(id)
      if (!currentArtwork) {
        throw new Error('Artwork not found')
      }

      let imageUrls = currentArtwork.images

      // Upload new images if provided
      if (updateData.newImages && updateData.newImages.length > 0) {
        const uploadResults = await StorageService.uploadImages(
          updateData.newImages,
          'artworks',
          onProgress
        )
        // Add new images to existing ones
        imageUrls = [...imageUrls, ...uploadResults.map(result => result.urls)]
      }

      // Prepare update object
      const updateObject: any = {}

      if (updateData.title) {
        updateObject.title_pt = updateData.title.ptBR
        updateObject.title_en = updateData.title.en
      }

      if (updateData.year !== undefined) updateObject.year = updateData.year

      if (updateData.medium) {
        updateObject.medium_pt = updateData.medium.ptBR
        updateObject.medium_en = updateData.medium.en
      }

      if (updateData.dimensions !== undefined) updateObject.dimensions = updateData.dimensions

      if (updateData.description) {
        updateObject.description_pt = updateData.description.ptBR
        updateObject.description_en = updateData.description.en
      }

      if (updateData.category !== undefined) updateObject.category = updateData.category
      if (updateData.seriesId !== undefined) updateObject.series_id = updateData.seriesId
      if (updateData.forSale !== undefined) updateObject.for_sale = updateData.forSale
      if (updateData.price !== undefined) updateObject.price = updateData.price
      if (updateData.currency !== undefined) updateObject.currency = updateData.currency
      if (updateData.featured !== undefined) updateObject.featured = updateData.featured
      if (updateData.displayOrder !== undefined) updateObject.display_order = updateData.displayOrder

      // Location fields
      if (updateData.locationType !== undefined) updateObject.location_type = updateData.locationType
      if (updateData.locationId !== undefined) updateObject.location_id = updateData.locationId || null
      if (updateData.locationNotes !== undefined) updateObject.location_notes = updateData.locationNotes

      // Sold tracking fields
      if (updateData.isSold !== undefined) updateObject.is_sold = updateData.isSold
      if (updateData.soldPrice !== undefined) updateObject.sold_price = updateData.soldPrice
      if (updateData.soldCurrency !== undefined) updateObject.sold_currency = updateData.soldCurrency
      if (updateData.soldDate !== undefined) updateObject.sold_date = updateData.soldDate
      if (updateData.buyerName !== undefined) updateObject.buyer_name = updateData.buyerName
      if (updateData.buyerEmail !== undefined) updateObject.buyer_email = updateData.buyerEmail
      if (updateData.buyerPhone !== undefined) updateObject.buyer_phone = updateData.buyerPhone
      if (updateData.buyerAddress !== undefined) updateObject.buyer_address = updateData.buyerAddress
      if (updateData.buyerCity !== undefined) updateObject.buyer_city = updateData.buyerCity
      if (updateData.buyerState !== undefined) updateObject.buyer_state = updateData.buyerState
      if (updateData.buyerCountry !== undefined) updateObject.buyer_country = updateData.buyerCountry
      if (updateData.buyerZipCode !== undefined) updateObject.buyer_zip_code = updateData.buyerZipCode

      // Always update images if we have new ones
      if (updateData.newImages && updateData.newImages.length > 0) {
        updateObject.images = imageUrls
      }

      // Handle image deletions
      if (updateData.imagesToDelete && updateData.imagesToDelete.length > 0) {
        // Filter out deleted images
        imageUrls = imageUrls.filter(img => !updateData.imagesToDelete!.includes(img.original))
        updateObject.images = imageUrls
      }

      // Update artwork record
      const { data, error } = await supabase
        .from('artworks')
        .update(updateObject)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return this.transformArtworkFromDB(data)
    } catch (error) {
      console.error('Error updating artwork:', error)
      throw error
    }
  }

  /**
   * Delete an artwork
   */
  static async deleteArtwork(id: string): Promise<void> {
    try {
      // Get artwork to delete associated images
      const artwork = await this.getArtworkById(id)
      if (artwork) {
        // Extract filenames from image URLs and delete from storage
        for (const imageSet of artwork.images) {
          try {
            // Extract filename from URL
            const originalUrl = imageSet.original
            const urlParts = originalUrl.split('/')
            const fileName = urlParts[urlParts.length - 1].split('.')[0]

            await StorageService.deleteImages('artworks', fileName)
          } catch (storageError) {
            console.warn('Failed to delete some images:', storageError)
          }
        }
      }

      // Delete artwork record
      const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting artwork:', error)
      throw error
    }
  }

  /**
   * Toggle sale status of an artwork
   */
  static async toggleSaleStatus(
    id: string,
    forSale: boolean,
    price?: number,
    currency?: 'BRL' | 'USD' | 'EUR'
  ): Promise<Artwork> {
    try {
      const updateData: any = {
        for_sale: forSale
      }

      if (forSale) {
        if (!price) throw new Error('Price is required when marking artwork for sale')
        updateData.price = price
        updateData.currency = currency || 'BRL'
      } else {
        updateData.price = null
        updateData.currency = null
      }

      const { data, error } = await supabase
        .from('artworks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return this.transformArtworkFromDB(data)
    } catch (error) {
      console.error('Error toggling sale status:', error)
      throw error
    }
  }

  /**
   * Reorder artworks
   */
  static async reorderArtworks(artworkIds: string[]): Promise<void> {
    try {
      const updates = artworkIds.map((id, index) => ({
        id,
        display_order: index
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('artworks')
          .update({ display_order: update.display_order })
          .eq('id', update.id)

        if (error) throw error
      }
    } catch (error) {
      console.error('Error reordering artworks:', error)
      throw error
    }
  }

  /**
   * Get available categories
   */
  static async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error

      // Get unique categories
      const categories = [...new Set(data?.map(item => item.category) || [])]
      return categories.sort()
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  /**
   * Get available years
   */
  static async getYears(): Promise<number[]> {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('year')
        .not('year', 'is', null)

      if (error) throw error

      // Get unique years, sorted descending
      const years = [...new Set(data?.map(item => item.year) || [])]
      return years.sort((a, b) => b - a)
    } catch (error) {
      console.error('Error fetching years:', error)
      throw error
    }
  }

  /**
   * Transform database record to Artwork type
   */
  private static transformArtworkFromDB(data: any): Artwork {
    return {
      id: data.id,
      title: {
        ptBR: data.title_pt,
        en: data.title_en
      },
      year: data.year,
      medium: {
        ptBR: data.medium_pt,
        en: data.medium_en
      },
      dimensions: data.dimensions,
      description: {
        ptBR: data.description_pt || '',
        en: data.description_en || ''
      },
      category: data.category,
      series: data.series_id,
      images: data.images || [],
      forSale: data.for_sale,
      price: data.price,
      currency: data.currency,
      isAvailable: data.is_available,
      displayOrder: data.display_order,
      featured: data.featured,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}