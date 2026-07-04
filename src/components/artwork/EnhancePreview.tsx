'use client'
import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface Props {
  beforeUrl: string
  croppedUrl?: string      // geometry-only (warp/crop/straighten, no AI); shown as the left "before"
  enhancedUrl: string      // cleaned, unframed (reflects the current flatten/colour flags)
  framedUrl: string        // cleaned + wood frame (same flags)
  busy?: boolean           // true while a de-wave/dewarp/colour/AI re-run is in flight
  onRerun: (flags: { flatten: boolean; dewarp: boolean; color: boolean; aiFlatten: boolean }) => void
  onApprove: (choice: { useFrame: boolean; displayChoice: DisplayChoice }) => void
  onDiscard: () => void
}

// Which variant the artist wants shown first on the public page.
export type DisplayChoice = 'cropped' | 'enhanced' | 'original'

export default function EnhancePreview({ beforeUrl, croppedUrl, enhancedUrl, framedUrl, busy = false, onRerun, onApprove, onDiscard }: Props) {
  // Frame is instant (both variants are already returned for the current flags).
  // The faithful de-wave (flatten) is applied automatically (default ON). The
  // generative "AI repaint", AI dewarp and Auto colour are opt-in. Toggling any
  // of these re-runs the server.
  const [useFrame, setUseFrame] = useState(false)
  const [flatten, setFlatten] = useState(false)
  const [dewarp, setDewarp] = useState(false)
  const [color, setColor] = useState(false)
  const [aiFlatten, setAiFlatten] = useState(false)
  // Which variant becomes the artwork's main (first-shown) image. Default to the
  // cropped/straightened photo — zero colour, tone or line change.
  const [displayChoice, setDisplayChoice] = useState<DisplayChoice>('cropped')
  const afterUrl = useFrame ? framedUrl : enhancedUrl

  function toggleFlatten(v: boolean) { setFlatten(v); onRerun({ flatten: v, dewarp, color, aiFlatten }) }
  function toggleDewarp(v: boolean) { setDewarp(v); onRerun({ flatten, dewarp: v, color, aiFlatten }) }
  function toggleColor(v: boolean) { setColor(v); onRerun({ flatten, dewarp, color: v, aiFlatten }) }
  function toggleAiFlatten(v: boolean) { setAiFlatten(v); onRerun({ flatten, dewarp, color, aiFlatten: v }) }

  const caption = [
    'Cleaned / Limpa',
    flatten ? '+ de-wave' : null,
    aiFlatten ? '+ AI repaint' : null,
    dewarp ? '+ dewarp' : null,
    color ? '+ colour' : null,
    useFrame ? '+ frame / moldura' : null,
  ].filter(Boolean).join(' ')

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onDiscard() }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Before / After · Antes / Depois</DialogTitle></DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <figure>
            <img src={croppedUrl || beforeUrl} className="w-full rounded" alt="Cropped (no AI)" />
            <figcaption className="text-xs text-gray-500 mt-1">{croppedUrl ? 'Cropped · no AI / sem IA' : 'Original'}</figcaption>
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
              <Switch id="flatten" checked={flatten} disabled={busy} onCheckedChange={toggleFlatten} />
              <Label htmlFor="flatten" className="text-sm">Flatten waves · taut canvas / tela esticada</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="use-frame" checked={useFrame} onCheckedChange={setUseFrame} />
              <Label htmlFor="use-frame" className="text-sm">Add wood frame / Moldura</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="auto-color" checked={color} disabled={busy} onCheckedChange={toggleColor} />
              <Label htmlFor="auto-color" className="text-sm">Auto colour / Cor automática</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="ai-flatten" checked={aiFlatten} disabled={busy} onCheckedChange={toggleAiFlatten} />
              <Label htmlFor="ai-flatten" className="text-sm">AI repaint · stronger, may alter / pode alterar</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="ai-dewarp" checked={dewarp} disabled={busy} onCheckedChange={toggleDewarp} />
              <Label htmlFor="ai-dewarp" className="text-sm">AI dewarp · may alter / pode alterar</Label>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Default is crop &amp; straighten only — zero colour, tone or line change. “Flatten waves” gently softens the canvas ripple shading; it keeps every colour exactly (hue &amp; saturation are untouched) and only nudges local lightness. “AI repaint” is a stronger generative pass that CAN re-render the artwork — use only if you accept change. Colour, frame and “AI dewarp” are optional.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show first · Mostrar primeiro</span>
              <div className="inline-flex rounded-md border overflow-hidden text-sm">
                {([
                  ['cropped', 'Cropped'],
                  ['enhanced', 'AI Stretch'],
                  ['original', 'Original'],
                ] as [DisplayChoice, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDisplayChoice(value)}
                    className={displayChoice === value ? 'bg-gray-900 text-white px-3 py-1.5' : 'px-3 py-1.5 text-gray-600 hover:bg-gray-100'}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onDiscard}>Discard</Button>
              <Button type="button" disabled={busy} onClick={() => onApprove({ useFrame, displayChoice })}>Use this image</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
