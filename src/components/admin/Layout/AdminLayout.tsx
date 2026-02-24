'use client'

import React, { useState } from 'react'
import { AdminSidebar } from './AdminSidebar'
import AuthGuard from '@/components/auth/AuthGuard'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Create a blurred fallback component for unauthenticated users
  const BlurredDashboardFallback = () => (
    <div className="min-h-[calc(100vh-5rem)] bg-gray-50 relative">
      {/* Blurred dashboard background */}
      <div className="absolute inset-0 blur-sm pointer-events-none flex">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <AdminSidebar />
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
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
      <div className="min-h-[calc(100vh-5rem)] bg-gray-50 flex">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
          <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
            <AdminSidebar />
          </div>
        </div>

        {/* Mobile sidebar toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="fixed bottom-4 left-4 z-50 lg:hidden bg-white shadow-md"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed top-20 bottom-0 left-0 z-50 w-64 bg-white lg:hidden">
              <AdminSidebar />
            </div>
          </>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}

export default AdminLayout