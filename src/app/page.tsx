'use client'

import { useActiveSection } from '@/hooks/useScrollAnimation'
import HeroCarousel from '@/components/carousel/HeroCarousel'
import ExhibitionsTimeline from '@/components/exhibitions/ExhibitionsTimeline'
import FeaturedSeries from '@/components/series/FeaturedSeries'
import ArtistStatement from '@/components/sections/ArtistStatement'
import CurrentAvailability from '@/components/sections/CurrentAvailability'
import BlogPreview from '@/components/sections/BlogPreview'
import ScrollNavigation from '@/components/navigation/ScrollNavigation'

const sectionIds = [
  'hero',
  'exhibitions',
  'series',
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

      {/* Exhibitions Timeline with Continuous Parallax */}
      <ExhibitionsTimeline id="exhibitions" />

      {/* Featured Series Preview */}
      <FeaturedSeries id="series" />

      {/* Artist Statement */}
      <ArtistStatement id="statement" />

      {/* Current Availability */}
      <CurrentAvailability id="availability" />

      {/* Blog Preview */}
      <BlogPreview id="blog" />
    </div>
  )
}