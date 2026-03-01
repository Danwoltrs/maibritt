'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Gallery } from '@/services/gallery.service'

export interface ArtworkPageFilters {
  searchTerm: string
  artworkStatus: string
  year: string
  galleryId: string
}

export const defaultFilters: ArtworkPageFilters = {
  searchTerm: '',
  artworkStatus: 'all',
  year: 'all',
  galleryId: 'all',
}

interface ArtworksFiltersProps {
  filters: ArtworkPageFilters
  onFiltersChange: (filters: ArtworkPageFilters) => void
  years: number[]
  galleries: Gallery[]
}

export function ArtworksFilters({ filters, onFiltersChange, years, galleries }: ArtworksFiltersProps) {
  const update = (partial: Partial<ArtworkPageFilters>) =>
    onFiltersChange({ ...filters, ...partial })

  const hasFilters =
    filters.searchTerm || filters.artworkStatus !== 'all' ||
    filters.year !== 'all' || filters.galleryId !== 'all'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search artworks..."
          value={filters.searchTerm}
          onChange={(e) => update({ searchTerm: e.target.value })}
          className="pl-9"
        />
      </div>

      <Select value={filters.artworkStatus} onValueChange={(v) => update({ artworkStatus: v })}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="studio">Studio</SelectItem>
          <SelectItem value="gallery">At Gallery</SelectItem>
          <SelectItem value="on_loan">On Loan</SelectItem>
          <SelectItem value="nfs">NFS</SelectItem>
          <SelectItem value="sold">Sold</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.year} onValueChange={(v) => update({ year: v })}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.galleryId} onValueChange={(v) => update({ galleryId: v })}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Gallery" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Galleries</SelectItem>
          {galleries.map((g) => (
            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange(defaultFilters)}
          className="h-9"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}
