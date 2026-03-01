'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Image as ImageIcon, AlertCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { ArtworkService } from '@/services/artwork.service'
import { GalleryService, Gallery } from '@/services/gallery.service'
import { Artwork } from '@/types'

import { ViewToggle, ViewMode } from '@/components/admin/artworks/ViewToggle'
import { ArtworksFilters, ArtworkPageFilters, defaultFilters } from '@/components/admin/artworks/ArtworksFilters'
import { ArtworksTable, SortField, SortDir } from '@/components/admin/artworks/ArtworksTable'
import { ArtworksGrid } from '@/components/admin/artworks/ArtworksGrid'
import { BulkActionBar } from '@/components/admin/artworks/BulkActionBar'

import {
  PreviewModal,
  MarkAsSoldModal,
  AssignToGalleryModal,
  AssignToExhibitionModal,
  ConfirmActionModal,
  FreightCostModal,
} from '@/components/admin/artwork-context-modals'
import { EditArtworkModal } from '@/components/admin/EditArtworkModal'

export default function ArtworksPage() {
  const router = useRouter()
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filters, setFilters] = useState<ArtworkPageFilters>(defaultFilters)

  // View
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('artworks-view') as ViewMode) || 'table'
    }
    return 'table'
  })

  // Sorting
  const [sortField, setSortField] = useState<SortField>('year')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Galleries
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [galleryMap, setGalleryMap] = useState<Map<string, string>>(new Map())
  const [years, setYears] = useState<number[]>([])

  // Modal state for table/grid three-dot menu
  const [modalType, setModalType] = useState<string | null>(null)
  const [modalArtwork, setModalArtwork] = useState<Artwork | null>(null)

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('artworks-view', mode)
  }

  const loadArtworks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ArtworkService.getArtworks({
        searchTerm: filters.searchTerm || undefined,
        artworkStatus: filters.artworkStatus !== 'all' ? filters.artworkStatus : undefined,
        year: filters.year !== 'all' ? parseInt(filters.year) : undefined,
        galleryId: filters.galleryId !== 'all' ? filters.galleryId : undefined,
      })

      setArtworks(response.artworks)
    } catch (err) {
      console.error('Error loading artworks:', err)
      setError('Failed to load artworks')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadArtworks()
  }, [loadArtworks])

  // Load galleries + years on mount
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [galleriesRes, yearsData] = await Promise.all([
          GalleryService.getAll({ includeInactive: false }),
          ArtworkService.getYears(),
        ])
        if (galleriesRes.success && galleriesRes.data) {
          setGalleries(galleriesRes.data)
          const map = new Map<string, string>()
          galleriesRes.data.forEach(g => map.set(g.id, g.name))
          setGalleryMap(map)
        }
        setYears(yearsData)
      } catch (err) {
        console.error('Error loading metadata:', err)
      }
    }
    loadMeta()
  }, [])

  // Sort artworks
  const sortedArtworks = [...artworks].sort((a, b) => {
    let aVal: any, bVal: any
    switch (sortField) {
      case 'year':
        aVal = a.year; bVal = b.year; break
      case 'title':
        aVal = a.title.en.toLowerCase(); bVal = b.title.en.toLowerCase(); break
      case 'artworkStatus':
        aVal = a.artworkStatus || ''; bVal = b.artworkStatus || ''; break
      case 'soldDate':
        aVal = a.soldDate ? new Date(a.soldDate).getTime() : 0
        bVal = b.soldDate ? new Date(b.soldDate).getTime() : 0
        break
    }
    if (sortDir === 'desc') return bVal > aVal ? 1 : bVal < aVal ? -1 : 0
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const handleOpenModal = (type: string, artwork: Artwork) => {
    setModalArtwork(artwork)
    setModalType(type)
  }

  const closeModal = () => {
    setModalType(null)
    setModalArtwork(null)
  }

  const handleToggleFeatured = async () => {
    if (!modalArtwork) return
    await ArtworkService.updateArtwork(modalArtwork.id, {
      featured: !modalArtwork.featured,
    })
    loadArtworks()
  }

  const handleDelete = async () => {
    if (!modalArtwork) return
    await ArtworkService.deleteArtwork(modalArtwork.id)
    loadArtworks()
  }

  // Stats
  const totalCount = artworks.length
  const soldCount = artworks.filter(a => a.artworkStatus === 'sold' || a.isSold).length
  const galleryCount = artworks.filter(a => a.artworkStatus === 'gallery').length
  const studioCount = artworks.filter(a => !a.artworkStatus || a.artworkStatus === 'studio').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artworks</h1>
          <p className="text-sm text-gray-500">Manage your art portfolio</p>
        </div>
        <Button onClick={() => router.push('/artworks/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Upload New
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: totalCount, color: 'text-gray-900' },
          { label: 'In Studio', value: studioCount, color: 'text-gray-600' },
          { label: 'At Galleries', value: galleryCount, color: 'text-blue-600' },
          { label: 'Sold', value: soldCount, color: 'text-red-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-3 text-center">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <ArtworksFilters
          filters={filters}
          onFiltersChange={setFilters}
          years={years}
          galleries={galleries}
        />
        <ViewToggle viewMode={viewMode} onChange={handleViewChange} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading artworks...</div>
      ) : sortedArtworks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No artworks found</h3>
            <p className="text-gray-600 mb-4">
              {filters.searchTerm || filters.artworkStatus !== 'all' || filters.year !== 'all'
                ? 'Try adjusting your filters.'
                : 'Upload your first artwork to get started.'}
            </p>
            <Button onClick={() => router.push('/artworks/new')}>Upload Artwork</Button>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <ArtworksTable
          artworks={sortedArtworks}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          galleryMap={galleryMap}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onUpdate={loadArtworks}
          onOpenModal={handleOpenModal}
        />
      ) : (
        <ArtworksGrid
          artworks={sortedArtworks}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          galleryMap={galleryMap}
          onUpdate={loadArtworks}
          onOpenModal={handleOpenModal}
        />
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        artworks={artworks}
        onClearSelection={() => setSelectedIds(new Set())}
        onUpdate={loadArtworks}
      />

      {/* Modals triggered from table/grid three-dot menu */}
      {modalArtwork && (
        <>
          <PreviewModal
            artwork={modalArtwork}
            open={modalType === 'preview'}
            onOpenChange={(open) => !open && closeModal()}
          />
          <EditArtworkModal
            artwork={modalArtwork}
            open={modalType === 'edit'}
            onOpenChange={(open) => !open && closeModal()}
            onUpdate={loadArtworks}
          />
          <MarkAsSoldModal
            artwork={modalArtwork}
            open={modalType === 'markSold'}
            onOpenChange={(open) => !open && closeModal()}
            onUpdate={loadArtworks}
          />
          <AssignToGalleryModal
            artwork={modalArtwork}
            open={modalType === 'assignGallery'}
            onOpenChange={(open) => !open && closeModal()}
            onUpdate={loadArtworks}
          />
          <AssignToExhibitionModal
            artwork={modalArtwork}
            open={modalType === 'assignExhibition'}
            onOpenChange={(open) => !open && closeModal()}
            onUpdate={loadArtworks}
          />
          <FreightCostModal
            artwork={modalArtwork}
            open={modalType === 'freightCost'}
            onOpenChange={(open) => !open && closeModal()}
            onUpdate={loadArtworks}
          />
          <ConfirmActionModal
            open={modalType === 'toggleFeatured'}
            onOpenChange={(open) => !open && closeModal()}
            title={modalArtwork.featured ? 'Remove Featured' : 'Mark as Featured'}
            description={
              modalArtwork.featured
                ? `Remove "${modalArtwork.title.en}" from featured artworks?`
                : `Feature "${modalArtwork.title.en}" on the homepage?`
            }
            confirmLabel={modalArtwork.featured ? 'Remove Featured' : 'Mark as Featured'}
            onConfirm={handleToggleFeatured}
          />
          <ConfirmActionModal
            open={modalType === 'delete'}
            onOpenChange={(open) => !open && closeModal()}
            title="Delete Artwork"
            description={`Are you sure you want to delete "${modalArtwork.title.en}"? This action cannot be undone.`}
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={handleDelete}
          />
        </>
      )}
    </div>
  )
}
