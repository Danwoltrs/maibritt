import { describe, it, expect } from 'vitest'
import { detectArPlatform } from './device'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const IPAD_DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15'
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0 Mobile Safari/537.36'
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0 Safari/537.36'

describe('detectArPlatform', () => {
  it('detects iPhone', () => expect(detectArPlatform(IPHONE, 5)).toBe('ios'))
  it('detects iPad masquerading as macOS via touch points', () => {
    expect(detectArPlatform(IPAD_DESKTOP_UA, 5)).toBe('ios')
  })
  it('detects Android', () => expect(detectArPlatform(ANDROID, 5)).toBe('android'))
  it('detects desktop (no touch)', () => expect(detectArPlatform(MAC, 0)).toBe('desktop'))
})
