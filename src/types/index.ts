// Language support types
export interface Language {
  code: 'pt-BR' | 'en'
  flag: string
  name: string
}

export interface Content {
  ptBR: string
  en: string
}

// Core artwork types
export interface Artwork {
  id: string
  title: Content
  year: number
  medium: Content
  dimensions: string
  description: Content
  category: 'painting' | 'sculpture' | 'engraving' | 'video' | 'mixed-media'
  series?: string
  location?: string
  status?: 'available' | 'sold' | 'reserved' | 'archived'
  images: {
    original: string
    display: string
    thumbnail: string
  }[]
  forSale: boolean
  price?: number
  currency: 'BRL' | 'USD' | 'EUR'
  isAvailable: boolean
  displayOrder: number
  featured: boolean
  createdAt: Date
  updatedAt: Date
}

// Art series/collections
export interface ArtSeries {
  id: string
  name: Content
  description: Content
  year: number
  coverImage: string
  artworks: string[] // artwork IDs
  displayOrder: number
  isActive: boolean
  isSeasonal: boolean
  seasonStart?: Date
  seasonEnd?: Date
}

// Reviews and press coverage
export interface Review {
  id: string
  source: string
  url: string
  title: string
  excerpt: string
  author?: string
  publishedDate: Date
  sentiment: 'positive' | 'neutral' | 'negative'
  verified: boolean
  displayOrder: number
}

// E-commerce types
export interface SaleItem extends Artwork {
  saleStatus: 'available' | 'reserved' | 'sold'
  reservedUntil?: Date
  saleHistory: {
    date: Date
    action: 'listed' | 'reserved' | 'sold' | 'unlisted'
    price: number
  }[]
}

export interface Order {
  id: string
  artworkId: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  shippingAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  amount: number
  currency: string
  stripePaymentId?: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Exhibition types
export interface ExhibitionImage {
  url: string
  captionPt?: string
  captionEn?: string
  isCover?: boolean
}

export interface ExhibitionVideo {
  url: string
  titlePt?: string
  titleEn?: string
}

export interface Exhibition {
  id: string
  // Basic info
  title: Content
  slug?: string
  venue: string
  location: string
  year: number
  type: 'solo' | 'group' | 'residency'

  // Short description (for cards/previews)
  description?: Content

  // Rich content (blog-like body)
  content?: Content

  // Curator/press quote
  curatorName?: string
  curatorText?: Content

  // Media
  image?: string // Legacy single image (cover)
  images: ExhibitionImage[]
  videos: ExhibitionVideo[]

  // Dates
  startDate?: Date
  endDate?: Date
  openingDate?: Date
  openingDetails?: string

  // Display settings
  featured: boolean
  showPopup: boolean
  isVisible: boolean
  displayOrder: number

  // Links
  externalUrl?: string
  catalogUrl?: string

  // Timestamps
  createdAt?: Date
  updatedAt?: Date
}