'use client'

import React from 'react'
import { TrendingUp, Image, Building, DollarSign, MapPin, PenTool } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Mock data - replace with real data from services
const mockStats = {
  totalArtworks: 127,
  artworksInGalleries: 45,
  artworksInStudio: 62,
  artworksSold: 20,
  monthlyRevenue: 12450,
  totalGalleries: 8,
  activeGalleries: 6,
  journalEntries: 34
}

const quickActions = [
  {
    title: 'Upload New Artwork',
    description: 'Add a new piece to your portfolio',
    icon: Image,
    href: '/admin/artworks/new',
    color: 'bg-blue-500'
  },
  {
    title: 'Add Gallery',
    description: 'Register a new partner gallery',
    icon: Building,
    href: '/admin/galleries/new',
    color: 'bg-green-500'
  },
  {
    title: 'Record Sale',
    description: 'Log a recent artwork sale',
    icon: DollarSign,
    href: '/admin/sales/new',
    color: 'bg-purple-500'
  },
  {
    title: 'Update Location',
    description: 'Move artwork to new location',
    icon: MapPin,
    href: '/admin/artworks/locations',
    color: 'bg-orange-500'
  },
  {
    title: 'Write Journal Entry',
    description: 'Document your creative process',
    icon: PenTool,
    href: '/admin/journal/new',
    color: 'bg-pink-500'
  }
]

const recentActivity = [
  {
    id: 1,
    type: 'artwork_uploaded',
    message: 'New artwork "Atlantic Sunrise" uploaded',
    time: '2 hours ago'
  },
  {
    id: 2,
    type: 'sale_recorded',
    message: 'Sale recorded: "Blue Depths" sold for R$ 4,500',
    time: '1 day ago'
  },
  {
    id: 3,
    type: 'location_updated',
    message: '3 artworks moved to Galeria Arte Moderna',
    time: '2 days ago'
  },
  {
    id: 4,
    type: 'journal_entry',
    message: 'New journal entry: "Color experiments in the studio"',
    time: '3 days ago'
  }
]

export default function DashboardPage() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

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
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {mockStats.artworksInStudio} artworks in studio
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {mockStats.artworksInGalleries} artworks in galleries
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              R$ {mockStats.monthlyRevenue.toLocaleString()} this month
            </span>
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
            <div className="text-2xl font-bold">{mockStats.totalArtworks}</div>
            <p className="text-xs text-gray-600">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {mockStats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-600">
              +18% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Galleries</CardTitle>
            <Building className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeGalleries}</div>
            <p className="text-xs text-gray-600">
              {mockStats.totalGalleries} total partners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales This Year</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.artworksSold}</div>
            <p className="text-xs text-gray-600">
              +12% from last year
            </p>
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