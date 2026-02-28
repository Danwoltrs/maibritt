// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TiptapDoc = Record<string, any>

export type BlockWidth = 'full' | 'half'

export interface TextBlock {
  id: string
  type: 'text'
  width: BlockWidth
  content: { tiptapDoc: TiptapDoc }
}

export interface SeriesBlock {
  id: string
  type: 'series'
  width: BlockWidth
  seriesId: string
  name?: string
  coverImage?: string
  artworkCount?: number
}

export interface ExhibitionBlock {
  id: string
  type: 'exhibition'
  width: BlockWidth
  exhibitionId: string
  title?: string
  imageUrl?: string
  subtitle?: string
}

export interface ImageBlock {
  id: string
  type: 'image'
  width: BlockWidth
  src: string
  alt: string
  caption: string
}

export type ContentBlock = TextBlock | SeriesBlock | ExhibitionBlock | ImageBlock

export interface PageBuilderDoc {
  version: 2
  blocks: ContentBlock[]
}

export function isPageBuilderDoc(doc: unknown): doc is PageBuilderDoc {
  return (
    typeof doc === 'object' &&
    doc !== null &&
    'version' in doc &&
    (doc as PageBuilderDoc).version === 2 &&
    'blocks' in doc &&
    Array.isArray((doc as PageBuilderDoc).blocks)
  )
}

export function isTextBlock(block: ContentBlock): block is TextBlock {
  return block.type === 'text'
}

export function isSeriesBlock(block: ContentBlock): block is SeriesBlock {
  return block.type === 'series'
}

export function isExhibitionBlock(block: ContentBlock): block is ExhibitionBlock {
  return block.type === 'exhibition'
}

export function isImageBlock(block: ContentBlock): block is ImageBlock {
  return block.type === 'image'
}
