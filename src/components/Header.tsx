'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading } = useAuth()

  const navigationItems = [
    { name: 'Portfolio', href: '/#hero', namePt: 'Portfólio' },
    { name: 'Series', href: '/#series', namePt: 'Séries' },
    { name: 'Exhibitions', href: '/#exhibitions', namePt: 'Exposições' },
    { name: 'About', href: '/#statement', namePt: 'Sobre' },
    { name: 'Available Works', href: '/#availability', namePt: 'Obras Disponíveis' },
    { name: 'Contact', href: '/#blog', namePt: 'Contato' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="Mai-Britt Wolthers"
              width={200}
              height={40}
              className="h-8 md:h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Authenticated User Indicator */}
            {!loading && user && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors duration-200 group"
                  title="Go to Artist Portal"
                >
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                    <User className="h-3 w-3 text-gray-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                    {user.user_metadata?.name || user.email?.split('@')[0] || 'Artist'}
                  </span>
                </Link>
                <span className="text-gray-300">|</span>
              </>
            )}
            
            {/* Language Toggle */}
            <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              EN
            </button>
            <span className="text-gray-300">|</span>
            <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              PT
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? (
              <X className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Authenticated User */}
              {!loading && user && (
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.user_metadata?.name || user.email?.split('@')[0] || 'Artist'}
                    </div>
                    <div className="text-xs text-gray-500">Artist Portal</div>
                  </div>
                </Link>
              )}

              {/* Mobile Language Toggle */}
              <div className="flex items-center space-x-4 px-3 py-2">
                <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  EN
                </button>
                <span className="text-gray-300">|</span>
                <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  PT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}