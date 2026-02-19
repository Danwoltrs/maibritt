import { supabase } from '@/lib/supabase'
import { Exhibition, ExhibitionImage, ExhibitionVideo, Content, ExhibitionAddress } from '@/types'
import { StorageService } from './storage.service'

export interface ExhibitionCreateData {
  title: Content
  venue: string
  location?: string // Legacy - will be constructed from address
  address?: ExhibitionAddress
  year: number
  type: 'solo' | 'group' | 'residency' | 'installation'
  description?: Content
  content?: Content
  curatorName?: string
  curatorText?: Content
  imageFile?: File
  images?: ExhibitionImage[]
  videos?: ExhibitionVideo[]
  startDate?: Date
  endDate?: Date
  openingDate?: Date
  openingDetails?: string
  featured?: boolean
  showPopup?: boolean
  externalUrl?: string
  catalogUrl?: string
}

export interface ExhibitionUpdateData {
  title?: Content
  venue?: string
  location?: string // Legacy - will be constructed from address
  address?: ExhibitionAddress
  year?: number
  type?: 'solo' | 'group' | 'residency' | 'installation'
  description?: Content
  content?: Content
  curatorName?: string
  curatorText?: Content
  newImageFile?: File
  images?: ExhibitionImage[]
  videos?: ExhibitionVideo[]
  startDate?: Date | null
  endDate?: Date | null
  openingDate?: Date | null
  openingDetails?: string
  featured?: boolean
  showPopup?: boolean
  isVisible?: boolean
  displayOrder?: number
  externalUrl?: string
  catalogUrl?: string
}

export interface ExhibitionFilters {
  type?: 'solo' | 'group' | 'residency' | 'installation'
  year?: number
  featured?: boolean
  upcoming?: boolean
  showPopup?: boolean
}

export interface ExhibitionsTimelineData {
  upcoming: Exhibition[]
  past: Exhibition[]
  featured: Exhibition[]
}

