'use client'

import React, { useEffect, useState } from 'react'
import { TrendingUp, Image, Building, DollarSign, MapPin, PenTool, Loader2, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArtworkService, GalleryService } from '@/services'

const quickActions = [
  {
    title: 'Upload New Artwork',
    description: 'Add a new piece to your portfolio',
    icon: Image,
    href: '/artworks/new',
    color: 'bg-blue-500'
  },
  {
    title: 'Add Gallery',
    description: 'Register a new partner gallery',
    icon: Building,
    href: '/galleries/new',
    color: 'bg-green-500'
  },
  {
    title: 'Record Sale',
    description: 'Log a recent artwork sale',
    icon: DollarSign,
    href: '/sales/new',
    color: 'bg-purple-500'
  },
  {
    title: 'Update Location',
    description: 'Move artwork to new location',
    icon: MapPin,
    href: '/artworks/locations',
    color: 'bg-orange-500'
  },
  {
    title: 'Write Journal Entry',
    description: 'Document your creative process',
    icon: PenTool,
    href: '/journal/new',
    color: 'bg-pink-500'
  },
  {
    title: 'Manage Exhibitions',
    description: 'Add or update exhibition information',
    icon: Calendar,
    href: '/exhibitions',
    color: 'bg-indigo-500'
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
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch artworks data
        const artworksResponse = await ArtworkService.getArtworks({}, { page: 1, limit: 1000 })
        const artworks = artworksResponse.artworks || []
        
        // Fetch galleries data  
        const galleriesResponse = await GalleryService.getAll({})
        const galleries = galleriesResponse.data || []
        
        // Calculate stats from real data
        const totalArtworks = artworks.length
        const artworksInGalleries = artworks.filter(artwork => 
          artwork.location && artwork.location !== 'studio'
        ).length
        const artworksInStudio = artworks.filter(artwork => 
          !artwork.location || artwork.location === 'studio'
        ).length
        const artworksSold = artworks.filter(artwork => 
          artwork.status === 'sold'
        ).length
        
        const activeGalleries = galleries.filter(gallery => 
          gallery.is_active && gallery.relationship_status === 'active'
        ).length
        
        setStats({
          totalArtworks,
          artworksInGalleries,
          artworksInStudio,
          artworksSold,
          monthlyRevenue: 0, // TODO: Calculate from sales data
          totalGalleries: galleries.length,
          activeGalleries,
          journalEntries: 0 // TODO: Fetch from journal entries
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
          journalEntries: 0
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
            Good morning, Mai-Britt
          </h1>
          <p className="text-gray-600 mb-4">
            Today is {currentDate}. Here's what's happening in your art world.
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start text-left"
                  asChild
                >
                  <a href={action.href}>
                    <div className={`p-2 rounded-md ${action.color} mb-3`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="font-medium text-sm mb-1">{action.title}</div>
                    <div className="text-xs text-gray-600">{action.description}</div>
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