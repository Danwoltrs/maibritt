# Mai-Britt Wolthers - Artist Portfolio & E-commerce Platform

## Project Overview
Create a sophisticated, minimalistic portfolio and e-commerce website for Mai-Britt Wolthers, a Danish-Brazilian contemporary artist in her early 60s. The platform will showcase her four-decade artistic journey, featuring landscape paintings, sculptures, and mixed media works while enabling direct art sales.

## Artist Context
- **Name**: Mai-Britt Wolthers
- **Age**: Early 60s (born 1962)
- **Background**: Danish artist living in Brazil since 1986
- **Style**: Transcultural contemporary art focusing on color as narrative protagonist
- **Mediums**: Acrylics on linen, sculpture, metal engraving, video art, mixed media
- **Themes**: Brazilian landscapes, memory, cultural duality, environmental research
- **Notable**: 17 solo exhibitions, international presence (Brazil, Denmark, UK, US)

## Core Requirements

### 1. Clean Minimalistic Design
- **Art-First Philosophy**: Artwork is the absolute focal point
- **White/neutral background** with ample whitespace
- **Typography**: Clean, modern sans-serif (Inter or similar)
- **Color Palette**: Monochrome with artist's signature colors as accents
- **Mobile-responsive**: Seamless experience across all devices

### 2. Bilingual Support (PT-BR & EN)
```typescript
// Language structure
interface Language {
  code: 'pt-BR' | 'en'
  flag: string
  name: string
}

// Content structure
interface Content {
  ptBR: string
  en: string
}
```

### 3. High-Resolution Image Management
- **Upload System**: Drag & drop with progress indicators
- **Image Optimization**: Automatic WebP conversion with fallbacks
- **Quality Tiers**: Original (download), Display (web), Thumbnail
- **Metadata Extraction**: EXIF data, dimensions, file size
- **Storage**: Supabase Storage with CDN

### 4. Artist Content Management System

#### 4.1 Artwork Management
```typescript
interface Artwork {
  id: string
  title: Content
  year: number
  medium: Content
  dimensions: string
  description: Content
  category: 'painting' | 'sculpture' | 'engraving' | 'video' | 'mixed-media'
  series?: string
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
```

#### 4.2 Series/Collections Management
```typescript
interface ArtSeries {
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
```

### 5. Drag & Drop Interface for Artist
- **Visual Grid Layout**: Sortable artwork grid
- **Real-time Updates**: Immediate visual feedback
- **Bulk Operations**: Select multiple artworks for batch updates
- **Preview Mode**: See changes before publishing

### 6. E-commerce Functionality

#### 6.1 Sales Management
```typescript
interface SaleItem extends Artwork {
  saleStatus: 'available' | 'reserved' | 'sold'
  reservedUntil?: Date
  saleHistory: {
    date: Date
    action: 'listed' | 'reserved' | 'sold' | 'unlisted'
    price: number
  }[]
}
```

#### 6.2 Purchase Flow
- **Artwork Inquiry**: Contact form for price/availability
- **Secure Checkout**: Stripe integration
- **Shipping Calculator**: Based on artwork dimensions and destination
- **Order Tracking**: Status updates and shipping information

### 7. Web Scraping for Reviews
```typescript
interface Review {
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
```

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand for global state
- **Animations**: Framer Motion for smooth transitions
- **Image Handling**: Next.js Image component with Supabase CDN

### Backend & Database
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (artist admin access)
- **Storage**: Supabase Storage for images
- **Payments**: Stripe for transactions
- **Email**: Resend for notifications

### Database Schema

