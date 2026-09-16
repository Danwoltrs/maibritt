'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { GalleryBlock as GalleryBlockType, CaptionedImage } from '@/lib/story/types'
import { useIsPhone } from '../useIsPhone'

const heights = [300, 360, 470, 380, 320]

function Caption({ text, onDark }: { text: string; onDark?: boolean }) {
  if (!text) return null
  return (
    <span className="story-serif text-[18px] italic md:text-[19px]" style={{ color: onDark ? 'var(--white)' : 'var(--ink-2)' }}>
      {text}
    </span>
  )
}

function StackedGallery({ images }: { images: CaptionedImage[] }) {
  return (
    <section className="flex w-full flex-col gap-10 px-6 py-24 md:px-24" style={{ background: 'var(--paper)' }}>
      {images.map((img, i) => (
        <motion.figure
          key={i}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1 }}
          className="m-0 flex flex-col gap-3"
          style={{ marginLeft: i % 2 ? 36 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.caption} className="story-photo block w-full max-w-[900px] object-cover" />
          <Caption text={img.caption} />
        </motion.figure>
      ))}
    </section>
  )
}

function SidewaysGallery({ images }: { images: CaptionedImage[] }) {
  const ref = useRef<HTMLElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const [maxShift, setMaxShift] = useState(0)
  const [index, setIndex] = useState(1)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const measure = () => {
    const row = rowRef.current
    if (!row) return
    setMaxShift(Math.max(0, row.scrollWidth - window.innerWidth + 96))
  }

  useEffect(() => {
    const row = rowRef.current
    measure()
    window.addEventListener('resize', measure)

    let observer: ResizeObserver | undefined
    if (row && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure)
      observer.observe(row)
    }

    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length])

  const x = useTransform(scrollYProgress, [0.06, 0.94], [0, -maxShift])
  const lineWidth = useTransform(scrollYProgress, [0.06, 0.94], ['0%', '100%'])
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const p = Math.max(0, Math.min(1, (v - 0.06) / 0.88))
    setIndex(Math.min(images.length, 1 + Math.floor(p * images.length)))
  })

  return (
    <section ref={ref} className="relative w-full" style={{ height: `${Math.max(2, images.length) * 100}vh`, background: 'var(--paper)' }}>
      <div className="sticky top-0 flex h-[100svh] w-full flex-col justify-center overflow-hidden">
        <motion.div ref={rowRef} className="flex items-start gap-10 pl-24" style={{ x }}>
          {images.map((img, i) => (
            <figure key={i} className="m-0 flex shrink-0 flex-col gap-3" style={{ marginTop: (i * 37) % 60 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption}
                onLoad={measure}
                className="story-photo block object-cover"
                style={{ height: heights[i % heights.length], width: 'auto', maxWidth: '60vw' }}
              />
              <Caption text={img.caption} />
            </figure>
          ))}
        </motion.div>
        <div className="absolute bottom-16 left-24 right-24 flex items-center gap-5">
          <span className="story-tabular whitespace-nowrap text-[15px]" style={{ color: 'var(--ink-2)' }}>
            {index} of {images.length}
          </span>
          <div className="relative h-px flex-grow" style={{ background: 'var(--line)' }}>
            <motion.div className="absolute left-0 top-0 h-px" style={{ width: lineWidth, background: 'var(--accent)' }} />
          </div>
        </div>
      </div>
    </section>
  )
}

function PageTurnGallery({ images }: { images: CaptionedImage[] }) {
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.max(0, Math.min(images.length - 1, Math.floor(v * images.length))))
  })

  return (
    <section ref={ref} className="relative w-full" style={{ height: `${images.length * 100}vh`, background: '#1e1712' }}>
      <div className="story-grain story-vignette sticky top-0 h-[100svh] w-full overflow-hidden">
        {images.map((img, i) => {
          const state = i < active ? 'behind' : i === active ? 'front' : 'next'
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.url}
              alt={img.caption}
              className="story-photo absolute left-0 top-0 h-full w-full object-cover transition-all duration-700 ease-out"
              style={{
                opacity: state === 'next' ? 0 : state === 'behind' ? 0.35 : 1,
                transform: state === 'next' ? 'translateY(8%) scale(1.02)' : state === 'behind' ? 'scale(1.04)' : 'none',
                zIndex: state === 'front' ? 2 : 1,
              }}
            />
          )
        })}
        <div className="absolute inset-0 z-[3]" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.35) 0%, rgba(20,14,10,0) 30%, rgba(20,14,10,0.75) 100%)' }} />
        <div className="absolute bottom-11 left-6 right-6 z-[4] flex flex-col gap-4">
          <p className="story-serif m-0 text-[26px] italic leading-tight" style={{ color: 'var(--white)' }}>
            {images[active]?.caption}
          </p>
          <div className="flex items-center justify-between">
            <span className="story-tabular text-[14px]" style={{ color: 'rgba(251,249,245,0.72)' }}>
              {active + 1} of {images.length}
            </span>
            <div className="flex items-center gap-2">
              {images.map((_, i) => (
                <span key={i} className="rounded-full" style={{ width: i === active ? 8 : 6, height: i === active ? 8 : 6, background: i === active ? 'var(--white)' : 'rgba(251,249,245,0.45)' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function GalleryBlock({ block }: { block: GalleryBlockType }) {
  const reduce = useReducedMotion()
  const isPhone = useIsPhone()
  if (block.images.length === 0) return null
  if (reduce) return <StackedGallery images={block.images} />
  return isPhone ? <PageTurnGallery images={block.images} /> : <SidewaysGallery images={block.images} />
}
