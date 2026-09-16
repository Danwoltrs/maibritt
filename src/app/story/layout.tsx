import type { ReactNode } from 'react'
import { Source_Sans_3 } from 'next/font/google'
import './story.css'

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-story-sans',
})

export default function StoryLayout({ children }: { children: ReactNode }) {
  return <div className={`${sourceSans.variable} story-theme`}>{children}</div>
}
