export interface UploadedImage {
  file: File
  preview: string
}

export interface ArtworkDetails {
  titlePt: string
  titleEn: string
  mediumPt: string
  mediumEn: string
  dimensions: string
  descriptionPt: string
  descriptionEn: string
  featured: boolean
  category?: string
  year?: number
}

export interface CommonMetadata {
  category?: string
  year?: number
}

export interface ApplyToAll {
  category: boolean
  year: boolean
}

export interface CommonApplied {
  category?: string
  year?: number
}