```sql
-- Artworks table
CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_pt TEXT NOT NULL,
  title_en TEXT NOT NULL,
  year INTEGER NOT NULL,
  medium_pt TEXT NOT NULL,
  medium_en TEXT NOT NULL,
  dimensions TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  category TEXT NOT NULL CHECK (category IN ('painting', 'sculpture', 'engraving', 'video', 'mixed-media')),
  series_id UUID REFERENCES art_series(id),
  images JSONB NOT NULL DEFAULT '[]',
  for_sale BOOLEAN DEFAULT false,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL' CHECK (currency IN ('BRL', 'USD', 'EUR')),
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Art series table
CREATE TABLE art_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  year INTEGER NOT NULL,
  cover_image TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_seasonal BOOLEAN DEFAULT false,
  season_start DATE,
  season_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table (for scraped content)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  author TEXT,
  published_date DATE,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  verified BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Key Features Implementation

### 1. Artist Dashboard
```typescript
// Admin interface for Mai-Britt
const ArtistDashboard = () => {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Quick Stats */}
      <div className="col-span-12 lg:col-span-3">
        <StatsCards />
      </div>
      
      {/* Artwork Management */}
      <div className="col-span-12 lg:col-span-9">
        <ArtworkGrid 
          draggable={true}
          onReorder={handleReorder}
          onEdit={handleEdit}
          onToggleSale={handleToggleSale}
        />
      </div>
    </div>
  )
}
```

### 2. Drag & Drop Artwork Ordering
```typescript
const ArtworkGrid = ({ draggable, onReorder }) => {
  const [artworks, setArtworks] = useState([])
  
  const handleDragEnd = (result) => {
    if (!result.destination) return
    
    const items = Array.from(artworks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    // Update display_order in database
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index
    }))
    
    setArtworks(updatedItems)
    onReorder(updatedItems)
  }
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="artworks" direction="horizontal">
        {(provided) => (
          <div 
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {artworks.map((artwork, index) => (
              <Draggable key={artwork.id} draggableId={artwork.id} index={index}>
                {(provided) => (
                  <ArtworkCard 
                    artwork={artwork}
                    draggable={draggable}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
```

### 3. High-Res Image Upload System
```typescript
const ImageUpload = ({ onUpload, maxFiles = 5 }) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const handleDrop = async (acceptedFiles) => {
    setUploading(true)
    
    const uploadPromises = acceptedFiles.map(async (file) => {
      // Generate multiple sizes
      const original = await uploadToSupabase(file, 'original')
      const display = await resizeAndUpload(file, 1920, 'display')
      const thumbnail = await resizeAndUpload(file, 400, 'thumbnail')
      
      return { original, display, thumbnail }
    })
    
    const results = await Promise.all(uploadPromises)
    setUploading(false)
    onUpload(results)
  }
  
  return (
    <Dropzone 
      onDrop={handleDrop}
      accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
      maxFiles={maxFiles}
    >
      {/* Upload UI */}
    </Dropzone>
  )
}
```

### 4. Sale Status Management
```typescript
const SaleStatusToggle = ({ artwork, onUpdate }) => {
  const [isForSale, setIsForSale] = useState(artwork.for_sale)
  const [price, setPrice] = useState(artwork.price || '')
  const [currency, setCurrency] = useState(artwork.currency || 'BRL')
  
  const handleToggleSale = async () => {
    const updatedArtwork = await updateArtwork(artwork.id, {
      for_sale: !isForSale,
      price: !isForSale ? parseFloat(price) : null,
      currency: !isForSale ? currency : null
    })
    
    setIsForSale(!isForSale)
    onUpdate(updatedArtwork)
  }
  
  return (
    <div className="space-y-4">
      <Switch
        checked={isForSale}
        onCheckedChange={handleToggleSale}
        label={isForSale ? "À venda / For Sale" : "Não disponível / Not Available"}
      />
      
      {isForSale && (
        <div className="flex gap-2">
          <Select value={currency} onValueChange={setCurrency}>
            <option value="BRL">R$ BRL</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
          </Select>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Preço / Price"
          />
        </div>
      )}
    </div>
  )
}
```

### 5. Seasonal Collections Feature
```typescript
const SeasonalCollections = () => {
  const [currentSeason, setCurrentSeason] = useState(null)
  const [seasonalSeries, setSeasonalSeries] = useState([])
  
  useEffect(() => {
    // Check for active seasonal collections
    const today = new Date()
    const activeSeason = seasonalSeries.find(series => 
      series.is_seasonal && 
      new Date(series.season_start) <= today && 
      new Date(series.season_end) >= today
    )
    setCurrentSeason(activeSeason)
  }, [seasonalSeries])
  
  return (
    <section className="py-16">
      {currentSeason && (
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-gray-900 mb-4">
            {currentSeason.name_pt} / {currentSeason.name_en}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {currentSeason.description_pt} / {currentSeason.description_en}
          </p>
        </div>
      )}
      
      <ArtworkGrid 
        series={currentSeason?.id}
        featured={true}
        limit={8}
      />
    </section>
  )
}
```

### 6. Web Scraping for Reviews
```typescript
// API endpoint for scraping reviews
export async function POST(request: Request) {
  const { urls } = await request.json()
  
  const scrapeReview = async (url: string) => {
    try {
      const response = await fetch(url)
      const html = await response.text()
      const $ = cheerio.load(html)
      
      // Extract review data
      const title = $('h1').first().text().trim()
      const content = $('article, .content, .post-content').first().text().trim()
      const author = $('[rel="author"], .author, .byline').first().text().trim()
      const date = extractDate($)
      
      // Sentiment analysis (basic)
      const sentiment = analyzeSentiment(content)
      
      return {
        source: new URL(url).hostname,
        url,
        title,
        excerpt: content.substring(0, 500) + '...',
        author,
        published_date: date,
        sentiment
      }
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error)
      return null
    }
  }
  
  const reviews = await Promise.all(urls.map(scrapeReview))
  const validReviews = reviews.filter(Boolean)
  
  // Save to database
  for (const review of validReviews) {
    await supabase.from('reviews').upsert(review)
  }
  
  return NextResponse.json({ success: true, count: validReviews.length })
}
```

## Main Page Layout & Design

### Hero Section - Rotating Latest Artworks
```typescript
const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [recentArtworks, setRecentArtworks] = useState([])
  
  useEffect(() => {
    // Fetch 5-8 most recent uploads
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6)
      setRecentArtworks(data)
    }
    fetchRecent()
  }, [])
  
  return (
    <section className="relative h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <Image
            src={recentArtworks[currentSlide]?.images[0]?.display}
            alt={recentArtworks[currentSlide]?.title_en}
            fill
            className="object-cover"
            priority
          />
          
          {/* Subtle overlay with artwork info */}
          <div className="absolute bottom-8 left-8 text-white">
            <h2 className="text-2xl font-light mb-2">
              {recentArtworks[currentSlide]?.title_en}
            </h2>
            <p className="text-sm opacity-80">
              {recentArtworks[currentSlide]?.year} • {recentArtworks[currentSlide]?.medium_en}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Auto-advance every 4 seconds */}
      <CarouselControls />
    </section>
  )
}
```

## Interactive Scrolling Experience

### Scroll-Triggered Animations Hook
```typescript
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const useScrollAnimation = (threshold = 0.1) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { 
    threshold, 
    once: true,
    margin: "-100px 0px"
  })
  
  return [ref, isInView]
}

