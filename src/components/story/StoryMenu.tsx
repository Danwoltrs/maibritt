'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SettingsService } from '@/services'

type Item = { name: string; href: string }

const SITE_LINKS: Item[] = [
  { name: 'Portfolio', href: '/#hero' },
  { name: 'Exhibitions', href: '/#exhibitions' },
  { name: 'About', href: '/#statement' },
  { name: 'Available Works', href: '/#availability' },
  { name: 'Contact', href: '/#blog' },
]

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  )
}

/**
 * The way out of the story. Mirrors the sound toggle in the opposite corner.
 * When she is signed in (and not previewing) it also offers the editor.
 */
export function StoryMenu({ onDark, preview = false, canEdit = false }: { onDark: boolean; preview?: boolean; canEdit?: boolean }) {
  const [open, setOpen] = useState(false)
  const [links, setLinks] = useState<Item[]>(SITE_LINKS)

  useEffect(() => {
    if (!open) return
    // Read the toggle only when she opens the menu, so visitors who never open
    // it pay nothing for it.
    SettingsService.getHomepageSections()
      .then((s) => setLinks(s.showAvailableWorks ? SITE_LINKS : SITE_LINKS.filter((l) => l.name !== 'Available Works')))
      .catch(() => {})
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close the menu' : 'Menu'}
        aria-expanded={open}
        className={`fixed z-[60] flex items-center gap-3 left-5 md:left-8 ${preview ? 'top-[96px] md:top-[100px]' : 'top-6 md:top-7'}`}
      >
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm"
          style={{
            border: `1px solid ${open || !onDark ? 'var(--line)' : 'rgba(251,249,245,0.45)'}`,
            background: open ? 'var(--white)' : onDark ? 'rgba(20,14,10,0.35)' : 'var(--white)',
            color: open ? 'var(--ink)' : onDark ? 'var(--white)' : 'var(--ink)',
          }}
        >
          <MenuIcon open={open} />
        </span>
        <span className="hidden md:inline text-[13px] tracking-[0.14em] uppercase" style={{ color: open ? 'var(--ink-2)' : onDark ? 'rgba(251,249,245,0.78)' : 'var(--ink-2)' }}>
          {open ? 'Close' : 'Menu'}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center px-8" style={{ background: 'var(--paper)' }} role="dialog" aria-label="Menu">
          <nav className="flex w-full max-w-[520px] flex-col gap-5">
            <span className="text-[13px] uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
              Back to the site
            </span>
            {links.map((l) => (
              <Link
                key={l.name}
                href={l.href}
                onClick={() => setOpen(false)}
                className="story-serif text-[34px] leading-tight md:text-[44px]"
                style={{ color: 'var(--ink)' }}
              >
                {l.name}
              </Link>
            ))}
            {canEdit && (
              <>
                <span className="mt-6 h-px w-full" style={{ background: 'var(--line)' }} />
                <span className="text-[13px] uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
                  Your story
                </span>
                <Link href="/story/edit" onClick={() => setOpen(false)} className="text-[22px]" style={{ color: 'var(--ink)' }}>
                  Edit my story
                </Link>
                <Link href="/story/edit?new=chapter" onClick={() => setOpen(false)} className="text-[22px]" style={{ color: 'var(--ink)' }}>
                  Add a chapter
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
