'use client'
import React, { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CropConfirmModal from './CropConfirmModal'
import EnhancePreview, { type DisplayChoice } from './EnhancePreview'
import { uploadOriginalSigned, requestDetect, runEnhance } from '@/services/enhance.service'
import { FRAME_PRESETS, defaultPresetForCategory } from '@/lib/framing/presets'
import type { Quad } from '@/lib/enhance/types'

type Phase = 'idle' | 'uploading' | 'detecting' | 'confirm' | 'running' | 'preview'

interface Props {
  file: File
  category: string
  onFramed: (urls: { enhanced: string; framed: string; cropped: string; framePreset: string; displayChoice: DisplayChoice }) => void
}

export default function EnhanceButton({ file, category, onFramed }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [imageUrl, setImageUrl] = useState('')
  const [baseFileName, setBaseFileName] = useState('')
  const [quad, setQuad] = useState<Quad | null>(null)
  const [presetKey, setPresetKey] = useState(defaultPresetForCategory(category))
  const [framedUrl, setFramedUrl] = useState('')
  const [enhancedUrl, setEnhancedUrl] = useState('')
  const [croppedUrl, setCroppedUrl] = useState('')
  const [busy, setBusy] = useState(false)
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
      setQuad(detected)
      setPhase('confirm')
    } catch (e) { setError(String(e)); setPhase('idle') }
  }

  async function confirm(nextQuad: Quad, key: string) {
    setQuad(nextQuad); setPresetKey(key); setPhase('running')
    try {
      // AI flatten is applied automatically; the preview can toggle it off.
      const out = await runEnhance({ imageUrl, quad: nextQuad, presetKey: key, baseFileName, aiFlatten: true })
      setEnhancedUrl(out.enhanced); setFramedUrl(out.framed); setCroppedUrl(out.cropped); setPhase('preview')
    } catch (e) { setError(String(e)); setPhase('confirm') }
  }

  // Re-run when the artist toggles AI flatten / AI dewarp / Auto colour.
  async function rerun(flags: { dewarp: boolean; color: boolean; aiFlatten: boolean }) {
    if (!quad) return
    setBusy(true); setError(null)
    try {
      const out = await runEnhance({ imageUrl, quad, presetKey, baseFileName, dewarp: flags.dewarp, color: flags.color, aiFlatten: flags.aiFlatten })
      setEnhancedUrl(out.enhanced); setFramedUrl(out.framed); setCroppedUrl(out.cropped)
    } catch (e) { setError(String(e)) }
    finally { setBusy(false) }
  }

  return (
    <>
      <Button type="button" size="sm" variant="secondary" disabled={phase !== 'idle'} onClick={start} className="gap-1">
        {phase === 'idle' ? <Sparkles className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {phase === 'idle' ? 'Enhance' : phase}
      </Button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {phase === 'confirm' && quad && (
        <CropConfirmModal imageUrl={imageUrl} quad={quad} presetKey={presetKey}
          presetOptions={presetOptions} onConfirm={confirm} onCancel={() => setPhase('idle')} />
      )}
      {phase === 'preview' && (
        <EnhancePreview beforeUrl={imageUrl} croppedUrl={croppedUrl} enhancedUrl={enhancedUrl} framedUrl={framedUrl}
          busy={busy} onRerun={rerun}
          onApprove={({ useFrame, displayChoice }) => {
            // No frame chosen → the clean image becomes the display image; preset cleared.
            onFramed({
              enhanced: enhancedUrl,
              framed: useFrame ? framedUrl : enhancedUrl,
              cropped: croppedUrl,
              framePreset: useFrame ? presetKey : '',
              displayChoice,
            })
            setPhase('idle')
          }}
          onDiscard={() => setPhase('idle')} />
      )}
    </>
  )
}
