import { NextResponse } from 'next/server'

export interface ScrapedMention {
  source: string
  sourceUrl: string
  title: string
  excerpt: string
  quoteEn?: string
  quotePt?: string
  author?: string
  authorTitle?: string
  date?: string
  imageUrl?: string
}

interface ScrapingSource {
  name: string
  url: string
  type: 'gallery' | 'platform' | 'press'
}

// Sources to scrape for Mai-Britt Wolthers mentions
const SCRAPING_SOURCES: ScrapingSource[] = [
  { name: 'Artsy', url: 'https://www.artsy.net/artist/mai-britt-wolthers', type: 'platform' },
  { name: 'Artsper', url: 'https://www.artsper.com/us/contemporary-artists/denmark/10273/mai-britt-wolthers', type: 'platform' },
  { name: 'Galeria Eduardo Fernandes', url: 'https://galeriaeduardofernandes.com/artistas-blog/mai-britt-wolthers', type: 'gallery' },
  { name: 'SP-Arte', url: 'https://www.sp-arte.com/en/artists/mai-britt-wolthers/', type: 'platform' },
  { name: 'Artsoul', url: 'https://en.artsoul.com.br/artistas/mai-britt-wolthers', type: 'platform' },
  { name: 'Portas Vilaseca Galeria', url: 'https://www.portasvilaseca.com.br/br/artistas/mai-britt-wolthers/', type: 'gallery' },
  { name: 'Artblr', url: 'https://www.artblr.com/maibrittwolthers/en', type: 'platform' },
  { name: 'Foraarsudstillingen', url: 'https://www.foraarsudstillingen.dk/en/artist/mai-britt-wolthers-br-ch/', type: 'platform' },
]

// Extract text content from HTML
function extractText(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

// Extract potential quotes from text (sentences in quotation marks or with attribution)
function extractQuotes(text: string): string[] {
  const quotes: string[] = []

  // Match text in various quotation styles
  const quotationPatterns = [
    /"([^"]{20,300})"/g,  // Double quotes
    /"([^"]{20,300})"/g,  // Smart quotes
    /«([^»]{20,300})»/g,  // Guillemets
    /'([^']{20,300})'/g,  // Single quotes
  ]

  for (const pattern of quotationPatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      if (match[1] && match[1].length > 20) {
        quotes.push(match[1].trim())
      }
    }
  }

  return quotes
}

// Extract meta description or first meaningful paragraph
function extractDescription(html: string): string {
  // Try meta description first
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  if (metaMatch && metaMatch[1]) {
    return metaMatch[1]
  }

  // Try og:description
  const ogMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
  if (ogMatch && ogMatch[1]) {
    return ogMatch[1]
  }

  // Fall back to first paragraph with substantial content
  const text = extractText(html)
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 50)
  if (sentences.length > 0) {
    return sentences.slice(0, 2).join('. ').substring(0, 500)
  }

  return ''
}

// Extract page title
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim()
  }

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim()
  }

  return ''
}

// Extract image URL
function extractImage(html: string, baseUrl: string): string | undefined {
  // Try og:image first
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  if (ogMatch && ogMatch[1]) {
    const imgUrl = ogMatch[1]
    return imgUrl.startsWith('http') ? imgUrl : new URL(imgUrl, baseUrl).href
  }

  return undefined
}

// Scrape a single source
async function scrapeSource(source: ScrapingSource): Promise<ScrapedMention | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log(`Failed to fetch ${source.name}: ${response.status}`)
      return null
    }

    const html = await response.text()
    const title = extractTitle(html)
    const excerpt = extractDescription(html)
    const imageUrl = extractImage(html, source.url)
    const text = extractText(html)
    const quotes = extractQuotes(text)

    // Only return if we found meaningful content
    if (!excerpt && quotes.length === 0) {
      return null
    }

    return {
      source: source.name,
      sourceUrl: source.url,
      title: title || source.name,
      excerpt: excerpt || '',
      quoteEn: quotes[0], // First quote found (if any)
      imageUrl,
    }
  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error)
    return null
  }
}

// Google search for recent mentions
async function searchGoogleMentions(): Promise<ScrapedMention[]> {
  // Note: For production, you'd want to use Google Custom Search API
  // This is a simplified version that returns known sources
  const mentions: ScrapedMention[] = []

  // Known press mentions from web search results
  const knownMentions = [
    {
      source: 'A Cor Divagante Exhibition',
      sourceUrl: 'https://en.artsoul.com.br/revista/eventos/exposicao-a-cor-divagante-individual-da-artista-mai-britt-wolthers',
      title: 'Exposição "A Cor Divagante" - Mai-Britt Wolthers',
      excerpt: 'Individual exhibition showcasing Mai-Britt Wolthers exploration of color and form in contemporary painting.',
    },
    {
      source: 'Incertezas Amanhecem Exhibition',
      sourceUrl: 'https://galeriaeduardofernandes.com/exposicoes/mai-britt-wolthers-incertezas-amanhecem',
      title: 'Mai-Britt Wolthers | Incertezas Amanhecem',
      excerpt: 'Solo exhibition at Galeria Eduardo Fernandes featuring new works exploring uncertainty and dawn.',
    },
    {
      source: 'Charlottenborg Spring Exhibition',
      sourceUrl: 'https://www.foraarsudstillingen.dk/en/artist/mai-britt-wolthers-br-ch/',
      title: 'Mai-Britt Wolthers at Charlottenborg Spring Exhibition',
      excerpt: 'Selected to participate in the traditional Charlottenborg Spring Exhibition at Charlottenborgs Kunsthal in Copenhagen.',
    },
    {
      source: 'Den Frie - Artists Autumn Exhibition 2021',
      sourceUrl: 'https://www.artland.com/exhibitions/the-artists-autumn-exhibition-2021',
      title: 'The Artists Autumn Exhibition 2021',
      excerpt: 'Group exhibition at Den Frie in Copenhagen featuring works by Mai-Britt Wolthers alongside other contemporary artists.',
    },
  ]

  return knownMentions
}

export async function GET() {
  try {
    const results: ScrapedMention[] = []

    // Scrape all sources in parallel with a limit
    const scrapePromises = SCRAPING_SOURCES.map(source => scrapeSource(source))
    const scrapedResults = await Promise.all(scrapePromises)

    // Filter out null results
    for (const result of scrapedResults) {
      if (result) {
        results.push(result)
      }
    }

    // Add known press mentions
    const knownMentions = await searchGoogleMentions()
    results.push(...knownMentions)

    // Remove duplicates based on URL
    const uniqueResults = results.filter((item, index, self) =>
      index === self.findIndex(t => t.sourceUrl === item.sourceUrl)
    )

    return NextResponse.json({
      success: true,
      mentions: uniqueResults,
      scrapedAt: new Date().toISOString(),
      sourcesChecked: SCRAPING_SOURCES.length,
    })
  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to scrape press mentions' },
      { status: 500 }
    )
  }
}
