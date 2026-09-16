'use client'

import { useState } from 'react'
import { useEditorStore } from './store'
import { findBlock, insertBlock, newId, updateBlock } from '@/lib/story/document'
import type { Screen } from './screens'
import { EButton, Field, Icon, PageTop, TextInput } from './ui'
import { PhotoPicker } from './PhotoPicker'
import { PhotoStyleChooser, type PhotoStyle } from './PhotoStyleChooser'
import { VoiceForSlideshow } from './VoiceForSlideshow'
import type { AudioRef, Block, CaptionedImage, SlideshowTiming } from '@/lib/story/types'

type Step = 'pick' | 'style'

export function PhotosFlow({ screen, onBack }: { screen: Extract<Screen, { kind: 'photos' }>; onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  const existing = screen.blockId ? findBlock(document, screen.blockId)?.block : undefined
  const single = screen.mode === 'photo'

  const initialImages: CaptionedImage[] =
    existing?.kind === 'photo' ? [{ ...existing.image, caption: existing.caption }] : existing?.kind === 'gallery' || existing?.kind === 'slideshow' ? existing.images : []
  const [images, setImages] = useState<CaptionedImage[]>(initialImages)
  const [step, setStep] = useState<Step>('pick')
  const [style, setStyle] = useState<PhotoStyle>(existing?.kind === 'slideshow' ? 'slideshow' : screen.mode === 'slideshow' ? 'slideshow' : 'gallery')
  const [timing, setTiming] = useState<SlideshowTiming>(existing?.kind === 'slideshow' ? existing.timing : { mode: 'interval', seconds: 5 })
  const [audio, setAudio] = useState<AudioRef | null>(existing?.kind === 'slideshow' ? existing.audio : null)

  const save = () => {
    let block: Block
    if (single) {
      const img = images[0]
      block = { id: existing?.id ?? newId(), kind: 'photo', image: { url: img.url, thumbnailUrl: img.thumbnailUrl, width: img.width, height: img.height }, caption: img.caption }
    } else if (style === 'gallery') {
      block = { id: existing?.id ?? newId(), kind: 'gallery', images }
    } else {
      block = { id: existing?.id ?? newId(), kind: 'slideshow', images, timing, audio }
    }
    if (existing) apply((d) => updateBlock(d, screen.chapterId, existing.id, block))
    else apply((d) => insertBlock(d, screen.chapterId, screen.insertIndex, block))
    onBack()
  }

  const title = single ? 'Add a photo' : 'Add photos'

  if (step === 'style') {
    return (
      <div className="min-h-[100svh]">
        <PageTop title={title} backLabel="Back to the photos" onBack={() => setStep('pick')} />
        <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8 px-6 py-10 md:px-0">
          <PhotoStyleChooser
            images={images}
            style={style}
            onStyle={setStyle}
            timing={timing}
            onTiming={setTiming}
            audio={audio}
            voiceControl={<VoiceForSlideshow audio={audio} onChange={setAudio} />}
          />
          <div className="flex justify-center gap-4">
            <EButton icon={<Icon name="chevronLeft" />} onClick={() => setStep('pick')}>Back</EButton>
            <EButton variant="primary" icon={<Icon name="check" />} onClick={save}>Add these photos to my story</EButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh]">
      <PageTop title={title} onBack={onBack} />
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8 px-6 py-10 md:px-0">
        <PhotoPicker multiple={!single} withCaptions={!single} value={images} onChange={setImages} />
        {single && images[0] && (
          <Field label="A few words about it" hint="Optional">
            <TextInput value={images[0].caption} onChange={(e) => setImages([{ ...images[0], caption: e.target.value }])} />
          </Field>
        )}
        <div className="flex justify-center gap-4">
          <EButton icon={<Icon name="chevronLeft" />} onClick={onBack}>Back</EButton>
          {single ? (
            <EButton variant="primary" icon={<Icon name="check" />} disabled={images.length === 0} onClick={save}>Add this photo to my story</EButton>
          ) : (
            <EButton variant="primary" icon={<Icon name="arrowRight" />} disabled={images.length === 0} onClick={() => setStep('style')}>Next: how should they appear?</EButton>
          )}
        </div>
      </div>
    </div>
  )
}
