export type LinkSource = { type: 'link'; provider: 'youtube' | 'vimeo'; videoId: string; url: string }

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const VIMEO_ID = /^\d{6,12}$/

function toUrl(input: string): URL | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
}

export function parseVideoLink(input: string): LinkSource | null {
  const url = toUrl(input)
  if (!url) return null
  const host = url.hostname.replace(/^www\.|^m\./, '')
  const parts = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be') {
    const id = parts[0]
    return id && YOUTUBE_ID.test(id) ? { type: 'link', provider: 'youtube', videoId: id, url: url.toString() } : null
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    let id = url.searchParams.get('v')
    if (!id && (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live')) id = parts[1] ?? null
    return id && YOUTUBE_ID.test(id) ? { type: 'link', provider: 'youtube', videoId: id, url: url.toString() } : null
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = [...parts].reverse().find((p) => VIMEO_ID.test(p))
    return id ? { type: 'link', provider: 'vimeo', videoId: id, url: url.toString() } : null
  }
  return null
}

export function embedUrl(source: LinkSource, autoplay: boolean): string {
  if (source.provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${source.videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`
  }
  return `https://player.vimeo.com/video/${source.videoId}?dnt=1&autoplay=${autoplay ? 1 : 0}`
}
