import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

interface TranslateRequest {
  text: string
  sourceLanguage: 'en' | 'pt-BR'
  targetLanguage: 'en' | 'pt-BR'
  format: 'plain' | 'tiptap'
}

function extractTextFromTiptapNode(node: Record<string, unknown>): string {
  if (node.type === 'text') return (node.text as string) || ''
  const children = node.content as Record<string, unknown>[] | undefined
  if (!children) return ''
  return children.map(extractTextFromTiptapNode).join('')
}

async function translateText(text: string, source: string, target: string): Promise<string> {
  const sourceName = source === 'en' ? 'English' : 'Brazilian Portuguese'
  const targetName = target === 'en' ? 'English' : 'Brazilian Portuguese'

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Translate the following text from ${sourceName} to ${targetName}. This is for a contemporary art context (artist Mai-Britt Wolthers). Return ONLY the translated text, nothing else.\n\n${text}`,
      },
    ],
  })

  const block = message.content[0]
  if (block.type === 'text') return block.text
  return ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function translateTiptapDoc(doc: Record<string, any>, source: string, target: string): Promise<Record<string, any>> {
  // Deep clone
  const clone = JSON.parse(JSON.stringify(doc))

  // Collect all text content, translate in batch, then replace
  const textParts: string[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textNodes: Record<string, any>[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function collectTextNodes(node: Record<string, any>) {
    if (node.type === 'text' && node.text) {
      textParts.push(node.text)
      textNodes.push(node)
    }
    if (node.content) {
      for (const child of node.content) {
        collectTextNodes(child)
      }
    }
  }

  collectTextNodes(clone)

  if (textParts.length === 0) return clone

  // Batch translate: join with delimiter, translate, split back
  const delimiter = '\n|||SPLIT|||\n'
  const joined = textParts.join(delimiter)

  const translated = await translateText(joined, source, target)
  const translatedParts = translated.split(/\n?\|\|\|SPLIT\|\|\|\n?/)

  // Map translated parts back to nodes
  for (let i = 0; i < textNodes.length; i++) {
    textNodes[i].text = translatedParts[i] || textNodes[i].text
  }

  return clone
}

export async function POST(request: Request) {
  try {
    // Auth check
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: TranslateRequest = await request.json()
    const { text, sourceLanguage, targetLanguage, format } = body

    if (!text || !sourceLanguage || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (format === 'tiptap') {
      const doc = JSON.parse(text)
      const translated = await translateTiptapDoc(doc, sourceLanguage, targetLanguage)
      return NextResponse.json({ translated: JSON.stringify(translated) })
    }

    const translated = await translateText(text, sourceLanguage, targetLanguage)
    return NextResponse.json({ translated })
  } catch (err) {
    console.error('Translation error:', err)
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}
