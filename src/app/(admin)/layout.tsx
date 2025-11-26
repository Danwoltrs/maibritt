'use client'

import React, { useState } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import AdminSidebar from '@/components/admin/Layout/AdminSidebar'
import AdminHeader from '@/components/admin/Layout/AdminHeader'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AuthGuard redirectTo="/login">
      <div className="min-h-screen bg-gray-50">
        {/* Fixed Sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
          <AdminSidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white z-50 lg:hidden">
              <AdminSidebar />
            </div>
          </>
        )}

        {/* Main content - offset by sidebar width on desktop */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}