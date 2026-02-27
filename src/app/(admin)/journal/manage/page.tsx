'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  Plus, Edit2, Trash2, Eye, Search,
  BookOpen, Star, StarOff, Globe, GlobeLock,
  Image as ImageIcon, Clock, Tag
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

import { JournalService, JournalPost, JournalPostCreateData, JournalPostUpdateData } from '@/services/journal.service'
import { JournalPostForm, JournalFormData, defaultJournalFormData } from '@/components/admin/journal/JournalPostForm'

export default function JournalAdminPage() {
  const [posts, setPosts] = useState<JournalPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPost, setSelectedPost] = useState<JournalPost | null>(null)

  // Form state
  const [formData, setFormData] = useState<JournalFormData>(defaultJournalFormData)
  const [saving, setSaving] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalPosts: 0, publishedPosts: 0, draftPosts: 0,
    totalViews: 0, featuredPosts: 0, uniqueTags: 0
  })

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [result, journalStats] = await Promise.all([
        JournalService.getJournalPosts(),
        JournalService.getJournalStats()
      ])
      setPosts(result.posts)
      setStats(journalStats)
    } catch (err) {
      console.error('Error loading journal posts:', err)
      setError('Failed to load journal posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  const getDisplayTitle = (post: JournalPost) => post.title.en || post.title.ptBR || 'Untitled'

  const filteredPosts = posts.filter(post => {
    const title = getDisplayTitle(post)
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' && post.published) ||
      (filterStatus === 'draft' && !post.published) ||
      (filterStatus === 'featured' && post.featured)
    return matchesSearch && matchesStatus
  })

  const resetForm = () => setFormData({ ...defaultJournalFormData })

  const formatDateForInput = (date?: Date) => {
    if (!date) return ''
    return new Date(date).toISOString().slice(0, 16)
  }

  const openEditDialog = (post: JournalPost) => {
    setSelectedPost(post)
    setFormData({
      titleEn: post.title.en || '',
      titlePt: post.title.ptBR || '',
      contentEn: post.content.en,
      contentPt: post.content.ptBR,
      excerptEn: post.excerpt?.en || '',
      excerptPt: post.excerpt?.ptBR || '',
      coverImageFile: null,
      tags: post.tags || [],
      published: post.published,
      publishedAt: formatDateForInput(post.publishedAt),
      featured: post.featured,
    })
    setShowEditDialog(true)
  }

  const handleCreate = async () => {
    try {
      setSaving(true)
      setError(null)

      const createData: JournalPostCreateData = {
        title: { en: formData.titleEn, ptBR: formData.titlePt },
        content: { en: formData.contentEn, ptBR: formData.contentPt },
        excerpt: (formData.excerptEn || formData.excerptPt)
          ? { en: formData.excerptEn, ptBR: formData.excerptPt }
          : undefined,
        coverImageFile: formData.coverImageFile || undefined,
        tags: formData.tags,
        published: formData.published,
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt) : undefined,
        featured: formData.featured,
      }

      await JournalService.createJournalPost(createData)
      await loadPosts()
      setShowCreateDialog(false)
      resetForm()
    } catch (err) {
      console.error('Error creating journal post:', err)
      setError('Failed to create journal post')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedPost) return
    try {
      setSaving(true)
      setError(null)

      const updateData: JournalPostUpdateData = {
        title: { en: formData.titleEn, ptBR: formData.titlePt },
        content: { en: formData.contentEn, ptBR: formData.contentPt },
        excerpt: { en: formData.excerptEn, ptBR: formData.excerptPt },
        newCoverImageFile: formData.coverImageFile || undefined,
        tags: formData.tags,
        published: formData.published,
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt) : undefined,
        featured: formData.featured,
      }

      await JournalService.updateJournalPost(selectedPost.id, updateData)
      await loadPosts()
      setShowEditDialog(false)
      setSelectedPost(null)
      resetForm()
    } catch (err) {
      console.error('Error updating journal post:', err)
      setError('Failed to update journal post')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPost) return
    try {
      setSaving(true)
      setError(null)
      await JournalService.deleteJournalPost(selectedPost.id)
      await loadPosts()
      setShowDeleteDialog(false)
      setSelectedPost(null)
    } catch (err) {
      console.error('Error deleting journal post:', err)
      setError('Failed to delete journal post')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleFeatured = async (post: JournalPost) => {
    try {
      await JournalService.toggleFeatured(post.id, !post.featured)
      await loadPosts()
    } catch (err) {
      console.error('Error toggling featured:', err)
      setError('Failed to update journal post')
    }
  }

  const handleTogglePublished = async (post: JournalPost) => {
    try {
      await JournalService.togglePublished(post.id, !post.published)
      await loadPosts()
    } catch (err) {
      console.error('Error toggling published:', err)
      setError('Failed to update journal post')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
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
          <h1 className="text-2xl font-bold text-gray-900">Journal</h1>
          <p className="text-gray-500">Manage journal entries and blog posts</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{stats.totalPosts}</div>
            <div className="text-sm text-gray-500">Total Entries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.publishedPosts}</div>
            <div className="text-sm text-gray-500">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{stats.draftPosts}</div>
            <div className="text-sm text-gray-500">Drafts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
            <div className="text-sm text-gray-500">Total Views</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Entries ({filteredPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No journal entries found.</p>
              <p className="text-sm">Create your first entry to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Cover</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Views</TableHead>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[80px]">Featured</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        {post.coverImage ? (
                          <div className="w-16 h-12 relative rounded overflow-hidden">
                            <Image
                              src={post.coverImage}
                              alt={getDisplayTitle(post)}
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
                        <div className="font-medium">{getDisplayTitle(post)}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {post.tags?.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                            </Badge>
                          ))}
                          {(post.tags?.length || 0) > 3 && (
                            <span className="text-xs text-gray-400">+{post.tags!.length - 3}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublished(post)}
                          className="p-1 h-auto"
                        >
                          {post.published ? (
                            <Badge className="bg-green-100 text-green-800 gap-1">
                              <Globe className="w-3 h-3" />Public
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <GlobeLock className="w-3 h-3" />Draft
                            </Badge>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Eye className="w-3 h-3" />
                          {post.viewCount}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-2.5 h-2.5" />
                          {post.readingTime} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString()
                            : new Date(post.createdAt).toLocaleDateString()
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFeatured(post)}
                        >
                          {post.featured ? (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          ) : (
                            <StarOff className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(post)}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPost(post)
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
            <DialogTitle>New Journal Entry</DialogTitle>
            <DialogDescription>
              Create a new journal entry with rich content
            </DialogDescription>
          </DialogHeader>
          <JournalPostForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
            saving={saving}
            submitLabel="Create Entry"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Journal Entry</DialogTitle>
            <DialogDescription>
              Update journal entry content and settings
            </DialogDescription>
          </DialogHeader>
          <JournalPostForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            onCancel={() => setShowEditDialog(false)}
            saving={saving}
            submitLabel="Save Changes"
            existingCoverImage={selectedPost?.coverImage}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Journal Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedPost ? getDisplayTitle(selectedPost) : ''}&quot;?
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
    </div>
  )
}
