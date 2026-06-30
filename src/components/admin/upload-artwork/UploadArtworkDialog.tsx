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
import { PerImageDetailsStep, type EnhancedResult } from './PerImageDetailsStep'
import type { UploadedImage, ArtworkDetails, CommonMetadata, ApplyToAll } from './types'
import { useBackgroundUploads } from './useBackgroundUploads'
import { saveDraft, loadDraft, clearDraft, draftHasContent } from './draftStorage'
import { filesToUploadedImages } from './imageFiles'
import { SessionRecoveryDialog } from './SessionRecoveryDialog'

// ─── Types ──────────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  { value: 'painting', label: 'Painting / Pintura' },
  { value: 'sculpture', label: 'Sculpture / Escultura' },
  { value: 'engraving', label: 'Engravings / Gravuras' },
  { value: 'video', label: 'Video / Vídeo' },
  { value: 'installations', label: 'Installations / Instalações' },
  { value: 'mixed-media', label: 'Mixed Media / Mídia Mista' },
]

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
  const [step, setStep] = useState<'upload' | 'details' | 'finalizing' | 'success'>('upload')

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
  // Approved AI-enhanced (taut + framed) result per image index
  const [enhancedByIndex, setEnhancedByIndex] = useState<Record<number, EnhancedResult>>({})

  // Session recovery state
  const [recovery, setRecovery] = useState<{
    artworkCount: number
    savedAt: string
    fileNames: string[]
    draftDetails: Record<number, ArtworkDetails>
    draftCommon: CommonMetadata
    draftApplyToAll: ApplyToAll
  } | null>(null)

  const uploads = useBackgroundUploads()

  useEffect(() => {
    if (step === 'finalizing' && uploads.allDone) {
      clearDraft()
      setStep('success')
      fireConfetti()
    }
  }, [step, uploads.allDone])

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

  // Check for saved draft when dialog opens
  useEffect(() => {
    if (!open) return
    const draft = loadDraft()
    if (!draft || !draftHasContent(draft)) return
    const artworkCount = Object.values(draft.artworkDetails).filter(
      (d) => (d.titleEn || d.titlePt || d.descriptionEn || d.descriptionPt || '').trim()
    ).length
    setRecovery({
      artworkCount,
      savedAt: draft.savedAt,
      fileNames: draft.fileHints.map((f) => f.name),
      draftDetails: draft.artworkDetails,
      draftCommon: draft.commonMeta,
      draftApplyToAll: draft.applyToAll,
    })
  }, [open])

  // Warn before unload when there is unsaved upload work
  useEffect(() => {
    if (step === 'success' || step === 'upload') return
    const hasUnsaved =
      uploads.pendingCount > 0 ||
      uploads.failedCount > 0 ||
      Object.values(artworkDetails).some(
        (d) =>
          (d.titleEn || d.titlePt || d.descriptionEn || d.descriptionPt || '').trim()
      )
    if (!hasUnsaved) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [step, uploads.pendingCount, uploads.failedCount, artworkDetails])

  // Debounced save effect
  useEffect(() => {
    if (step === 'success') return
    const handle = setTimeout(() => {
      saveDraft({
        commonMeta,
        applyToAll,
        artworkDetails,
        fileHints: images.map((img) => ({
          name: img.file.name,
          size: img.file.size,
        })),
      })
    }, 500)
    return () => clearTimeout(handle)
  }, [step, commonMeta, applyToAll, artworkDetails, images])

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    clearDraft()
    setStep('upload')
    setImages([])
    setCommonMeta({ year: new Date().getFullYear() })
    setApplyToAll({ category: false, year: false })
    setShowNewCategory(false)
    setNewCategoryValue('')
    setNewCategoryLabel('')
    setArtworkDetails({})
    setEnhancedByIndex({})
    setError(null)
    onClose()
  }, [onClose])

  // Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 20,
    maxSize: 50 * 1024 * 1024,
    onDrop: (accepted) => {
      const newImages = filesToUploadedImages(accepted)
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

  // Build payload for a single artwork
  const buildPayload = useCallback(
    (i: number) => {
      const d = artworkDetails[i]
      const category = applyToAll.category ? commonMeta.category : d?.category
      const year = applyToAll.year ? commonMeta.year : d?.year ?? new Date().getFullYear()
      return {
        title: { ptBR: d.titlePt, en: d.titleEn },
        year,
        medium: { ptBR: d.mediumPt, en: d.mediumEn },
        dimensions: d.dimensions,
        description: { ptBR: d.descriptionPt, en: d.descriptionEn },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: category as any,
        images: [images[i].file],
        featured: d.featured,
        // Single-image payload → the enhanced result maps to image index 0
        enhancements: enhancedByIndex[i] ? { 0: enhancedByIndex[i] } : undefined,
      }
    },
    [artworkDetails, applyToAll, commonMeta, images, enhancedByIndex]
  )

  // Submit all artworks
  const handleSubmit = async () => {
    setError(null)
    setStep('finalizing')
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
        onUploadIndex={(i) => {
          const state = uploads.getState(i)
          if (state.status === 'uploaded') {
            uploads.updateUploaded(i, buildPayload(i))
          } else {
            uploads.startUpload(i, buildPayload(i))
          }
        }}
        onRetryIndex={(i) => uploads.retry(i)}
        getUploadState={uploads.getState}
        error={error}
        enhancedByIndex={enhancedByIndex}
        onFramed={(i, urls) => setEnhancedByIndex(prev => ({ ...prev, [i]: urls }))}
      />
    )
  }

  // ─── Step 3: Finalizing ────────────────────────────────────────────────────
  if (step === 'finalizing') {
    const failedIndices = images
      .map((_, i) => i)
      .filter((i) => uploads.getState(i).status === 'failed')

    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[500px]"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {failedIndices.length > 0 ? 'Some uploads need attention' : 'Finalizing…'}
            </DialogTitle>
          </DialogHeader>

          {failedIndices.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="h-10 w-10 mx-auto text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">
                Finalizing {uploads.pendingCount} of {images.length} still uploading…
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-sm text-gray-600">
                {failedIndices.length} artwork{failedIndices.length === 1 ? '' : 's'} failed to upload.
              </p>
              <ul className="space-y-2">
                {failedIndices.map((i) => {
                  const state = uploads.getState(i)
                  const errorMsg = state.status === 'failed' ? state.error : 'Unknown error'
                  const title = artworkDetails[i]?.titleEn || artworkDetails[i]?.titlePt || `Artwork ${i + 1}`
                  return (
                    <li key={i} className="flex items-center gap-3 border rounded-md p-2">
                      <img src={images[i].preview} alt="" className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{title}</p>
                        <p className="text-xs text-red-600 truncate">{errorMsg}</p>
                      </div>
                      <Button size="sm" onClick={() => uploads.retry(i)}>Retry</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStep('details')}
                      >
                        Edit
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
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
              {uploads.uploadedCount} Artwork{uploads.uploadedCount > 1 ? 's' : ''} Created!
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

  // ─── Session Recovery ─────────────────────────────────────────────────────
  if (recovery) {
    return (
      <SessionRecoveryDialog
        open={true}
        artworkCount={recovery.artworkCount}
        savedAt={recovery.savedAt}
        fileNames={recovery.fileNames}
        onResume={() => {
          setCommonMeta(recovery.draftCommon)
          setApplyToAll(recovery.draftApplyToAll)
          setArtworkDetails(recovery.draftDetails)
          setRecovery(null)
        }}
        onStartFresh={() => {
          clearDraft()
          setRecovery(null)
        }}
      />
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
