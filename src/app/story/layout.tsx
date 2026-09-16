import type { ReactNode } from 'react'
import './story.css'
import { STORY_FONT_CLASSES } from './fonts'

export default function StoryLayout({ children }: { children: ReactNode }) {
  return <div className={`${STORY_FONT_CLASSES} story-theme`}>{children}</div>
}
