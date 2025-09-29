# Mai-Britt Wolthers Platform - Development Tasks

## Project Overview
Sophisticated, minimalistic portfolio and e-commerce website for Mai-Britt Wolthers, a Danish-Brazilian contemporary artist. The platform showcases her four-decade artistic journey while enabling direct art sales and featuring a personal artist journal.

## Task Status Legend
- ✅ Completed
- 🚧 In Progress
- ⏳ Pending
- ❌ Blocked
- 🔄 Needs Review

---

## ✅ Task 0: Foundation Setup (COMPLETED)
- **0.1** ✅ Initialize Next.js project with TypeScript
- **0.2** ✅ Set up Supabase project and database configuration
- **0.3** ✅ Install and configure shadcn/ui components
- **0.4** ✅ Set up Tailwind CSS and design tokens
- **0.5** ✅ Create database schema (src/lib/database.sql)
- **0.6** ✅ Create header component with logo

---

## ✅ Task 1: Fix Current Issues (COMPLETED)
**Priority: IMMEDIATE**

- **1.1** ✅ Fix Tailwind CSS configuration in globals.css
- **1.2** ✅ Create docs/ directory
- **1.3** ✅ Create tasks.md with full task breakdown
- **1.4** ✅ Test that styles are working properly
- **1.5** ✅ Restart development server and verify fixes
- **1.6** ✅ Fix Tailwind version mismatch (v4 → v3.4.17)
- **1.7** ✅ Update PostCSS configuration for Tailwind v3
- **1.8** ✅ Add shadcn/ui color system integration
- **1.9** ✅ Install @tailwindcss/typography plugin

---

## ✅ Task 2: Core Data Layer (COMPLETED)
**Priority: HIGH**

### Database Services
- **2.1** ✅ Create services directory structure
- **2.2** ✅ Create artwork.service.ts
  - **2.2.1** ✅ CRUD operations for artworks
  - **2.2.2** ✅ Filtering and search methods
  - **2.2.3** ✅ Batch operations
- **2.3** ✅ Create series.service.ts
  - **2.3.1** ✅ Series CRUD operations
  - **2.3.2** ✅ Link artworks to series
  - **2.3.3** ✅ Seasonal series handling
- **2.4** ✅ Create exhibitions.service.ts
  - **2.4.1** ✅ Exhibition CRUD operations
  - **2.4.2** ✅ Timeline sorting
  - **2.4.3** ✅ Featured exhibitions
- **2.5** ✅ Create storage.service.ts
  - **2.5.1** ✅ Image upload to Supabase
  - **2.5.2** ✅ Image optimization
  - **2.5.3** ✅ Multiple size generation (original, display, thumbnail)
- **2.6** ✅ Create blog.service.ts (NEW FEATURE)
  - **2.6.1** ✅ Blog post CRUD operations
  - **2.6.2** ✅ Draft/publish states
  - **2.6.3** ✅ Tag management
  - **2.6.4** ✅ Archive functionality

### Database Schema Updates
- **2.7** ✅ Verified existing database schema in Supabase
- **2.8** ✅ Blog_posts table exists and ready
- **2.9** ✅ Indexes and RLS policies configured
- **2.10** ✅ All storage buckets configured (artworks, exhibitions, series)

---

## ⏳ Task 3: Main Page Development
**Priority: HIGH**

### Hero Section
- **3.1** ⏳ Build rotating hero carousel component
  - **3.1.1** ⏳ Create HeroCarousel component
  - **3.1.2** ⏳ Implement auto-rotation (4-5 seconds)
  - **3.1.3** ⏳ Add manual navigation controls (arrows, dots)
  - **3.1.4** ⏳ Make responsive for all devices
  - **3.1.5** ⏳ Add pause on hover functionality
  - **3.1.6** ⏳ Smooth fade/slide transitions

### Timeline Section
- **3.2** ⏳ Create exhibitions timeline section
  - **3.2.1** ⏳ Create ExhibitionsTimeline component
  - **3.2.2** ⏳ Fetch exhibitions data from Supabase
  - **3.2.3** ⏳ Create timeline UI with cards
  - **3.2.4** ⏳ Add filtering by year/type
  - **3.2.5** ⏳ Implement scroll animations (Framer Motion)

