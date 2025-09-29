import { supabase } from '@/lib/supabase'

export interface ImageVariant {
  original: string
  display: string
  thumbnail: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadResult {
  urls: ImageVariant
  fileName: string
  size: number
}

export class StorageService {
  private static readonly DISPLAY_SIZE = 1920
  private static readonly THUMBNAIL_SIZE = 400

  /**
   * Upload multiple images with automatic resizing
   */
  static async uploadImages(
    files: File[],
    bucket: 'artworks' | 'exhibitions' | 'series',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []
    let totalLoaded = 0
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)

    for (const file of files) {
      try {
        const result = await this.uploadSingleImage(file, bucket, (progress) => {
          const overallProgress = {
            loaded: totalLoaded + progress.loaded,
            total: totalSize,
            percentage: Math.round(((totalLoaded + progress.loaded) / totalSize) * 100)
          }
          onProgress?.(overallProgress)
        })

        results.push(result)
        totalLoaded += file.size
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        throw error
      }
    }

    return results
  }

  /**
   * Upload a single image with automatic resizing
   */
  static async uploadSingleImage(
    file: File,
    bucket: 'artworks' | 'exhibitions' | 'series',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // Validate file type
    if (!this.isValidImageType(file)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, or WebP images.')
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const baseFileName = `${timestamp}-${randomId}`

    try {
      // Upload original image
      const originalPath = `original/${baseFileName}.${extension}`
      const { data: originalData, error: originalError } = await supabase.storage
        .from(bucket)
        .upload(originalPath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (originalError) throw originalError

      // Get original image URL
      const { data: originalUrl } = supabase.storage
        .from(bucket)
        .getPublicUrl(originalPath)

      // Create resized versions
      const displayBlob = await this.resizeImage(file, this.DISPLAY_SIZE)
      const thumbnailBlob = await this.resizeImage(file, this.THUMBNAIL_SIZE)

      // Upload display version
      const displayPath = `display/${baseFileName}.webp`
      const { error: displayError } = await supabase.storage
        .from(bucket)
        .upload(displayPath, displayBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/webp'
        })

      if (displayError) throw displayError

      // Upload thumbnail version
      const thumbnailPath = `thumbnail/${baseFileName}.webp`
      const { error: thumbnailError } = await supabase.storage
        .from(bucket)
        .upload(thumbnailPath, thumbnailBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/webp'
        })

      if (thumbnailError) throw thumbnailError

      // Get URLs for all versions
      const { data: displayUrl } = supabase.storage
        .from(bucket)
        .getPublicUrl(displayPath)

      const { data: thumbnailUrl } = supabase.storage
        .from(bucket)
        .getPublicUrl(thumbnailPath)

      // Report final progress
      onProgress?.({
        loaded: file.size,
        total: file.size,
        percentage: 100
      })

      return {
        urls: {
          original: originalUrl.publicUrl,
          display: displayUrl.publicUrl,
          thumbnail: thumbnailUrl.publicUrl
        },
        fileName: baseFileName,
        size: file.size
      }
    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    }
  }

  /**
   * Delete images from storage
   */
  static async deleteImages(
    bucket: 'artworks' | 'exhibitions' | 'series',
    fileName: string
  ): Promise<void> {
    try {
      const extension = 'jpg' // We'll try common extensions
      const paths = [
        `original/${fileName}.jpg`,
        `original/${fileName}.png`,
        `original/${fileName}.webp`,
        `display/${fileName}.webp`,
        `thumbnail/${fileName}.webp`
      ]

      // Attempt to delete all possible paths
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths)

      if (error) {
        console.warn('Some files may not have been deleted:', error.message)
      }
    } catch (error) {
      console.error('Error deleting images:', error)
      throw error
    }
  }

  /**
   * List all files in a bucket
   */
  static async listFiles(
    bucket: 'artworks' | 'exhibitions' | 'series',
    folder?: 'original' | 'display' | 'thumbnail'
  ) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder || '', {
          limit: 100,
          offset: 0
        })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error listing files:', error)
      throw error
    }
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrl(
    bucket: 'artworks' | 'exhibitions' | 'series',
    path: string
  ): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  /**
   * Resize image using Canvas API
   */
  private static async resizeImage(file: File, maxSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        // Set canvas size
        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob'))
            }
          },
          'image/webp',
          0.8 // Quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Validate if file is a supported image type
   */
  private static isValidImageType(file: File): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ]
    return validTypes.includes(file.type.toLowerCase())
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}