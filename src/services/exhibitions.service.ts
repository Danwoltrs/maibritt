import { supabase } from '@/lib/supabase'
import { Exhibition } from '@/types'
import { StorageService } from './storage.service'

export interface ExhibitionCreateData {
  title: string
  venue: string
  location: string
  year: number
  type: 'solo' | 'group' | 'residency'
  description?: string
  imageFile?: File
  featured?: boolean
}

export interface ExhibitionUpdateData {
  title?: string
  venue?: string
  location?: string
  year?: number
  type?: 'solo' | 'group' | 'residency'
  description?: string
  newImageFile?: File
  featured?: boolean
  displayOrder?: number
}

export interface ExhibitionFilters {
  type?: 'solo' | 'group' | 'residency'
  year?: number
  featured?: boolean
  upcoming?: boolean
}

export interface ExhibitionsTimelineData {
  upcoming: Exhibition[]
  past: Exhibition[]
  featured: Exhibition[]
}

export class ExhibitionsService {
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

      if (filters.upcoming !== undefined) {
        const currentYear = new Date().getFullYear()
        if (filters.upcoming) {
          query = query.gte('year', currentYear)
        } else {
          query = query.lt('year', currentYear)
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
   * Get exhibitions organized for timeline display
   */
  static async getExhibitionsTimeline(): Promise<ExhibitionsTimelineData> {
    try {
      const currentYear = new Date().getFullYear()

      // Get upcoming exhibitions
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('exhibitions')
        .select('*')
        .gte('year', currentYear)
        .order('year', { ascending: true })
        .order('display_order', { ascending: true })

      if (upcomingError) throw upcomingError

      // Get past exhibitions
      const { data: pastData, error: pastError } = await supabase
        .from('exhibitions')
        .select('*')
        .lt('year', currentYear)
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

      // Create exhibition record
      const { data, error } = await supabase
        .from('exhibitions')
        .insert({
          title: exhibitionData.title,
          venue: exhibitionData.venue,
          location: exhibitionData.location,
          year: exhibitionData.year,
          type: exhibitionData.type,
          description: exhibitionData.description || '',
          image: imageUrl,
          featured: exhibitionData.featured || false,
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

      if (updateData.title !== undefined) updateObject.title = updateData.title
      if (updateData.venue !== undefined) updateObject.venue = updateData.venue
      if (updateData.location !== undefined) updateObject.location = updateData.location
      if (updateData.year !== undefined) updateObject.year = updateData.year
      if (updateData.type !== undefined) updateObject.type = updateData.type
      if (updateData.description !== undefined) updateObject.description = updateData.description
      if (updateData.featured !== undefined) updateObject.featured = updateData.featured
      if (updateData.displayOrder !== undefined) updateObject.display_order = updateData.displayOrder

      // Upload new image if provided
      if (updateData.newImageFile) {
        const uploadResult = await StorageService.uploadSingleImage(
          updateData.newImageFile,
          'exhibitions'
        )
        updateObject.image = uploadResult.urls.display
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
    type: 'solo' | 'group' | 'residency'
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
        data.map(ex => ex.location.split(',').pop()?.trim().toLowerCase())
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
   */
  private static transformExhibitionFromDB(data: any): Exhibition {
    return {
      id: data.id,
      title: data.title,
      venue: data.venue,
      location: data.location,
      year: data.year,
      type: data.type,
      description: data.description || '',
      image: data.image || '',
      featured: data.featured,
      displayOrder: data.display_order
    }
  }
}