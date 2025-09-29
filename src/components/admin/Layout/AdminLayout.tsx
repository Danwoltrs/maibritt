'use client'

import React, { useState } from 'react'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64">
          <AdminSidebar />
        </div>
      </div>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white lg:hidden">
            <AdminSidebar />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          onMenuClick={handleMenuClick}
          title={title}
          subtitle={subtitle}
        />
        
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout