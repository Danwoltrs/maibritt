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

export type TextBlock = { id: string; kind: 'text'; heading: string; body: string }
export type PhotoBlock = { id: string; kind: 'photo'; image: ImageRef; caption: string }
export type GalleryBlock = { id: string; kind: 'gallery'; images: CaptionedImage[] }
export type SlideshowBlock = {
  id: string
  kind: 'slideshow'
  images: CaptionedImage[]
  timing: SlideshowTiming
  audio: AudioRef | null
}
export type AudioBlock = { id: string; kind: 'audio'; heading: string; audio: AudioRef }
export type VideoBlock = { id: string; kind: 'video'; source: VideoSource; caption: string }

export type Block = TextBlock | PhotoBlock | GalleryBlock | SlideshowBlock | AudioBlock | VideoBlock
export type BlockKind = Block['kind']

export type Chapter = { id: string; title: string; blocks: Block[] }

export type StoryOpening = {
  name: string
  title: string
  portrait: ImageRef | null
  cover: ImageRef | null
}

export type StoryDocument = {
  version: 1
  opening: StoryOpening
  chapters: Chapter[]
}
