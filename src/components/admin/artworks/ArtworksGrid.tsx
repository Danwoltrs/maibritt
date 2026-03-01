'use client'

import React from 'react'
import { MoreHorizontal, Image as ImageIcon, Clock } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Artwork } from '@/types'
import { ArtworkContextMenu } from '@/components/admin/ArtworkContextMenu'
import {
  Eye, Pencil, DollarSign, Building, CalendarDays,
  Star, Download, Trash2, Truck,
} from 'lucide-react'

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

interface ArtworksGridProps {
  artworks: Artwork[]
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  galleryMap: Map<string, string>
  onUpdate: () => void
  onOpenModal: (type: string, artwork: Artwork) => void
}

export function ArtworksGrid({
  artworks, selectedIds, onSelectionChange, galleryMap, onUpdate, onOpenModal,
}: ArtworksGridProps) {
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  const handleTimelineToggle = async (artwork: Artwork) => {
    const { error } = await (await import('@/lib/supabase')).supabase
      .from('artworks')
      .update({ show_on_timeline: !artwork.showOnTimeline })
      .eq('id', artwork.id)
    if (!error) onUpdate()
  }

  const getLocationDisplay = (artwork: Artwork) => {
    if (artwork.locationType === 'gallery' && artwork.locationId) {
      return galleryMap.get(artwork.locationId) || 'Gallery'
    }
    if (artwork.locationType === 'exhibition') return 'Exhibition'
    return artwork.locationType || ''
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {artworks.map((artwork) => (
        <ArtworkContextMenu key={artwork.id} artwork={artwork} onUpdate={onUpdate}>
          <Card className={`group hover:shadow-md transition-shadow relative ${selectedIds.has(artwork.id) ? 'ring-2 ring-primary' : ''}`}>
            {/* Checkbox overlay */}
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={selectedIds.has(artwork.id)}
                onCheckedChange={() => toggleOne(artwork.id)}
                className="bg-white/80 backdrop-blur-sm"
              />
            </div>

            {/* 3-dot menu overlay */}
            <div className="absolute top-2 right-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-white/80 backdrop-blur-sm hover:bg-white">
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
            </div>

            {/* Image */}
            <div className="aspect-square overflow-hidden rounded-t-lg">
              {artwork.images.length > 0 ? (
                <img
                  src={artwork.images[0].thumbnail || artwork.images[0].display}
                  alt={artwork.title.en}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-sm line-clamp-1">{artwork.title.en}</h3>
                  <p className="text-xs text-muted-foreground">{artwork.year} &middot; {artwork.dimensions}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-1">{artwork.medium.en}</p>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge className={`${statusColors[artwork.artworkStatus || 'studio']} text-[10px] px-1.5 py-0`}>
                  {statusLabels[artwork.artworkStatus || 'studio']}
                </Badge>
                {getLocationDisplay(artwork) && artwork.locationType !== artwork.artworkStatus && (
                  <span className="text-[10px] text-muted-foreground capitalize">{getLocationDisplay(artwork)}</span>
                )}
                {artwork.featured && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-yellow-50 text-yellow-700">
                    <Star className="h-2.5 w-2.5 mr-0.5" /> Featured
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <Switch
                    checked={artwork.showOnTimeline || false}
                    onCheckedChange={() => handleTimelineToggle(artwork)}
                    className="scale-[0.65]"
                  />
                </div>
                {artwork.isSold && artwork.soldPrice && (
                  <span className="text-xs font-medium text-red-600">
                    {artwork.soldCurrency === 'BRL' ? 'R$' : artwork.soldCurrency === 'USD' ? '$' : '€'} {artwork.soldPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </ArtworkContextMenu>
      ))}
    </div>
  )
}
