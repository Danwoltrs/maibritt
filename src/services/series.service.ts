import { supabase } from '@/lib/supabase'
import { ArtSeries, Content, Artwork } from '@/types'
import { StorageService } from './storage.service'

export interface SeriesCreateData {
  name: Content
  description?: Content
  year: number
  coverImageFile?: File
  isSeasonal?: boolean
  seasonStart?: Date
  seasonEnd?: Date
}

export interface SeriesUpdateData {
  name?: Content
  description?: Content
  year?: number
  newCoverImageFile?: File
  isSeasonal?: boolean
  seasonStart?: Date
  seasonEnd?: Date
  isActive?: boolean
  displayOrder?: number
}

export interface SeriesWithArtworks extends ArtSeries {
  artworkCount: number
  latestArtworks: Artwork[]
}

export class SeriesService {
  /**
   * Get all art series
   */
  static async getSeries(includeInactive = false): Promise<ArtSeries[]> {
    try {
      let query = supabase
        .from('art_series')
        .select('*')
        .order('display_order', { ascending: true })
        .order('year', { ascending: false })

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error

      return data?.map(this.transformSeriesFromDB) || []
    } catch (error) {
      console.error('Error fetching series:', error)
      throw error
    }
  }

  /**
   * Get a single series by ID with artworks
   */
  static async getSeriesById(id: string): Promise<SeriesWithArtworks | null> {
    try {
      const { data: seriesData, error: seriesError } = await supabase
        .from('art_series')
        .select('*')
        .eq('id', id)
        .single()

      if (seriesError) {
        if (seriesError.code === 'PGRST116') {
          return null // Not found
        }
        throw seriesError
      }

      // Get artworks in this series
      const { data: artworksData, error: artworksError } = await supabase
        .from('artworks')
        .select('*')
        .eq('series_id', id)
        .order('display_order', { ascending: true })
        .order('year', { ascending: false })

      if (artworksError) throw artworksError

      // Transform artworks
      const artworks = artworksData?.map(artwork => ({
        id: artwork.id,
        title: {
          ptBR: artwork.title_pt,
          en: artwork.title_en
        },
        year: artwork.year,
        medium: {
          ptBR: artwork.medium_pt,
          en: artwork.medium_en
        },
        dimensions: artwork.dimensions,
        description: {
          ptBR: artwork.description_pt || '',
          en: artwork.description_en || ''
        },
        category: artwork.category,
        series: artwork.series_id,
        images: artwork.images || [],
        forSale: artwork.for_sale,
        price: artwork.price,
        currency: artwork.currency,
        isAvailable: artwork.is_available,
        displayOrder: artwork.display_order,
        featured: artwork.featured,
        createdAt: new Date(artwork.created_at),
        updatedAt: new Date(artwork.updated_at)
      })) || []

      const series = this.transformSeriesFromDB(seriesData)

      return {
        ...series,
        artworkCount: artworks.length,
        latestArtworks: artworks.slice(0, 6) // Latest 6 artworks for preview
      }
    } catch (error) {
      console.error('Error fetching series:', error)
      throw error
    }
  }

  /**
   * Get series by slug (URL-friendly name)
   */
  static async getSeriesBySlug(slug: string): Promise<SeriesWithArtworks | null> {
    try {
      // For now, we'll search by name. In the future, you might want to add a slug field
      const { data: seriesData, error } = await supabase
        .from('art_series')
        .select('*')
        .or(`name_en.ilike.%${slug}%,name_pt.ilike.%${slug}%`)
        .eq('is_active', true)
        .limit(1)

      if (error) throw error

      if (!seriesData || seriesData.length === 0) {
        return null
      }

      return this.getSeriesById(seriesData[0].id)
    } catch (error) {
      console.error('Error fetching series by slug:', error)
      throw error
    }
  }