### Featured Content
- **3.3** ⏳ Develop featured series preview grid
  - **3.3.1** ⏳ Create FeaturedSeries component
  - **3.3.2** ⏳ Implement 3-column responsive grid
  - **3.3.3** ⏳ Add hover effects and animations
  - **3.3.4** ⏳ Link to series detail pages
  - **3.3.5** ⏳ Mobile optimization (single column)

### Blog Preview (NEW)
- **3.4** ⏳ Add artist blog preview section
  - **3.4.1** ⏳ Create BlogPreview component
  - **3.4.2** ⏳ Show latest 3 journal entries
  - **3.4.3** ⏳ Add "Read more" links
  - **3.4.4** ⏳ Style blog preview cards
  - **3.4.5** ⏳ Link to full blog page

### Additional Sections
- **3.5** ⏳ Implement artist statement section
- **3.6** ⏳ Create current availability section
- **3.7** ⏳ Add latest reviews/press section

---

## ⏳ Task 4: Public Pages Implementation
**Priority: HIGH**

### Portfolio
- **4.1** ⏳ Portfolio page
  - **4.1.1** ⏳ Create /portfolio route
  - **4.1.2** ⏳ Build responsive artwork grid
  - **4.1.3** ⏳ Implement category filters (painting, sculpture, etc.)
  - **4.1.4** ⏳ Add search functionality
  - **4.1.5** ⏳ Implement pagination
  - **4.1.6** ⏳ Artwork detail modal/page

### Series Pages
- **4.2** ⏳ Series/Collections pages
  - **4.2.1** ⏳ Create /series route structure
  - **4.2.2** ⏳ Individual series pages (/series/[slug])
  - **4.2.3** ⏳ Related artworks display
  - **4.2.4** ⏳ Series navigation and breadcrumbs

### Exhibitions
- **4.3** ⏳ Exhibitions archive
  - **4.3.1** ⏳ Create /exhibitions route
  - **4.3.2** ⏳ Chronological listing with cards
  - **4.3.3** ⏳ Past/upcoming separation
  - **4.3.4** ⏳ Individual exhibition detail pages

### About Page
- **4.4** ⏳ About the artist page
  - **4.4.1** ⏳ Create /about route
  - **4.4.2** ⏳ Biography sections (PT/EN)
  - **4.4.3** ⏳ Artist statement
  - **4.4.4** ⏳ CV/Resume section
  - **4.4.5** ⏳ Photo gallery

### Blog Pages (NEW)
- **4.5** ⏳ Blog/Journal page
  - **4.5.1** ⏳ Create /blog route structure
  - **4.5.2** ⏳ Blog listing page with cards
  - **4.5.3** ⏳ Individual post pages (/blog/[slug])
  - **4.5.4** ⏳ Archive sidebar (by month/year)
  - **4.5.5** ⏳ Category/tag pages (/blog/tag/[tag])
  - **4.5.6** ⏳ Search within blog
  - **4.5.7** ⏳ Reading time estimation

### Contact & Where to Buy
- **4.6** ⏳ Contact form
  - **4.6.1** ⏳ Create /contact route
  - **4.6.2** ⏳ Build contact form (shadcn/ui)
  - **4.6.3** ⏳ Form validation (Zod)
  - **4.6.4** ⏳ Email integration (Resend)
  - **4.6.5** ⏳ Success/error handling
  - **4.6.6** ⏳ Artist contact info display

### Where to Buy (Gallery Directory)
- **4.7** ⏳ Public gallery listings
  - **4.7.1** ⏳ Create /where-to-buy route
  - **4.7.2** ⏳ Gallery cards display:
    - Gallery name and photo
    - Full address with country flag
    - Contact information (phone, email, website)
    - Opening hours display
    - "Get Directions" button (Google Maps)
    - Current artworks available count
  - **4.7.3** ⏳ Interactive gallery map view
  - **4.7.4** ⏳ Filter galleries by:
    - Country/region
    - City
    - Has current artworks
  - **4.7.5** ⏳ Individual gallery detail pages (/where-to-buy/[slug])
  - **4.7.6** ⏳ Distance calculator from user location
  - **4.7.7** ⏳ Mobile-optimized gallery finder
  - **4.7.8** ⏳ Gallery contact forms for inquiries

---

## ⏳ Task 5: Blog/Journal Feature (NEW)
**Priority: MEDIUM**

