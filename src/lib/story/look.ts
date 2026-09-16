import type { StoryColors, StoryLook, StoryDocument } from './types'
import { DEFAULT_BODY_FONT, DEFAULT_HEADING_FONT } from './fonts'

export const DEFAULT_COLORS: StoryColors = {
  page: '#f5f0e8',
  text: '#2a2521',
  accent: '#b5623a',
  accentText: '#fbf9f5',
  backdrop: '#1e1712',
}

export const DEFAULT_LOOK: StoryLook = {
  fonts: { heading: DEFAULT_HEADING_FONT, body: DEFAULT_BODY_FONT },
  colors: DEFAULT_COLORS,
  words: {},
}

export function cloneLook(look: StoryLook): StoryLook {
  return { fonts: { ...look.fonts }, colors: { ...look.colors }, words: { ...look.words } }
}

export function setLook(doc: StoryDocument, look: StoryLook): StoryDocument {
  return { ...doc, look: cloneLook(look) }
}
