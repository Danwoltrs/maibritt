'use client'
import React, { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

export default function CropConfirmModal({ imageUrl, rect, presetKey, presetOptions, onConfirm, onCancel }: Props) {
  const [r, setR] = useState<RotatedRect>(rect)
  const [preset, setPreset] = useState(presetKey)
  const imgRef = useRef<HTMLImageElement>(null)
  const [natural, setNatural] = useState({ w: 1, h: 1 })

  // Overlay is rendered in displayed-image pixels; rect is in natural pixels → scale.
  const scale = imgRef.current ? imgRef.current.clientWidth / natural.w : 1

  const nudge = (patch: Partial<RotatedRect>) => setR((prev) => ({ ...prev, ...patch }))

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirm crop / Confirmar recorte</DialogTitle>
        </DialogHeader>

        <div className="relative inline-block">
          <img
            ref={imgRef}
            src={imageUrl}
            alt="To enhance"
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className="max-h-[60vh] w-auto rounded"
          />
          <div
            className="absolute border-2 border-emerald-400/90 pointer-events-none"
            style={{
              left: (r.cx - r.width / 2) * scale,
              top: (r.cy - r.height / 2) * scale,
              width: r.width * scale,
              height: r.height * scale,
              transform: `rotate(${r.angleDeg}deg)`,
              transformOrigin: 'center',
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
          <label className="flex items-center gap-2">Rotate
            <input type="range" min={-15} max={15} step={0.5} value={r.angleDeg}
              onChange={(e) => nudge({ angleDeg: parseFloat(e.target.value) })} className="flex-1" />
          </label>
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
