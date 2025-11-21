import { supabase } from '@/lib/supabase'

export interface SiteSettings {
  carouselRotationSpeed: number // milliseconds
  carouselAutoPlay: boolean
  carouselTransitionStyle: 'fade' | 'slide' | 'zoom'
  carouselPauseOnHover: boolean
}

export class SettingsService {
  /**
   * Get a specific setting by key
   */
  static async getSetting<T>(key: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        throw error
      }

      return data?.value as T
    } catch (error) {
      console.error(`Error fetching setting ${key}:`, error)
      return null
    }
  }

  /**
   * Get all carousel settings
   */
  static async getCarouselSettings(): Promise<SiteSettings> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', [
          'carousel_rotation_speed',
          'carousel_auto_play',
          'carousel_transition_style',
          'carousel_pause_on_hover'
        ])

      if (error) throw error

      // Transform database format to SiteSettings format
      const settings: SiteSettings = {
        carouselRotationSpeed: 30000, // Default
        carouselAutoPlay: true,
        carouselTransitionStyle: 'fade',
        carouselPauseOnHover: true
      }

      data?.forEach(setting => {
        switch (setting.key) {
          case 'carousel_rotation_speed':
            settings.carouselRotationSpeed = parseInt(setting.value)
            break
          case 'carousel_auto_play':
            settings.carouselAutoPlay = setting.value
            break
          case 'carousel_transition_style':
            settings.carouselTransitionStyle = setting.value
            break
          case 'carousel_pause_on_hover':
            settings.carouselPauseOnHover = setting.value
            break
        }
      })

      return settings
    } catch (error) {
      console.error('Error fetching carousel settings:', error)
      // Return defaults on error
      return {
        carouselRotationSpeed: 30000,
        carouselAutoPlay: true,
        carouselTransitionStyle: 'fade',
        carouselPauseOnHover: true
      }
    }
  }

  /**
   * Update a specific setting
   */
  static async updateSetting(key: string, value: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ value })
        .eq('key', key)

      if (error) throw error
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error)
      throw error
    }
  }

  /**
   * Update multiple carousel settings at once
   */
  static async updateCarouselSettings(settings: Partial<SiteSettings>): Promise<void> {
    try {
      const updates: Array<{ key: string; value: any }> = []

      if (settings.carouselRotationSpeed !== undefined) {
        updates.push({
          key: 'carousel_rotation_speed',
          value: settings.carouselRotationSpeed.toString()
        })
      }

      if (settings.carouselAutoPlay !== undefined) {
        updates.push({
          key: 'carousel_auto_play',
          value: settings.carouselAutoPlay
        })
      }

      if (settings.carouselTransitionStyle !== undefined) {
        updates.push({
          key: 'carousel_transition_style',
          value: settings.carouselTransitionStyle
        })
      }

      if (settings.carouselPauseOnHover !== undefined) {
        updates.push({
          key: 'carousel_pause_on_hover',
          value: settings.carouselPauseOnHover
        })
      }

      // Execute all updates
      for (const update of updates) {
        await this.updateSetting(update.key, update.value)
      }
    } catch (error) {
      console.error('Error updating carousel settings:', error)
      throw error
    }
  }

  /**
   * Reset carousel settings to defaults
   */
  static async resetCarouselSettings(): Promise<void> {
    await this.updateCarouselSettings({
      carouselRotationSpeed: 30000,
      carouselAutoPlay: true,
      carouselTransitionStyle: 'fade',
      carouselPauseOnHover: true
    })
  }
}
