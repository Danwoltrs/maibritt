import { supabase } from '@/lib/supabase'

export interface Gallery {
  id: string
  name: string
  slug: string

  // Address
  address_line1: string
  address_line2?: string
  city: string
  state_province?: string
  postal_code?: string
  country: string
  country_code?: string
  latitude?: number
  longitude?: number

  // Contact
  contact_person?: string
  email?: string
  phone?: string
  website?: string
  instagram?: string

  // Business
  opening_hours?: Record<string, string>
  commission_rate?: number
  payment_terms?: string
  shipping_arrangements?: string
  insurance_provider?: string

  // Display
  gallery_photo?: string
  description_pt?: string
  description_en?: string

  // Relationship
  relationship_status: 'active' | 'inactive' | 'prospective'
  first_partnership_date?: string
  contract_expiry_date?: string

  // Settings
  is_active: boolean
  show_on_website: boolean
  featured: boolean
  display_order: number

  // Meta
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateGalleryData {
  name: string
  address_line1: string
  address_line2?: string
  city: string
  state_province?: string
  postal_code?: string
  country: string
  country_code?: string
  latitude?: number
  longitude?: number
  contact_person?: string
  email?: string
  phone?: string
  website?: string
  instagram?: string
  opening_hours?: Record<string, string>
  commission_rate?: number
  payment_terms?: string
  shipping_arrangements?: string
  insurance_provider?: string
  gallery_photo?: string
  description_pt?: string
  description_en?: string
  relationship_status?: 'active' | 'inactive' | 'prospective'
  first_partnership_date?: string
  contract_expiry_date?: string
  is_active?: boolean
  show_on_website?: boolean
  featured?: boolean
  display_order?: number
  notes?: string
}

export interface UpdateGalleryData extends Partial<CreateGalleryData> {
  id: string
}

export interface GetGalleriesOptions {
  limit?: number
  offset?: number
  orderBy?: keyof Gallery
  orderDirection?: 'asc' | 'desc'
  includeInactive?: boolean
  publicOnly?: boolean
  search?: string
  country?: string
  featured?: boolean
}

export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  count?: number
}

export class GalleryService {
  /**
   * Get all galleries with filtering options
   */
  static async getAll(options: GetGalleriesOptions = {}): Promise<ServiceResponse<Gallery[]>> {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'display_order',
        orderDirection = 'asc',
        includeInactive = false,
        publicOnly = false,
        search,
        country,
        featured
      } = options

      let query = supabase
        .from('galleries')
        .select('*')

      // Apply filters
      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      if (publicOnly) {
        query = query.eq('show_on_website', true)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,country.ilike.%${search}%`)
      }

      if (country) {
        query = query.eq('country', country)
      }

      if (featured !== undefined) {
        query = query.eq('featured', featured)
      }

      // Apply ordering and pagination
      query = query
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching galleries:', error)
        return { success: false, error: error.message }
      }

      return {
        success: true,
        data: data || [],
        count: count || 0
      }
    } catch (error) {
      console.error('Gallery service error:', error)
      return {
        success: false,
        error: 'Failed to fetch galleries'
      }
    }
  }

  /**
   * Get gallery by ID
   */
  static async getById(id: string): Promise<ServiceResponse<Gallery>> {
    try {
      const { data, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching gallery:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Gallery service error:', error)
      return { success: false, error: 'Failed to fetch gallery' }
    }
  }

  /**
   * Get gallery by slug
   */
  static async getBySlug(slug: string): Promise<ServiceResponse<Gallery>> {
    try {
      const { data, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        console.error('Error fetching gallery by slug:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Gallery service error:', error)
      return { success: false, error: 'Failed to fetch gallery' }
    }
  }

  /**
   * Create new gallery
   */
  static async create(galleryData: CreateGalleryData): Promise<ServiceResponse<Gallery>> {
    try {
      const { data, error } = await supabase
        .from('galleries')
        .insert([galleryData])
        .select()
        .single()

      if (error) {
        console.error('Error creating gallery:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Gallery service error:', error)
      return { success: false, error: 'Failed to create gallery' }
    }
  }

  /**
   * Update gallery
   */
  static async update({ id, ...updateData }: UpdateGalleryData): Promise<ServiceResponse<Gallery>> {
    try {
      const { data, error } = await supabase
        .from('galleries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating gallery:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Gallery service error:', error)
      return { success: false, error: 'Failed to update gallery' }
    }
  }

  /**
   * Delete gallery
   */
  static async delete(id: string): Promise<ServiceResponse<null>> {
    try {
      const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting gallery:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: null }
    } catch (error) {
      console.error('Gallery service error:', error)
      return { success: false, error: 'Failed to delete gallery' }
    }
  }

  /**
   * Get galleries for public display (Where to Buy page)
   */
  static async getPublicGalleries(options: GetGalleriesOptions = {}): Promise<ServiceResponse<Gallery[]>> {
    return this.getAll({
      ...options,
      publicOnly: true,
      includeInactive: false,
      orderBy: 'display_order'
    })
  }

  /**
   * Get galleries by country for filtering
   */
  static async getCountries(): Promise<ServiceResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('galleries')
        .select('country')
        .eq('is_active', true)
        .eq('show_on_website', true)

      if (error) {
        console.error('Error fetching countries:', error)
        return { success: false, error: error.message }
      }

      const countries = [...new Set(data?.map(item => item.country) || [])]
        .sort()

      return { success: true, data: countries }
    } catch (error) {
      console.error('Gallery service error:', error)
      return { success: false, error: 'Failed to fetch countries' }
    }
  }

  /**
   * Update gallery display order
   */
  static async updateDisplayOrder(galleries: { id: string; display_order: number }[]): Promise<ServiceResponse<null>> {
    try {
      const updates = galleries.map(({ id, display_order }) =>
        supabase
          .from('galleries')
          .update({ display_order })
          .eq('id', id)
      )

      await Promise.all(updates)

      return { success: true, data: null }
    } catch (error) {
      console.error('Gallery service error:', error)
      return { success: false, error: 'Failed to update display order' }
    }
  }

  /**
   * Search galleries
   */
  static async search(query: string, options: GetGalleriesOptions = {}): Promise<ServiceResponse<Gallery[]>> {
    return this.getAll({
      ...options,
      search: query
    })
  }

  /**
   * Get performance metrics for a gallery
   */
  static async getMetrics(galleryId: string, startDate?: string, endDate?: string): Promise<ServiceResponse<any>> {
    try {
      let query = supabase
        .from('gallery_metrics')
        .select('*')
        .eq('gallery_id', galleryId)

      if (startDate) {
        query = query.gte('period_start', startDate)
      }

      if (endDate) {
        query = query.lte('period_end', endDate)
      }

      const { data, error } = await query.order('period_start', { ascending: false })

      if (error) {
        console.error('Error fetching gallery metrics:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Gallery service error:', error)
      return { success: false, error: 'Failed to fetch gallery metrics' }
    }
  }

  /**
   * Calculate gallery metrics for a period
   */
  static async calculateMetrics(
    galleryId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResponse<null>> {
    try {
      const { error } = await supabase.rpc('calculate_gallery_metrics', {
        p_gallery_id: galleryId,
        p_start_date: startDate,
        p_end_date: endDate
      })

      if (error) {
        console.error('Error calculating gallery metrics:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: null }
    } catch (error) {
      console.error('Gallery service error:', error)
      return { success: false, error: 'Failed to calculate gallery metrics' }
    }
  }
}

export default GalleryService