  /**
   * Create a new art series
   */
  static async createSeries(seriesData: SeriesCreateData): Promise<ArtSeries> {
    try {
      // Upload cover image if provided
      let coverImageUrl = ''

      if (seriesData.coverImageFile) {
        const uploadResult = await StorageService.uploadSingleImage(
          seriesData.coverImageFile,
          'series'
        )
        coverImageUrl = uploadResult.urls.display
      }

      // Get the next display order
      const { data: maxOrderData } = await supabase
        .from('art_series')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)

      const nextDisplayOrder = (maxOrderData?.[0]?.display_order || 0) + 1

      // Create series record
      const { data, error } = await supabase
        .from('art_series')
        .insert({
          name_pt: seriesData.name.ptBR,
          name_en: seriesData.name.en,
          description_pt: seriesData.description?.ptBR || '',
          description_en: seriesData.description?.en || '',
          year: seriesData.year,
          cover_image: coverImageUrl,
          is_seasonal: seriesData.isSeasonal || false,
          season_start: seriesData.seasonStart || null,
          season_end: seriesData.seasonEnd || null,
          display_order: nextDisplayOrder
        })
        .select()
        .single()

      if (error) throw error

      return this.transformSeriesFromDB(data)
    } catch (error) {
      console.error('Error creating series:', error)
      throw error
    }
  }

  /**
   * Update an existing series
   */
  static async updateSeries(
    id: string,
    updateData: SeriesUpdateData
  ): Promise<ArtSeries> {
    try {
      // Prepare update object
      const updateObject: any = {}

      if (updateData.name) {
        updateObject.name_pt = updateData.name.ptBR
        updateObject.name_en = updateData.name.en
      }

      if (updateData.description) {
        updateObject.description_pt = updateData.description.ptBR
        updateObject.description_en = updateData.description.en
      }

      if (updateData.year !== undefined) updateObject.year = updateData.year
      if (updateData.isSeasonal !== undefined) updateObject.is_seasonal = updateData.isSeasonal
      if (updateData.seasonStart !== undefined) updateObject.season_start = updateData.seasonStart
      if (updateData.seasonEnd !== undefined) updateObject.season_end = updateData.seasonEnd
      if (updateData.isActive !== undefined) updateObject.is_active = updateData.isActive
      if (updateData.displayOrder !== undefined) updateObject.display_order = updateData.displayOrder

      // Upload new cover image if provided
      if (updateData.newCoverImageFile) {
        const uploadResult = await StorageService.uploadSingleImage(
          updateData.newCoverImageFile,
          'series'
        )
        updateObject.cover_image = uploadResult.urls.display
      }

      // Update series record
      const { data, error } = await supabase
        .from('art_series')
        .update(updateObject)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return this.transformSeriesFromDB(data)
    } catch (error) {
      console.error('Error updating series:', error)
      throw error
    }
  }

  /**
   * Delete a series
   */
  static async deleteSeries(id: string): Promise<void> {
    try {
      // First, remove series association from artworks
      const { error: artworkError } = await supabase
        .from('artworks')
        .update({ series_id: null })
        .eq('series_id', id)

      if (artworkError) throw artworkError

      // Delete series record
      const { error } = await supabase
        .from('art_series')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting series:', error)
      throw error
    }
  }

  /**
   * Add artworks to a series
   */
  static async addArtworksToSeries(
    seriesId: string,
    artworkIds: string[]
  ): Promise<void> {
    try {
      for (const artworkId of artworkIds) {
        const { error } = await supabase
          .from('artworks')
          .update({ series_id: seriesId })
          .eq('id', artworkId)

        if (error) throw error
      }
    } catch (error) {
      console.error('Error adding artworks to series:', error)
      throw error
    }
  }

  /**
   * Remove artworks from a series
   */
  static async removeArtworksFromSeries(artworkIds: string[]): Promise<void> {
    try {
      for (const artworkId of artworkIds) {
        const { error } = await supabase
          .from('artworks')
          .update({ series_id: null })
          .eq('id', artworkId)

        if (error) throw error
      }
    } catch (error) {
      console.error('Error removing artworks from series:', error)
      throw error
    }
  }

  /**
   * Get current seasonal series
   */
  static async getCurrentSeasonalSeries(): Promise<ArtSeries[]> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('art_series')
        .select('*')
        .eq('is_seasonal', true)
        .eq('is_active', true)
        .lte('season_start', today)
        .gte('season_end', today)
        .order('display_order', { ascending: true })

      if (error) throw error

      return data?.map(this.transformSeriesFromDB) || []
    } catch (error) {
      console.error('Error fetching seasonal series:', error)
      throw error
    }
  }

  /**
   * Get featured series
   */
  static async getFeaturedSeries(limit = 3): Promise<SeriesWithArtworks[]> {
    try {
      const { data, error } = await supabase
        .from('art_series')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(limit)

      if (error) throw error

      if (!data) return []

      // Get artwork counts and preview for each series
      const seriesWithArtworks = await Promise.all(
        data.map(async (series) => {
          const { data: artworks, error: artworkError } = await supabase
            .from('artworks')
            .select('*')
            .eq('series_id', series.id)
            .order('display_order', { ascending: true })
            .limit(3) // Get first 3 for preview

          if (artworkError) {
            console.warn(`Error fetching artworks for series ${series.id}:`, artworkError)
            return {
              ...this.transformSeriesFromDB(series),
              artworkCount: 0,
              latestArtworks: []
            }
          }

          // Get total count
          const { count } = await supabase
            .from('artworks')
            .select('*', { count: 'exact', head: true })
            .eq('series_id', series.id)

          const transformedArtworks = artworks?.map(artwork => ({
            id: artwork.id,
            title: {
              ptBR: artwork.title_pt,
              en: artwork.title_en
            },
            year: artwork.year,
            medium: {
              ptBR: artwork.medium_pt,
              en: artwork.medium_en
            },
            dimensions: artwork.dimensions,
            description: {
              ptBR: artwork.description_pt || '',
              en: artwork.description_en || ''
            },
            category: artwork.category,
            series: artwork.series_id,
            images: artwork.images || [],
            forSale: artwork.for_sale,
            price: artwork.price,
            currency: artwork.currency,
            isAvailable: artwork.is_available,
            displayOrder: artwork.display_order,
            featured: artwork.featured,
            createdAt: new Date(artwork.created_at),
            updatedAt: new Date(artwork.updated_at)
          })) || []

          return {
            ...this.transformSeriesFromDB(series),
            artworkCount: count || 0,
            latestArtworks: transformedArtworks
          }
        })
      )

      return seriesWithArtworks
    } catch (error) {
      console.error('Error fetching featured series:', error)
      throw error
    }
  }

  /**
   * Reorder series
   */
  static async reorderSeries(seriesIds: string[]): Promise<void> {
    try {
      const updates = seriesIds.map((id, index) => ({
        id,
        display_order: index
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('art_series')
          .update({ display_order: update.display_order })
          .eq('id', update.id)

        if (error) throw error
      }
    } catch (error) {
      console.error('Error reordering series:', error)
      throw error
    }
  }

  /**
   * Transform database record to ArtSeries type
   */
  private static transformSeriesFromDB(data: any): ArtSeries {
    return {
      id: data.id,
      name: {
        ptBR: data.name_pt,
        en: data.name_en
      },
      description: {
        ptBR: data.description_pt || '',
        en: data.description_en || ''
      },
      year: data.year,
      coverImage: data.cover_image || '',
      artworks: [], // This will be populated separately when needed
      displayOrder: data.display_order,
      isActive: data.is_active,
      isSeasonal: data.is_seasonal,
      seasonStart: data.season_start ? new Date(data.season_start) : undefined,
      seasonEnd: data.season_end ? new Date(data.season_end) : undefined
    }
  }
}