import { supabase } from '@/lib/supabase'
import { sanitizeFilterValue } from '@/lib/utils'
import { Artwork, Content } from '@/types'
import { StorageService, ImageVariant } from './storage.service'

export interface ArtworkFilters {
  category?: 'painting' | 'sculpture' | 'engraving' | 'video' | 'installations' | 'mixed-media'
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
  category: 'painting' | 'sculpture' | 'engraving' | 'video' | 'installations' | 'mixed-media'
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
  category?: 'painting' | 'sculpture' | 'engraving' | 'video' | 'installations' | 'mixed-media'
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
  soldThroughGalleryId?: string | null
  saleType?: 'gallery' | 'direct' | 'online'
  commissionRate?: number
  commissionAmount?: number
  netAmount?: number
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

export interface MonthlySale {
  month: string // "2025-01"
  label: string // "Jan 2025"
  gross: number
  commission: number
  net: number
  count: number
}

export interface GallerySalesStats {
  galleryId: string | null
  galleryName: string
  totalSales: number
  totalGross: number
  totalCommission: number
  totalNet: number
}

export interface SalesStats {
  totalRevenue: number
  totalCommission: number
  totalNet: number
  salesCount: number
  estimatedTax: number
  monthlySales: MonthlySale[]
  gallerySales: GallerySalesStats[]
  currentMonthRevenue: number
}

/**
 * Generate a URL-friendly slug from artwork title, dimensions, and year
 */
function generateSlug(title: string, dimensions: string, year: number): string {
  const titleSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')   // strip special chars
    .trim()
    .replace(/\s+/g, '-')           // spaces to hyphens

  const dimSlug = dimensions
    .toLowerCase()
    .replace(/\s+/g, '')            // collapse spaces: "100 x 80 cm" → "100x80cm"
    .replace(/[^a-z0-9x.]/g, '')    // keep letters, digits, x, dot

  return `${titleSlug}-${dimSlug}-${year}`
}

export class ArtworkService {
  /**
   * Get lightweight artwork stats without fetching full records
   */
  static async getArtworkStats(): Promise<ArtworkStats> {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('id, location_type, is_sold')

      if (error) throw error

      const artworks = data || []
      return {
        totalArtworks: artworks.length,
        artworksInGalleries: artworks.filter(a => a.location_type === 'gallery' || a.location_type === 'exhibition').length,
        artworksInStudio: artworks.filter(a => !a.location_type || a.location_type === 'studio').length,
        artworksSold: artworks.filter(a => a.is_sold === true).length
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
   * Get a single artwork by slug
   */
  static async getArtworkBySlug(slug: string): Promise<Artwork | null> {
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
        .eq('slug', slug)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return this.transformArtworkFromDB(data)
    } catch (error) {
      console.error('Error fetching artwork by slug:', error)
      throw error
    }
  }

  /**
   * Ensure slug uniqueness by appending -2, -3, etc. if needed
   */
  private static async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug
    let suffix = 1

    while (true) {
      let query = supabase
        .from('artworks')
        .select('id')
        .eq('slug', slug)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data } = await query.maybeSingle()

      if (!data) return slug

      suffix++
      slug = `${baseSlug}-${suffix}`
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

      // Generate slug
      const baseSlug = generateSlug(artworkData.title.en, artworkData.dimensions, artworkData.year)
      const slug = await this.ensureUniqueSlug(baseSlug)

      // Create artwork record
      const { data, error } = await supabase
        .from('artworks')
        .insert({
          slug,
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

      // Regenerate slug if title, dimensions, or year changed
      if (updateData.title || updateData.dimensions !== undefined || updateData.year !== undefined) {
        const title = updateData.title?.en ?? currentArtwork.title.en
        const dimensions = updateData.dimensions ?? currentArtwork.dimensions
        const year = updateData.year ?? currentArtwork.year
        const baseSlug = generateSlug(title, dimensions, year)
        updateObject.slug = await this.ensureUniqueSlug(baseSlug, id)
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
      if (updateData.soldThroughGalleryId !== undefined) updateObject.sold_through_gallery_id = updateData.soldThroughGalleryId
      if (updateData.saleType !== undefined) updateObject.sale_type = updateData.saleType
      if (updateData.commissionRate !== undefined) updateObject.commission_rate = updateData.commissionRate
      if (updateData.commissionAmount !== undefined) updateObject.commission_amount = updateData.commissionAmount
      if (updateData.netAmount !== undefined) updateObject.net_amount = updateData.netAmount

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
   * Get sales statistics from sold artworks
   */
  static async getSalesStats(): Promise<SalesStats> {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('sold_price, sold_currency, commission_amount, net_amount, sold_date, sale_type, sold_through_gallery_id, galleries:sold_through_gallery_id(id, name)')
        .eq('is_sold', true)

      if (error) throw error

      const sales = data || []

      // Static conversion rates to BRL
      const toBRL: Record<string, number> = { BRL: 1, USD: 5.0, EUR: 5.5 }

      let totalRevenue = 0
      let totalCommission = 0
      let totalNet = 0
      let currentMonthRevenue = 0

      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      const monthlyMap = new Map<string, MonthlySale>()
      const galleryMap = new Map<string | null, GallerySalesStats>()

      for (const sale of sales) {
        const rate = toBRL[sale.sold_currency || 'BRL'] || 1
        const gross = (sale.sold_price || 0) * rate
        const commission = (sale.commission_amount || 0) * rate
        const net = (sale.net_amount || 0) * rate

        totalRevenue += gross
        totalCommission += commission
        totalNet += net

        // Monthly grouping
        if (sale.sold_date) {
          const d = new Date(sale.sold_date)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          const existing = monthlyMap.get(key)
          const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

          if (existing) {
            existing.gross += gross
            existing.commission += commission
            existing.net += net
            existing.count += 1
          } else {
            monthlyMap.set(key, { month: key, label, gross, commission, net, count: 1 })
          }

          if (key === currentMonth) {
            currentMonthRevenue += gross
          }
        }

        // Gallery grouping
        const gId = sale.sold_through_gallery_id || null
        const gName = (sale as any).galleries?.name || (gId ? 'Unknown Gallery' : 'Direct Sale')
        const gExisting = galleryMap.get(gId)
        if (gExisting) {
          gExisting.totalSales += 1
          gExisting.totalGross += gross
          gExisting.totalCommission += commission
          gExisting.totalNet += net
        } else {
          galleryMap.set(gId, {
            galleryId: gId,
            galleryName: gName,
            totalSales: 1,
            totalGross: gross,
            totalCommission: commission,
            totalNet: net,
          })
        }
      }

      const monthlySales = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month))
      const gallerySales = Array.from(galleryMap.values()).sort((a, b) => b.totalGross - a.totalGross)

      // Simples Nacional estimated tax (~6% for art sales)
      const TAX_RATE = 0.06
      const estimatedTax = totalRevenue * TAX_RATE

      return {
        totalRevenue,
        totalCommission,
        totalNet,
        salesCount: sales.length,
        estimatedTax,
        monthlySales,
        gallerySales,
        currentMonthRevenue,
      }
    } catch (error) {
      console.error('Error fetching sales stats:', error)
      return {
        totalRevenue: 0,
        totalCommission: 0,
        totalNet: 0,
        salesCount: 0,
        estimatedTax: 0,
        monthlySales: [],
        gallerySales: [],
        currentMonthRevenue: 0,
      }
    }
  }

  /**
   * Transform database record to Artwork type
   */
  private static transformArtworkFromDB(data: any): Artwork {
    return {
      id: data.id,
      slug: data.slug || data.id,
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
      // Sold tracking
      isSold: data.is_sold || false,
      soldPrice: data.sold_price,
      soldCurrency: data.sold_currency,
      soldDate: data.sold_date ? new Date(data.sold_date) : undefined,
      soldThroughGalleryId: data.sold_through_gallery_id,
      saleType: data.sale_type,
      commissionRate: data.commission_rate,
      commissionAmount: data.commission_amount,
      netAmount: data.net_amount,
      // Buyer info
      buyerName: data.buyer_name,
      buyerEmail: data.buyer_email,
      buyerPhone: data.buyer_phone,
      buyerAddress: data.buyer_address,
      buyerCity: data.buyer_city,
      buyerState: data.buyer_state,
      buyerCountry: data.buyer_country,
      buyerZipCode: data.buyer_zip_code,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}