### Blog Components
- **5.1** ⏳ Core blog components
  - **5.1.1** ⏳ Create BlogCard component
  - **5.1.2** ⏳ Create BlogPost full view component
  - **5.1.3** ⏳ Create BlogSidebar component
  - **5.1.4** ⏳ Create TagCloud component
  - **5.1.5** ⏳ Create RelatedPosts component
  - **5.1.6** ⏳ Create BlogNavigation component

### Blog Functionality
- **5.2** ⏳ Advanced blog features
  - **5.2.1** ⏳ Implement pagination
  - **5.2.2** ⏳ Add search within blog
  - **5.2.3** ⏳ Create RSS feed
  - **5.2.4** ⏳ Add social sharing buttons
  - **5.2.5** ⏳ Implement comments (optional)
  - **5.2.6** ⏳ Reading progress indicator

### Blog Archives
- **5.3** ⏳ Archive functionality
  - **5.3.1** ⏳ Monthly/yearly archives
  - **5.3.2** ⏳ Category archives
  - **5.3.3** ⏳ Tag archives
  - **5.3.4** ⏳ Archive navigation

---

## ⏳ Task 6: Artist Dashboard & Admin System
**Priority: HIGH**

### Authentication System
- **6.1** ⏳ Enhanced authentication
  - **6.1.1** ⏳ Set up Supabase Auth with 2FA
  - **6.1.2** ⏳ Create elegant split-screen /login page
    - Left panel: Rotating artwork showcase
    - Right panel: Clean login form
  - **6.1.3** ⏳ Implement protected routes middleware
  - **6.1.4** ⏳ Session management with auto-logout
  - **6.1.5** ⏳ Trusted device registration
  - **6.1.6** ⏳ Password reset flow
  - **6.1.7** ⏳ Login activity monitoring
  - **6.1.8** ⏳ Biometric login support (mobile)

### Main Dashboard Hub
- **6.2** ⏳ Comprehensive dashboard
  - **6.2.1** ⏳ Create dashboard layout with sidebar navigation
  - **6.2.2** ⏳ Welcome section with personalized greeting/weather
  - **6.2.3** ⏳ Quick actions bar:
    - Upload artwork
    - Record sale
    - Add gallery
    - Write journal
    - Move artwork location
  - **6.2.4** ⏳ Live metrics cards:
    - Total artworks by location
    - Monthly/yearly revenue
    - Gallery performance comparison
    - Recent website visitors
  - **6.2.5** ⏳ Recent activity feed
  - **6.2.6** ⏳ Revenue charts (Recharts/Chart.js)

### Gallery Management System
- **6.3** ⏳ Full gallery CRUD
  - **6.3.1** ⏳ Gallery listing with cards view
  - **6.3.2** ⏳ Add/Edit gallery form with fields:
    - Name, slug (for URL)
    - Full address (line1, line2, city, state, postal code, country)
    - GPS coordinates (lat/long)
    - Contact person, email, phone, website
    - Opening hours (JSON structure)
    - Commission rate, payment terms
    - Shipping arrangements, insurance
    - Gallery photo upload
  - **6.3.3** ⏳ Google Maps integration for addresses
  - **6.3.4** ⏳ Gallery performance metrics:
    - Total artworks displayed
    - Total sold, conversion rate
    - Average days to sale
    - Revenue generated
  - **6.3.5** ⏳ Gallery relationship status tracking
  - **6.3.6** ⏳ Contract expiry reminders
  - **6.3.7** ⏳ Bulk email to galleries

### Artwork Location Management
- **6.4** ⏳ Location tracking system
  - **6.4.1** ⏳ Visual inventory grid with location badges:
    - 🏛️ Gallery (with gallery name)
    - 🎨 Studio
    - 📦 Storage
    - ✈️ In Transit
    - 🏠 With Collector (sold)
  - **6.4.2** ⏳ Drag-and-drop to change locations
  - **6.4.3** ⏳ Artwork journey timeline view
  - **6.4.4** ⏳ Bulk location updates
  - **6.4.5** ⏳ Expected return date tracking
  - **6.4.6** ⏳ Shipping tracking integration
  - **6.4.7** ⏳ Location history log

### Sales Dashboard & Analytics
- **6.5** ⏳ Comprehensive sales system
  - **6.5.1** ⏳ Sales recording form:
    - Artwork selection
    - Gallery/direct sale toggle
    - Sale price, commission calculation
    - Buyer details (name, email, country)
    - Payment method and status
    - Certificate of authenticity checkbox
  - **6.5.2** ⏳ Revenue analytics dashboard:
    - Monthly/yearly revenue charts
    - Geographic heat map of sales
    - Gallery performance comparison
    - Best-selling artworks ranking
    - Average sale price trends
  - **6.5.3** ⏳ Gallery leaderboard with metrics
  - **6.5.4** ⏳ Sales pipeline tracking
  - **6.5.5** ⏳ Commission vs direct sales analysis
  - **6.5.6** ⏳ Export to CSV/Excel for accounting
  - **6.5.7** ⏳ Invoice generation

### Private Journal System
- **6.6** ⏳ Artist journal/diary
  - **6.6.1** ⏳ Rich text editor for journal entries
  - **6.6.2** ⏳ Entry metadata:
    - Title, date, mood
    - Weather (auto-fetch)
    - Location
    - Inspiration source
  - **6.6.3** ⏳ Link/embed artworks in entries
  - **6.6.4** ⏳ Photo attachments from studio
  - **6.6.5** ⏳ Private/public toggle for blog publishing
  - **6.6.6** ⏳ Search and filter entries
  - **6.6.7** ⏳ Export journal as PDF/backup

### Content Management Enhanced
- **6.7** ⏳ Artwork management
  - **6.7.1** ⏳ Enhanced artwork listing with location filters
  - **6.7.2** ⏳ Add artwork form with location assignment
  - **6.7.3** ⏳ Edit artwork with location history
  - **6.7.4** ⏳ Bulk operations with location updates
  - **6.7.5** ⏳ Sale status toggle with buyer info
  - **6.7.6** ⏳ Availability scheduler

### Blog/Public Content Editor
- **6.8** ⏳ Blog post editor
  - **6.8.1** ⏳ Integrate rich text editor (Tiptap)
  - **6.8.2** ⏳ Convert journal entries to blog posts
  - **6.8.3** ⏳ Draft/publish/schedule workflow
  - **6.8.4** ⏳ Media library integration
  - **6.8.5** ⏳ SEO metadata fields
  - **6.8.6** ⏳ Auto-save drafts
  - **6.8.7** ⏳ Preview mode

### Additional Management
- **6.9** ⏳ Series management
  - **6.9.1** ⏳ Series CRUD interface
  - **6.9.2** ⏳ Assign artworks to series
  - **6.9.3** ⏳ Reorder series
- **6.10** ⏳ Exhibition management
  - **6.10.1** ⏳ Exhibition CRUD interface
  - **6.10.2** ⏳ Link exhibitions to galleries
  - **6.10.3** ⏳ Upload exhibition images
  - **6.10.4** ⏳ Mark as featured

---

## ⏳ Task 7: Advanced Features
**Priority: MEDIUM**

### Drag & Drop
- **7.1** ⏳ Portfolio ordering system
  - **7.1.1** ⏳ Integrate @dnd-kit/core
  - **7.1.2** ⏳ Create sortable artwork grid
  - **7.1.3** ⏳ Save order to database
  - **7.1.4** ⏳ Preview before save
  - **7.1.5** ⏳ Reset to default order
  - **7.1.6** ⏳ Bulk drag operations

### Image System
- **7.2** ⏳ Advanced image optimization
  - **7.2.1** ⏳ Automatic WebP conversion
  - **7.2.2** ⏳ Generate thumbnails (400px)
  - **7.2.3** ⏳ Generate display sizes (1920px)
  - **7.2.4** ⏳ CDN integration optimization
  - **7.2.5** ⏳ Lazy loading implementation
  - **7.2.6** ⏳ Image compression settings

### Internationalization
- **7.3** ⏳ Bilingual support
  - **7.3.1** ⏳ Create LanguageContext
  - **7.3.2** ⏳ Create useLanguage hook
  - **7.3.3** ⏳ Update all components for PT/EN
  - **7.3.4** ⏳ Language toggle component
  - **7.3.5** ⏳ Save preference to localStorage
  - **7.3.6** ⏳ URL-based language routing

---

## ⏳ Task 8: E-commerce Integration
**Priority: LOW**

