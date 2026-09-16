'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/Header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  if (pathname === '/story' || pathname.startsWith('/story/')) return null
  return <Header />
}
