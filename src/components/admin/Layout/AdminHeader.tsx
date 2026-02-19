'use client'

import React from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminHeaderProps {
  onMenuClick?: () => void
  title?: string
  subtitle?: string
}

export function AdminHeader({ onMenuClick, title, subtitle }: AdminHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 lg:hidden">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
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
    </header>
  )
}

export default AdminHeader