### Payment Processing
- **8.1** ⏳ Stripe integration
  - **8.1.1** ⏳ Install Stripe SDK
  - **8.1.2** ⏳ Configure API keys
  - **8.1.3** ⏳ Create checkout session
  - **8.1.4** ⏳ Webhook handling
  - **8.1.5** ⏳ Payment confirmation flow

### Inquiry System
- **8.2** ⏳ Artwork inquiries
  - **8.2.1** ⏳ Artwork inquiry form
  - **8.2.2** ⏳ Email notifications (Resend)
  - **8.2.3** ⏳ Admin inquiry management
  - **8.2.4** ⏳ Response templates

### Order Management
- **8.3** ⏳ Order system
  - **8.3.1** ⏳ Order database schema
  - **8.3.2** ⏳ Order tracking page
  - **8.3.3** ⏳ Status updates
  - **8.3.4** ⏳ Order history

### Shipping
- **8.4** ⏳ Shipping calculator
  - **8.4.1** ⏳ Dimension-based calculation
  - **8.4.2** ⏳ Multiple shipping options
  - **8.4.3** ⏳ International shipping

---

## ⏳ Task 9: SEO & Performance
**Priority: LOW**

### SEO Optimization
- **9.1** ⏳ Meta tags and SEO
  - **9.1.1** ⏳ Dynamic meta tags
  - **9.1.2** ⏳ Open Graph tags
  - **9.1.3** ⏳ Twitter cards
  - **9.1.4** ⏳ Structured data (JSON-LD)
  - **9.1.5** ⏳ Canonical URLs

### Technical SEO
- **9.2** ⏳ Sitemap and indexing
  - **9.2.1** ⏳ Generate sitemap.xml
  - **9.2.2** ⏳ Submit to search engines
  - **9.2.3** ⏳ Robots.txt

### Performance
- **9.3** ⏳ Performance optimization
  - **9.3.1** ⏳ Image lazy loading
  - **9.3.2** ⏳ Code splitting
  - **9.3.3** ⏳ Bundle optimization
  - **9.3.4** ⏳ Caching strategies

### Analytics
- **9.4** ⏳ Analytics and monitoring
  - **9.4.1** ⏳ Google Analytics setup
  - **9.4.2** ⏳ Custom events tracking
  - **9.4.3** ⏳ Conversion tracking
  - **9.4.4** ⏳ Performance monitoring

### Blog SEO (NEW)
- **9.5** ⏳ Blog-specific SEO
  - **9.5.1** ⏳ RSS feed generation
  - **9.5.2** ⏳ JSON-LD for blog posts
  - **9.5.3** ⏳ Reading time calculation
  - **9.5.4** ⏳ Blog sitemap

---

## File Structure to Create

