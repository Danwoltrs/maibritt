'use client'
import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  beforeUrl: string
  framedUrl: string
  onApprove: () => void
  onDiscard: () => void
}

export default function EnhancePreview({ beforeUrl, framedUrl, onApprove, onDiscard }: Props) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onDiscard() }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Before / After</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <figure><img src={beforeUrl} className="w-full rounded" alt="Before" /><figcaption className="text-xs text-gray-500 mt-1">Original</figcaption></figure>
          <figure><img src={framedUrl} className="w-full rounded" alt="After" /><figcaption className="text-xs text-gray-500 mt-1">Enhanced & framed</figcaption></figure>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onDiscard}>Discard</Button>
          <Button onClick={onApprove}>Use this image</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
