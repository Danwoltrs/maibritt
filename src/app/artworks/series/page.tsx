'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, FolderOpen, Calendar, Image, Users, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SeriesService } from '@/services/series.service'
import { ArtworkService } from '@/services/artwork.service'
import { ArtSeries, Artwork } from '@/types'
import ArtworkUploadForm from '@/components/artwork/ArtworkUploadForm'


// Form validation schema
const seriesSchema = z.object({
  namePt: z.string().min(1, 'Portuguese name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  descriptionPt: z.string().optional(),
  descriptionEn: z.string().optional(),
  year: z.number().min(1800).max(new Date().getFullYear() + 1),
  isActive: z.boolean(),
  isSeasonal: z.boolean(),
  seasonStart: z.string().optional(),
  seasonEnd: z.string().optional()
})

type SeriesFormData = z.infer<typeof seriesSchema>

interface SeriesWithCount extends ArtSeries {
  artworkCount: number
}

export default function SeriesManagementPage() {
  const [series, setSeries] = useState<SeriesWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSeries, setEditingSeries] = useState<SeriesWithCount | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Artwork management modal state
  const [isArtworkModalOpen, setIsArtworkModalOpen] = useState(false)
  const [managingSeries, setManagingSeries] = useState<SeriesWithCount | null>(null)
  const [allArtworks, setAllArtworks] = useState<Artwork[]>([])
  const [seriesArtworks, setSeriesArtworks] = useState<Artwork[]>([])
  const [selectedArtworks, setSelectedArtworks] = useState<string[]>([])
  const [artworkLoading, setArtworkLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<SeriesFormData>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      isActive: true,
      isSeasonal: false,
      year: new Date().getFullYear()
    }
  })

  const watchIsSeasonal = watch('isSeasonal')

  // Load series data
  useEffect(() => {
    const loadSeries = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await SeriesService.getSeries(true) // Include inactive
        
        // Transform to include artwork count (we'll get this from artworks table)
        const seriesWithCount: SeriesWithCount[] = data.map(s => ({
          ...s,
          artworkCount: 0 // TODO: Get actual count from artworks
        }))
        
        setSeries(seriesWithCount)
      } catch (err) {
        console.error('Error loading series:', err)
        setError('Failed to load series')
      } finally {
        setLoading(false)
      }
    }

    loadSeries()
  }, [])

  const openCreateDialog = () => {
    setEditingSeries(null)
    reset({
      isActive: true,
      isSeasonal: false,
      year: new Date().getFullYear()
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (series: SeriesWithCount) => {
    setEditingSeries(series)
    reset({
      namePt: series.name.ptBR,
      nameEn: series.name.en,
      descriptionPt: series.description?.ptBR || '',
      descriptionEn: series.description?.en || '',
      year: series.year,
      isActive: series.isActive,
      isSeasonal: series.isSeasonal,
      seasonStart: series.seasonStart,
      seasonEnd: series.seasonEnd
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: SeriesFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const seriesData = {
        name: {
          ptBR: data.namePt,
          en: data.nameEn
        },
        description: {
          ptBR: data.descriptionPt || '',
          en: data.descriptionEn || ''
        },
        year: data.year,
        isActive: data.isActive,
        isSeasonal: data.isSeasonal,
        seasonStart: data.isSeasonal && data.seasonStart ? new Date(data.seasonStart) : undefined,
        seasonEnd: data.isSeasonal && data.seasonEnd ? new Date(data.seasonEnd) : undefined
      }

      let savedSeries: ArtSeries
      
      if (editingSeries) {
        // Update existing series
        savedSeries = await SeriesService.updateSeries(editingSeries.id, seriesData)
        setSeries(prev => prev.map(s => s.id === editingSeries.id ? {
          ...savedSeries,
          artworkCount: s.artworkCount
        } : s))
      } else {
        // Create new series
        savedSeries = await SeriesService.createSeries(seriesData)
        setSeries(prev => [{
          ...savedSeries,
          artworkCount: 0
        }, ...prev])
      }

      setIsDialogOpen(false)
      reset()
    } catch (error) {
      console.error('Error saving series:', error)
      setError('Failed to save series')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteSeries = async (id: string) => {
    if (!confirm('Are you sure you want to delete this series? This action cannot be undone.')) {
      return
    }

    try {
      await SeriesService.deleteSeries(id)
      setSeries(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error('Error deleting series:', error)
      setError('Failed to delete series')
    }
  }

  const openArtworkManagementModal = async (series: SeriesWithCount) => {
    setManagingSeries(series)
    setIsArtworkModalOpen(true)
    setArtworkLoading(true)
    
    try {
      // Load all artworks and series artworks in parallel
      const [allArtworksResponse, seriesArtworksResponse] = await Promise.all([
        ArtworkService.getArtworks({}, { page: 1, limit: 100 }), // Get all artworks
        ArtworkService.getArtworks({ seriesId: series.id }, { page: 1, limit: 100 }) // Get series artworks
      ])
      
      setAllArtworks(allArtworksResponse.artworks)
      setSeriesArtworks(seriesArtworksResponse.artworks)
      setSelectedArtworks([]) // Reset selection
    } catch (error) {
      console.error('Error loading artworks:', error)
      setError('Failed to load artworks')
    } finally {
      setArtworkLoading(false)
    }
  }

  const handleAddArtworksToSeries = async () => {
    if (!managingSeries || selectedArtworks.length === 0) return
    
    try {
      await SeriesService.addArtworksToSeries(managingSeries.id, selectedArtworks)
      
      // Refresh the data
      const seriesArtworksResponse = await ArtworkService.getArtworks(
        { seriesId: managingSeries.id }, 
        { page: 1, limit: 100 }
      )
      setSeriesArtworks(seriesArtworksResponse.artworks)
      setSelectedArtworks([])
      
      // Update series artwork count
      setSeries(prev => prev.map(s => 
        s.id === managingSeries.id 
          ? { ...s, artworkCount: seriesArtworksResponse.artworks.length }
          : s
      ))
    } catch (error) {
      console.error('Error adding artworks to series:', error)
      setError('Failed to add artworks to series')
    }
  }

  const handleRemoveArtworkFromSeries = async (artworkId: string) => {
    if (!managingSeries) return
    
    try {
      await SeriesService.removeArtworksFromSeries([artworkId])
      
      // Update local state
      setSeriesArtworks(prev => prev.filter(a => a.id !== artworkId))
      
      // Update series artwork count
      setSeries(prev => prev.map(s => 
        s.id === managingSeries.id 
          ? { ...s, artworkCount: s.artworkCount - 1 }
          : s
      ))
    } catch (error) {
      console.error('Error removing artwork from series:', error)
      setError('Failed to remove artwork from series')
    }
  }

  const handleArtworkUploadSuccess = (artworkId: string) => {
    // Refresh the series artworks
    if (managingSeries) {
      openArtworkManagementModal(managingSeries)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Series & Collections</h1>
          <p className="text-gray-600">Organize your artworks into meaningful collections</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Series
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading series...</p>
          </div>
        </div>
      ) : series.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Series Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first art series to organize your portfolio into collections
            </p>
            <Button onClick={openCreateDialog}>Create Your First Series</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {series.map((series) => (
            <Card key={series.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {series.coverImage ? (
                  <img
                    src={series.coverImage}
                    alt={series.name.en}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                {/* Status badges */}
                <div className="absolute top-2 right-2 flex gap-2">
                  {!series.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {series.isSeasonal && (
                    <Badge variant="outline" className="bg-white/90">
                      <Calendar className="h-3 w-3 mr-1" />
                      Seasonal
                    </Badge>
                  )}
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{series.name.en}</CardTitle>
                    <p className="text-sm text-gray-600">{series.name.ptBR}</p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {series.year}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                  {series.description.en}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">
                    {series.artworkCount} artwork{series.artworkCount !== 1 ? 's' : ''}
                  </span>
                  {series.isSeasonal && series.seasonStart && series.seasonEnd && (
                    <span className="text-xs text-gray-500">
                      {new Date(series.seasonStart).toLocaleDateString()} - {new Date(series.seasonEnd).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(series)}
                    className="flex-1"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openArtworkManagementModal(series)}
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSeries(series.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSeries ? 'Edit Series' : 'Create New Series'}
            </DialogTitle>
            <DialogDescription>
              {editingSeries 
                ? 'Update your series information and settings'
                : 'Create a new collection to organize related artworks'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="namePt">Name (Portuguese)</Label>
                <Input
                  id="namePt"
                  {...register('namePt')}
                  placeholder="Nome da série"
                />
                {errors.namePt && (
                  <p className="text-sm text-red-600">{errors.namePt.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameEn">Name (English)</Label>
                <Input
                  id="nameEn"
                  {...register('nameEn')}
                  placeholder="Series name"
                />
                {errors.nameEn && (
                  <p className="text-sm text-red-600">{errors.nameEn.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                {...register('year', { valueAsNumber: true })}
                placeholder="2024"
              />
              {errors.year && (
                <p className="text-sm text-red-600">{errors.year.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="descriptionPt">Description (Portuguese)</Label>
                <Textarea
                  id="descriptionPt"
                  {...register('descriptionPt')}
                  placeholder="Descrição da série..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionEn">Description (English)</Label>
                <Textarea
                  id="descriptionEn"
                  {...register('descriptionEn')}
                  placeholder="Series description..."
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Active Series</Label>
                  <p className="text-sm text-gray-500">Make this series visible in portfolio</p>
                </div>
                <Switch
                  id="isActive"
                  {...register('isActive')}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isSeasonal">Seasonal Collection</Label>
                  <p className="text-sm text-gray-500">Limited time or themed collection</p>
                </div>
                <Switch
                  id="isSeasonal"
                  checked={watchIsSeasonal}
                  onCheckedChange={(checked) => setValue('isSeasonal', checked)}
                />
              </div>

              {watchIsSeasonal && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="seasonStart">Season Start</Label>
                    <Input
                      id="seasonStart"
                      type="date"
                      {...register('seasonStart')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seasonEnd">Season End</Label>
                    <Input
                      id="seasonEnd"
                      type="date"
                      {...register('seasonEnd')}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {editingSeries ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editingSeries ? 'Update Series' : 'Create Series'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Artwork Management Modal */}
      <Dialog open={isArtworkModalOpen} onOpenChange={setIsArtworkModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Manage Artworks - {managingSeries?.name.en}
            </DialogTitle>
            <DialogDescription>
              Add existing artworks to this series or create new ones
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="existing" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Add Existing Artwork</TabsTrigger>
              <TabsTrigger value="create">Create New Artwork</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4 h-full overflow-y-auto">
              {artworkLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading artworks...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Current Series Artworks */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Current Artworks in Series ({seriesArtworks.length})
                    </h4>
                    {seriesArtworks.length === 0 ? (
                      <p className="text-gray-500 text-sm">No artworks in this series yet.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {seriesArtworks.map((artwork) => (
                          <div key={artwork.id} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                              {artwork.images.length > 0 && (
                                <img
                                  src={artwork.images[0].thumbnail}
                                  alt={artwork.title.en}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveArtworkFromSeries(artwork.id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {artwork.title.en}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Available Artworks */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Available Artworks
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
                      {allArtworks
                        .filter(artwork => !seriesArtworks.some(sa => sa.id === artwork.id))
                        .map((artwork) => (
                          <div key={artwork.id} className="relative">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer">
                              {artwork.images.length > 0 && (
                                <img
                                  src={artwork.images[0].thumbnail}
                                  alt={artwork.title.en}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute top-2 left-2">
                                <Checkbox
                                  checked={selectedArtworks.includes(artwork.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedArtworks(prev => [...prev, artwork.id])
                                    } else {
                                      setSelectedArtworks(prev => prev.filter(id => id !== artwork.id))
                                    }
                                  }}
                                  className="bg-white"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {artwork.title.en}
                            </p>
                          </div>
                        ))}
                    </div>

                    {selectedArtworks.length > 0 && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {selectedArtworks.length} artwork{selectedArtworks.length !== 1 ? 's' : ''} selected
                        </span>
                        <Button onClick={handleAddArtworksToSeries}>
                          Add to Series
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedArtworks([])}
                        >
                          Clear Selection
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="create" className="h-full overflow-y-auto">
              <ArtworkUploadForm
                defaultSeriesId={managingSeries?.id}
                onSuccess={handleArtworkUploadSuccess}
                isModal={true}
                className="border-none shadow-none"
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}