```
docs/
└── tasks.md ✅

src/
├── app/
│   ├── (public)/
│   │   ├── portfolio/
│   │   ├── series/
│   │   ├── exhibitions/
│   │   ├── blog/ ⏳ (NEW)
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/page.tsx
│   │   │   └── tag/[tag]/page.tsx
│   │   ├── about/
│   │   ├── contact/
│   │   └── where-to-buy/ ⏳ (NEW)
│   │       ├── page.tsx
│   │       └── [slug]/page.tsx
│   ├── login/ ⏳ (NEW)
│   │   └── page.tsx
│   └── (admin)/ ⏳ (NEW)
│       ├── layout.tsx
│       ├── dashboard/
│       │   └── page.tsx
│       ├── galleries/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/
│       │       ├── page.tsx
│       │       └── edit/page.tsx
│       ├── sales/
│       │   ├── page.tsx
│       │   └── new/page.tsx
│       ├── journal/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/edit/page.tsx
│       ├── artworks/
│       │   ├── locations/page.tsx
│       │   └── analytics/page.tsx
│       └── blog/ ⏳ (ENHANCED)
│           ├── page.tsx
│           ├── new/page.tsx
│           └── edit/[id]/page.tsx
├── components/
│   ├── admin/ ⏳ (NEW)
│   │   ├── Dashboard/
│   │   │   ├── DashboardMetrics.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   └── RevenueCharts.tsx
│   │   ├── Galleries/
│   │   │   ├── GalleryCard.tsx
│   │   │   ├── GalleryForm.tsx
│   │   │   ├── GalleryMap.tsx
│   │   │   └── AddressInput.tsx
│   │   ├── Sales/
│   │   │   ├── SalesForm.tsx
│   │   │   ├── SalesChart.tsx
│   │   │   ├── GalleryLeaderboard.tsx
│   │   │   └── RevenueAnalytics.tsx
│   │   ├── Artworks/
│   │   │   ├── LocationBadge.tsx
│   │   │   ├── ArtworkTimeline.tsx
│   │   │   ├── LocationTracker.tsx
│   │   │   └── BulkActions.tsx
│   │   ├── Journal/
│   │   │   ├── JournalEditor.tsx
│   │   │   ├── EntryCard.tsx
│   │   │   ├── MoodTracker.tsx
│   │   │   └── ArtworkLinker.tsx
│   │   └── Layout/
│   │       ├── AdminSidebar.tsx
│   │       ├── AdminHeader.tsx
│   │       └── ProtectedRoute.tsx
│   ├── galleries/ ⏳ (NEW)
│   │   ├── GalleryCard.tsx (public version)
│   │   ├── GalleryMap.tsx (public interactive map)
│   │   ├── GalleryFilter.tsx
│   │   └── DirectionsButton.tsx
│   ├── blog/ ⏳ (ENHANCED)
│   │   ├── BlogCard.tsx
│   │   ├── BlogPost.tsx
│   │   ├── BlogEditor.tsx (admin)
│   │   ├── BlogSidebar.tsx
│   │   └── JournalToBlogConverter.tsx
│   ├── carousel/
│   │   └── HeroCarousel.tsx
│   ├── exhibitions/
│   │   └── ExhibitionsTimeline.tsx
│   └── auth/ ⏳ (NEW)
│       ├── LoginForm.tsx
│       ├── AuthGuard.tsx
│       └── LogoutButton.tsx
├── services/ ⏳ (ENHANCED)
│   ├── artwork.service.ts
│   ├── series.service.ts
│   ├── exhibitions.service.ts
│   ├── storage.service.ts
│   ├── blog.service.ts
│   ├── auth.service.ts ⏳ (NEW)
│   ├── gallery.service.ts ⏳ (NEW)
│   ├── sales.service.ts ⏳ (NEW)
│   ├── journal.service.ts ⏳ (NEW)
│   ├── analytics.service.ts ⏳ (NEW)
│   └── location.service.ts ⏳ (NEW)
├── contexts/ ⏳
│   ├── LanguageContext.tsx
│   └── AuthContext.tsx ⏳ (NEW)
├── hooks/ ⏳ (ENHANCED)
│   ├── useLanguage.ts
│   ├── useAuth.ts ⏳ (NEW)
│   ├── useGalleries.ts ⏳ (NEW)
│   ├── useSales.ts ⏳ (NEW)
│   ├── useAnalytics.ts ⏳ (NEW)
│   └── useLocation.ts ⏳ (NEW)
└── middleware/ ⏳ (NEW)
    └── auth.middleware.ts
```

---

## Current Priority Order

1. **Task 1** ✅ - Fix remaining issues and test styles (COMPLETED)
2. **Task 2** ✅ - Set up core data layer and services (COMPLETED)
3. **Task 3** ⏳ - Build main page components (IN PROGRESS)
4. **Task 4** ⏳ - Create public pages including Where to Buy
5. **Task 5** ⏳ - Implement blog feature
6. **Task 6** ⏳ - Build artist dashboard & admin system (HIGH PRIORITY)
7. **Task 7** ⏳ - Add advanced features
8. **Task 8** ⏳ - E-commerce integration
9. **Task 9** ⏳ - SEO and performance

## Database Schema Extensions Required

