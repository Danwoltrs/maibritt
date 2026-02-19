'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Image,
  FolderOpen,
  TrendingUp,
  Building,
  PenTool,
  Calendar,
  PartyPopper,
  Upload,
  X,
} from 'lucide-react'
import confetti from 'canvas-confetti'

export type QuickAction =
  | 'upload-artwork'
  | 'add-series'
  | 'record-sale'
  | 'view-galleries'
  | 'write-journal'
  | 'upcoming-exhibition'
  | null

interface QuickActionDialogsProps {
  activeAction: QuickAction
  onClose: () => void
}

export function QuickActionDialogs({ activeAction, onClose }: QuickActionDialogsProps) {
  return (
    <>
      <UploadArtworkDialog open={activeAction === 'upload-artwork'} onClose={onClose} />
      <AddSeriesDialog open={activeAction === 'add-series'} onClose={onClose} />
      <RecordSaleDialog open={activeAction === 'record-sale'} onClose={onClose} />
      <ViewGalleriesDialog open={activeAction === 'view-galleries'} onClose={onClose} />
      <WriteJournalDialog open={activeAction === 'write-journal'} onClose={onClose} />
      <UpcomingExhibitionDialog open={activeAction === 'upcoming-exhibition'} onClose={onClose} />
    </>
  )
}

function UploadArtworkDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [medium, setMedium] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [year, setYear] = useState('')

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Upload New Artwork
          </DialogTitle>
          <DialogDescription>Add a new artwork to your portfolio.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Title</label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Artwork title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Image</label>
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer">
              <div className="text-center">
                <Image className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-1 text-sm text-gray-500">Click to upload or drag and drop</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Medium</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Oil on canvas"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Year</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. 2024"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Dimensions</label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. 100 x 80 cm"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button>Upload Artwork</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddSeriesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Add Series
          </DialogTitle>
          <DialogDescription>Create a new series or collection.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Series Name</label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Series name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Describe this series..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button>Create Series</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function fireConfetti() {
  // Initial burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  })
  // Left side
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
    })
  }, 200)
  // Right side
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
    })
  }, 400)
  // Fireworks-style starbursts
  setTimeout(() => {
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }
    confetti({ ...defaults, particleCount: 30, origin: { x: 0.3, y: 0.3 } })
    confetti({ ...defaults, particleCount: 30, origin: { x: 0.7, y: 0.4 } })
  }, 600)
}

function RecordSaleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [artwork, setArtwork] = useState('')
  const [price, setPrice] = useState('')
  const [buyer, setBuyer] = useState('')
  const [date, setDate] = useState('')
  const [celebrated, setCelebrated] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState('')

  const celebrationMessages = [
    'Sådan!',
    'Tillykke!',
    'Tillykke mor!',
    'Kæmpe stort!',
    'Boa mãe!!',
    'Sådan mor!!',
    'Flot!',
    'Juppiiii!',
    'Yumalauutaaa!',
  ]

  const handleRecordSale = () => {
    setCelebrationMessage(celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)])
    setCelebrated(true)
    fireConfetti()
    // Reset after a delay so next open is fresh
    setTimeout(() => {
      setCelebrated(false)
      onClose()
    }, 3000)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) {
        setCelebrated(false)
        onClose()
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        {celebrated ? (
          <div className="py-12 text-center space-y-4">
            <PartyPopper className="h-16 w-16 mx-auto text-yellow-500 animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-900">{celebrationMessage}</h2>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Record Sale
              </DialogTitle>
              <DialogDescription>Record a new artwork sale.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Artwork</label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Search artwork..."
                  value={artwork}
                  onChange={(e) => setArtwork(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Price</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="e.g. 5000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Buyer</label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Buyer name or gallery"
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleRecordSale}>Record Sale</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ViewGalleriesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Active Galleries
          </DialogTitle>
          <DialogDescription>Your current gallery partnerships.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center py-8">
              Gallery data will load from your database.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button asChild>
            <a href="/galleries">Manage Galleries</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function WriteJournalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Write Journal Entry
          </DialogTitle>
          <DialogDescription>Capture your thoughts and reflections.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Title</label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Entry title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Content</label>
            <textarea
              className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Write your journal entry..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button>Save Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const COUNTRIES = [
  'Denmark', 'Brazil', 'United States', 'United Kingdom', 'Germany', 'France',
  'Spain', 'Italy', 'Portugal', 'Netherlands', 'Sweden', 'Norway', 'Finland',
  'Switzerland', 'Austria', 'Belgium', 'Japan', 'China', 'South Korea',
  'Australia', 'Canada', 'Mexico', 'Argentina', 'Colombia', 'Chile',
  'India', 'UAE', 'Israel', 'South Africa', 'Nigeria', 'Singapore',
  'Thailand', 'Indonesia', 'Turkey', 'Greece', 'Poland', 'Czech Republic',
  'Ireland', 'New Zealand', 'Iceland', 'Luxembourg', 'Monaco',
]

const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

function UpcomingExhibitionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [venue, setVenue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [country, setCountry] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [addressQuery, setAddressQuery] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{
    display: string
    street?: string
    number?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImagePreview(null)
    setImageFile(null)
  }

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      setAddressSuggestions(
        data.map((item: { display_name: string; address: { road?: string; house_number?: string; city?: string; town?: string; village?: string; state?: string; postcode?: string; country?: string } }) => ({
          display: item.display_name,
          street: item.address?.road || '',
          number: item.address?.house_number || '',
          city: item.address?.city || item.address?.town || item.address?.village || '',
          state: item.address?.state || '',
          postcode: item.address?.postcode || '',
          country: item.address?.country || '',
        }))
      )
      setShowSuggestions(true)
    } catch {
      setAddressSuggestions([])
    } finally {
      setSearching(false)
    }
  }

  const handleAddressQueryChange = (value: string) => {
    setAddressQuery(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchAddress(value), 400)
  }

  const selectSuggestion = (suggestion: typeof addressSuggestions[0]) => {
    setStreet(suggestion.street || '')
    setNumber(suggestion.number || '')
    setCity(suggestion.city || '')
    setState(suggestion.state || '')
    setZipCode(suggestion.postcode || '')
    const matchedCountry = COUNTRIES.find(
      (c) => c.toLowerCase() === suggestion.country?.toLowerCase()
    )
    if (matchedCountry) setCountry(matchedCountry)
    setAddressQuery(suggestion.display)
    setShowSuggestions(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Exhibition
          </DialogTitle>
          <DialogDescription>Add a new upcoming exhibition.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Exhibition Name</label>
            <input
              className={inputClass}
              placeholder="Exhibition name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Venue</label>
            <input
              className={inputClass}
              placeholder="Gallery or venue name"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          {/* Image Upload */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Flyer / Invitation / Image</label>
            {imagePreview ? (
              <div className="relative w-full">
                <img
                  src={imagePreview}
                  alt="Exhibition flyer preview"
                  className="w-full max-h-48 object-contain rounded-lg border"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-1 text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400">PNG, JPG, PDF up to 10MB</p>
                </div>
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                className={inputClass}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                className={inputClass}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Venue Address</label>
            <div className="relative">
              <input
                className={inputClass}
                placeholder="Search address worldwide..."
                value={addressQuery}
                onChange={(e) => handleAddressQueryChange(e.target.value)}
                onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                </div>
              )}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {addressSuggestions.map((s, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b last:border-b-0 truncate"
                      onMouseDown={() => selectSuggestion(s)}
                    >
                      {s.display}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 grid gap-1">
                <label className="text-xs text-muted-foreground">Street</label>
                <input
                  className={inputClass}
                  placeholder="Street name"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground">Number</label>
                <input
                  className={inputClass}
                  placeholder="No."
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">Complement / Floor / Suite</label>
              <input
                className={inputClass}
                placeholder="Apt, Suite, Floor..."
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground">City</label>
                <input
                  className={inputClass}
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground">State / Province</label>
                <input
                  className={inputClass}
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground">ZIP / Postal / CEP</label>
                <input
                  className={inputClass}
                  placeholder="Postal code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground">Country</label>
                <select
                  className={inputClass}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Exhibition description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button>Add Exhibition</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
