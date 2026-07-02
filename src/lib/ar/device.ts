export type ArPlatform = 'ios' | 'android' | 'desktop'

/** iPadOS Safari reports a macOS UA; multi-touch is the tell. */
export function detectArPlatform(ua: string, maxTouchPoints: number): ArPlatform {
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Macintosh/.test(ua) && maxTouchPoints > 1) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

export function currentArPlatform(): ArPlatform {
  if (typeof navigator === 'undefined') return 'desktop'
  return detectArPlatform(navigator.userAgent, navigator.maxTouchPoints ?? 0)
}
