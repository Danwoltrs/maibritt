import { supabase } from '@/lib/supabase'

export interface SiteSettings {
  carouselRotationSpeed: number // milliseconds
  carouselAutoPlay: boolean
  carouselTransitionStyle: 'fade' | 'slide' | 'zoom'
  carouselPauseOnHover: boolean
}

export interface BrandingSettings {
  logoUrl: string | null
}

export interface HomepageSections {
  showJournal: boolean
  showAvailableWorks: boolean
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
            settings.carouselAutoPlay = setting.value === true || setting.value === 'true'
            break
          case 'carousel_transition_style':
            settings.carouselTransitionStyle = setting.value
            break
          case 'carousel_pause_on_hover':
            settings.carouselPauseOnHover = setting.value === true || setting.value === 'true'
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
   * Get homepage section visibility settings
   */
  static async getHomepageSections(): Promise<HomepageSections> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['show_journal', 'show_available_works'])

      if (error) throw error

      const sections: HomepageSections = {
        showJournal: true,
        showAvailableWorks: true,
      }

      data?.forEach(setting => {
        if (setting.key === 'show_journal') {
          sections.showJournal = setting.value === true || setting.value === 'true'
        }
        if (setting.key === 'show_available_works') {
          sections.showAvailableWorks = setting.value === true || setting.value === 'true'
        }
      })

      return sections
    } catch (error) {
      console.error('Error fetching homepage sections:', error)
      return { showJournal: true, showAvailableWorks: true }
    }
  }

  /**
   * Update homepage section visibility
   */
  static async updateHomepageSections(sections: Partial<HomepageSections>): Promise<void> {
    const updates: Array<{ key: string; value: boolean }> = []
    if (sections.showJournal !== undefined) {
      updates.push({ key: 'show_journal', value: sections.showJournal })
    }
    if (sections.showAvailableWorks !== undefined) {
      updates.push({ key: 'show_available_works', value: sections.showAvailableWorks })
    }
    for (const u of updates) {
      await this.upsertSetting(u.key, u.value)
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
   * Upsert a setting (create if not exists, update if exists)
   */
  static async upsertSetting(key: string, value: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value }, { onConflict: 'key' })

      if (error) throw error
    } catch (error) {
      console.error(`Error upserting setting ${key}:`, error)
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

  /**
   * Get the custom logo URL (null means use default /logo.svg)
   */
  static async getLogoUrl(): Promise<string | null> {
    const value = await this.getSetting<string>('logo_url')
    return value || null
  }

  /**
   * Upload a new logo and save URL to settings
   * Accepts SVG, PNG, JPG, WebP
   */
  static async uploadLogo(file: File): Promise<string> {
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type.toLowerCase())) {
      throw new Error('Invalid file type. Please upload SVG, PNG, JPG, or WebP.')
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
    const fileName = `logo-${Date.now()}.${extension}`
    const path = `branding/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('artworks').getPublicUrl(path)
    const publicUrl = data.publicUrl

    await this.upsertSetting('logo_url', publicUrl)
    return publicUrl
  }

  /**
   * Remove custom logo (reverts to default /logo.svg)
   */
  static async removeLogo(): Promise<void> {
    await this.upsertSetting('logo_url', null)
  }
}
