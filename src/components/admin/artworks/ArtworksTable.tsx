'use client'

import React from 'react'
import { ArrowUpDown, MoreHorizontal, Image as ImageIcon } from 'lucide-react'

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'

import { Artwork } from '@/types'
import { ArtworkService } from '@/services/artwork.service'
import { ArtworkContextMenu } from '@/components/admin/ArtworkContextMenu'
import {
  Eye, Pencil, DollarSign, Building, CalendarDays,
  Star, Download, Trash2, Clock, Briefcase, Truck,
} from 'lucide-react'

export type SortField = 'year' | 'title' | 'artworkStatus' | 'soldDate'
export type SortDir = 'asc' | 'desc'

interface ArtworksTableProps {
  artworks: Artwork[]
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  galleryMap: Map<string, string>
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
  onUpdate: () => void
  onOpenModal: (type: string, artwork: Artwork) => void
}

const statusLabels: Record<string, string> = {
  studio: 'Studio',
  gallery: 'At Gallery',
  on_loan: 'On Loan',
  nfs: 'NFS',
  sold: 'Sold',
}

const statusColors: Record<string, string> = {
  studio: 'bg-gray-100 text-gray-700',
  gallery: 'bg-blue-100 text-blue-700',
  on_loan: 'bg-amber-100 text-amber-700',
  nfs: 'bg-purple-100 text-purple-700',
  sold: 'bg-red-100 text-red-700',
}

function formatCurrency(amount: number | undefined, currency: string | undefined) {
  if (!amount) return '—'
  const sym = { BRL: 'R$', USD: '$', EUR: '€', DKK: 'kr' }[currency || 'BRL'] || currency || ''
  return `${sym} ${amount.toLocaleString()}`
}

export function ArtworksTable({
  artworks, selectedIds, onSelectionChange, galleryMap,
  sortField, sortDir, onSort, onUpdate, onOpenModal,
}: ArtworksTableProps) {
  const allSelected = artworks.length > 0 && selectedIds.size === artworks.length
  const someSelected = selectedIds.size > 0 && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(artworks.map(a => a.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  const handleStatusChange = async (artwork: Artwork, status: string) => {
    const { error } = await (await import('@/lib/supabase')).supabase
      .from('artworks')
      .update({ artwork_status: status })
      .eq('id', artwork.id)
    if (!error) onUpdate()
  }

  const handleTimelineToggle = async (artwork: Artwork) => {
    const { error } = await (await import('@/lib/supabase')).supabase
      .from('artworks')
      .update({ show_on_timeline: !artwork.showOnTimeline })
      .eq('id', artwork.id)
    if (!error) onUpdate()
  }

  const SortableHead = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'opacity-100' : 'opacity-30'}`} />
      </div>
    </TableHead>
  )

  const getLocationDisplay = (artwork: Artwork) => {
    if (artwork.locationType === 'gallery' && artwork.locationId) {
      return galleryMap.get(artwork.locationId) || 'Gallery'
    }
    if (artwork.locationType === 'exhibition') return 'Exhibition'
    return artwork.locationType || '—'
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={toggleAll}
            />
          </TableHead>
          <TableHead className="w-[56px]">Image</TableHead>
          <SortableHead field="title">Title</SortableHead>
          <SortableHead field="year">Year</SortableHead>
          <TableHead>Dimensions</TableHead>
          <TableHead>Medium</TableHead>
          <TableHead>Location</TableHead>
          <SortableHead field="artworkStatus">Status</SortableHead>
          <TableHead>Sold For</TableHead>
          <SortableHead field="soldDate">Sold Date</SortableHead>
          <TableHead>Freight</TableHead>
          <TableHead className="w-[80px]">Timeline</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {artworks.map((artwork) => (
          <ArtworkContextMenu key={artwork.id} artwork={artwork} onUpdate={onUpdate}>
            <TableRow data-state={selectedIds.has(artwork.id) ? 'selected' : undefined}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(artwork.id)}
                  onCheckedChange={() => toggleOne(artwork.id)}
                />
              </TableCell>
              <TableCell>
                {artwork.images.length > 0 ? (
                  <img
                    src={artwork.images[0].thumbnail || artwork.images[0].display}
                    alt={artwork.title.en}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium max-w-[200px]">
                <span className="line-clamp-1">{artwork.title.en}</span>
              </TableCell>
              <TableCell>{artwork.year}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[120px]">
                <span className="line-clamp-1">{artwork.dimensions}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[150px]">
                <span className="line-clamp-1">{artwork.medium.en}</span>
              </TableCell>
              <TableCell className="text-sm capitalize">
                {getLocationDisplay(artwork)}
              </TableCell>
              <TableCell>
                <Select
                  value={artwork.artworkStatus || 'studio'}
                  onValueChange={(v) => handleStatusChange(artwork, v)}
                >
                  <SelectTrigger className="h-7 w-[110px] text-xs border-0 p-0">
                    <Badge className={`${statusColors[artwork.artworkStatus || 'studio']} text-xs`}>
                      {statusLabels[artwork.artworkStatus || 'studio']}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-sm">
                {artwork.isSold ? formatCurrency(artwork.soldPrice, artwork.soldCurrency) : '—'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {artwork.soldDate ? new Date(artwork.soldDate).toLocaleDateString() : '—'}
              </TableCell>
              <TableCell className="text-sm">
                {artwork.freightCost
                  ? formatCurrency(artwork.freightCost, artwork.freightCurrency)
                  : '—'}
              </TableCell>
              <TableCell>
                <Switch
                  checked={artwork.showOnTimeline || false}
                  onCheckedChange={() => handleTimelineToggle(artwork)}
                  className="scale-75"
                />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => onOpenModal('preview', artwork)}>
                      <Eye className="mr-2 h-4 w-4" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onOpenModal('edit', artwork)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onOpenModal('markSold', artwork)}>
                      <DollarSign className="mr-2 h-4 w-4" /> Mark as Sold
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Briefcase className="mr-2 h-4 w-4" /> Set Status
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {Object.entries(statusLabels).filter(([k]) => k !== 'sold').map(([value, label]) => (
                          <DropdownMenuItem key={value} onClick={() => handleStatusChange(artwork, value)}>
                            {label}
                            {artwork.artworkStatus === value && <span className="ml-auto text-xs">&#10003;</span>}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onOpenModal('assignGallery', artwork)}>
                      <Building className="mr-2 h-4 w-4" /> Assign to Gallery
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onOpenModal('assignExhibition', artwork)}>
                      <CalendarDays className="mr-2 h-4 w-4" /> Assign to Exhibition
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onOpenModal('freightCost', artwork)}>
                      <Truck className="mr-2 h-4 w-4" /> {artwork.freightCost ? 'Edit' : 'Add'} Freight Cost
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onOpenModal('toggleFeatured', artwork)}>
                      <Star className="mr-2 h-4 w-4" /> {artwork.featured ? 'Remove Featured' : 'Mark as Featured'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTimelineToggle(artwork)}>
                      <Clock className="mr-2 h-4 w-4" /> {artwork.showOnTimeline ? 'Hide from' : 'Show on'} Timeline
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={artwork.images.length === 0}
                      onClick={() => {
                        if (artwork.images.length === 0) return
                        const url = artwork.images[0].original || artwork.images[0].display
                        const link = document.createElement('a')
                        link.href = url
                        link.download = `${artwork.title.en.replace(/\s+/g, '-').toLowerCase()}.jpg`
                        link.target = '_blank'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" /> Download Image
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onOpenModal('delete', artwork)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </ArtworkContextMenu>
        ))}
      </TableBody>
    </Table>
  )
}
