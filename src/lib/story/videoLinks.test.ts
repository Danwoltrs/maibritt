import { describe, it, expect } from 'vitest'
import { parseVideoLink, embedUrl } from './videoLinks'

describe('parseVideoLink', () => {
  it('parses the YouTube forms', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
    ]) {
      expect(parseVideoLink(url)).toMatchObject({ provider: 'youtube', videoId: 'dQw4w9WgXcQ' })
    }
  })
  it('parses the Vimeo forms', () => {
    for (const url of ['https://vimeo.com/76979871', 'https://player.vimeo.com/video/76979871', 'vimeo.com/channels/staffpicks/76979871']) {
      expect(parseVideoLink(url)).toMatchObject({ provider: 'vimeo', videoId: '76979871' })
    }
  })
  it('rejects everything else', () => {
    expect(parseVideoLink('https://example.com/video.mp4')).toBeNull()
    expect(parseVideoLink('not a link')).toBeNull()
    expect(parseVideoLink('')).toBeNull()
  })
})

describe('embedUrl', () => {
  it('uses the privacy embeds', () => {
    const yt = parseVideoLink('https://youtu.be/dQw4w9WgXcQ')!
    expect(embedUrl(yt, true)).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1&playsinline=1')
    const vm = parseVideoLink('https://vimeo.com/76979871')!
    expect(embedUrl(vm, false)).toBe('https://player.vimeo.com/video/76979871?dnt=1&autoplay=0')
  })
})
