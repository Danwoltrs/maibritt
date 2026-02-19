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

function UpcomingExhibitionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [venue, setVenue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Exhibition name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Venue</label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Gallery or venue name"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
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
