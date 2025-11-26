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
  LogOut,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Quote
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
    description: 'Manage portfolio',
    expandable: true,
    subItems: [
      {
        name: 'All Artworks',
        href: '/artworks',
        description: 'Browse all works'
      },
      {
        name: 'Upload New',
        href: '/artworks/new',
        description: 'Add new artwork'
      },
      {
        name: 'Series & Collections',
        href: '/artworks/series',
        description: 'Manage series'
      },
      {
        name: 'Locations',
        href: '/artworks/locations',
        description: 'Track locations'
      }
    ]
  },
  {
    name: 'Galleries',
    href: '/galleries',
    icon: Building,
    description: 'Partner galleries'
  },
  {
    name: 'Quotes & Press',
    href: '/quotes',
    icon: Quote,
    description: 'Quotes & reviews'
  },
  {
    name: 'Sales',
    href: '/sales',
    icon: TrendingUp,
    description: 'Sales & revenue'
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
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Site settings'
  }
]

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['Artworks'])

  const handleSignOut = async () => {
    await signOut()
  }

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
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
          const isExpanded = expandedItems.includes(item.name)
          const isActive = pathname === item.href || (item.subItems?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/')))
          const hasSubItems = item.expandable && item.subItems

          return (
            <div key={item.name}>
              {/* Main item */}
              <div
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
                onClick={() => {
                  if (hasSubItems) {
                    toggleExpanded(item.name)
                  } else {
                    // Navigate for non-expandable items
                    window.location.href = item.href
                  }
                }}
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
                {hasSubItems && (
                  <div className={cn(
                    'transition-transform duration-200',
                    isExpanded ? 'rotate-90' : ''
                  )}>
                    <ChevronRight className={cn(
                      'h-4 w-4',
                      isActive ? 'text-white' : 'text-gray-400'
                    )} />
                  </div>
                )}
              </div>

              {/* Sub items */}
              {hasSubItems && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.subItems.map((subItem) => {
                    const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/')
                    
                    return (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                          isSubActive
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <div className="w-2 h-2 bg-current rounded-full mr-3 opacity-40" />
                        <div className="flex-1">
                          <div className="text-sm">{subItem.name}</div>
                          <div className="text-xs text-gray-500">{subItem.description}</div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
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