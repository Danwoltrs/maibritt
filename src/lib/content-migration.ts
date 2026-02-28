import type { PageBuilderDoc, TiptapDoc } from '@/components/admin/journal/page-builder/types'
import { isPageBuilderDoc } from '@/components/admin/journal/page-builder/types'

export { isPageBuilderDoc }

/**
 * Check if content is a legacy Tiptap doc (type: "doc")
 */
function isLegacyTiptapDoc(doc: unknown): doc is TiptapDoc {
  return (
    typeof doc === 'object' &&
    doc !== null &&
    'type' in doc &&
    (doc as TiptapDoc).type === 'doc'
  )
}

/**
 * Migrate a legacy Tiptap document to a PageBuilderDoc with a single full-width text block.
 */
export function migrateTiptapToPageBuilder(doc: TiptapDoc): PageBuilderDoc {
  return {
    version: 2,
    blocks: [
      {
        id: crypto.randomUUID(),
        type: 'text',
        width: 'full',
        content: { tiptapDoc: doc },
      },
    ],
  }
}

/**
 * Normalize content: if legacy Tiptap doc, auto-migrate; if already v2, return as-is.
 * Returns null if content is empty/invalid.
 */
export function normalizeContent(raw: unknown): PageBuilderDoc | null {
  if (!raw) return null
  if (isPageBuilderDoc(raw)) return raw
  if (isLegacyTiptapDoc(raw)) return migrateTiptapToPageBuilder(raw)
  return null
}

/**
 * Create an empty PageBuilderDoc.
 */
export function createEmptyPageBuilderDoc(): PageBuilderDoc {
  return { version: 2, blocks: [] }
}

/**
 * Extract plain text from all text blocks in a PageBuilderDoc (for reading time).
 */
export function extractTextFromPageBuilder(doc: PageBuilderDoc): string {
  const texts: string[] = []

  for (const block of doc.blocks) {
    if (block.type === 'text' && block.content?.tiptapDoc) {
      texts.push(extractTextFromTiptap(block.content.tiptapDoc))
    }
  }

  return texts.join(' ')
}

function extractTextFromTiptap(doc: TiptapDoc): string {
  const parts: string[] = []
  const walk = (node: TiptapDoc) => {
    if (node.type === 'text' && node.text) {
      parts.push(node.text)
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(walk)
    }
  }
  walk(doc)
  return parts.join(' ')
}
