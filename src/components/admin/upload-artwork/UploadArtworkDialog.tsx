'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ImageIcon,
  Upload,
  X,
  Plus,
  ChevronRight,
  AlertCircle,
  PartyPopper,
  Loader2,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { useDropzone } from 'react-dropzone'

import { ArtworkService } from '@/services/artwork.service'
import { PerImageDetailsStep, type ArtworkDetails } from './PerImageDetailsStep'

// ─── Types ──────────────────────────────────────────────────────────────────

interface UploadedImage {
  file: File
  preview: string
}

const DEFAULT_CATEGORIES = [
  { value: 'painting', label: 'Painting / Pintura' },
  { value: 'sculpture', label: 'Sculpture / Escultura' },
  { value: 'engraving', label: 'Engravings / Gravuras' },
  { value: 'video', label: 'Video / Vídeo' },
  { value: 'installations', label: 'Installations / Instalações' },
  { value: 'mixed-media', label: 'Mixed Media / Mídia Mista' },
]

interface CommonMetadata {
  category?: string
  year?: number
}

interface ApplyToAll {
  category: boolean
  year: boolean
}

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear; y >= 2012; y--) years.push(y)
  return years
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface UploadArtworkDialogProps {
  open: boolean
  onClose: () => void
}

// ─── Component ──────────────────────────────────────────────────────────────

