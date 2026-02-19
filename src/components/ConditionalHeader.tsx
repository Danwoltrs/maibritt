'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/Header'

const ADMIN_PREFIXES = [
  '/artworks',
  '/galleries',
  '/journal',
  '/quotes',
  '/sales',
  '/settings',
  '/exhibitions/manage',
  '/analytics',
  '/blog',
  '/dashboard',
]

export default function ConditionalHeader() {
  const pathname = usePathname()

  // Hide public header on admin routes (they have their own AdminHeader)
  const isAdminRoute =
    ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    (pathname.startsWith('/series/') && pathname !== '/series')

  if (isAdminRoute) return null

  return <Header />
}
