'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Plus, Edit2, Trash2, Eye, Search,
  Calendar, MapPin, Award, Users, Palette, Star, StarOff,
  Image as ImageIcon, Bell, BellOff
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'

import { ExhibitionsService, ExhibitionCreateData, ExhibitionUpdateData } from '@/services/exhibitions.service'
import { Exhibition } from '@/types'
import { ExhibitionRichForm, ExhibitionFormData, defaultFormData } from '@/components/admin/exhibitions/ExhibitionRichForm'

export default function ExhibitionsAdminPage() {
  const router = useRouter()
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null)

  // Form state
  const [formData, setFormData] = useState<ExhibitionFormData>(defaultFormData)
  const [saving, setSaving] = useState(false)

  // Load exhibitions
  const loadExhibitions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ExhibitionsService.getExhibitions()
      setExhibitions(data)
    } catch (err) {
      console.error('Error loading exhibitions:', err)
      setError('Failed to load exhibitions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadExhibitions()
  }, [loadExhibitions])

  // Get unique years for filter
  const years = [...new Set(exhibitions.map(e => e.year))].sort((a, b) => b - a)

  // Helper to get display title (prefer English, fallback to Portuguese)
  const getDisplayTitle = (exhibition: Exhibition) => exhibition.title.en || exhibition.title.ptBR
  const getDisplayDescription = (exhibition: Exhibition) => exhibition.description?.en || exhibition.description?.ptBR || ''

  // Filter exhibitions
  const filteredExhibitions = exhibitions.filter(exhibition => {
    const displayTitle = getDisplayTitle(exhibition)
    const matchesSearch = displayTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibition.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibition.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || exhibition.type === filterType
    const matchesYear = filterYear === 'all' || exhibition.year === parseInt(filterYear)
    return matchesSearch && matchesType && matchesYear
  })

  // Reset form
  const resetForm = () => {
    setFormData({ ...defaultFormData, year: new Date().getFullYear() })
  }

  // Helper to format date string for form
  const formatDateForInput = (date?: Date) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  const formatDateTimeForInput = (date?: Date) => {
    if (!date) return ''
    return date.toISOString().slice(0, 16)
  }

  // Open edit dialog
  const openEditDialog = (exhibition: Exhibition) => {
    setSelectedExhibition(exhibition)
    setFormData({
      titleEn: exhibition.title.en || '',
      titlePt: exhibition.title.ptBR || '',
      venue: exhibition.venue,
      location: exhibition.location,
      year: exhibition.year,
      type: exhibition.type,
      descriptionEn: exhibition.description?.en || '',
      descriptionPt: exhibition.description?.ptBR || '',
      contentEn: exhibition.content?.en || '',
      contentPt: exhibition.content?.ptBR || '',
      curatorName: exhibition.curatorName || '',
      curatorTextEn: exhibition.curatorText?.en || '',
      curatorTextPt: exhibition.curatorText?.ptBR || '',
      images: exhibition.images || [],
      videos: exhibition.videos || [],
      startDate: formatDateForInput(exhibition.startDate),
      endDate: formatDateForInput(exhibition.endDate),
      openingDate: formatDateTimeForInput(exhibition.openingDate),
      openingDetails: exhibition.openingDetails || '',
      featured: exhibition.featured,
      showPopup: exhibition.showPopup,
      externalUrl: exhibition.externalUrl || '',
      catalogUrl: exhibition.catalogUrl || '',
      imageFile: null
    })
    setShowEditDialog(true)
  }

  // Open preview dialog
  const openPreviewDialog = (exhibition: Exhibition) => {
    setSelectedExhibition(exhibition)
    setShowPreviewDialog(true)
  }

  // Handle create
  const handleCreate = async () => {
    try {
      setSaving(true)
      setError(null)

      const createData: ExhibitionCreateData = {
        title: { en: formData.titleEn, ptBR: formData.titlePt },
        venue: formData.venue,
        location: formData.location,
        year: formData.year,
        type: formData.type,
        description: { en: formData.descriptionEn, ptBR: formData.descriptionPt },
        content: { en: formData.contentEn, ptBR: formData.contentPt },
        curatorName: formData.curatorName || undefined,
        curatorText: formData.curatorTextEn || formData.curatorTextPt
          ? { en: formData.curatorTextEn, ptBR: formData.curatorTextPt }
          : undefined,
        images: formData.images,
        videos: formData.videos,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        openingDate: formData.openingDate ? new Date(formData.openingDate) : undefined,
        openingDetails: formData.openingDetails || undefined,
        featured: formData.featured,
        showPopup: formData.showPopup,
        externalUrl: formData.externalUrl || undefined,
        catalogUrl: formData.catalogUrl || undefined,
        imageFile: formData.imageFile || undefined
      }

      await ExhibitionsService.createExhibition(createData)
      await loadExhibitions()
      setShowCreateDialog(false)
      resetForm()
    } catch (err) {
      console.error('Error creating exhibition:', err)
      setError('Failed to create exhibition')
    } finally {
      setSaving(false)
    }
  }

  // Handle update
  const handleUpdate = async () => {
    if (!selectedExhibition) return

    try {
      setSaving(true)
      setError(null)

      const updateData: ExhibitionUpdateData = {
        title: { en: formData.titleEn, ptBR: formData.titlePt },
        venue: formData.venue,
        location: formData.location,
        year: formData.year,
        type: formData.type,
        description: { en: formData.descriptionEn, ptBR: formData.descriptionPt },
        content: { en: formData.contentEn, ptBR: formData.contentPt },
        curatorName: formData.curatorName || undefined,
        curatorText: formData.curatorTextEn || formData.curatorTextPt
          ? { en: formData.curatorTextEn, ptBR: formData.curatorTextPt }
          : undefined,
        images: formData.images,
        videos: formData.videos,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        openingDate: formData.openingDate ? new Date(formData.openingDate) : null,
        openingDetails: formData.openingDetails || undefined,
        featured: formData.featured,
        showPopup: formData.showPopup,
        externalUrl: formData.externalUrl || undefined,
        catalogUrl: formData.catalogUrl || undefined,
        newImageFile: formData.imageFile || undefined
      }

      await ExhibitionsService.updateExhibition(selectedExhibition.id, updateData)
      await loadExhibitions()
      setShowEditDialog(false)
      setSelectedExhibition(null)
      resetForm()
    } catch (err) {
      console.error('Error updating exhibition:', err)
      setError('Failed to update exhibition')
    } finally {
      setSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedExhibition) return

    try {
      setSaving(true)
      setError(null)

      await ExhibitionsService.deleteExhibition(selectedExhibition.id)
      await loadExhibitions()
      setShowDeleteDialog(false)
      setSelectedExhibition(null)
    } catch (err) {
      console.error('Error deleting exhibition:', err)
      setError('Failed to delete exhibition')
    } finally {
      setSaving(false)
    }
  }

  // Handle toggle featured
  const handleToggleFeatured = async (exhibition: Exhibition) => {
    try {
      await ExhibitionsService.toggleFeatured(exhibition.id, !exhibition.featured)
      await loadExhibitions()
    } catch (err) {
      console.error('Error toggling featured:', err)
      setError('Failed to update exhibition')
    }
  }

  // Handle toggle popup
  const handleTogglePopup = async (exhibition: Exhibition) => {
    try {
      await ExhibitionsService.togglePopup(exhibition.id, !exhibition.showPopup)
      await loadExhibitions()
    } catch (err) {
      console.error('Error toggling popup:', err)
      setError('Failed to update exhibition')
    }
  }

  // Get type badge color
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'solo':
        return <Badge className="bg-blue-100 text-blue-800"><Award className="w-3 h-3 mr-1" />Solo</Badge>
      case 'group':
        return <Badge className="bg-green-100 text-green-800"><Users className="w-3 h-3 mr-1" />Group</Badge>
      case 'residency':
        return <Badge className="bg-purple-100 text-purple-800"><Palette className="w-3 h-3 mr-1" />Residency</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  // Generate slug for exhibition
  const generateSlug = (exhibition: Exhibition) => {
    const title = getDisplayTitle(exhibition)
    return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${exhibition.year}`
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exhibitions</h1>
          <p className="text-gray-500">Manage your exhibition history and upcoming shows</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Exhibition
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search exhibitions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="solo">Solo</SelectItem>
                <SelectItem value="group">Group</SelectItem>
                <SelectItem value="residency">Residency</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{exhibitions.length}</div>
            <div className="text-sm text-gray-500">Total Exhibitions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {exhibitions.filter(e => e.type === 'solo').length}
            </div>
            <div className="text-sm text-gray-500">Solo Shows</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {exhibitions.filter(e => e.type === 'group').length}
            </div>
            <div className="text-sm text-gray-500">Group Shows</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {exhibitions.filter(e => e.type === 'residency').length}
            </div>
            <div className="text-sm text-gray-500">Residencies</div>
          </CardContent>
        </Card>
      </div>

      {/* Exhibitions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Exhibitions ({filteredExhibitions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExhibitions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No exhibitions found.</p>
              <p className="text-sm">Add your first exhibition to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Exhibition</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-[80px]">Year</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[80px]">Featured</TableHead>
                    <TableHead className="w-[80px]">Popup</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExhibitions.map((exhibition) => (
                    <TableRow key={exhibition.id}>
                      <TableCell>
                        {exhibition.image ? (
                          <div className="w-16 h-12 relative rounded overflow-hidden">
                            <Image
                              src={exhibition.image}
                              alt={getDisplayTitle(exhibition)}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{getDisplayTitle(exhibition)}</div>
                        {getDisplayDescription(exhibition) && (
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {getDisplayDescription(exhibition)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{exhibition.venue}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {exhibition.location}
                        </div>
                      </TableCell>
                      <TableCell>{exhibition.year}</TableCell>
                      <TableCell>{getTypeBadge(exhibition.type)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFeatured(exhibition)}
                        >
                          {exhibition.featured ? (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          ) : (
                            <StarOff className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePopup(exhibition)}
                          title={exhibition.showPopup ? 'Disable popup' : 'Enable popup'}
                        >
                          {exhibition.showPopup ? (
                            <Bell className="w-4 h-4 text-blue-500 fill-blue-100" />
                          ) : (
                            <BellOff className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPreviewDialog(exhibition)}
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(exhibition)}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedExhibition(exhibition)
                              setShowDeleteDialog(true)
                            }}
                            title="Delete"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Exhibition</DialogTitle>
            <DialogDescription>
              Add a new exhibition with rich content support
            </DialogDescription>
          </DialogHeader>
          <ExhibitionRichForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
            saving={saving}
            submitLabel="Create Exhibition"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Exhibition</DialogTitle>
            <DialogDescription>
              Update exhibition details and rich content
            </DialogDescription>
          </DialogHeader>
          <ExhibitionRichForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            onCancel={() => setShowEditDialog(false)}
            saving={saving}
            submitLabel="Save Changes"
            existingImage={selectedExhibition?.image}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exhibition</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedExhibition ? getDisplayTitle(selectedExhibition) : ''}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedExhibition ? getDisplayTitle(selectedExhibition) : ''}
              {selectedExhibition?.featured && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedExhibition && generateSlug(selectedExhibition)}
            </DialogDescription>
          </DialogHeader>
          {selectedExhibition && (
            <div className="space-y-4">
              {selectedExhibition.image && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <Image
                    src={selectedExhibition.image}
                    alt={getDisplayTitle(selectedExhibition)}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Venue</Label>
                  <p className="font-medium">{selectedExhibition.venue}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Location</Label>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedExhibition.location}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Year</Label>
                  <p className="font-medium">{selectedExhibition.year}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Type</Label>
                  <div className="mt-1">{getTypeBadge(selectedExhibition.type)}</div>
                </div>
              </div>
              {getDisplayDescription(selectedExhibition) && (
                <div>
                  <Label className="text-gray-500">Description</Label>
                  <p className="mt-1 text-gray-700">{getDisplayDescription(selectedExhibition)}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowPreviewDialog(false)
              if (selectedExhibition) openEditDialog(selectedExhibition)
            }}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