// Parallax scrolling hook
const useParallax = (offset = 50) => {
  const [elementTop, setElementTop] = useState(0)
  const [clientHeight, setClientHeight] = useState(0)
  const ref = useRef(null)
  
  useEffect(() => {
    const element = ref.current
    setElementTop(element.offsetTop)
    setClientHeight(window.innerHeight)
    
    const onScroll = () => {
      if (element) {
        const scrolled = window.scrollY
        const rate = scrolled * -offset / 1000
        element.style.transform = `translateY(${rate}px)`
      }
    }
    
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [offset])
  
  return ref
}
```

### Main Page Layout with Interactive Scrolling
```typescript
const MainPage = () => {
  const [activeSection, setActiveSection] = useState('hero')
  
  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }
  
  return (
    <div className="relative">
      {/* Fixed Navigation Dots */}
      <ScrollNavigation 
        activeSection={activeSection}
        onSectionClick={scrollToSection}
      />
      
      {/* Hero Section */}
      <HeroCarousel id="hero" />
      
      {/* Past Projects & Exhibitions */}
      <ExhibitionsTimeline id="exhibitions" />
      
      {/* Featured Series Preview */}
      <FeaturedSeries id="series" />
      
      {/* Artist Statement */}
      <ArtistStatement id="statement" />
      
      {/* Current Availability */}
      <CurrentAvailability id="availability" />
      
      {/* Studio Life Instagram */}
      <StudioLife id="studio" />
      
      {/* Contact/Inquiry */}
      <ContactSection id="contact" />
    </div>
  )
}
```

### Fixed Scroll Navigation
```typescript
const ScrollNavigation = ({ activeSection, onSectionClick }) => {
  const sections = [
    { id: 'hero', label: 'Latest Works', labelPt: 'Últimos Trabalhos' },
    { id: 'exhibitions', label: 'Exhibitions', labelPt: 'Exposições' },
    { id: 'series', label: 'Series', labelPt: 'Séries' },
    { id: 'statement', label: 'Artist', labelPt: 'Artista' },
    { id: 'availability', label: 'Available', labelPt: 'Disponível' },
    { id: 'studio', label: 'Studio', labelPt: 'Ateliê' },
    { id: 'contact', label: 'Contact', labelPt: 'Contato' }
  ]
  
  return (
    <nav className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50 hidden lg:block">
      <div className="space-y-4">
        {sections.map((section) => (
          <motion.button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={`group block w-3 h-3 rounded-full transition-all duration-300 ${
              activeSection === section.id 
                ? 'bg-gray-900 scale-125' 
                : 'bg-gray-300 hover:bg-gray-500'
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="absolute right-6 top-1/2 transform -translate-y-1/2 
                           bg-gray-900 text-white text-xs px-2 py-1 rounded
                           opacity-0 group-hover:opacity-100 transition-opacity
                           whitespace-nowrap">
              {section.label}
            </span>
          </motion.button>
        ))}
      </div>
    </nav>
  )
}
```

### Past Projects & Exhibitions with Scroll Animations
```typescript
const ExhibitionsTimeline = ({ id }) => {
  const [ref, isInView] = useScrollAnimation(0.2)
  const parallaxRef = useParallax(30)
  
  const exhibitions = [
    {
      year: 2025,
      title: "Mai-Britt Wolthers e a Cor Protagonista",
      venue: "Pinacoteca Benedicto Calixto",
      location: "Santos, Brazil",
      type: "solo",
      image: "/exhibitions/2025-pinacoteca.jpg",
      featured: true
    },
    {
      year: 2022,
      title: "Artist Residency - Fragmentos do Real",
      venue: "Mothership Studio",
      location: "Brooklyn, NY",
      type: "residency",
      image: "/exhibitions/2022-brooklyn.jpg"
    },
    {
      year: 2021,
      title: "Kunstnernes Efterårsudstilling",
      venue: "Charlottenborg",
      location: "Copenhagen, Denmark",
      type: "group",
      image: "/exhibitions/2021-copenhagen.jpg"
    },
    {
      year: 2019,
      title: "Confluências",
      venue: "Galeria Eduardo Fernandes",
      location: "São Paulo, Brazil",
      type: "solo",
      image: "/exhibitions/2019-confluencias.jpg"
    },
    {
      year: 2016,
      title: "I'm Rosa",
      venue: "Lamb-arts Gallery",
      location: "London, UK",
      type: "group",
      image: "/exhibitions/2016-london.jpg"
    },
    {
      year: 2014,
      title: "Equações",
      venue: "Centro Cultural São Paulo",
      location: "São Paulo, Brazil",
      type: "solo",
      image: "/exhibitions/2014-equacoes.jpg"
    }
  ]
  
  return (
    <section id={id} ref={ref} className="py-24 px-8 bg-gray-50 relative overflow-hidden">
      {/* Parallax background element */}
      <div 
        ref={parallaxRef}
        className="absolute inset-0 opacity-5 bg-gradient-to-br from-blue-100 to-green-100"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10"
      >
        <h2 className="text-4xl font-light text-center mb-16 text-gray-900">
          Exhibitions & Projects
          <span className="block text-2xl text-gray-600 mt-2">
            Exposições & Projetos
          </span>
        </h2>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exhibitions.map((exhibition, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: "easeOut" 
                }}
              >
                <ExhibitionCard exhibition={exhibition} />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

const ExhibitionCard = ({ exhibition }) => {
  return (
    <motion.div
      className={`group cursor-pointer bg-white rounded-lg overflow-hidden shadow-sm 
                 hover:shadow-xl transition-all duration-300 ${
        exhibition.featured ? 'md:col-span-2 lg:col-span-1' : ''
      }`}
      whileHover={{ y: -5 }}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <Image
          src={exhibition.image}
          alt={exhibition.title}
          width={600}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-light text-gray-900">{exhibition.year}</span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            exhibition.type === 'solo' ? 'bg-blue-100 text-blue-800' :
            exhibition.type === 'residency' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {exhibition.type}
          </span>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
          {exhibition.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-1">{exhibition.venue}</p>
        <p className="text-xs text-gray-500">{exhibition.location}</p>
      </div>
    </motion.div>
  )
}
```

### Featured Series with Parallax
```typescript
const FeaturedSeries = ({ id }) => {
  const [ref, isInView] = useScrollAnimation(0.3)
  
  const featuredSeries = [
    {
      id: "azul-no-negro",
      title: "Azul no Negro",
      titleEn: "Blue in Black",
      year: 2015,
      description: "Expedição ao Rio Negro, Amazônia",
      descriptionEn: "Rio Negro Expedition, Amazon",
      image: "/series/azul-no-negro-cover.jpg",
      artworkCount: 12
    },
    {
      id: "confluencias",
      title: "Confluências", 
      titleEn: "Confluences",
      year: 2019,
      description: "Encontros de culturas e paisagens",
      descriptionEn: "Cultural and landscape convergences",
      image: "/series/confluencias-cover.jpg",
      artworkCount: 18
    },
    {
      id: "fragmentos-do-real",
      title: "Fragmentos do Real",
      titleEn: "Fragments of Reality", 
      year: 2022,
      description: "Residência artística em Brooklyn",
      descriptionEn: "Artist residency in Brooklyn",
      image: "/series/fragmentos-cover.jpg",
      artworkCount: 15
    }
  ]
  
  return (
    <section id={id} ref={ref} className="py-24 px-8 relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1 }}
      >
        <h2 className="text-4xl font-light text-center mb-16 text-gray-900">
          Featured Series
          <span className="block text-2xl text-gray-600 mt-2">
            Séries em Destaque
          </span>
        </h2>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {featuredSeries.map((series, index) => (
              <motion.div
                key={series.id}
                initial={{ opacity: 0, x: -50 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.2,
                  ease: "easeOut" 
                }}
                className="group cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg mb-4">
                  <Image
                    src={series.image}
                    alt={series.titleEn}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent 
                                 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-sm">{series.artworkCount} works</p>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {series.title}
                </h3>
                <p className="text-gray-600 text-sm mb-1">{series.titleEn}</p>
                <p className="text-gray-500 text-sm">{series.year}</p>
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                  {series.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
```

### Artist Statement with Scroll Reveal
```typescript
const ArtistStatement = ({ id }) => {
  const [ref, isInView] = useScrollAnimation(0.4)
  
  return (
    <section id={id} ref={ref} className="py-24 bg-gradient-to-br from-gray-50 to-white relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="max-w-4xl mx-auto px-8 text-center"
      >
        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="text-2xl lg:text-3xl font-light italic text-gray-700 mb-8 leading-relaxed"
        >
          "Color not only fills space, but conducts thought. Each look restarts 
          the image, creating new scenes in the territory between abstraction and representation."
        </motion.blockquote>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="text-lg text-gray-600 mb-6">
            Four decades exploring the confluence of European tradition and Brazilian landscape exuberance.
          </p>
          <Button 
            variant="outline" 
            className="hover:bg-gray-900 hover:text-white transition-colors duration-300"
          >
            Read Full Artist Statement
          </Button>
        </motion.div>
      </motion.div>
    </section>
  )
}
```

### Current Availability with Live Updates
```typescript
const CurrentAvailability = ({ id }) => {
  const [ref, isInView] = useScrollAnimation(0.3)
  const [availableWorks, setAvailableWorks] = useState([])
  const [stats, setStats] = useState({ total: 0, available: 0, recentReviews: [] })
  
  useEffect(() => {
    const fetchAvailability = async () => {
      const { data: works } = await supabase
        .from('artworks')
        .select('*')
        .eq('for_sale', true)
        .eq('is_available', true)
        .limit(4)
      
      const { count } = await supabase
        .from('artworks')
        .select('*', { count: 'exact', head: true })
        .eq('for_sale', true)
      
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('verified', true)
        .order('published_date', { ascending: false })
        .limit(2)
      
      setAvailableWorks(works || [])
      setStats({ total: works?.length || 0, available: count || 0, recentReviews: reviews || [] })
    }
    
    fetchAvailability()
  }, [])
  
  return (
    <section id={id} ref={ref} className="py-24 px-8 bg-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto"
      >
        <h2 className="text-4xl font-light text-center mb-16 text-gray-900">
          Available Now
          <span className="block text-2xl text-gray-600 mt-2">
            Disponível Agora
          </span>
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Available Works */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-2xl font-medium mb-6 text-gray-900">
              Works for Acquisition
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {availableWorks.map((work, index) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="group cursor-pointer"
                >
                  <div className="aspect-square overflow-hidden rounded mb-2">
                    <Image
                      src={work.images[0]?.thumbnail}
                      alt={work.title_en}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{work.title_en}</p>
                  <p className="text-xs text-gray-500">{work.year}</p>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {stats.available} artworks currently available for acquisition
              </p>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                View All Available Works
              </Button>
            </div>
          </motion.div>
          
          {/* Latest Reviews */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h3 className="text-2xl font-medium mb-6 text-gray-900">
              Latest Reviews
            </h3>
            
            <div className="space-y-6">
              {stats.recentReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="border-l-4 border-gray-200 pl-4"
                >
                  <h4 className="font-medium text-gray-900 text-sm mb-2">
                    {review.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-3">
                    {review.excerpt}
                  </p>
                  <p className="text-xs text-gray-500">
                    {review.source} • {new Date(review.published_date).getFullYear()}
                  </p>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-6">
              <Button variant="outline">
                View All Press Coverage
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
```

### Studio Life Instagram Feed
```typescript
const StudioLife = ({ id }) => {
  const [ref, isInView] = useScrollAnimation(0.2)
  const [instagramPosts, setInstagramPosts] = useState([])
  
  // Mock Instagram data - replace with actual Instagram API
  const mockPosts = [
    { id: 1, image: "/studio/post1.jpg", caption: "Working on new series..." },
    { id: 2, image: "/studio/post2.jpg", caption: "Colors mixing..." },
    { id: 3, image: "/studio/post3.jpg", caption: "Atlantic Forest inspiration..." },
    { id: 4, image: "/studio/post4.jpg", caption: "Studio view today..." },
    { id: 5, image: "/studio/post5.jpg", caption: "New canvas preparation..." },
    { id: 6, image: "/studio/post6.jpg", caption: "Detail work..." }
  ]
  
  return (
    <section id={id} ref={ref} className="py-24 px-8 bg-gray-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-4xl font-light text-center mb-16 text-gray-900">
          Studio Life
          <span className="block text-2xl text-gray-600 mt-2">
            Vida no Ateliê
          </span>
        </h2>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {mockPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: "easeOut" 
                }}
                className="group cursor-pointer aspect-square overflow-hidden rounded"
                whileHover={{ scale: 1.05 }}
              >
                <Image
                  src={post.image}
                  alt={post.caption}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
                />
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mt-12"
          >
            <a 
              href="https://instagram.com/maibrittwolthers" 
              target="_blank"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="text-lg">@maibrittwolthers</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
```

### **Recommended Additional Main Page Sections:**

#### 1. **Artist Statement Snippet**
```typescript
const ArtistStatement = () => (
  <section className="py-16 bg-gray-50">
    <div className="max-w-4xl mx-auto px-8 text-center">
      <blockquote className="text-xl font-light italic text-gray-700 mb-6">
        "Color not only fills space, but conducts thought. Each look restarts 
        the image, creating new scenes..."
      </blockquote>
      <p className="text-sm text-gray-500">
        Read full artist statement
      </p>
    </div>
  </section>
)
```

#### 2. **Featured Series Preview**
```typescript
const FeaturedSeries = () => (
  <section className="py-16">
    <h2 className="text-3xl font-light text-center mb-12">
      Featured Series / Séries em Destaque
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8">
      {/* "Azul no Negro" (Amazon), "Confluências", "Fragmentos do Real" */}
      <SeriesPreviewCard series="azul-no-negro" />
      <SeriesPreviewCard series="confluencias" />
      <SeriesPreviewCard series="fragmentos-do-real" />
    </div>
  </section>
)
```

#### 3. **Current Availability/News**
```typescript
const CurrentNews = () => (
  <section className="py-12 bg-white border-t border-gray-100">
    <div className="max-w-6xl mx-auto px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-medium mb-4">Available Works</h3>
          <p className="text-gray-600 text-sm">
            {availableCount} artworks currently available for acquisition
          </p>
          <Button variant="outline" className="mt-4">
            View Available Works
          </Button>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Latest Reviews</h3>
          <ReviewSnippet />
        </div>
      </div>
    </div>
  </section>
)
```

#### 4. **Instagram Feed Integration**
```typescript
const InstagramFeed = () => (
  <section className="py-16">
    <h2 className="text-3xl font-light text-center mb-12">
      Studio Life / Vida no Ateliê
    </h2>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 px-8">
      {/* Latest 12 Instagram posts */}
      {instagramPosts.map((post, index) => (
        <InstagramPost key={index} post={post} />
      ))}
    </div>
    
    <div className="text-center mt-8">
      <a 
        href="https://instagram.com/maibrittwolthers" 
        target="_blank"
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        @maibrittwolthers
      </a>
    </div>
  </section>
)
```

### User Experience Flow

#### Public Visitor Journey
1. **Landing Page**: Rotating hero carousel with latest works
2. **Exhibitions Timeline**: Past projects and upcoming shows
3. **Featured Series**: Curated collections preview
4. **Portfolio Browse**: Full artwork catalog with filters
5. **Artwork Detail**: High-res images, purchase options
6. **Purchase Process**: Inquiry → Quote → Secure payment

#### Artist Admin Journey
1. **Login**: Secure authentication
2. **Dashboard**: Upload status, sales metrics, recent activity
3. **Upload**: Drag & drop new artworks (auto-feeds hero carousel)
4. **Organize**: Reorder portfolio, manage series
5. **Sales**: Toggle availability, set prices
6. **Content**: Manage exhibitions, approve reviews

## Implementation Task Order

### **Task 1: Foundation Setup**
- **1.1** Initialize Next.js project with TypeScript
- **1.2** Set up Supabase project and database schema
- **1.3** Configure authentication system
- **1.4** Install and configure shadcn/ui components
- **1.5** Set up Tailwind CSS and design tokens

### **Task 2: Core Data Models**
- **2.1** Create artwork CRUD operations
- **2.2** Implement image upload to Supabase Storage
- **2.3** Set up automatic image optimization (WebP conversion)
- **2.4** Create art series/collections management
- **2.5** Build exhibitions timeline data structure

### **Task 3: Main Page Development**
- **3.1** Build rotating hero carousel component
- **3.2** Create exhibitions timeline section
- **3.3** Develop featured series preview grid
- **3.4** Implement artist statement and news sections
- **3.5** Add Instagram feed integration (optional)

### **Task 4: Portfolio Management**
- **4.1** Create responsive artwork grid layout
- **4.2** Implement drag & drop reordering system
- **4.3** Build filtering and search functionality
- **4.4** Add bulk operations for artwork management
- **4.5** Create artwork detail pages with high-res viewing

### **Task 5: Artist Dashboard**
- **5.1** Build admin authentication and routing
- **5.2** Create dashboard with metrics and quick actions
- **5.3** Implement artwork upload interface
- **5.4** Add sale status toggle and pricing tools
- **5.5** Build content management for exhibitions/bio

### **Task 6: E-commerce Integration**
- **6.1** Set up Stripe payment processing
- **6.2** Create inquiry/contact forms
- **6.3** Build purchase flow with shipping calculator
- **6.4** Implement order management system
- **6.5** Add email notifications for sales/inquiries

### **Task 7: Content & Reviews**
- **7.1** Implement web scraping for reviews
- **7.2** Create review management interface
- **7.3** Add sentiment analysis for scraped content
- **7.4** Build bilingual content management
- **7.5** Implement SEO optimization

### **Task 8: Polish & Performance**
- **8.1** Optimize image loading and CDN setup
- **8.2** Add analytics and performance monitoring
- **8.3** Implement error handling and logging
- **8.4** Mobile responsiveness testing
- **8.5** Final UI/UX refinements and testing

## Success Metrics
- **User Engagement**: Time on site, page views per session
- **Conversion**: Inquiry-to-sale rate, average order value
- **Artist Efficiency**: Time to upload/organize new works
- **International Reach**: Geographic distribution of visitors
- **Mobile Performance**: Mobile conversion rates

## Next Steps
1. Set up Supabase project and database schema
2. Initialize Next.js project with shadcn/ui
3. Implement core authentication and basic CRUD
4. Create responsive artwork grid layout
5. Add drag & drop functionality for artist dashboard

This platform will serve as Mai-Britt Wolthers' digital presence, reflecting her sophisticated artistic practice while providing practical tools for portfolio management and direct sales to collectors worldwide.