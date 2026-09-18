'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEditorStore } from './store'
import type { Screen } from './screens'
import { screenFromParams } from './screens'
import { StoryOverview } from './StoryOverview'
import { TextEditor } from './TextEditor'
import { OpeningEditor } from './OpeningEditor'
import { NameChapter } from './NameChapter'
import { PhotosFlow } from './PhotosFlow'
import { RecordFlow } from './RecordFlow'
import { VideoFlow } from './VideoFlow'
import { LookScreen } from './look/LookScreen'
import { ArrangeScreen } from './arrange/ArrangeScreen'

export function EditorApp() {
  const load = useEditorStore((s) => s.load)
  const document = useEditorStore((s) => s.document)
  const [screen, setScreen] = useState<Screen>({ kind: 'overview' })
  const [loadError, setLoadError] = useState(false)
  const params = useSearchParams()
  const [routed, setRouted] = useState(false)

  useEffect(() => {
    load().catch(() => setLoadError(true))
  }, [load])

  // "+ Add something here" on the public story arrives as a query. Resolve it
  // against the loaded draft once, then drop it so a reload does not reopen it.
  useEffect(() => {
    if (!document || routed) return
    setRouted(true)
    const target = screenFromParams(params, document)
    if (target) {
      setScreen(target)
      window.history.replaceState(null, '', '/story/edit')
    }
  }, [document, routed, params])

  if (loadError) {
    return <div className="flex min-h-[100svh] items-center justify-center px-6 text-[20px]">Could not load your story. Check your internet and reload the page.</div>
  }
  if (!document) {
    return <div className="flex min-h-[100svh] items-center justify-center text-[20px]" style={{ color: 'var(--ink-2)' }}>Loading your story…</div>
  }

  const back = () => setScreen({ kind: 'overview' })

  switch (screen.kind) {
    case 'overview':
      return <StoryOverview go={setScreen} />
    case 'opening':
      return <OpeningEditor onBack={back} />
    case 'name-chapter':
      return <NameChapter chapterId={screen.chapterId} onBack={back} />
    case 'text':
      return <TextEditor screen={screen} onBack={back} />
    case 'photos':
      return <PhotosFlow screen={screen} onBack={back} />
    case 'record':
      return <RecordFlow screen={screen} onBack={back} />
    case 'video':
      return <VideoFlow screen={screen} onBack={back} />
    case 'look':
      return <LookScreen onBack={back} />
    case 'arrange':
      return <ArrangeScreen target={screen.target} onBack={back} />
    default:
      return null
  }
}
