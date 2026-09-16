import type { CSSProperties, ReactNode } from 'react'
import type { StoryLook } from '@/lib/story/types'
import { themeVars } from '@/lib/story/look'
import { fontById } from '@/lib/story/fonts'

export function lookStyle(look: StoryLook): CSSProperties {
  return {
    ...themeVars(look.colors),
    '--story-heading-font': `var(${fontById(look.fonts.heading).cssVar})`,
    '--story-body-font': `var(${fontById(look.fonts.body).cssVar})`,
  } as CSSProperties
}

export function StoryTheme({ look, className = '', style, children }: { look: StoryLook; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={`story-theme ${className}`} style={{ ...lookStyle(look), ...style }}>
      {children}
    </div>
  )
}
