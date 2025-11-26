'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Edit2, Plus, Trash2, Image as ImageIcon,
  Calendar, Layers, Eye, EyeOff, Save, X, GripVertical
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { SeriesService, ArtSeries } from '@/services/series.service'
import { ArtworkService } from '@/services/artwork.service'
import { Artwork } from '@/types'
import { supabase } from '@/lib/supabase'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SeriesDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [series, setSeries] = useState<ArtSeries | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [allArtworks, setAllArtworks] = useState<Artwork[]>([]) // Artworks not in any series
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editNamePt, setEditNamePt] = useState('')
  const [editNameEn, setEditNameEn] = useState('')
  const [editDescriptionPt, setEditDescriptionPt] = useState('')
  const [editDescriptionEn, setEditDescriptionEn] = useState('')
  const [editYear, setEditYear] = useState<number>(new Date().getFullYear())
  const [editIsActive, setEditIsActive] = useState(true)
  const [editIsSeasonal, setEditIsSeasonal] = useState(false)

  // Add artwork dialog
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedArtworkId, setSelectedArtworkId] = useState<string>('')

  // Load series and artworks
  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load series details
      const seriesData = await SeriesService.getSeriesById(id)
      if (!seriesData) {
        setError('Series not found')
        return
      }
      setSeries(seriesData)

      // Set edit form values
      setEditNamePt(seriesData.name.ptBR)
      setEditNameEn(seriesData.name.en)
      setEditDescriptionPt(seriesData.description?.ptBR || '')
      setEditDescriptionEn(seriesData.description?.en || '')
      setEditYear(seriesData.year)
      setEditIsActive(seriesData.isActive)
      setEditIsSeasonal(seriesData.isSeasonal)

      // Load artworks in this series
      const { data: artworksData, error: artworksError } = await supabase
        .from('artworks')
        .select('*')
        .eq('series_id', id)
        .order('created_at', { ascending: false })

      if (artworksError) throw artworksError

      // Transform artworks data
      const transformedArtworks: Artwork[] = (artworksData || []).map((a: any) => ({
        id: a.id,
        title: { ptBR: a.title_pt || '', en: a.title_en || '' },
        year: a.year,
        medium: { ptBR: a.medium_pt || '', en: a.medium_en || '' },
        dimensions: a.dimensions || '',
        description: { ptBR: a.description_pt || '', en: a.description_en || '' },
        images: a.images || [],
        category: a.category || 'painting',
        series: a.series_id,
        forSale: a.for_sale || false,
        price: a.price,
        currency: a.currency || 'BRL',
        isAvailable: a.is_available ?? true,
        displayOrder: a.display_order ?? 0,
        featured: a.featured || false,
        createdAt: a.created_at,
        updatedAt: a.updated_at
      }))

      setArtworks(transformedArtworks)

      // Load artworks not in any series (for adding)
      const { data: unassignedData } = await supabase
        .from('artworks')
        .select('*')
        .is('series_id', null)
        .order('created_at', { ascending: false })

      const transformedUnassigned: Artwork[] = (unassignedData || []).map((a: any) => ({
        id: a.id,
        title: { ptBR: a.title_pt || '', en: a.title_en || '' },
        year: a.year,
        medium: { ptBR: a.medium_pt || '', en: a.medium_en || '' },
        dimensions: a.dimensions || '',
        description: { ptBR: a.description_pt || '', en: a.description_en || '' },
        images: a.images || [],
        category: a.category || 'painting',
        series: undefined,
        forSale: a.for_sale || false,
        price: a.price,
        currency: a.currency || 'BRL',
        isAvailable: a.is_available ?? true,
        displayOrder: a.display_order ?? 0,
        featured: a.featured || false,
        createdAt: a.created_at,
        updatedAt: a.updated_at
      }))

      setAllArtworks(transformedUnassigned)

    } catch (err) {
      console.error('Error loading series:', err)
      setError('Failed to load series data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!series) return

    try {
      setSaving(true)
      setError(null)

      await SeriesService.updateSeries(series.id, {
        name: { ptBR: editNamePt, en: editNameEn },
        description: { ptBR: editDescriptionPt, en: editDescriptionEn },
        year: editYear,
        isActive: editIsActive,
        isSeasonal: editIsSeasonal
      })

      // Reload data
      await loadData()
      setIsEditing(false)
    } catch (err) {
      console.error('Error saving series:', err)
      setError('Failed to save series')
    } finally {
      setSaving(false)
    }
  }

  const handleAddArtwork = async () => {
    if (!selectedArtworkId) return

    try {
      setSaving(true)
      setError(null)

      // Update artwork to belong to this series
      const { error: updateError } = await supabase
        .from('artworks')
        .update({ series_id: id })
        .eq('id', selectedArtworkId)

      if (updateError) throw updateError

      // Reload data
      await loadData()
      setShowAddDialog(false)
      setSelectedArtworkId('')
    } catch (err) {
      console.error('Error adding artwork to series:', err)
      setError('Failed to add artwork to series')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveArtwork = async (artworkId: string) => {
    if (!confirm('Remove this artwork from the series?')) return

    try {
      setSaving(true)
      setError(null)

      // Update artwork to remove from series
      const { error: updateError } = await supabase
        .from('artworks')
        .update({ series_id: null })
        .eq('id', artworkId)

      if (updateError) throw updateError

      // Reload data
      await loadData()
    } catch (err) {
      console.error('Error removing artwork from series:', err)
      setError('Failed to remove artwork from series')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error && !series) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  if (!series) return null

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {series.name.en}
            </h1>
            <p className="text-gray-500">{series.name.ptBR}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Series
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Series Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Series Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nameEn">Name (English)</Label>
                  <Input
                    id="nameEn"
                    value={editNameEn}
                    onChange={(e) => setEditNameEn(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="namePt">Name (Portuguese)</Label>
                  <Input
                    id="namePt"
                    value={editNamePt}
                    onChange={(e) => setEditNamePt(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={editYear}
                    onChange={(e) => setEditYear(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="descriptionEn">Description (English)</Label>
                  <Textarea
                    id="descriptionEn"
                    value={editDescriptionEn}
                    onChange={(e) => setEditDescriptionEn(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="descriptionPt">Description (Portuguese)</Label>
                  <Textarea
                    id="descriptionPt"
                    value={editDescriptionPt}
                    onChange={(e) => setEditDescriptionPt(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active</Label>
                    <p className="text-sm text-gray-500">Show in portfolio</p>
                  </div>
                  <Switch
                    checked={editIsActive}
                    onCheckedChange={setEditIsActive}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Seasonal</Label>
                    <p className="text-sm text-gray-500">Limited time collection</p>
                  </div>
                  <Switch
                    checked={editIsSeasonal}
                    onCheckedChange={setEditIsSeasonal}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Year: {series.year}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <ImageIcon className="w-4 h-4" />
                  <span>{artworks.length} artworks</span>
                </div>
                <div className="flex items-center gap-2">
                  {series.isActive ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Eye className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <EyeOff className="w-3 h-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                  {series.isSeasonal && (
                    <Badge variant="outline">Seasonal</Badge>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                {series.description?.en && (
                  <p className="text-gray-700 mb-2">{series.description.en}</p>
                )}
                {series.description?.ptBR && (
                  <p className="text-gray-500 text-sm italic">{series.description.ptBR}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Artworks in Series */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Artworks in Series</CardTitle>
            <CardDescription>
              {artworks.length} artwork{artworks.length !== 1 ? 's' : ''} in this series
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Artwork
          </Button>
        </CardHeader>
        <CardContent>
          {artworks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No artworks in this series yet.</p>
              <p className="text-sm">Add artworks using the button above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {artworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className="group relative bg-gray-50 rounded-lg overflow-hidden border hover:shadow-lg transition-shadow"
                >
                  {/* Artwork Image */}
                  <div className="aspect-square relative">
                    {artwork.images.length > 0 ? (
                      <Image
                        src={artwork.images[0].thumbnail || artwork.images[0].display}
                        alt={artwork.title.en}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/artworks/${artwork.id}/edit`)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveArtwork(artwork.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Artwork Info */}
                  <div className="p-3">
                    <h4 className="font-medium text-sm truncate">{artwork.title.en}</h4>
                    <p className="text-xs text-gray-500">{artwork.year}</p>
                    <p className="text-xs text-gray-400 truncate">{artwork.medium.en}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Artwork Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Artwork to Series</DialogTitle>
            <DialogDescription>
              Select an artwork to add to "{series.name.en}"
            </DialogDescription>
          </DialogHeader>

          {allArtworks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No unassigned artworks available.</p>
              <p className="text-sm mt-2">
                Create a new artwork or remove one from another series first.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/artworks/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Artwork
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto py-4">
                {allArtworks.map((artwork) => (
                  <div
                    key={artwork.id}
                    onClick={() => setSelectedArtworkId(artwork.id)}
                    className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                      selectedArtworkId === artwork.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="aspect-square relative">
                      {artwork.images.length > 0 ? (
                        <Image
                          src={artwork.images[0].thumbnail || artwork.images[0].display}
                          alt={artwork.title.en}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{artwork.title.en}</p>
                      <p className="text-xs text-gray-500">{artwork.year}</p>
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddArtwork}
                  disabled={!selectedArtworkId || saving}
                >
                  {saving ? 'Adding...' : 'Add to Series'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
