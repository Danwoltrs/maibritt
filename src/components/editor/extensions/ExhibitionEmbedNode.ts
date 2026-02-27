import { Node, mergeAttributes, Command } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ExhibitionEmbedView from '../blocks/ExhibitionEmbedView'

export interface ExhibitionEmbedAttributes {
  exhibitionId: string
  title: string
  year: number
  venue: string
  imageUrl: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    exhibitionEmbed: {
      insertExhibitionEmbed: (attrs: ExhibitionEmbedAttributes) => ReturnType
    }
  }
}

export const ExhibitionEmbedNode = Node.create({
  name: 'exhibitionEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      exhibitionId: { default: '' },
      title: { default: '' },
      year: { default: null },
      venue: { default: '' },
      imageUrl: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="exhibition-embed"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'exhibition-embed' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExhibitionEmbedView)
  },

  addCommands() {
    return {
      insertExhibitionEmbed:
        (attrs: ExhibitionEmbedAttributes): Command =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    }
  },
})

export default ExhibitionEmbedNode
