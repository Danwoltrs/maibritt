'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, FolderOpen, Calendar, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Mock data - replace with actual service calls
const mockSeries = [
  {
    id: '1',
    name: { ptBR: 'Azul no Negro', en: 'Blue in Black' },
    description: { ptBR: 'Expedição ao Rio Negro, Amazônia', en: 'Rio Negro Expedition, Amazon' },
    year: 2015,
    artworkCount: 12,
    coverImage: '/placeholder-artwork.jpg',
    isActive: true,
    isSeasonal: false
  },
  {
    id: '2',
    name: { ptBR: 'Confluências', en: 'Confluences' },
    description: { ptBR: 'Encontros de culturas e paisagens', en: 'Cultural and landscape convergences' },
    year: 2019,
    artworkCount: 18,
    coverImage: '/placeholder-artwork.jpg',
    isActive: true,
    isSeasonal: false
  },
  {
    id: '3',
    name: { ptBR: 'Fragmentos do Real', en: 'Fragments of Reality' },
    description: { ptBR: 'Residência artística em Brooklyn', en: 'Artist residency in Brooklyn' },
    year: 2022,
    artworkCount: 15,
    coverImage: '/placeholder-artwork.jpg',
    isActive: true,
    isSeasonal: true,
    seasonStart: '2022-06-01',
    seasonEnd: '2022-12-31'
  }
]

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

interface Series {
  id: string
  name: { ptBR: string; en: string }
  description: { ptBR: string; en: string }
  year: number
  artworkCount: number
  coverImage?: string
  isActive: boolean
  isSeasonal: boolean
  seasonStart?: string
  seasonEnd?: string
}

export default function SeriesManagementPage() {
  const [series, setSeries] = useState<Series[]>(mockSeries)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const openCreateDialog = () => {
    setEditingSeries(null)
    reset({
      isActive: true,
      isSeasonal: false,
      year: new Date().getFullYear()
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (series: Series) => {
    setEditingSeries(series)
    reset({
      namePt: series.name.ptBR,
      nameEn: series.name.en,
      descriptionPt: series.description.ptBR,
      descriptionEn: series.description.en,
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
      // Mock API call - replace with actual service
      await new Promise(resolve => setTimeout(resolve, 1000))

      const seriesData: Series = {
        id: editingSeries?.id || Date.now().toString(),
        name: {
          ptBR: data.namePt,
          en: data.nameEn
        },
        description: {
          ptBR: data.descriptionPt || '',
          en: data.descriptionEn || ''
        },
        year: data.year,
        artworkCount: editingSeries?.artworkCount || 0,
        coverImage: editingSeries?.coverImage,
        isActive: data.isActive,
        isSeasonal: data.isSeasonal,
        seasonStart: data.isSeasonal ? data.seasonStart : undefined,
        seasonEnd: data.isSeasonal ? data.seasonEnd : undefined
      }

      if (editingSeries) {
        setSeries(prev => prev.map(s => s.id === editingSeries.id ? seriesData : s))
      } else {
        setSeries(prev => [seriesData, ...prev])
      }

      setIsDialogOpen(false)
      reset()
    } catch (error) {
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
      // Mock API call - replace with actual service
      await new Promise(resolve => setTimeout(resolve, 500))
      setSeries(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      setError('Failed to delete series')
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

      {/* Series Grid */}
      {series.length === 0 ? (
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
    </div>
  )
}