### Enhanced Galleries Table
```sql
-- Enhanced galleries table for admin management and public display
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE, -- for URLs like /where-to-buy/galeria-xyz

  -- Full Address Fields
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state_province TEXT,
  postal_code TEXT,
  country TEXT NOT NULL,
  country_code CHAR(2), -- for flag display
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Contact Information
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  instagram TEXT,

  -- Business Details
  opening_hours JSONB, -- {"monday": "9:00-18:00", "tuesday": "9:00-18:00", ...}
  commission_rate DECIMAL(5,2),
  payment_terms TEXT,
  shipping_arrangements TEXT,
  insurance_provider TEXT,

  -- Display & Media
  gallery_photo TEXT, -- Supabase storage URL
  description_pt TEXT,
  description_en TEXT,

  -- Relationship Management
  relationship_status TEXT CHECK (relationship_status IN ('active', 'inactive', 'prospective')),
  first_partnership_date DATE,
  contract_expiry_date DATE,

  -- Public Display Settings
  is_active BOOLEAN DEFAULT true,
  show_on_website BOOLEAN DEFAULT true, -- for Where to Buy page
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artwork Location Tracking
CREATE TABLE artwork_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  gallery_id UUID REFERENCES galleries(id),
  location_type TEXT NOT NULL CHECK (location_type IN ('gallery', 'studio', 'collector', 'exhibition', 'storage', 'transit')),

  -- Movement Tracking
  date_moved TIMESTAMPTZ DEFAULT NOW(),
  expected_return_date DATE,
  shipping_tracking_number TEXT,
  condition_on_arrival TEXT,

  -- Current Status
  is_current BOOLEAN DEFAULT true,

  -- Notes
  notes TEXT,
  created_by UUID, -- artist user ID

  UNIQUE(artwork_id, is_current) WHERE is_current = true -- Only one current location per artwork
);

-- Sales Records with Enhanced Tracking
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id),
  gallery_id UUID REFERENCES galleries(id), -- NULL for direct sales

  -- Sale Details
  sale_date DATE NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2), -- can override gallery default
  commission_amount DECIMAL(10,2),
  net_amount DECIMAL(10,2), -- after commission
  currency TEXT DEFAULT 'BRL' CHECK (currency IN ('BRL', 'USD', 'EUR')),

  -- Buyer Information
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  buyer_country TEXT,
  buyer_address JSONB,

  -- Payment & Documentation
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  invoice_number TEXT,
  certificate_of_authenticity_sent BOOLEAN DEFAULT false,

  -- Metadata
  sale_type TEXT DEFAULT 'gallery' CHECK (sale_type IN ('gallery', 'direct', 'online')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Private Journal Entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL, -- artist user ID

  -- Content
  title TEXT,
  content TEXT NOT NULL,
  excerpt TEXT, -- auto-generated or manual

  -- Metadata
  mood TEXT, -- happy, contemplative, frustrated, inspired, etc.
  weather TEXT, -- auto-fetched or manual
  location TEXT, -- studio, gallery, travel location
  inspiration_source TEXT,

  -- Artwork Connections
  artwork_references UUID[], -- array of artwork IDs mentioned

  -- Publication Settings
  is_public BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  blog_post_id UUID REFERENCES blog_posts(id), -- if converted to blog post

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery Performance Metrics (Auto-calculated)
CREATE TABLE gallery_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES galleries(id),

  -- Time Period
  period_start DATE,
  period_end DATE,

  -- Performance Data
  total_artworks_displayed INTEGER DEFAULT 0,
  total_sold INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0,
  average_sale_price DECIMAL(10,2),
  conversion_rate DECIMAL(5,2), -- percentage sold vs displayed
  average_days_to_sale INTEGER,

  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(gallery_id, period_start, period_end)
);
```

---

## Notes

### Artist Dashboard Feature Highlights
- **Comprehensive Business Management**: Gallery relationships, sales tracking, artwork locations
- **Private Journal**: Artist can write about her creative process, convert to public blog posts
- **Visual Location Tracking**: See where every artwork is located with badges and timeline
- **Sales Analytics**: Revenue charts, gallery performance comparison, geographic insights
- **Bilingual Content**: All content supports both Portuguese and English
- **Admin Friendly**: Intuitive interface designed for artist workflow

### Where to Buy Page Features
- **Public Gallery Directory**: All active partner galleries displayed as cards
- **Interactive Map**: Google Maps integration showing gallery locations worldwide
- **Contact Integration**: Direct contact forms for each gallery
- **Current Inventory**: Shows which galleries currently have artworks available
- **Directions & Hours**: Easy access to gallery information for collectors

### Technical Considerations
- All components follow shadcn/ui design system
- Responsive design with mobile-first approach
- Accessibility (a11y) compliance
- Performance optimization throughout
- Bilingual support for international audience
- Secure authentication with protected admin routes
- Real-time data updates for location tracking

### Success Metrics
- Artist efficiency in business management
- Reduced time for artwork location tracking
- Improved gallery relationship management
- Enhanced collector experience through Where to Buy page
- Increased international reach through gallery network
- Better sales insights through comprehensive analytics