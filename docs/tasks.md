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

## ⏳ Task 2: Core Data Layer
**Priority: HIGH**

### Database Services
- **2.1** ⏳ Create services directory structure
- **2.2** ⏳ Create artwork.service.ts
  - **2.2.1** ⏳ CRUD operations for artworks
  - **2.2.2** ⏳ Filtering and search methods
  - **2.2.3** ⏳ Batch operations
- **2.3** ⏳ Create series.service.ts
  - **2.3.1** ⏳ Series CRUD operations
  - **2.3.2** ⏳ Link artworks to series
  - **2.3.3** ⏳ Seasonal series handling
- **2.4** ⏳ Create exhibitions.service.ts
  - **2.4.1** ⏳ Exhibition CRUD operations
  - **2.4.2** ⏳ Timeline sorting
  - **2.4.3** ⏳ Featured exhibitions
- **2.5** ⏳ Create storage.service.ts
  - **2.5.1** ⏳ Image upload to Supabase
  - **2.5.2** ⏳ Image optimization
  - **2.5.3** ⏳ Multiple size generation (original, display, thumbnail)
- **2.6** ⏳ Create blog.service.ts (NEW FEATURE)
  - **2.6.1** ⏳ Blog post CRUD operations
  - **2.6.2** ⏳ Draft/publish states
  - **2.6.3** ⏳ Tag management
  - **2.6.4** ⏳ Archive functionality

### Database Schema Updates
- **2.7** ⏳ Execute existing database schema in Supabase
- **2.8** ⏳ Create blog_posts table
  ```sql
  CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_pt TEXT NOT NULL,
    title_en TEXT NOT NULL,
    content_pt TEXT NOT NULL,
    content_en TEXT NOT NULL,
    excerpt_pt TEXT,
    excerpt_en TEXT,
    cover_image TEXT,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    tags JSONB DEFAULT '[]',
    reading_time INTEGER, -- estimated minutes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- **2.9** ⏳ Create indexes for blog posts
- **2.10** ⏳ Set up Row Level Security for blog posts

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

### Contact
- **4.6** ⏳ Contact form
  - **4.6.1** ⏳ Create /contact route
  - **4.6.2** ⏳ Build contact form (shadcn/ui)
  - **4.6.3** ⏳ Form validation (Zod)
  - **4.6.4** ⏳ Email integration (Resend)
  - **4.6.5** ⏳ Success/error handling
  - **4.6.6** ⏳ Artist contact info display

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

## ⏳ Task 6: Artist Dashboard
**Priority: MEDIUM**

### Authentication
- **6.1** ⏳ Authentication system
  - **6.1.1** ⏳ Set up Supabase Auth
  - **6.1.2** ⏳ Create /admin/login page
  - **6.1.3** ⏳ Implement protected routes middleware
  - **6.1.4** ⏳ Session management
  - **6.1.5** ⏳ Logout functionality
  - **6.1.6** ⏳ Password reset flow

### Dashboard Overview
- **6.2** ⏳ Main dashboard
  - **6.2.1** ⏳ Create dashboard layout
  - **6.2.2** ⏳ Statistics cards (views, sales, posts)
  - **6.2.3** ⏳ Recent activity feed
  - **6.2.4** ⏳ Quick action buttons
  - **6.2.5** ⏳ Charts and metrics (Recharts)

### Content Management
- **6.3** ⏳ Artwork management
  - **6.3.1** ⏳ Artwork listing table with actions
  - **6.3.2** ⏳ Add artwork form with image upload
  - **6.3.3** ⏳ Edit artwork functionality
  - **6.3.4** ⏳ Delete with confirmation modal
  - **6.3.5** ⏳ Bulk operations (select all, delete, etc.)
  - **6.3.6** ⏳ Sale status toggle interface

### Blog Editor (NEW)
- **6.4** ⏳ Blog post editor
  - **6.4.1** ⏳ Integrate rich text editor (Tiptap or similar)
  - **6.4.2** ⏳ Draft/publish toggle
  - **6.4.3** ⏳ Media library integration
  - **6.4.4** ⏳ SEO metadata fields
  - **6.4.5** ⏳ Schedule publishing
  - **6.4.6** ⏳ Auto-save drafts
  - **6.4.7** ⏳ Preview mode

### Additional Management
- **6.5** ⏳ Series management
  - **6.5.1** ⏳ Series CRUD interface
  - **6.5.2** ⏳ Assign artworks to series
  - **6.5.3** ⏳ Reorder series
- **6.6** ⏳ Exhibition management
  - **6.6.1** ⏳ Exhibition CRUD interface
  - **6.6.2** ⏳ Upload exhibition images
  - **6.6.3** ⏳ Mark as featured

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
│   │   └── contact/
│   └── (admin)/
│       ├── dashboard/
│       └── blog/ ⏳ (NEW)
│           ├── new/page.tsx
│           └── edit/[id]/page.tsx
├── components/
│   ├── blog/ ⏳ (NEW)
│   │   ├── BlogCard.tsx
│   │   ├── BlogPost.tsx
│   │   ├── BlogEditor.tsx
│   │   └── BlogSidebar.tsx
│   ├── carousel/
│   │   └── HeroCarousel.tsx
│   └── exhibitions/
│       └── ExhibitionsTimeline.tsx
├── services/ ⏳
│   ├── artwork.service.ts
│   ├── series.service.ts
│   ├── exhibitions.service.ts
│   ├── storage.service.ts
│   └── blog.service.ts (NEW)
├── contexts/ ⏳
│   └── LanguageContext.tsx
└── hooks/ ⏳
    └── useLanguage.ts
```

---

## Current Priority Order

1. **Task 1** - Fix remaining issues and test styles
2. **Task 2** - Set up core data layer and services
3. **Task 3** - Build main page components
4. **Task 4** - Create public pages
5. **Task 5** - Implement blog feature
6. **Task 6** - Build artist dashboard
7. **Task 7** - Add advanced features
8. **Task 8** - E-commerce integration
9. **Task 9** - SEO and performance

---

## Notes

### Blog Feature Highlights
- **Personal Journal**: Artist can write about her creative process, inspiration, travels
- **Bilingual Content**: All posts support both Portuguese and English
- **Rich Media**: Integration with artwork images and exhibition photos
- **SEO Optimized**: Full meta tags, structured data, RSS feed
- **Admin Friendly**: WYSIWYG editor with draft/publish workflow

### Technical Considerations
- All components follow shadcn/ui design system
- Responsive design with mobile-first approach
- Accessibility (a11y) compliance
- Performance optimization throughout
- Bilingual support for international audience

### Success Metrics
- Page load speed < 2 seconds
- Mobile responsiveness score 100%
- SEO score 90+
- Artist efficiency in content management
- International reach through bilingual content