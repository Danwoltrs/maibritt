'use client'

import { useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

/**
 * Hook for scroll-triggered animations with Framer Motion
 */
export const useScrollAnimation = (amount = 0.1, once = true) => {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    amount,
    once,
    margin: "0px 0px" // Removed negative margin to trigger animations more reliably
  })

  return [ref, isInView] as const
}

/**
 * Hook for parallax scrolling effects
 */
export const useParallax = (offset = 50, smoothness = 0.1) => {
  const [elementTop, setElementTop] = useState(0)
  const [clientHeight, setClientHeight] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const updatePosition = () => {
      setElementTop(element.offsetTop)
      setClientHeight(window.innerHeight)
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)

    return () => window.removeEventListener('resize', updatePosition)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return

      const scrolled = window.scrollY
      const rect = ref.current.getBoundingClientRect()
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0

      if (isVisible) {
        const rate = scrolled * -offset / 1000
        setTranslateY(rate)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [offset])

  return [ref, translateY] as const
}

/**
 * Hook for continuous parallax effects (for timeline)
 */
export const useContinuousParallax = (speed = 0.5) => {
  const [offset, setOffset] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const scrolled = window.scrollY
      const elementTop = rect.top + scrolled
      const elementHeight = rect.height
      const windowHeight = window.innerHeight

      // Calculate if element is in viewport
      const elementBottom = elementTop + elementHeight
      const viewportTop = scrolled
      const viewportBottom = scrolled + windowHeight

      if (elementBottom > viewportTop && elementTop < viewportBottom) {
        // Element is visible, calculate parallax offset
        const elementCenter = elementTop + elementHeight / 2
        const viewportCenter = scrolled + windowHeight / 2
        const distance = elementCenter - viewportCenter
        const parallaxOffset = distance * speed

        setOffset(parallaxOffset)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // Initial calculation

    return () => window.removeEventListener('scroll', onScroll)
  }, [speed])

  return [ref, offset] as const
}

/**
 * Hook for scroll progress (useful for timeline animations)
 */
export const useScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const scrolled = window.scrollY
      const elementTop = rect.top + scrolled
      const elementHeight = rect.height
      const windowHeight = window.innerHeight

      // Calculate progress through the element
      const scrollStart = elementTop - windowHeight
      const scrollEnd = elementTop + elementHeight
      const scrollDistance = scrollEnd - scrollStart

      if (scrolled >= scrollStart && scrolled <= scrollEnd) {
        const progress = (scrolled - scrollStart) / scrollDistance
        setScrollProgress(Math.max(0, Math.min(1, progress)))
      } else if (scrolled < scrollStart) {
        setScrollProgress(0)
      } else {
        setScrollProgress(1)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // Initial calculation

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return [ref, scrollProgress] as const
}

/**
 * Hook for smooth scroll to element
 */
export const useSmoothScroll = () => {
  const scrollToElement = (elementId: string, offset = 0) => {
    const element = document.getElementById(elementId)
    if (!element) return

    const elementPosition = element.offsetTop - offset
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    })
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return { scrollToElement, scrollToTop }
}

/**
 * Hook for tracking which section is currently in view
 */
export const useActiveSection = (sectionIds: string[]) => {
  const [activeSection, setActiveSection] = useState<string>('')

  useEffect(() => {
    const handleScroll = () => {
      const viewportCenter = window.scrollY + window.innerHeight / 2
      let closestSection = ''
      let closestDistance = Infinity

      sectionIds.forEach((id) => {
        const element = document.getElementById(id)
        if (!element) return

        const rect = element.getBoundingClientRect()
        const elementTop = rect.top + window.scrollY
        const elementCenter = elementTop + rect.height / 2
        const distance = Math.abs(viewportCenter - elementCenter)

        if (distance < closestDistance) {
          closestDistance = distance
          closestSection = id
        }
      })

      if (closestSection && closestSection !== activeSection) {
        setActiveSection(closestSection)
      }
    }

    // Initial check
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sectionIds, activeSection])

  return activeSection
}