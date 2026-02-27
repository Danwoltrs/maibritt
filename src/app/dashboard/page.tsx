'use client'

import React, { useEffect, useState } from 'react'
import { TrendingUp, Image, Building, DollarSign, Loader2, Sparkles, Receipt, Percent } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArtworkService, GalleryService, AiUsageService } from '@/services'
import type { SalesStats } from '@/services'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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
    href: '/journal/manage/new',
  }
]

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

interface DashboardStats {
  totalArtworks: number
  artworksInGalleries: number
  artworksInStudio: number
  artworksSold: number
  totalGalleries: number
  activeGalleries: number
  journalEntries: number
  aiCallCount: number
  aiCostTotal: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const greeting = getDanishGreeting()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        const [artworkStats, galleriesResponse, aiUsageStats, salesData] = await Promise.all([
          ArtworkService.getArtworkStats(),
          GalleryService.getAll({}),
          AiUsageService.getUsageStats(),
          ArtworkService.getSalesStats(),
        ])
        const galleries = galleriesResponse.data || []

        const activeGalleries = galleries.filter(gallery =>
          gallery.is_active && gallery.relationship_status === 'active'
        ).length

        setStats({
          ...artworkStats,
          totalGalleries: galleries.length,
          activeGalleries,
          journalEntries: 0,
          aiCallCount: aiUsageStats.totalCalls,
          aiCostTotal: aiUsageStats.totalCost
        })
        setSalesStats(salesData)
        setRecentActivity([])

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setStats({
          totalArtworks: 0,
          artworksInGalleries: 0,
          artworksInStudio: 0,
          artworksSold: 0,
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

  const StatCardLoader = () => (
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-gray-500">Loading...</span>
    </div>
  )

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
                  {salesStats?.currentMonthRevenue ? formatBRL(salesStats.currentMonthRevenue) : '-'} this month
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
            {loading ? <StatCardLoader /> : (
              <>
                <div className="text-2xl font-bold">{stats?.totalArtworks || 0}</div>
                <p className="text-xs text-gray-600">Total pieces in collection</p>
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
            {loading ? <StatCardLoader /> : (
              <>
                <div className="text-2xl font-bold">
                  {salesStats?.currentMonthRevenue ? formatBRL(salesStats.currentMonthRevenue) : '-'}
                </div>
                <p className="text-xs text-gray-600">
                  {salesStats?.totalRevenue ? `${formatBRL(salesStats.totalRevenue)} lifetime` : 'No sales yet'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net After Commission</CardTitle>
            <Receipt className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            {loading ? <StatCardLoader /> : (
              <>
                <div className="text-2xl font-bold">
                  {salesStats?.totalNet ? formatBRL(salesStats.totalNet) : '-'}
                </div>
                <p className="text-xs text-gray-600">
                  {salesStats?.totalCommission ? `${formatBRL(salesStats.totalCommission)} in commissions` : 'No commissions yet'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Tax (Brazil)</CardTitle>
            <Percent className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            {loading ? <StatCardLoader /> : (
              <>
                <div className="text-2xl font-bold">
                  {salesStats?.estimatedTax ? formatBRL(salesStats.estimatedTax) : '-'}
                </div>
                <p className="text-xs text-gray-600">
                  ~6% Simples Nacional
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second row of stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Galleries</CardTitle>
            <Building className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            {loading ? <StatCardLoader /> : (
              <>
                <div className="text-2xl font-bold">{stats?.activeGalleries || 0}</div>
                <p className="text-xs text-gray-600">{stats?.totalGalleries || 0} total partners</p>
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
            {loading ? <StatCardLoader /> : (
              <>
                <div className="text-2xl font-bold">{stats?.artworksSold || 0}</div>
                <p className="text-xs text-gray-600">Lifetime sales</p>
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
            {loading ? <StatCardLoader /> : (
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

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>
            Monthly gross revenue vs net revenue (BRL)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : salesStats && salesStats.monthlySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesStats.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => formatBRL(Number(value))}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Legend />
                <Bar dataKey="gross" name="Gross Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Net Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No sales data yet</p>
                <p className="text-sm text-gray-500">Revenue chart will appear once artworks are sold</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
