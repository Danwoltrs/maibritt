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
  busy?: boolean           // true while a dewarp/flatten/colour/AI-flatten re-run is in flight
  onRerun: (flags: { dewarp: boolean; flatten: boolean; color: boolean; aiFlatten: boolean }) => void
  onApprove: (choice: { useFrame: boolean }) => void
  onDiscard: () => void
}

export default function EnhancePreview({ beforeUrl, enhancedUrl, framedUrl, busy = false, onRerun, onApprove, onDiscard }: Props) {
  // Frame is instant (both variants are already returned for the current flags).
  // AI dewarp / Flatten / Auto colour / AI flatten are opt-in and re-run the server
  // — default OFF so the shown image starts geometry-only (faithful colours).
  const [useFrame, setUseFrame] = useState(false)
  const [dewarp, setDewarp] = useState(false)
  const [flatten, setFlatten] = useState(false)
  const [color, setColor] = useState(false)
  const [aiFlatten, setAiFlatten] = useState(false)
  const afterUrl = useFrame ? framedUrl : enhancedUrl

  function toggleDewarp(v: boolean) { setDewarp(v); onRerun({ dewarp: v, flatten, color, aiFlatten }) }
  function toggleFlatten(v: boolean) { setFlatten(v); onRerun({ dewarp, flatten: v, color, aiFlatten }) }
  function toggleColor(v: boolean) { setColor(v); onRerun({ dewarp, flatten, color: v, aiFlatten }) }
  function toggleAiFlatten(v: boolean) { setAiFlatten(v); onRerun({ dewarp, flatten, color, aiFlatten: v }) }

  const caption = [
    'Cleaned / Limpa',
    dewarp ? '+ dewarp' : null,
    flatten ? '+ light' : null,
    color ? '+ colour' : null,
    aiFlatten ? '+ AI flat' : null,
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

        {busy && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-1/3 rounded-full bg-emerald-500" style={{ animation: 'enhBar 1.1s ease-in-out infinite' }} />
            </div>
            <p className="mt-1 text-xs text-gray-400">Processing… AI steps (dewarp / flatten) can take ~20–40s.</p>
            <style>{`@keyframes enhBar{0%{transform:translateX(-120%)}100%{transform:translateX(360%)}}`}</style>
          </div>
        )}

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
            <div className="flex items-center gap-2">
              <Switch id="ai-flatten" checked={aiFlatten} disabled={busy} onCheckedChange={toggleAiFlatten} />
              <Label htmlFor="ai-flatten" className="text-sm">AI flatten · may repaint / pode repintar</Label>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Colours stay faithful by default — only cropping and straightening are applied. Lighting and colour are optional.
            “AI dewarp” reshapes the image to straighten the canvas; “AI flatten” re-renders it to look taut and evenly lit — both may alter the painting, so check the result.
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
