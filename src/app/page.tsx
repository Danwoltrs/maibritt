'use client'

import { useEffect, useMemo, useState } from 'react'
import { useActiveSection } from '@/hooks/useScrollAnimation'
import HeroCarousel from '@/components/carousel/HeroCarousel'
import RiverMagazineTimeline from '@/components/timeline/RiverMagazineTimeline'
import FeaturedSeries from '@/components/series/FeaturedSeries'
import ArtistStatement from '@/components/sections/ArtistStatement'
import GalleryLocations from '@/components/sections/GalleryLocations'
import BlogPreview from '@/components/sections/BlogPreview'
import ScrollNavigation from '@/components/navigation/ScrollNavigation'
import UpcomingExhibitionPopup from '@/components/exhibitions/UpcomingExhibitionPopup'
import { SettingsService, HomepageSections } from '@/services/settings.service'

export default function Home() {
  const [sections, setSections] = useState<HomepageSections>({
    showJournal: true,
    showAvailableWorks: true,
  })

  useEffect(() => {
    SettingsService.getHomepageSections().then(setSections)
  }, [])

  const sectionIds = useMemo(() => {
    const ids = ['hero', 'series', 'exhibitions', 'statement']
    if (sections.showAvailableWorks) ids.push('availability')
    if (sections.showJournal) ids.push('blog')
    return ids
  }, [sections])

  const activeSection = useActiveSection(sectionIds)

  return (
    <div className="relative">
      <ScrollNavigation
        activeSection={activeSection}
        sections={sectionIds}
      />

      <section id="hero">
        <HeroCarousel />
      </section>

      <FeaturedSeries id="series" />
      <RiverMagazineTimeline id="exhibitions" />
      <ArtistStatement id="statement" />

      {sections.showAvailableWorks && <GalleryLocations id="availability" />}
      {sections.showJournal && <BlogPreview id="blog" />}

      <UpcomingExhibitionPopup delay={3000} />
    </div>
  )
}