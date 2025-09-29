// Service layer exports for Mai-Britt Wolthers Platform
// Central export point for all database and storage services

export { StorageService } from './storage.service'
export type {
  ImageVariant,
  UploadProgress,
  UploadResult
} from './storage.service'

export { ArtworkService } from './artwork.service'
export type {
  ArtworkFilters,
  ArtworkCreateData,
  ArtworkUpdateData,
  PaginationOptions,
  ArtworkListResponse
} from './artwork.service'

export { SeriesService } from './series.service'
export type {
  SeriesCreateData,
  SeriesUpdateData,
  SeriesWithArtworks
} from './series.service'

export { ExhibitionsService } from './exhibitions.service'
export type {
  ExhibitionCreateData,
  ExhibitionUpdateData,
  ExhibitionFilters,
  ExhibitionsTimelineData
} from './exhibitions.service'

export { BlogService } from './blog.service'
export type {
  BlogPost,
  BlogPostCreateData,
  BlogPostUpdateData,
  BlogPostFilters,
  BlogPostListResponse,
  BlogArchive
} from './blog.service'