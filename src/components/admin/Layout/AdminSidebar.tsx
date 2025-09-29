'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Image,
  Building,
  TrendingUp,
  BookOpen,
  Settings,
  MapPin,
  BarChart3,
  PenTool,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview & metrics'
  },
  {
    name: 'Artworks',
    href: '/artworks',
    icon: Image,
    description: 'Manage portfolio'
  },
  {
    name: 'Galleries',
    href: '/galleries',
    icon: Building,
    description: 'Partner galleries'
  },
  {
    name: 'Sales',
    href: '/sales',
    icon: TrendingUp,
    description: 'Sales & revenue'
  },
  {
    name: 'Locations',
    href: '/artworks/locations',
    icon: MapPin,
    description: 'Track artwork locations'
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Performance insights'
  },
  {
    name: 'Journal',
    href: '/journal',
    icon: PenTool,
    description: 'Private journal'
  },
  {
    name: 'Blog',
    href: '/blog',
    icon: BookOpen,
    description: 'Public blog posts'
  }
]

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()
  const { signOut, user } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="block">
          <h1 className="text-xl font-semibold text-gray-900">Artist Portal</h1>
          <p className="text-sm text-gray-600 mt-1">Mai-Britt Wolthers</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className={cn(
                'mr-3 h-5 w-5',
                isActive ? 'text-white' : 'text-gray-400'
              )} />
              <div className="flex-1">
                <div className="text-sm font-medium">{item.name}</div>
                <div className={cn(
                  'text-xs',
                  isActive ? 'text-gray-300' : 'text-gray-500'
                )}>
                  {item.description}
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.email || 'Artist'}
            </p>
            <p className="text-xs text-gray-500">Signed in</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export default AdminSidebar