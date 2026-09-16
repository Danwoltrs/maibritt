import { describe, it, expect } from 'vitest'
import { speedToSeconds, secondsToSpeed, slideshowIntervalMs, slideIndexForTime, formatTime } from './timing'
import type { SlideshowBlock, CaptionedImage } from './types'

const img = (n: number): CaptionedImage => ({ url: `${n}`, thumbnailUrl: `${n}`, width: 1, height: 1, caption: '' })
const base = (n: number): Omit<SlideshowBlock, 'timing' | 'audio'> => ({ id: 's', kind: 'slideshow', images: Array.from({ length: n }, (_, i) => img(i)) })

describe('speed mapping', () => {
  it('maps slow / medium / fast to 8 / 5 / 3 seconds', () => {
    expect(speedToSeconds('slow')).toBe(8)
    expect(speedToSeconds('medium')).toBe(5)
    expect(speedToSeconds('fast')).toBe(3)
    expect(secondsToSpeed(8)).toBe('slow')
    expect(secondsToSpeed(3)).toBe('fast')
  })
})

describe('slideshowIntervalMs', () => {
  it('uses the fixed interval', () => {
    expect(slideshowIntervalMs({ ...base(4), timing: { mode: 'interval', seconds: 5 }, audio: null })).toBe(5000)
  })
  it('spreads photos evenly across the recording', () => {
    const block: SlideshowBlock = { ...base(4), timing: { mode: 'audio' }, audio: { url: 'a', durationSec: 60, transcript: '' } }
    expect(slideshowIntervalMs(block)).toBe(15000)
  })
  it('falls back to 5 seconds when audio mode has no recording yet', () => {
    expect(slideshowIntervalMs({ ...base(4), timing: { mode: 'audio' }, audio: null })).toBe(5000)
  })
})

describe('slideIndexForTime', () => {
  it('picks the slide for a time and clamps to the last slide', () => {
    expect(slideIndexForTime(0, 60, 4)).toBe(0)
    expect(slideIndexForTime(14.9, 60, 4)).toBe(0)
    expect(slideIndexForTime(15, 60, 4)).toBe(1)
    expect(slideIndexForTime(60, 60, 4)).toBe(3)
    expect(slideIndexForTime(10, 0, 4)).toBe(0)
  })
})

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(600)).toBe('10:00')
  })
})
