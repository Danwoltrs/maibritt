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
  heightCm: string   // form input value, e.g. "185" or "80,5"
  widthCm: string
  descriptionPt: string
  descriptionEn: string
  featured: boolean
  showOnTimeline: boolean
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
