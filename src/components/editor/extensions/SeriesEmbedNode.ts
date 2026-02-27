import { Node, mergeAttributes, Command } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import SeriesEmbedView from '../blocks/SeriesEmbedView'

export interface SeriesEmbedAttributes {
  seriesId: string
  name: string
  coverImage: string
  artworkCount: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    seriesEmbed: {
      insertSeriesEmbed: (attrs: SeriesEmbedAttributes) => ReturnType
    }
  }
}

export const SeriesEmbedNode = Node.create({
  name: 'seriesEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      seriesId: { default: '' },
      name: { default: '' },
      coverImage: { default: '' },
      artworkCount: { default: 0 },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="series-embed"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'series-embed' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SeriesEmbedView)
  },

  addCommands() {
    return {
      insertSeriesEmbed:
        (attrs: SeriesEmbedAttributes): Command =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    }
  },
})

export default SeriesEmbedNode
