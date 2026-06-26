'use client'
import React, { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CropConfirmModal from './CropConfirmModal'
import EnhancePreview from './EnhancePreview'
import { uploadOriginalSigned, requestDetect, runEnhance } from '@/services/enhance.service'
import { FRAME_PRESETS, defaultPresetForCategory } from '@/lib/framing/presets'
import type { RotatedRect } from '@/lib/enhance/types'

type Phase = 'idle' | 'uploading' | 'detecting' | 'confirm' | 'running' | 'preview'

interface Props {
  file: File
  category: string
  onFramed: (urls: { enhanced: string; framed: string; framePreset: string }) => void
}

export default function EnhanceButton({ file, category, onFramed }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [imageUrl, setImageUrl] = useState('')
  const [baseFileName, setBaseFileName] = useState('')
  const [rect, setRect] = useState<RotatedRect | null>(null)
  const [presetKey, setPresetKey] = useState(defaultPresetForCategory(category))
  const [framedUrl, setFramedUrl] = useState('')
  const [enhancedUrl, setEnhancedUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const presetOptions = Object.values(FRAME_PRESETS).filter((p) =>
    category === 'engraving' ? p.family === 'matted' || p.key === 'oak-mat' : true,
  )

  async function start() {
    setError(null)
    try {
      setPhase('uploading')
      const up = await uploadOriginalSigned(file)
      setImageUrl(up.imageUrl); setBaseFileName(up.baseFileName)
      setPhase('detecting')
      const detected = await requestDetect(up.imageUrl)
      setRect(detected)
      setPhase('confirm')
    } catch (e) { setError(String(e)); setPhase('idle') }
  }

  async function confirm(r: RotatedRect, key: string) {
    setRect(r); setPresetKey(key); setPhase('running')
    try {
      const out = await runEnhance({ imageUrl, rect: r, presetKey: key, baseFileName })
      setEnhancedUrl(out.enhanced); setFramedUrl(out.framed); setPhase('preview')
    } catch (e) { setError(String(e)); setPhase('confirm') }
  }

  return (
    <>
      <Button type="button" size="sm" variant="secondary" disabled={phase !== 'idle'} onClick={start} className="gap-1">
        {phase === 'idle' ? <Sparkles className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {phase === 'idle' ? 'Enhance' : phase}
      </Button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {phase === 'confirm' && rect && (
        <CropConfirmModal imageUrl={imageUrl} rect={rect} presetKey={presetKey}
          presetOptions={presetOptions} onConfirm={confirm} onCancel={() => setPhase('idle')} />
      )}
      {phase === 'preview' && (
        <EnhancePreview beforeUrl={imageUrl} framedUrl={framedUrl}
          onApprove={() => { onFramed({ enhanced: enhancedUrl, framed: framedUrl, framePreset: presetKey }); setPhase('idle') }}
          onDiscard={() => setPhase('idle')} />
      )}
    </>
  )
}
