'use client'

import React, { useEffect, useState } from 'react'
import { TrendingUp, Image, Building, DollarSign, Loader2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArtworkService, GalleryService, AiUsageService } from '@/services'

function getDanishGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 10) return 'Godmorgen'
  if (hour >= 10 && hour < 12) return 'God formiddag'
  if (hour >= 12 && hour < 14) return 'God middag'
  if (hour >= 14 && hour < 18) return 'God eftermiddag'
  if (hour >= 18 && hour < 22) return 'God aften'
  return 'God nat'
}

const quickActions = [
  {
    title: 'New Work',
    description: 'Add a new piece to your portfolio',
    href: '/artworks/new',
  },
  {
    title: 'New Gallery',
    description: 'Register a new partner gallery',
    href: '/galleries/new',
  },
  {
    title: 'Sold',
    description: 'Log a recent artwork sale',
    href: '/sales/new',
  },
  {
    title: 'Piece Moved',
    description: 'Move artwork to new location',
    href: '/artworks/locations',
  },
  {
    title: 'New Journal Entry',
    description: 'Document your creative process',
    href: '/journal/new',
  }
]

interface DashboardStats {
  totalArtworks: number
  artworksInGalleries: number
  artworksInStudio: number
  artworksSold: number
  monthlyRevenue: number
  totalGalleries: number
  activeGalleries: number
  journalEntries: number
  aiCallCount: number
  aiCostTotal: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const greeting = getDanishGreeting()

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch lightweight stats instead of full records
        const [artworkStats, galleriesResponse, aiUsageStats] = await Promise.all([
          ArtworkService.getArtworkStats(),
          GalleryService.getAll({}),
          AiUsageService.getUsageStats()
        ])
        const galleries = galleriesResponse.data || []

        const activeGalleries = galleries.filter(gallery =>
          gallery.is_active && gallery.relationship_status === 'active'
        ).length

        setStats({
          ...artworkStats,
          monthlyRevenue: 0, // TODO: Calculate from sales data
          totalGalleries: galleries.length,
          activeGalleries,
          journalEntries: 0, // TODO: Fetch from journal entries
          aiCallCount: aiUsageStats.totalCalls,
          aiCostTotal: aiUsageStats.totalCost
        })
        
        // Set empty recent activity for now
        setRecentActivity([])
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // Set zero stats if error
        setStats({
          totalArtworks: 0,
          artworksInGalleries: 0,
          artworksInStudio: 0,
          artworksSold: 0,
          monthlyRevenue: 0,
          totalGalleries: 0,
          activeGalleries: 0,
          journalEntries: 0,
          aiCallCount: 0,
          aiCostTotal: 0
        })
        setRecentActivity([])
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {greeting}, Mor
          </h1>
          <p className="text-gray-600 mb-4">
            Hoje é {currentDate}.
          </p>
          <div className="flex flex-wrap gap-3">
            {loading ? (
              <div className="flex items-center space-x-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-500">Loading stats...</span>
              </div>
            ) : (
              <>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {stats?.artworksInStudio || 0} artworks in studio
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {stats?.artworksInGalleries || 0} artworks in galleries
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {stats?.monthlyRevenue ? `R$ ${stats.monthlyRevenue.toLocaleString()}` : '-'} this month
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Artworks</CardTitle>
            <Image className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalArtworks || 0}</div>
                <p className="text-xs text-gray-600">
                  Total pieces in collection
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.monthlyRevenue ? `R$ ${stats.monthlyRevenue.toLocaleString()}` : '-'}
                </div>
                <p className="text-xs text-gray-600">
                  Sales tracking coming soon
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Galleries</CardTitle>
            <Building className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeGalleries || 0}</div>
                <p className="text-xs text-gray-600">
                  {stats?.totalGalleries || 0} total partners
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Artworks Sold</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.artworksSold || 0}</div>
                <p className="text-xs text-gray-600">
                  Lifetime sales
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Usage</CardTitle>
            <Sparkles className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.aiCallCount || 0}</div>
                <p className="text-xs text-gray-600">
                  calls ~${(stats?.aiCostTotal || 0).toFixed(4)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to manage your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto px-4 py-3 flex flex-col items-start text-left hover:bg-gray-50 transition-colors"
                  asChild
                >
                  <a href={action.href}>
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{action.description}</div>
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading activity...</span>
                </div>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-600">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">No recent activity</p>
                <p className="text-xs text-gray-500">Activity will appear here as you use the platform</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>
            Monthly revenue and sales performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Revenue chart will be implemented here</p>
              <p className="text-sm text-gray-500">Using Chart.js or Recharts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}