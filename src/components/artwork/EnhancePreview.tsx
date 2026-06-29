'use client'
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface Props {
  beforeUrl: string
  enhancedUrl: string      // cleaned, unframed
  framedUrl: string        // cleaned + wood frame
  onApprove: (choice: { useFrame: boolean }) => void
  onDiscard: () => void
}

export default function EnhancePreview({ beforeUrl, enhancedUrl, framedUrl, onApprove, onDiscard }: Props) {
  // Default to the clean, unframed result — the artist may not want a frame at all.
  const [useFrame, setUseFrame] = useState(false)
  const afterUrl = useFrame ? framedUrl : enhancedUrl

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onDiscard() }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Before / After · Antes / Depois</DialogTitle></DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <figure>
            <img src={beforeUrl} className="w-full rounded" alt="Before" />
            <figcaption className="text-xs text-gray-500 mt-1">Original</figcaption>
          </figure>
          <figure>
            <img src={afterUrl} className="w-full rounded" alt="After" />
            <figcaption className="text-xs text-gray-500 mt-1">
              {useFrame ? 'Cleaned + framed / Limpa + moldura' : 'Cleaned / Limpa'}
            </figcaption>
          </figure>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Switch id="use-frame" checked={useFrame} onCheckedChange={setUseFrame} />
            <Label htmlFor="use-frame" className="text-sm">Add wood frame / Adicionar moldura</Label>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onDiscard}>Discard</Button>
            <Button type="button" onClick={() => onApprove({ useFrame })}>Use this image</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
