'use client'

import React from 'react'
import { Menu, Bell, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AdminHeaderProps {
  onMenuClick?: () => void
  title?: string
  subtitle?: string
}

export function AdminHeader({ onMenuClick, title, subtitle }: AdminHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 shrink-0">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            {title && (
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Quick Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Create New</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/artworks/new">Upload Artwork</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/galleries/new">Add Gallery</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/sales/new">Record Sale</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/journal/new">Write Journal Entry</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader