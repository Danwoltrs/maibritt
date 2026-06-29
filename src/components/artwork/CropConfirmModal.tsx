'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Move } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { setCorner, moveQuad, fullFrameQuad, quadPoints, CORNERS, type Corner } from '@/lib/enhance/quad'
import type { Quad } from '@/lib/enhance/types'
import type { FramePreset } from '@/lib/framing/presets'

interface Props {
  imageUrl: string
  quad: Quad
  presetKey: string
  presetOptions: FramePreset[]
  onConfirm: (quad: Quad, presetKey: string) => void
  onCancel: () => void
}

const cursorFor: Record<Corner, string> = { tl: 'nwse-resize', tr: 'nesw-resize', br: 'nwse-resize', bl: 'nesw-resize' }

export default function CropConfirmModal({ imageUrl, quad, presetKey, presetOptions, onConfirm, onCancel }: Props) {
  const [q, setQ] = useState<Quad>(quad)
  const [preset, setPreset] = useState(presetKey)
  const imgRef = useRef<HTMLImageElement>(null)
  const drag = useRef<{ mode: Corner | 'move'; sx: number; sy: number; start: Quad; dispW: number; dispH: number } | null>(null)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      const dxF = (e.clientX - d.sx) / d.dispW
      const dyF = (e.clientY - d.sy) / d.dispH
      if (d.mode === 'move') setQ(moveQuad(d.start, dxF, dyF))
      else setQ(setCorner(d.start, d.mode, d.start[d.mode].x + dxF, d.start[d.mode].y + dyF))
    }
    const onUp = () => { drag.current = null }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    window.addEventListener('lostpointercapture', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('lostpointercapture', onUp)
    }
  }, [])

  const startDrag = (mode: Corner | 'move') => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation()
    const rect = imgRef.current?.getBoundingClientRect()
    drag.current = {
      mode, sx: e.clientX, sy: e.clientY, start: q,
      dispW: rect?.width || 1, dispH: rect?.height || 1,
    }
  }

  const pts = quadPoints(q)
  const polygon = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const center = { x: (q.tl.x + q.tr.x + q.br.x + q.bl.x) / 4, y: (q.tl.y + q.tr.y + q.br.y + q.bl.y) / 4 }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adjust the canvas corners / Ajuste os cantos da tela</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-1">
          Drag the 4 corners onto the painting's corners (it straightens &amp; removes the angle) ·
          {' '}Arraste os 4 cantos para os cantos da pintura
        </p>

        <div className="relative inline-block select-none touch-none">
          <img ref={imgRef} src={imageUrl} alt="To enhance" draggable={false} className="block max-h-[60vh] w-auto rounded" />

          <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-0 h-full w-full pointer-events-none">
            {/* Dim everything outside the quad (even-odd hole). */}
            <path
              d={`M0 0H1V1H0Z M${q.tl.x} ${q.tl.y} L${q.tr.x} ${q.tr.y} L${q.br.x} ${q.br.y} L${q.bl.x} ${q.bl.y} Z`}
              fill="black" fillOpacity="0.45" fillRule="evenodd"
            />
            <polygon points={polygon} fill="none" stroke="#34d399" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Corner grips */}
          {CORNERS.map((c) => (
            <div
              key={c}
              onPointerDown={startDrag(c)}
              className="absolute h-4 w-4 -ml-2 -mt-2 rounded-full border-2 border-emerald-500 bg-white shadow touch-none"
              style={{ left: `${q[c].x * 100}%`, top: `${q[c].y * 100}%`, cursor: cursorFor[c] }}
            />
          ))}

          {/* Move-all grip at the centroid */}
          <div
            onPointerDown={startDrag('move')}
            className="absolute flex h-7 w-7 -ml-3.5 -mt-3.5 items-center justify-center rounded-full border border-emerald-500 bg-white/90 shadow cursor-move touch-none"
            style={{ left: `${center.x * 100}%`, top: `${center.y * 100}%` }}
          >
            <Move className="h-3.5 w-3.5 text-emerald-600" />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-3 mt-3">
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {presetOptions.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" variant="ghost" size="sm" onClick={() => setQ(fullFrameQuad(1))}>
            Fit to image
          </Button>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="button" onClick={() => onConfirm(q, preset)}>Enhance</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
