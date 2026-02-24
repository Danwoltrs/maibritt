# Mai-Britt Wolthers Artist Website

## Project Overview
Next.js website for Mai-Britt Wolthers, Danish-Brazilian contemporary artist. Bilingual (EN/PT-BR), Supabase backend.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Supabase (database + storage)
- Tailwind CSS + shadcn/ui
- Framer Motion

## Structure
```
src/
├── app/(admin)/     # Admin panel routes
├── app/(public)/    # Public routes  
├── components/      # React components
├── services/        # Supabase service classes
├── lib/             # Utilities, supabase client
└── hooks/           # Custom React hooks
migrations/          # SQL migration files
```

## Key Services
- `ArtworksService` - Artwork CRUD with location tracking
- `GalleryService` - Galleries with artwork relationships
- `QuotesService` - Quotes (artist, press, testimonial, curator types)
- `ExhibitionsService` - Exhibition management
- `SeriesService` - Artwork series/collections

## Conventions
- Services use camelCase properties, transform from snake_case DB columns
- Bilingual fields: `fieldPt` / `fieldEn` pattern
- Admin routes under `(admin)` route group
- Components follow feature-based organization


## Current State
- Homepage sections: Hero, FeaturedArtworks, ExhibitionsTimeline, FeaturedSeries, ArtistStatement, GalleryLocations, BlogPreview
- Admin panel: artworks, exhibitions, series, galleries, quotes, sales
- Quotes system supports press reviews with images

Always ask questions prior to doing any big jobs.
Never have a file larger than 2000 lines, when that happens inform and refactor