export function UploadArtworkDialog({ open, onClose }: UploadArtworkDialogProps) {
  const [step, setStep] = useState<'upload' | 'details' | 'submitting' | 'success'>('upload')

  // Step 1 state
  const [images, setImages] = useState<UploadedImage[]>([])
  const [commonMeta, setCommonMeta] = useState<CommonMetadata>({ year: new Date().getFullYear() })
  const [applyToAll, setApplyToAll] = useState<ApplyToAll>({ category: false, year: false })
  const [categoryOptions, setCategoryOptions] = useState(DEFAULT_CATEGORIES)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryValue, setNewCategoryValue] = useState('')
  const [newCategoryLabel, setNewCategoryLabel] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Step 2 state
  const [artworkDetails, setArtworkDetails] = useState<Record<number, ArtworkDetails>>({})

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Load categories when dialog opens
  useEffect(() => {
    if (open) {
      ArtworkService.getCategories().then(dbCats => {
        const merged = [...DEFAULT_CATEGORIES]
        dbCats.forEach(cat => {
          if (!merged.find(c => c.value === cat)) {
            merged.push({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) })
          }
        })
        setCategoryOptions(merged)
      }).catch(console.error)
    }
  }, [open])

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    setStep('upload')
    setImages([])
    setCommonMeta({ year: new Date().getFullYear() })
    setApplyToAll({ category: false, year: false })
    setShowNewCategory(false)
    setNewCategoryValue('')
    setNewCategoryLabel('')
    setArtworkDetails({})
    setError(null)
    setIsSubmitting(false)
    setUploadProgress(0)
    onClose()
  }, [onClose])

  // Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 20,
    maxSize: 50 * 1024 * 1024,
    onDrop: (accepted) => {
      const newImages = accepted.map(file => ({ file, preview: URL.createObjectURL(file) }))
      setImages(prev => [...prev, ...newImages])
      setError(null)
    },
    onDropRejected: (rejected) => {
      setError(`Some files were rejected: ${rejected.map(r => r.errors.map(e => e.message).join(', ')).join('; ')}`)
    },
  })

  const removeImage = (index: number) => {
    URL.revokeObjectURL(images[index].preview)
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // Proceed to step 2
  const handleContinue = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image')
      return
    }

    // Initialize per-image details
    const details: Record<number, ArtworkDetails> = {}
    images.forEach((_, i) => {
      details[i] = {
        titlePt: '', titleEn: '', mediumPt: '', mediumEn: '',
        dimensions: '', descriptionPt: '', descriptionEn: '', featured: false,
      }
    })
    setArtworkDetails(details)
    setError(null)
    setStep('details')
  }

  // Update per-image details
  const handleUpdateDetails = (index: number, updates: Partial<ArtworkDetails>) => {
    setArtworkDetails(prev => ({
      ...prev,
      [index]: { ...prev[index], ...updates },
    }))
  }

  // Submit all artworks
  const handleSubmit = async () => {
    const category = applyToAll.category ? commonMeta.category : undefined
    const year = applyToAll.year ? commonMeta.year : new Date().getFullYear()

    setIsSubmitting(true)
    setError(null)
    setStep('submitting')

    try {
      for (let i = 0; i < images.length; i++) {
        const d = artworkDetails[i]
        await ArtworkService.createArtwork({
          title: { ptBR: d.titlePt, en: d.titleEn },
          year: year,
          medium: { ptBR: d.mediumPt, en: d.mediumEn },
          dimensions: d.dimensions,
          description: { ptBR: d.descriptionPt, en: d.descriptionEn },
          category: category as any,
          images: [images[i].file],
          featured: d.featured,
        }, (progress) => {
          const overall = ((i / images.length) * 100) + (progress.percentage / images.length)
          setUploadProgress(Math.round(overall))
        })
      }

      setStep('success')
      fireConfetti()
    } catch (err) {
      console.error('Failed to create artworks:', err)
      setError(err instanceof Error ? err.message : 'Failed to create artworks')
      setStep('details')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add new category handler
  const handleAddCategory = () => {
    const val = newCategoryValue.trim().toLowerCase().replace(/\s+/g, '-')
    const label = newCategoryLabel.trim() || newCategoryValue.trim()
    if (!val) return
    if (!categoryOptions.find(c => c.value === val)) {
      setCategoryOptions(prev => [...prev, { value: val, label }])
    }
    setCommonMeta(prev => ({ ...prev, category: val }))
    setNewCategoryValue('')
    setNewCategoryLabel('')
    setShowNewCategory(false)
  }

  // Computed values for step 2
  const commonApplied = {
    category: applyToAll.category ? commonMeta.category : undefined,
    year: applyToAll.year ? commonMeta.year : undefined,
  }

  // ─── Step 2: Per-Image Details (fullscreen, rendered outside dialog) ────
  if (step === 'details') {
    return (
      <PerImageDetailsStep
        images={images}
        artworkDetails={artworkDetails}
        onUpdateDetails={handleUpdateDetails}
        commonApplied={commonApplied}
        onBack={() => setStep('upload')}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        uploadProgress={uploadProgress}
        error={error}
      />
    )
  }

  // ─── Step 3: Submitting progress ───────────────────────────────────────────
  if (step === 'submitting') {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px]" onPointerDownOutside={e => e.preventDefault()}>
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin" />
            <h2 className="text-xl font-semibold">Uploading Artworks...</h2>
            <div className="w-full bg-gray-200 rounded-full h-2 mx-auto max-w-xs">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ─── Step 4: Success ──────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[450px]">
          <div className="py-12 text-center space-y-4">
            <PartyPopper className="h-16 w-16 mx-auto text-yellow-500 animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-900">
              {images.length} Artwork{images.length > 1 ? 's' : ''} Created!
            </h2>
            <p className="text-gray-600">
              Your artworks have been uploaded successfully.
            </p>
            <Button onClick={handleClose} className="mt-4">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ─── Step 1: Upload & Common Metadata ─────────────────────────────────────
  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Upload Artworks
            </DialogTitle>
            <DialogDescription>
              Upload images and set common properties. You'll add individual details in the next step.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-5 py-2">
            {/* Drag & drop zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {images.length > 0 ? 'Add more images' : 'Drag & drop images here, or click to select'}
              </p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 50MB each (max 20)</p>
            </div>

            {/* Image thumbnails */}
            {images.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  {images.length} image{images.length > 1 ? 's' : ''} selected
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={img.preview}
                        alt={`Upload ${i + 1}`}
                        className="w-full h-20 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                        {(img.file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common properties */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-sm font-semibold text-gray-700">Common Properties</h3>

              {/* Work (category) + Year on same row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Work (category) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Work</Label>
                    {images.length > 1 && (
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          id="applyCatAll"
                          checked={applyToAll.category}
                          onCheckedChange={(checked) =>
                            setApplyToAll(prev => ({ ...prev, category: checked as boolean }))
                          }
                        />
                        <Label htmlFor="applyCatAll" className="text-xs text-gray-500 cursor-pointer font-normal">
                          Same for all
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={commonMeta.category || ''}
                      onValueChange={(v) => setCommonMeta(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select work" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNewCategory(true)}
                      title="Add new category"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {showNewCategory && (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={newCategoryValue}
                          onChange={(e) => setNewCategoryValue(e.target.value)}
                          placeholder="e.g. Ceramics"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Label (optional)</Label>
                        <Input
                          value={newCategoryLabel}
                          onChange={(e) => setNewCategoryLabel(e.target.value)}
                          placeholder="e.g. Ceramics / Cerâmica"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        />
                      </div>
                      <Button size="sm" onClick={handleAddCategory}>Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setShowNewCategory(false); setNewCategoryValue(''); setNewCategoryLabel('') }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Year */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Year</Label>
                    {images.length > 1 && (
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          id="applyYearAll"
                          checked={applyToAll.year}
                          onCheckedChange={(checked) =>
                            setApplyToAll(prev => ({ ...prev, year: checked as boolean }))
                          }
                        />
                        <Label htmlFor="applyYearAll" className="text-xs text-gray-500 cursor-pointer font-normal">
                          Same for all
                        </Label>
                      </div>
                    )}
                  </div>
                  <Select
                    value={commonMeta.year?.toString()}
                    onValueChange={(v) => setCommonMeta(prev => ({ ...prev, year: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateYearOptions().map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleContinue} disabled={images.length === 0}>
              Continue to Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  )
}

// ─── Confetti helper ────────────────────────────────────────────────────────

function fireConfetti() {
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
  setTimeout(() => {
    confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } })
  }, 200)
  setTimeout(() => {
    confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } })
  }, 400)
  setTimeout(() => {
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }
    confetti({ ...defaults, particleCount: 30, origin: { x: 0.3, y: 0.3 } })
    confetti({ ...defaults, particleCount: 30, origin: { x: 0.7, y: 0.4 } })
  }, 600)
}
