'use client'
import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface Props {
  beforeUrl: string
  enhancedUrl: string      // cleaned, unframed (reflects the current flatten/colour flags)
  framedUrl: string        // cleaned + wood frame (same flags)
  busy?: boolean           // true while a dewarp/flatten/colour re-run is in flight
  onRerun: (flags: { dewarp: boolean; flatten: boolean; color: boolean }) => void
  onApprove: (choice: { useFrame: boolean }) => void
  onDiscard: () => void
}

export default function EnhancePreview({ beforeUrl, enhancedUrl, framedUrl, busy = false, onRerun, onApprove, onDiscard }: Props) {
  // Frame is instant (both variants are already returned for the current flags).
  // AI dewarp / Flatten / Auto colour are opt-in and re-run the server — default
  // OFF so the shown image starts geometry-only (faithful colours).
  const [useFrame, setUseFrame] = useState(false)
  const [dewarp, setDewarp] = useState(false)
  const [flatten, setFlatten] = useState(false)
  const [color, setColor] = useState(false)
  const afterUrl = useFrame ? framedUrl : enhancedUrl

  function toggleDewarp(v: boolean) { setDewarp(v); onRerun({ dewarp: v, flatten, color }) }
  function toggleFlatten(v: boolean) { setFlatten(v); onRerun({ dewarp, flatten: v, color }) }
  function toggleColor(v: boolean) { setColor(v); onRerun({ dewarp, flatten, color: v }) }

  const caption = [
    'Cleaned / Limpa',
    dewarp ? '+ dewarp' : null,
    flatten ? '+ light' : null,
    color ? '+ colour' : null,
    useFrame ? '+ frame / moldura' : null,
  ].filter(Boolean).join(' ')

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
            <div className="relative">
              <img src={afterUrl} className="w-full rounded" alt="After" />
              {busy && (
                <div className="absolute inset-0 flex items-center justify-center rounded bg-black/30">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <figcaption className="text-xs text-gray-500 mt-1">{caption}</figcaption>
          </figure>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <Switch id="use-frame" checked={useFrame} onCheckedChange={setUseFrame} />
              <Label htmlFor="use-frame" className="text-sm">Add wood frame / Moldura</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="flatten" checked={flatten} disabled={busy} onCheckedChange={toggleFlatten} />
              <Label htmlFor="flatten" className="text-sm">Flatten lighting / Nivelar luz</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="auto-color" checked={color} disabled={busy} onCheckedChange={toggleColor} />
              <Label htmlFor="auto-color" className="text-sm">Auto colour / Cor automática</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="ai-dewarp" checked={dewarp} disabled={busy} onCheckedChange={toggleDewarp} />
              <Label htmlFor="ai-dewarp" className="text-sm">AI dewarp · may alter / pode alterar</Label>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Colours stay faithful by default — only cropping and straightening are applied. Lighting and colour are optional.
            “AI dewarp” straightens the canvas’s waviness by reshaping the image and may slightly alter the painting — check the result.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onDiscard}>Discard</Button>
            <Button type="button" disabled={busy} onClick={() => onApprove({ useFrame })}>Use this image</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
