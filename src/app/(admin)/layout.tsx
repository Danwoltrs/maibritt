'use client'

import React, { useState } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import AdminSidebar from '@/components/admin/Layout/AdminSidebar'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AuthGuard redirectTo="/login">
      <div className="min-h-[calc(100vh-5rem)] bg-gray-50 flex">
        {/* Fixed Sidebar for desktop - positioned below the sticky header */}
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

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed top-20 bottom-0 left-0 flex flex-col w-64 bg-white z-50 lg:hidden">
              <AdminSidebar />
            </div>
          </>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <main>
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}