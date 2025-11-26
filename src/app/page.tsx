'use client'

import { useActiveSection } from '@/hooks/useScrollAnimation'
import HeroCarousel from '@/components/carousel/HeroCarousel'
import ExhibitionsTimeline from '@/components/exhibitions/ExhibitionsTimeline'
import FeaturedSeries from '@/components/series/FeaturedSeries'
import ArtistStatement from '@/components/sections/ArtistStatement'
import GalleryLocations from '@/components/sections/GalleryLocations'
import BlogPreview from '@/components/sections/BlogPreview'
import ScrollNavigation from '@/components/navigation/ScrollNavigation'

const sectionIds = [
  'hero',
  'series',
  'exhibitions',
  'statement',
  'availability',
  'blog'
]

export default function Home() {
  const activeSection = useActiveSection(sectionIds)

  return (
    <div className="relative">
      {/* Fixed Scroll Navigation */}
      <ScrollNavigation
        activeSection={activeSection}
        sections={sectionIds}
      />

      {/* Hero Section - Rotating Carousel */}
      <section id="hero">
        <HeroCarousel />
      </section>

      {/* Featured Series Preview */}
      <FeaturedSeries id="series" />

      {/* Exhibitions Timeline with Continuous Parallax */}
      <ExhibitionsTimeline id="exhibitions" />

      {/* Artist Statement */}
      <ArtistStatement id="statement" />

      {/* Gallery Locations - Where to Find Work */}
      <GalleryLocations id="availability" />

      {/* Blog Preview */}
      <BlogPreview id="blog" />
    </div>
  )
}