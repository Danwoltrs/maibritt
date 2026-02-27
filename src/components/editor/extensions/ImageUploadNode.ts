import { Node, mergeAttributes, Command } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ImageUploadView from '../blocks/ImageUploadView'

export type ImageWidth = 'full' | '2/3' | '1/2' | '1/3'

export interface ImageUploadAttributes {
  src: string
  alt: string
  caption: string
  width: ImageWidth
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      insertImageUpload: (attrs: Partial<ImageUploadAttributes>) => ReturnType
    }
  }
}

export const ImageUploadNode = Node.create({
  name: 'imageUpload',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      caption: { default: '' },
      width: { default: 'full' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-upload"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-upload' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageUploadView)
  },

  addCommands() {
    return {
      insertImageUpload:
        (attrs: Partial<ImageUploadAttributes> = {}): Command =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    }
  },
})

export default ImageUploadNode
