'use client'

import React, { useState } from 'react'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'
import AuthGuard from '@/components/auth/AuthGuard'

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

  // Create a blurred fallback component for unauthenticated users
  const BlurredDashboardFallback = () => (
    <div className="h-screen flex overflow-hidden bg-gray-50 relative">
      {/* Blurred dashboard background */}
      <div className="absolute inset-0 blur-sm pointer-events-none">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="w-64">
            <AdminSidebar />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader 
            onMenuClick={() => {}}
            title={title || "Dashboard"}
            subtitle={subtitle || "Artist Portfolio Management"}
          />
          
          <main className="flex-1 overflow-auto p-6">
            {/* Mock dashboard content */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 h-32"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-lg p-6 h-24"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg p-6 h-64"></div>
                <div className="bg-white rounded-lg p-6 h-64"></div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Authentication overlay */}
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">
              Please sign in to access the artist dashboard
            </p>
          </div>
          
          <div className="space-y-4">
            <a
              href="/login?redirectTo=/dashboard"
              className="block w-full bg-gray-900 text-white text-center py-3 px-4 rounded-md hover:bg-gray-800 transition-colors font-medium"
            >
              Sign In to Dashboard
            </a>
            <a
              href="/"
              className="block w-full bg-gray-100 text-gray-700 text-center py-3 px-4 rounded-md hover:bg-gray-200 transition-colors"
            >
              Return to Gallery
            </a>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <AuthGuard fallback={<BlurredDashboardFallback />}>
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
    </AuthGuard>
  )
}

export default AdminLayout