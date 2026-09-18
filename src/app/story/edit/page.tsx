import { Suspense } from 'react'
import { EditorApp } from '@/components/story-editor/EditorApp'

export const metadata = { title: 'My story' }

export default function StoryEditPage() {
  return (
    <Suspense>
      <EditorApp />
    </Suspense>
  )
}
