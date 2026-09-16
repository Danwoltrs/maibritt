export type ImageRef = {
  url: string
  thumbnailUrl: string
  width: number
  height: number
}

export type CaptionedImage = ImageRef & { caption: string }

export type AudioRef = {
  url: string
  durationSec: number
  transcript: string
}

export type SlideshowTiming =
  | { mode: 'interval'; seconds: 3 | 5 | 8 }
  | { mode: 'audio' }

export type VideoSource =
  | { type: 'upload'; url: string; poster: ImageRef | null; durationSec: number }
  | { type: 'link'; provider: 'youtube' | 'vimeo'; videoId: string; url: string }

export type GridRect = { x: number; y: number; w: number; h: number }
export type SectionLayout = { cols: 12; rows: 8; tiles: Record<string, GridRect> }
type WithLayout = { layout?: SectionLayout }

export type TextBlock = WithLayout & { id: string; kind: 'text'; heading: string; body: string }
export type PhotoBlock = WithLayout & { id: string; kind: 'photo'; image: ImageRef; caption: string }
export type GalleryBlock = WithLayout & { id: string; kind: 'gallery'; images: CaptionedImage[] }
export type SlideshowBlock = WithLayout & {
  id: string
  kind: 'slideshow'
  images: CaptionedImage[]
  timing: SlideshowTiming
  audio: AudioRef | null
}
export type AudioBlock = WithLayout & { id: string; kind: 'audio'; heading: string; audio: AudioRef }
export type VideoBlock = WithLayout & { id: string; kind: 'video'; source: VideoSource; caption: string }

export type Block = TextBlock | PhotoBlock | GalleryBlock | SlideshowBlock | AudioBlock | VideoBlock
export type BlockKind = Block['kind']

export type Chapter = { id: string; title: string; blocks: Block[] }

export type StoryOpening = WithLayout & {
  name: string
  title: string
  portrait: ImageRef | null
  cover: ImageRef | null
}

export type WordKey =
  | 'eyebrow'
  | 'begin'
  | 'soundNote'
  | 'chapterWord'
  | 'voiceLabel'
  | 'ownWords'
  | 'readAlong'
  | 'soundOn'
  | 'soundOff'
  | 'notReady'

export type StoryColors = { page: string; text: string; accent: string; accentText: string; backdrop: string }

export type StoryLook = {
  fonts: { heading: string; body: string }
  colors: StoryColors
  words: Partial<Record<WordKey, string>>
}

export type StoryDocument = {
  version: 2
  opening: StoryOpening
  chapters: Chapter[]
  look: StoryLook
}
