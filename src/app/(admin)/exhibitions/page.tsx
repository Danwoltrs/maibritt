'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, EyeOff, Award, MapPin, Calendar, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ExhibitionsService } from '@/services'
import { Exhibition } from '@/types'
import { toast } from 'sonner'

export default function ExhibitionsAdminPage() {
  const router = useRouter()
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [filteredExhibitions, setFilteredExhibitions] = useState<Exhibition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [exhibitionToDelete, setExhibitionToDelete] = useState<Exhibition | null>(null)

  // Fetch exhibitions
  useEffect(() => {
    fetchExhibitions()
  }, [])

  const fetchExhibitions = async () => {
    try {
      setIsLoading(true)
      const data = await ExhibitionsService.getExhibitions({ includeHidden: true })
      setExhibitions(data)
      setFilteredExhibitions(data)
    } catch (error) {
      console.error('Error fetching exhibitions:', error)
      toast.error('Failed to load exhibitions')
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters
  useEffect(() => {
    let result = exhibitions

    // Search filter
    if (searchQuery) {
      result = result.filter(ex =>
        ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(ex => ex.type === typeFilter)
    }

    // Visibility filter
    if (visibilityFilter === 'visible') {
      result = result.filter(ex => ex.isVisible)
    } else if (visibilityFilter === 'hidden') {
      result = result.filter(ex => !ex.isVisible)
    }

    setFilteredExhibitions(result)
  }, [searchQuery, typeFilter, visibilityFilter, exhibitions])

  const handleToggleVisibility = async (exhibition: Exhibition) => {
    try {
      await ExhibitionsService.toggleVisibility(exhibition.id, !exhibition.isVisible)
      toast.success(
        exhibition.isVisible ? 'Exhibition hidden from timeline' : 'Exhibition now visible on timeline'
      )
      fetchExhibitions()
    } catch (error) {
      console.error('Error toggling visibility:', error)
      toast.error('Failed to update visibility')
    }
  }

  const handleToggleFeatured = async (exhibition: Exhibition) => {
    try {
      await ExhibitionsService.toggleFeatured(exhibition.id, !exhibition.featured)
      toast.success(
        exhibition.featured ? 'Removed from featured' : 'Marked as featured'
      )
      fetchExhibitions()
    } catch (error) {
      console.error('Error toggling featured:', error)
      toast.error('Failed to update featured status')
    }
  }

  const handleDelete = async () => {
    if (!exhibitionToDelete) return

    try {
      await ExhibitionsService.deleteExhibition(exhibitionToDelete.id)
      toast.success('Exhibition deleted successfully')
      setDeleteDialogOpen(false)
      setExhibitionToDelete(null)
      fetchExhibitions()
    } catch (error) {
      console.error('Error deleting exhibition:', error)
      toast.error('Failed to delete exhibition')
    }
  }

  const getExhibitionIcon = (type: string) => {
    switch (type) {
      case 'solo':
        return <Award className="w-4 h-4" />
      case 'group':
        return <MapPin className="w-4 h-4" />
      case 'residency':
        return <Calendar className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'solo':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'group':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'residency':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const stats = {
    total: exhibitions.length,
    visible: exhibitions.filter(ex => ex.isVisible).length,
    hidden: exhibitions.filter(ex => !ex.isVisible).length,
    featured: exhibitions.filter(ex => ex.featured).length,
    solo: exhibitions.filter(ex => ex.type === 'solo').length,
    group: exhibitions.filter(ex => ex.type === 'group').length,
    residency: exhibitions.filter(ex => ex.type === 'residency').length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light text-gray-900 mb-2">Exhibitions Management</h1>
          <p className="text-gray-600">Manage your exhibition history and upcoming shows</p>
        </div>
        <Button
          onClick={() => router.push('/exhibitions/new')}
          className="bg-gray-900 hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Exhibition
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Exhibitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Visible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.visible}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Hidden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.hidden}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Featured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.featured}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search exhibitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="solo">Solo ({stats.solo})</SelectItem>
                <SelectItem value="group">Group ({stats.group})</SelectItem>
                <SelectItem value="residency">Residency ({stats.residency})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exhibitions</SelectItem>
                <SelectItem value="visible">Visible Only</SelectItem>
                <SelectItem value="hidden">Hidden Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exhibitions List */}
      <div className="space-y-4">
        {filteredExhibitions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No exhibitions found</p>
            </CardContent>
          </Card>
        ) : (
          filteredExhibitions.map((exhibition, index) => (
            <motion.div
              key={exhibition.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Card className={`overflow-hidden ${!exhibition.isVisible ? 'opacity-60' : ''}`}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    {exhibition.image && (
                      <div className="relative w-full md:w-48 h-48 md:h-auto">
                        <Image
                          src={exhibition.image}
                          alt={exhibition.title}
                          fill
                          className="object-cover"
                        />
                        {!exhibition.isVisible && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <EyeOff className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-medium text-gray-900">{exhibition.title}</h3>
                            {exhibition.featured && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <Award className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span className="font-medium">{exhibition.venue}</span>
                              <span>• {exhibition.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{exhibition.year}</span>
                              <Badge variant="outline" className={`${getTypeColor(exhibition.type)} ml-2`}>
                                {getExhibitionIcon(exhibition.type)}
                                <span className="ml-1 capitalize">{exhibition.type}</span>
                              </Badge>
                            </div>
                          </div>
                          {exhibition.description && (
                            <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                              {exhibition.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleVisibility(exhibition)}
                        >
                          {exhibition.isVisible ? (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Hidden
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleFeatured(exhibition)}
                        >
                          <Award className={`w-4 h-4 mr-2 ${exhibition.featured ? 'text-yellow-600' : ''}`} />
                          {exhibition.featured ? 'Featured' : 'Feature'}
                        </Button>
                        <div className="flex-1"></div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/exhibitions/${exhibition.id}/edit`)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setExhibitionToDelete(exhibition)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exhibition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{exhibitionToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
