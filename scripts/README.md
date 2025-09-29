# Scripts Directory

This directory contains utility scripts for the Mai-Britt Wolthers platform.

## Available Scripts

### `verify-supabase.js`
Tests the Supabase connection and lists available tables and storage buckets.

```bash
node scripts/verify-supabase.js
```

### `test-services.js`
Comprehensive test of all service layer functionality.

```bash
node scripts/test-services.js
```

### `create-blog-table.sql`
SQL script to create the blog_posts table for the artist journal feature.

Execute this in your Supabase SQL editor if the blog table doesn't exist:
```sql
-- Copy the contents of create-blog-table.sql and run in Supabase
```

## Service Layer Architecture

The `/src/services/` directory contains:

- **StorageService**: Image upload, optimization, and management
- **ArtworkService**: CRUD operations for artworks with filtering and search
- **SeriesService**: Art collections and seasonal series management
- **ExhibitionsService**: Exhibition timeline and featured shows
- **BlogService**: Artist journal with bilingual content support

All services are TypeScript-based with comprehensive error handling and optimized for both client and server-side usage.