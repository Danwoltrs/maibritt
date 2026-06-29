'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { moveRect, resizeRect, fullFrameRect, type Handle } from '@/lib/enhance/cropEdit'
import type { RotatedRect } from '@/lib/enhance/types'
import type { FramePreset } from '@/lib/framing/presets'

interface Props {
  imageUrl: string
  rect: RotatedRect
  presetKey: string
  presetOptions: FramePreset[]
  onConfirm: (rect: RotatedRect, presetKey: string) => void
  onCancel: () => void
}

// Handle positions are percentages of the (unrotated) box; the parent box div is
// rotated, so the handles rotate with it and stay on the visual corners/edges.
const clampAngle = (d: number) => Math.max(-45, Math.min(45, d))

const HANDLES: { h: Handle; left: string; top: string; cursor: string }[] = [
  { h: 'nw', left: '0%',   top: '0%',   cursor: 'nwse-resize' },
  { h: 'n',  left: '50%',  top: '0%',   cursor: 'ns-resize' },
  { h: 'ne', left: '100%', top: '0%',   cursor: 'nesw-resize' },
  { h: 'w',  left: '0%',   top: '50%',  cursor: 'ew-resize' },
  { h: 'e',  left: '100%', top: '50%',  cursor: 'ew-resize' },
  { h: 'sw', left: '0%',   top: '100%', cursor: 'nesw-resize' },
  { h: 's',  left: '50%',  top: '100%', cursor: 'ns-resize' },
  { h: 'se', left: '100%', top: '100%', cursor: 'nwse-resize' },
]

export default function CropConfirmModal({ imageUrl, rect, presetKey, presetOptions, onConfirm, onCancel }: Props) {
  // Clamp the detected tilt at the source so the slider, readout, overlay box,
  // and onConfirm all share one consistent angle.
  const [r, setR] = useState<RotatedRect>(() => ({ ...rect, angleDeg: clampAngle(rect.angleDeg) }))
  const [preset, setPreset] = useState(presetKey)
  const imgRef = useRef<HTMLImageElement>(null)
  const [natural, setNatural] = useState({ w: 1, h: 1 })
  const [scale, setScale] = useState(1) // displayed px per natural px
  const drag = useRef<{ mode: 'move' | Handle; sx: number; sy: number; start: RotatedRect; scale: number } | null>(null)

  const measure = useCallback(() => {
    const img = imgRef.current
    if (img && img.naturalWidth) {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight })
      setScale(img.getBoundingClientRect().width / img.naturalWidth)
    }
  }, [])

  // Keep the display scale in sync as the modal mounts / the window resizes.
  useEffect(() => {
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (ro && imgRef.current) ro.observe(imgRef.current)
    window.addEventListener('resize', measure)
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure) }
  }, [measure])

  // Window-level drag so the pointer can leave the small handles without dropping.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      const dxN = (e.clientX - d.sx) / d.scale
      const dyN = (e.clientY - d.sy) / d.scale
      setR(d.mode === 'move' ? moveRect(d.start, dxN, dyN) : resizeRect(d.start, d.mode, dxN, dyN))
    }
    const onUp = () => { drag.current = null }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    // pointercancel/lostpointercapture fire instead of pointerup on touch/pen
    // when the browser steals the gesture — clear the drag or it sticks.
    window.addEventListener('pointercancel', onUp)
    window.addEventListener('lostpointercapture', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('lostpointercapture', onUp)
    }
  }, [])

  const startDrag = (mode: 'move' | Handle) => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation()
    const img = imgRef.current
    const s = img && img.naturalWidth ? img.getBoundingClientRect().width / img.naturalWidth : scale
    drag.current = { mode, sx: e.clientX, sy: e.clientY, start: r, scale: s }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adjust crop / Ajustar recorte</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-1">
          Drag to move · drag the dots to resize · slider to straighten ·
          {' '}Arraste para mover · pontos para redimensionar · controle para alinhar
        </p>

        <div className="relative inline-block select-none">
          <img
            ref={imgRef}
            src={imageUrl}
            alt="To enhance"
            draggable={false}
            onLoad={measure}
            className="max-h-[60vh] w-auto rounded"
          />
          <div
            onPointerDown={startDrag('move')}
            className="absolute border-2 border-emerald-400 bg-emerald-400/10 cursor-move touch-none"
            style={{
              left: (r.cx - r.width / 2) * scale,
              top: (r.cy - r.height / 2) * scale,
              width: r.width * scale,
              height: r.height * scale,
              transform: `rotate(${r.angleDeg}deg)`,
              transformOrigin: 'center',
            }}
          >
            {HANDLES.map(({ h, left, top, cursor }) => (
              <div
                key={h}
                onPointerDown={startDrag(h)}
                className="absolute h-3 w-3 -ml-1.5 -mt-1.5 rounded-sm border border-emerald-600 bg-white shadow touch-none"
                style={{ left, top, cursor }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-3 mt-3 text-sm">
          <label className="flex items-center gap-2">
            Rotate / Girar
            <input
              type="range" min={-45} max={45} step={0.5} value={r.angleDeg}
              onChange={(e) => setR((p) => ({ ...p, angleDeg: clampAngle(parseFloat(e.target.value)) }))}
              className="flex-1"
            />
            <span className="w-10 tabular-nums text-right text-muted-foreground">{r.angleDeg.toFixed(1)}°</span>
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={() => setR(fullFrameRect(natural.w, natural.h, 1))}>
            Fit to image
          </Button>
        </div>

        <div className="mt-2">
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {presetOptions.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="button" onClick={() => onConfirm(r, preset)}>Enhance</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
