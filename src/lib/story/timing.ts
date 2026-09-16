import type { SlideshowBlock } from './types'

export type Speed = 'slow' | 'medium' | 'fast'

const SPEED_SECONDS: Record<Speed, 3 | 5 | 8> = { slow: 8, medium: 5, fast: 3 }

export function speedToSeconds(speed: Speed): 3 | 5 | 8 {
  return SPEED_SECONDS[speed]
}

export function secondsToSpeed(seconds: number): Speed {
  if (seconds >= 8) return 'slow'
  if (seconds <= 3) return 'fast'
  return 'medium'
}

export function slideshowIntervalMs(block: SlideshowBlock): number {
  const count = Math.max(1, block.images.length)
  if (block.timing.mode === 'audio' && block.audio && block.audio.durationSec > 0) {
    return (block.audio.durationSec * 1000) / count
  }
  if (block.timing.mode === 'interval') return block.timing.seconds * 1000
  return 5000
}

export function slideIndexForTime(timeSec: number, durationSec: number, count: number): number {
  if (count <= 1 || durationSec <= 0) return 0
  const per = durationSec / count
  return Math.max(0, Math.min(count - 1, Math.floor(timeSec / per)))
}

export function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
