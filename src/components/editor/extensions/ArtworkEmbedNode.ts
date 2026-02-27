import { Node, mergeAttributes, Command } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ArtworkEmbedView from '../blocks/ArtworkEmbedView'

export interface ArtworkEmbedAttributes {
  artworkId: string
  title: string
  year: number
  medium: string
  imageUrl: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    artworkEmbed: {
      insertArtworkEmbed: (attrs: ArtworkEmbedAttributes) => ReturnType
    }
  }
}

export const ArtworkEmbedNode = Node.create({
  name: 'artworkEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      artworkId: { default: '' },
      title: { default: '' },
      year: { default: null },
      medium: { default: '' },
      imageUrl: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="artwork-embed"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'artwork-embed' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ArtworkEmbedView)
  },

  addCommands() {
    return {
      insertArtworkEmbed:
        (attrs: ArtworkEmbedAttributes): Command =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    }
  },
})

export default ArtworkEmbedNode
