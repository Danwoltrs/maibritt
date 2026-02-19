'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
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
  Quote,
  Calendar,
  Search,
  Upload,
  DollarSign,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { QuickActionDialogs, type QuickAction } from '@/components/admin/QuickActionDialogs'

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
    name: 'Exhibitions',
    href: '/exhibitions/manage',
    icon: Calendar,
    description: 'Manage exhibitions'
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
  const router = useRouter()
  const { signOut, user } = useAuth()
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['Artworks'])
  const [quickAction, setQuickAction] = useState<QuickAction>(null)

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
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100">
        <Link href="/dashboard">
          <NextImage
            src="/logo.svg"
            alt="Mai-Britt Wolthers"
            width={160}
            height={32}
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 pt-2 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isExpanded = expandedItems.includes(item.name)
          const isActive = pathname === item.href || (item.subItems?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/')))
          const hasSubItems = item.expandable && item.subItems

          const mainItemContent = (
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
                    router.push(item.href)
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
          )

          return (
            <div key={item.name}>
              {item.name === 'Dashboard' ? (
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    {mainItemContent}
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-56">
                    <ContextMenuItem onClick={() => setQuickAction('upload-artwork')}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload New Artwork
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setQuickAction('add-series')}>
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Add Series
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setQuickAction('record-sale')}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Record Sale
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setQuickAction('view-galleries')}>
                      <Building className="mr-2 h-4 w-4" />
                      View Active Galleries
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setQuickAction('write-journal')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Write Journal Entry
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setQuickAction('upcoming-exhibition')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Upcoming Exhibition
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                      Dani elsker dig
                    </div>
                  </ContextMenuContent>
                </ContextMenu>
              ) : (
                mainItemContent
              )}

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
      <div className="p-4 border-t border-gray-200 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search artworks..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {/* User & Sign Out */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate">
            {user?.email || 'Artist'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-gray-500 hover:text-gray-700 p-1 h-auto"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <QuickActionDialogs
        activeAction={quickAction}
        onClose={() => setQuickAction(null)}
      />
    </div>
  )
}

export default AdminSidebar