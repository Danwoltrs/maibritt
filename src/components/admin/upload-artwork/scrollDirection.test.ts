import { describe, it, expect } from 'vitest'
import { computeScrollHidden } from './scrollDirection'

describe('computeScrollHidden', () => {
  it('always shows near the top, even if previously hidden', () => {
    expect(computeScrollHidden({ prevY: 500, currentY: 40, prevHidden: true })).toBe(false)
  })

  it('hides when scrolling down past the threshold', () => {
    expect(computeScrollHidden({ prevY: 200, currentY: 260, prevHidden: false })).toBe(true)
  })

  it('shows when scrolling up past the threshold', () => {
    expect(computeScrollHidden({ prevY: 400, currentY: 340, prevHidden: true })).toBe(false)
  })

  it('keeps the previous state on tiny movements (jitter)', () => {
    expect(computeScrollHidden({ prevY: 300, currentY: 303, prevHidden: true })).toBe(true)
    expect(computeScrollHidden({ prevY: 300, currentY: 303, prevHidden: false })).toBe(false)
  })
})
