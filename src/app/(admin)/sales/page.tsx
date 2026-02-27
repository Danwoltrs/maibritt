'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Percent,
  Loader2,
  Building,
  Search,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ArtworkService } from '@/services'
import type { SalesStats, GallerySalesStats } from '@/services'
import type { Artwork } from '@/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDate(date: Date | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SalesPage() {
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null)
  const [soldArtworks, setSoldArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)

  // Filters
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [saleTypeFilter, setSaleTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [stats, artworksRes] = await Promise.all([
          ArtworkService.getSalesStats(),
          ArtworkService.getArtworks({}, { page: 1, limit: 500 }),
        ])
        setSalesStats(stats)
        // Filter to sold artworks and sort by sold_date descending
        const sold = artworksRes.artworks
          .filter(a => a.isSold)
          .sort((a, b) => {
            const da = a.soldDate ? new Date(a.soldDate).getTime() : 0
            const db = b.soldDate ? new Date(b.soldDate).getTime() : 0
            return db - da
          })
        setSoldArtworks(sold)
      } catch (error) {
        console.error('Error fetching sales data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Derive available years from sold artworks
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    soldArtworks.forEach(a => {
      if (a.soldDate) years.add(new Date(a.soldDate).getFullYear())
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [soldArtworks])

  // Filtered artworks
  const filteredArtworks = useMemo(() => {
    return soldArtworks.filter(a => {
      if (yearFilter !== 'all' && a.soldDate) {
        if (new Date(a.soldDate).getFullYear() !== parseInt(yearFilter)) return false
      }
      if (saleTypeFilter !== 'all' && a.saleType !== saleTypeFilter) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const titleMatch = a.title.en.toLowerCase().includes(term) || a.title.ptBR.toLowerCase().includes(term)
        const buyerMatch = a.buyerName?.toLowerCase().includes(term)
        if (!titleMatch && !buyerMatch) return false
      }
      return true
    })
  }, [soldArtworks, yearFilter, saleTypeFilter, searchTerm])

  // Gallery performance pie data
  const galleryPieData = useMemo(() => {
    if (!salesStats?.gallerySales.length) return []
    return salesStats.gallerySales.map(g => ({
      name: g.galleryName,
      value: g.totalGross,
      sales: g.totalSales,
    }))
  }, [salesStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Overview</h1>
        <p className="text-gray-600 mt-1">Track revenue, commissions, and gallerist performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesStats?.salesCount || 0}</div>
            <p className="text-xs text-gray-600">artworks sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesStats?.totalRevenue ? formatBRL(salesStats.totalRevenue) : '-'}
            </div>
            <p className="text-xs text-gray-600">all time (BRL)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Paid</CardTitle>
            <Building className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesStats?.totalCommission ? formatBRL(salesStats.totalCommission) : '-'}
            </div>
            <p className="text-xs text-gray-600">to galleries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <Receipt className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesStats?.totalNet ? formatBRL(salesStats.totalNet) : '-'}
            </div>
            <p className="text-xs text-gray-600">after commissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Tax</CardTitle>
            <Percent className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesStats?.estimatedTax ? formatBRL(salesStats.estimatedTax) : '-'}
            </div>
            <p className="text-xs text-gray-600">~6% Simples Nacional</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Gross vs Net revenue by month (BRL)</CardDescription>
          </CardHeader>
          <CardContent>
            {salesStats && salesStats.monthlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={salesStats.monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                  <Tooltip formatter={(value) => formatBRL(Number(value))} />
                  <Legend />
                  <Bar dataKey="gross" name="Gross" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="net" name="Net" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">No sales data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallerist Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Gallerist Performance</CardTitle>
            <CardDescription>Revenue by sales channel</CardDescription>
          </CardHeader>
          <CardContent>
            {galleryPieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={280}>
                  <PieChart>
                    <Pie
                      data={galleryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {galleryPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatBRL(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {galleryPieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{entry.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatBRL(entry.value)} ({entry.sales} sale{entry.sales !== 1 ? 's' : ''})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">No sales data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gallery Performance Table */}
      {salesStats && salesStats.gallerySales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gallery Breakdown</CardTitle>
            <CardDescription>Performance by gallery / sales channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-gray-600">Gallery</th>
                    <th className="pb-2 font-medium text-gray-600 text-right">Sales</th>
                    <th className="pb-2 font-medium text-gray-600 text-right">Gross</th>
                    <th className="pb-2 font-medium text-gray-600 text-right">Commission</th>
                    <th className="pb-2 font-medium text-gray-600 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {salesStats.gallerySales.map((g) => (
                    <tr key={g.galleryId ?? 'direct'} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{g.galleryName}</td>
                      <td className="py-2.5 text-right">{g.totalSales}</td>
                      <td className="py-2.5 text-right">{formatBRL(g.totalGross)}</td>
                      <td className="py-2.5 text-right text-orange-600">{formatBRL(g.totalCommission)}</td>
                      <td className="py-2.5 text-right text-green-600">{formatBRL(g.totalNet)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Sales</CardTitle>
              <CardDescription>{filteredArtworks.length} sold artwork{filteredArtworks.length !== 1 ? 's' : ''}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search title or buyer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {availableYears.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={saleTypeFilter} onValueChange={setSaleTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sale type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="gallery">Gallery</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredArtworks.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No sold artworks found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-gray-600">Artwork</th>
                    <th className="pb-2 font-medium text-gray-600">Sale Date</th>
                    <th className="pb-2 font-medium text-gray-600 text-right">Price</th>
                    <th className="pb-2 font-medium text-gray-600 text-right">Commission</th>
                    <th className="pb-2 font-medium text-gray-600 text-right">Net</th>
                    <th className="pb-2 font-medium text-gray-600">Type</th>
                    <th className="pb-2 font-medium text-gray-600">Buyer</th>
                    <th className="pb-2 font-medium text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArtworks.map((artwork) => (
                    <tr
                      key={artwork.id}
                      className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedArtwork(artwork)}
                    >
                      <td className="py-2.5">
                        <div className="flex items-center gap-3">
                          {artwork.images[0] && (
                            <img
                              src={artwork.images[0].thumbnail}
                              alt={artwork.title.en}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{artwork.title.en}</p>
                            <p className="text-xs text-gray-500">{artwork.dimensions}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-gray-600">{formatDate(artwork.soldDate)}</td>
                      <td className="py-2.5 text-right font-medium">
                        {artwork.soldPrice ? `${artwork.soldCurrency || 'BRL'} ${artwork.soldPrice.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2.5 text-right text-orange-600">
                        {artwork.commissionAmount ? formatBRL(artwork.commissionAmount) : '-'}
                      </td>
                      <td className="py-2.5 text-right text-green-600">
                        {artwork.netAmount ? formatBRL(artwork.netAmount) : '-'}
                      </td>
                      <td className="py-2.5">
                        {artwork.saleType && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            artwork.saleType === 'gallery' ? 'bg-blue-100 text-blue-700' :
                            artwork.saleType === 'direct' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {artwork.saleType}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-gray-600">{artwork.buyerName || '-'}</td>
                      <td className="py-2.5">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sale Detail Sheet */}
      <Sheet open={!!selectedArtwork} onOpenChange={(open: boolean) => !open && setSelectedArtwork(null)}>
        <SheetContent className="overflow-y-auto">
          {selectedArtwork && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedArtwork.title.en}</SheetTitle>
                <SheetDescription>{selectedArtwork.title.ptBR}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Artwork Image */}
                {selectedArtwork.images[0] && (
                  <img
                    src={selectedArtwork.images[0].display}
                    alt={selectedArtwork.title.en}
                    className="w-full rounded-lg object-cover"
                  />
                )}

                {/* Sale Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-900">Sale Details</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-gray-500">Sale Date</dt>
                    <dd className="font-medium">{formatDate(selectedArtwork.soldDate)}</dd>
                    <dt className="text-gray-500">Sale Type</dt>
                    <dd className="font-medium capitalize">{selectedArtwork.saleType || '-'}</dd>
                    <dt className="text-gray-500">Price</dt>
                    <dd className="font-medium">
                      {selectedArtwork.soldPrice
                        ? `${selectedArtwork.soldCurrency || 'BRL'} ${selectedArtwork.soldPrice.toLocaleString()}`
                        : '-'}
                    </dd>
                    <dt className="text-gray-500">Commission Rate</dt>
                    <dd className="font-medium">
                      {selectedArtwork.commissionRate ? `${selectedArtwork.commissionRate}%` : '-'}
                    </dd>
                    <dt className="text-gray-500">Commission</dt>
                    <dd className="font-medium text-orange-600">
                      {selectedArtwork.commissionAmount ? formatBRL(selectedArtwork.commissionAmount) : '-'}
                    </dd>
                    <dt className="text-gray-500">Net Amount</dt>
                    <dd className="font-medium text-green-600">
                      {selectedArtwork.netAmount ? formatBRL(selectedArtwork.netAmount) : '-'}
                    </dd>
                  </dl>
                </div>

                {/* Buyer Info */}
                {selectedArtwork.buyerName && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-900">Buyer Information</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <dt className="text-gray-500">Name</dt>
                      <dd className="font-medium">{selectedArtwork.buyerName}</dd>
                      {selectedArtwork.buyerEmail && (
                        <>
                          <dt className="text-gray-500">Email</dt>
                          <dd className="font-medium">{selectedArtwork.buyerEmail}</dd>
                        </>
                      )}
                      {selectedArtwork.buyerPhone && (
                        <>
                          <dt className="text-gray-500">Phone</dt>
                          <dd className="font-medium">{selectedArtwork.buyerPhone}</dd>
                        </>
                      )}
                      {selectedArtwork.buyerCity && (
                        <>
                          <dt className="text-gray-500">Location</dt>
                          <dd className="font-medium">
                            {[selectedArtwork.buyerCity, selectedArtwork.buyerState, selectedArtwork.buyerCountry]
                              .filter(Boolean).join(', ')}
                          </dd>
                        </>
                      )}
                    </dl>
                  </div>
                )}

                {/* Artwork Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-900">Artwork Details</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-gray-500">Year</dt>
                    <dd className="font-medium">{selectedArtwork.year}</dd>
                    <dt className="text-gray-500">Medium</dt>
                    <dd className="font-medium">{selectedArtwork.medium.en}</dd>
                    <dt className="text-gray-500">Dimensions</dt>
                    <dd className="font-medium">{selectedArtwork.dimensions}</dd>
                    <dt className="text-gray-500">Category</dt>
                    <dd className="font-medium capitalize">{selectedArtwork.category}</dd>
                  </dl>
                </div>

                <Button variant="outline" className="w-full" asChild>
                  <a href={`/artworks/${selectedArtwork.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Artwork
                  </a>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
