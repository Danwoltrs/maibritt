import { Node, mergeAttributes, Command } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ColumnLayoutView from '../blocks/ColumnLayoutView'

export type ColumnCount = 2 | 3

export interface ColumnLayoutAttributes {
  columns: ColumnCount
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columnLayout: {
      insertColumnLayout: (attrs?: Partial<ColumnLayoutAttributes>) => ReturnType
    }
  }
}

export const ColumnContentNode = Node.create({
  name: 'columnContent',
  group: 'block',
  content: 'block+',

  parseHTML() {
    return [{ tag: 'div[data-type="column-content"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column-content' })]
  },
})

export const ColumnLayoutNode = Node.create({
  name: 'columnLayout',
  group: 'block',
  content: 'columnContent+',

  addAttributes() {
    return {
      columns: { default: 2 },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="column-layout"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column-layout' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnLayoutView)
  },

  addCommands() {
    return {
      insertColumnLayout:
        (attrs: Partial<ColumnLayoutAttributes> = {}): Command =>
        ({ commands }) => {
          const columnCount: ColumnCount = attrs.columns ?? 2
          const columnNodes = Array.from({ length: columnCount }, () => ({
            type: 'columnContent',
            content: [{ type: 'paragraph' }],
          }))
          return commands.insertContent({
            type: this.name,
            attrs: { columns: columnCount },
            content: columnNodes,
          })
        },
    }
  },
})

export default ColumnLayoutNode