export class ExhibitionsService {
  /**
   * Construct location string from address components
   */
  static constructLocationString(address?: ExhibitionAddress): string {
    if (!address) return ''
    const parts: string[] = []
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.country) parts.push(address.country)
    return parts.join(', ')
  }

  /**
   * Upload multiple gallery images for an exhibition
   */
  static async uploadGalleryImages(files: File[]): Promise<ExhibitionImage[]> {
    const uploadedImages: ExhibitionImage[] = []

    for (const file of files) {
      try {
        const uploadResult = await StorageService.uploadSingleImage(file, 'exhibitions')
        uploadedImages.push({
          url: uploadResult.urls.display,
          isCover: false
        })
      } catch (error) {
        console.error('Error uploading gallery image:', error)
      }
    }

    return uploadedImages
  }

  /**
   * Get all exhibitions with optional filtering
   */
  static async getExhibitions(
    filters: ExhibitionFilters = {}
  ): Promise<Exhibition[]> {
    try {
      let query = supabase
        .from('exhibitions')
        .select('*')

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type)
      }

      if (filters.year) {
        query = query.eq('year', filters.year)
      }

      if (filters.featured !== undefined) {
        query = query.eq('featured', filters.featured)
      }

      if (filters.showPopup !== undefined) {
        query = query.eq('show_popup', filters.showPopup)
      }

      if (filters.upcoming !== undefined) {
        const today = new Date().toISOString().split('T')[0]
        if (filters.upcoming) {
          // Has start_date in the future OR year >= current year with no start_date
          query = query.or(`start_date.gte.${today},and(start_date.is.null,year.gte.${new Date().getFullYear()})`)
        } else {
          query = query.or(`end_date.lt.${today},and(end_date.is.null,year.lt.${new Date().getFullYear()})`)
        }
      }

      // Order by year descending, then by display order
      query = query.order('year', { ascending: false })
                   .order('display_order', { ascending: true })

      const { data, error } = await query

      if (error) throw error

      return data?.map(this.transformExhibitionFromDB) || []
    } catch (error) {
      console.error('Error fetching exhibitions:', error)
      throw error
    }
  }

  /**
   * Get exhibitions for popup (upcoming with show_popup = true)
   */
  static async getUpcomingPopupExhibition(): Promise<Exhibition | null> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('exhibitions')
        .select('*')
        .eq('show_popup', true)
        .or(`start_date.gte.${today},end_date.gte.${today}`)
        .order('start_date', { ascending: true })
        .limit(1)

      if (error) throw error

      if (!data || data.length === 0) return null

      return this.transformExhibitionFromDB(data[0])
    } catch (error) {
      console.error('Error fetching popup exhibition:', error)
      return null
    }
  }

  /**
   * Get exhibitions organized for timeline display
   */
  static async getExhibitionsTimeline(): Promise<ExhibitionsTimelineData> {
    try {
      const currentYear = new Date().getFullYear()
      const today = new Date().toISOString().split('T')[0]

      // Get upcoming exhibitions (by date or year)
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('exhibitions')
        .select('*')
        .or(`start_date.gte.${today},and(start_date.is.null,year.gte.${currentYear})`)
        .order('start_date', { ascending: true, nullsFirst: false })
        .order('year', { ascending: true })
        .order('display_order', { ascending: true })

      if (upcomingError) throw upcomingError

      // Get past exhibitions
      const { data: pastData, error: pastError } = await supabase
        .from('exhibitions')
        .select('*')
        .or(`end_date.lt.${today},and(end_date.is.null,year.lt.${currentYear})`)
        .order('end_date', { ascending: false, nullsFirst: false })
        .order('year', { ascending: false })
        .order('display_order', { ascending: true })

      if (pastError) throw pastError

      // Get featured exhibitions (from all time)
      const { data: featuredData, error: featuredError } = await supabase
        .from('exhibitions')
        .select('*')
        .eq('featured', true)
        .order('year', { ascending: false })
        .order('display_order', { ascending: true })

      if (featuredError) throw featuredError

      return {
        upcoming: upcomingData?.map(this.transformExhibitionFromDB) || [],
        past: pastData?.map(this.transformExhibitionFromDB) || [],
        featured: featuredData?.map(this.transformExhibitionFromDB) || []
      }
    } catch (error) {
      console.error('Error fetching exhibitions timeline:', error)
      throw error
    }
  }

  /**
   * Get a single exhibition by ID
   */
  static async getExhibitionById(id: string): Promise<Exhibition | null> {
    try {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        throw error
      }

      return this.transformExhibitionFromDB(data)
    } catch (error) {
      console.error('Error fetching exhibition:', error)
      throw error
    }
  }

  /**
   * Get exhibition by slug
   */
  static async getExhibitionBySlug(slug: string): Promise<Exhibition | null> {
    try {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return this.transformExhibitionFromDB(data)
    } catch (error) {
      console.error('Error fetching exhibition by slug:', error)
      throw error
    }
  }

  /**
   * Generate unique slug from title and year
   */
  static async generateUniqueSlug(title: string, year: number, excludeId?: string): Promise<string> {
    const baseSlug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${year}`

    let slug = baseSlug
    let suffix = 2

    while (true) {
      let query = supabase
        .from('exhibitions')
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
   * Create a new exhibition
   */
  static async createExhibition(
    exhibitionData: ExhibitionCreateData
  ): Promise<Exhibition> {
    try {
      // Upload image if provided
      let imageUrl = ''

      if (exhibitionData.imageFile) {
        const uploadResult = await StorageService.uploadSingleImage(
          exhibitionData.imageFile,
          'exhibitions'
        )
        imageUrl = uploadResult.urls.display
      }

      // Get the next display order for the same year
      const { data: maxOrderData } = await supabase
        .from('exhibitions')
        .select('display_order')
        .eq('year', exhibitionData.year)
        .order('display_order', { ascending: false })
        .limit(1)

      const nextDisplayOrder = (maxOrderData?.[0]?.display_order || 0) + 1

      // Generate unique slug
      const slug = await this.generateUniqueSlug(exhibitionData.title.en || exhibitionData.title.ptBR, exhibitionData.year)

      // Construct location from address if provided
      const locationString = exhibitionData.location || this.constructLocationString(exhibitionData.address)

      // Create exhibition record
      const { data, error } = await supabase
        .from('exhibitions')
        .insert({
          // Legacy field for backward compatibility
          title: exhibitionData.title.en || exhibitionData.title.ptBR,
          description: exhibitionData.description?.en || exhibitionData.description?.ptBR || '',
          // New bilingual fields
          title_pt: exhibitionData.title.ptBR,
          title_en: exhibitionData.title.en,
          description_pt: exhibitionData.description?.ptBR || '',
          description_en: exhibitionData.description?.en || '',
          content_pt: exhibitionData.content?.ptBR || '',
          content_en: exhibitionData.content?.en || '',
          curator_name: exhibitionData.curatorName || null,
          curator_text_pt: exhibitionData.curatorText?.ptBR || null,
          curator_text_en: exhibitionData.curatorText?.en || null,
          venue: exhibitionData.venue,
          location: locationString,
          // Address fields
          street: exhibitionData.address?.street || null,
          street_number: exhibitionData.address?.streetNumber || null,
          neighborhood: exhibitionData.address?.neighborhood || null,
          zip_code: exhibitionData.address?.zipCode || null,
          city: exhibitionData.address?.city || null,
          state: exhibitionData.address?.state || null,
          country: exhibitionData.address?.country || null,
          year: exhibitionData.year,
          type: exhibitionData.type,
          image: imageUrl,
          images: exhibitionData.images || [],
          videos: exhibitionData.videos || [],
          start_date: exhibitionData.startDate?.toISOString().split('T')[0] || null,
          end_date: exhibitionData.endDate?.toISOString().split('T')[0] || null,
          opening_date: exhibitionData.openingDate?.toISOString() || null,
          opening_details: exhibitionData.openingDetails || null,
          featured: exhibitionData.featured || false,
          show_popup: exhibitionData.showPopup || false,
          external_url: exhibitionData.externalUrl || null,
          catalog_url: exhibitionData.catalogUrl || null,
          slug,
          display_order: nextDisplayOrder
        })
        .select()
        .single()

      if (error) throw error

      return this.transformExhibitionFromDB(data)
    } catch (error) {
      console.error('Error creating exhibition:', error)
      throw error
    }
  }

  /**
   * Update an existing exhibition
   */
  static async updateExhibition(
    id: string,
    updateData: ExhibitionUpdateData
  ): Promise<Exhibition> {
    try {
      // Prepare update object
      const updateObject: any = {}

      if (updateData.title) {
        updateObject.title = updateData.title.en || updateData.title.ptBR
        updateObject.title_pt = updateData.title.ptBR
        updateObject.title_en = updateData.title.en
      }

      if (updateData.description) {
        updateObject.description = updateData.description.en || updateData.description.ptBR
        updateObject.description_pt = updateData.description.ptBR
        updateObject.description_en = updateData.description.en
      }

      if (updateData.content) {
        updateObject.content_pt = updateData.content.ptBR
        updateObject.content_en = updateData.content.en
      }

      if (updateData.curatorName !== undefined) updateObject.curator_name = updateData.curatorName
      if (updateData.curatorText) {
        updateObject.curator_text_pt = updateData.curatorText.ptBR
        updateObject.curator_text_en = updateData.curatorText.en
      }

      if (updateData.venue !== undefined) updateObject.venue = updateData.venue
      if (updateData.location !== undefined) updateObject.location = updateData.location
      if (updateData.year !== undefined) updateObject.year = updateData.year
      if (updateData.type !== undefined) updateObject.type = updateData.type

      // Handle address fields
      if (updateData.address !== undefined) {
        updateObject.street = updateData.address.street || null
        updateObject.street_number = updateData.address.streetNumber || null
        updateObject.neighborhood = updateData.address.neighborhood || null
        updateObject.zip_code = updateData.address.zipCode || null
        updateObject.city = updateData.address.city || null
        updateObject.state = updateData.address.state || null
        updateObject.country = updateData.address.country || null
        // Update location string from address
        updateObject.location = this.constructLocationString(updateData.address)
      }

      if (updateData.images !== undefined) updateObject.images = updateData.images
      if (updateData.videos !== undefined) updateObject.videos = updateData.videos

      if (updateData.startDate !== undefined) {
        updateObject.start_date = updateData.startDate ? updateData.startDate.toISOString().split('T')[0] : null
      }
      if (updateData.endDate !== undefined) {
        updateObject.end_date = updateData.endDate ? updateData.endDate.toISOString().split('T')[0] : null
      }
      if (updateData.openingDate !== undefined) {
        updateObject.opening_date = updateData.openingDate ? updateData.openingDate.toISOString() : null
      }
      if (updateData.openingDetails !== undefined) updateObject.opening_details = updateData.openingDetails

      if (updateData.featured !== undefined) updateObject.featured = updateData.featured
      if (updateData.showPopup !== undefined) updateObject.show_popup = updateData.showPopup
      if (updateData.isVisible !== undefined) updateObject.is_visible = updateData.isVisible
      if (updateData.displayOrder !== undefined) updateObject.display_order = updateData.displayOrder

      if (updateData.externalUrl !== undefined) updateObject.external_url = updateData.externalUrl
      if (updateData.catalogUrl !== undefined) updateObject.catalog_url = updateData.catalogUrl

      // Upload new image if provided
      if (updateData.newImageFile) {
        const uploadResult = await StorageService.uploadSingleImage(
          updateData.newImageFile,
          'exhibitions'
        )
        updateObject.image = uploadResult.urls.display
      }

      // Update slug if title or year changed
      if (updateData.title || updateData.year) {
        const exhibition = await this.getExhibitionById(id)
        if (exhibition) {
          const titleForSlug = updateData.title?.en || updateData.title?.ptBR || exhibition.title.en || exhibition.title.ptBR
          const yearForSlug = updateData.year || exhibition.year
          updateObject.slug = await this.generateUniqueSlug(titleForSlug, yearForSlug, id)
        }
      }

      // Update exhibition record
      const { data, error } = await supabase
        .from('exhibitions')
        .update(updateObject)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return this.transformExhibitionFromDB(data)
    } catch (error) {
      console.error('Error updating exhibition:', error)
      throw error
    }
  }

  /**
   * Delete an exhibition
   */
  static async deleteExhibition(id: string): Promise<void> {
    try {
      // Get exhibition to delete associated image
      const exhibition = await this.getExhibitionById(id)
      if (exhibition && exhibition.image) {
        try {
          // Extract filename from URL and delete from storage
          const imageUrl = exhibition.image
          const urlParts = imageUrl.split('/')
          const fileName = urlParts[urlParts.length - 1].split('.')[0]

          await StorageService.deleteImages('exhibitions', fileName)
        } catch (storageError) {
          console.warn('Failed to delete exhibition image:', storageError)
        }
      }

      // Delete exhibition record
      const { error } = await supabase
        .from('exhibitions')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting exhibition:', error)
      throw error
    }
  }

  /**
   * Get featured exhibitions for homepage
   */
  static async getFeaturedExhibitions(limit = 3): Promise<Exhibition[]> {
    try {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('*')
        .eq('featured', true)
        .order('year', { ascending: false })
        .order('display_order', { ascending: true })
        .limit(limit)

      if (error) throw error

      return data?.map(this.transformExhibitionFromDB) || []
    } catch (error) {
      console.error('Error fetching featured exhibitions:', error)
      throw error
    }
  }

  /**
   * Get recent exhibitions (last 3 years)
   */
  static async getRecentExhibitions(yearsBack = 3): Promise<Exhibition[]> {
    try {
      const currentYear = new Date().getFullYear()
      const cutoffYear = currentYear - yearsBack

      const { data, error } = await supabase
        .from('exhibitions')
        .select('*')
        .gte('year', cutoffYear)
        .order('year', { ascending: false })
        .order('display_order', { ascending: true })

      if (error) throw error

      return data?.map(this.transformExhibitionFromDB) || []
    } catch (error) {
      console.error('Error fetching recent exhibitions:', error)
      throw error
    }
  }

  /**
   * Get exhibitions by type
   */
  static async getExhibitionsByType(
    type: 'solo' | 'group' | 'residency' | 'installation'
  ): Promise<Exhibition[]> {
    try {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('*')
        .eq('type', type)
        .order('year', { ascending: false })
        .order('display_order', { ascending: true })

      if (error) throw error

      return data?.map(this.transformExhibitionFromDB) || []
    } catch (error) {
      console.error('Error fetching exhibitions by type:', error)
      throw error
    }
  }

  /**
   * Get unique years from exhibitions
   */
  static async getExhibitionYears(): Promise<number[]> {
    try {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('year')
        .not('year', 'is', null)

      if (error) throw error

      // Get unique years, sorted descending
      const years = [...new Set(data?.map(item => item.year) || [])]
      return years.sort((a, b) => b - a)
    } catch (error) {
      console.error('Error fetching exhibition years:', error)
      throw error
    }
  }

  /**
   * Reorder exhibitions within a year
   */
  static async reorderExhibitions(
    year: number,
    exhibitionIds: string[]
  ): Promise<void> {
    try {
      const updates = exhibitionIds.map((id, index) => ({
        id,
        display_order: index
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('exhibitions')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
          .eq('year', year)

        if (error) throw error
      }
    } catch (error) {
      console.error('Error reordering exhibitions:', error)
      throw error
    }
  }

  /**
   * Toggle featured status of an exhibition
   */
  static async toggleFeatured(id: string, featured: boolean): Promise<Exhibition> {
    try {
      const { data, error } = await supabase
        .from('exhibitions')
        .update({ featured })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return this.transformExhibitionFromDB(data)
    } catch (error) {
      console.error('Error toggling featured status:', error)
      throw error
    }
  }

  /**
   * Toggle popup status of an exhibition
   */
  static async togglePopup(id: string, showPopup: boolean): Promise<Exhibition> {
    try {
      const { data, error } = await supabase
        .from('exhibitions')
        .update({ show_popup: showPopup })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return this.transformExhibitionFromDB(data)
    } catch (error) {
      console.error('Error toggling popup status:', error)
      throw error
    }
  }

  /**
   * Get exhibition statistics
   */
  static async getExhibitionStats(): Promise<{
    total: number
    soloShows: number
    groupShows: number
    residencies: number
    countries: number
    recentYears: number[]
  }> {
    try {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('type, location, year')

      if (error) throw error

      if (!data) {
        return {
          total: 0,
          soloShows: 0,
          groupShows: 0,
          residencies: 0,
          countries: 0,
          recentYears: []
        }
      }

      const soloShows = data.filter(ex => ex.type === 'solo').length
      const groupShows = data.filter(ex => ex.type === 'group').length
      const residencies = data.filter(ex => ex.type === 'residency').length

      // Extract unique countries from locations
      const countries = new Set(
        data.map(ex => (ex.location || '').split(',').pop()?.trim().toLowerCase())
          .filter(Boolean)
      )

      // Get recent years (last 5 years with exhibitions)
      const years = [...new Set(data.map(ex => ex.year))]
        .sort((a, b) => b - a)
        .slice(0, 5)

      return {
        total: data.length,
        soloShows,
        groupShows,
        residencies,
        countries: countries.size,
        recentYears: years
      }
    } catch (error) {
      console.error('Error fetching exhibition stats:', error)
      throw error
    }
  }

  /**
   * Transform database record to Exhibition type
   * Supports both legacy (single language) and new (bilingual) data
   */
  private static transformExhibitionFromDB(data: any): Exhibition {
    return {
      id: data.id,
      // Bilingual title - fallback to legacy title field
      title: {
        ptBR: data.title_pt || data.title || '',
        en: data.title_en || data.title || ''
      },
      slug: data.slug || '',
      venue: data.venue || '',
      location: data.location || '',
      address: data.city || data.country ? {
        street: data.street || undefined,
        streetNumber: data.street_number || undefined,
        neighborhood: data.neighborhood || undefined,
        zipCode: data.zip_code || undefined,
        city: data.city || '',
        state: data.state || undefined,
        country: data.country || ''
      } : undefined,
      year: data.year,
      type: data.type,
      // Bilingual description
      description: {
        ptBR: data.description_pt || data.description || '',
        en: data.description_en || data.description || ''
      },
      // Rich content
      content: {
        ptBR: data.content_pt || '',
        en: data.content_en || ''
      },
      // Curator info
      curatorName: data.curator_name || undefined,
      curatorText: data.curator_text_pt || data.curator_text_en ? {
        ptBR: data.curator_text_pt || '',
        en: data.curator_text_en || ''
      } : undefined,
      // Media
      image: data.image || '',
      images: data.images || [],
      videos: data.videos || [],
      // Dates
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      openingDate: data.opening_date ? new Date(data.opening_date) : undefined,
      openingDetails: data.opening_details || undefined,
      // Display settings
      featured: data.featured || false,
      showPopup: data.show_popup || false,
      isVisible: data.is_visible !== false, // default to true
      displayOrder: data.display_order || 0,
      // Links
      externalUrl: data.external_url || undefined,
      catalogUrl: data.catalog_url || undefined,
      // Timestamps
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    }
  }
}
