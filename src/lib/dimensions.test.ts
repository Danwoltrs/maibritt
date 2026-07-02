import { describe, it, expect } from 'vitest'
import { parseDimensionsToCm, composeDimensions } from './dimensions'

describe('parseDimensionsToCm', () => {
  it('parses compact form', () => {
    expect(parseDimensionsToCm('185×285')).toEqual({ heightCm: 185, widthCm: 285 })
  })
  it('parses spaced form with unit', () => {
    expect(parseDimensionsToCm('100 x 80 cm')).toEqual({ heightCm: 100, widthCm: 80 })
  })
  it('parses decimal comma', () => {
    expect(parseDimensionsToCm('80,5 X 100 cm')).toEqual({ heightCm: 80.5, widthCm: 100 })
  })
  it('rejects strings without an HxW pair', () => {
    expect(parseDimensionsToCm('variable dimensions')).toBeNull()
    expect(parseDimensionsToCm('')).toBeNull()
  })
  it('rejects implausible sizes', () => {
    expect(parseDimensionsToCm('1850 x 2850')).toBeNull()
  })
})

describe('composeDimensions', () => {
  it('composes integers', () => {
    expect(composeDimensions(185, 285)).toBe('185 x 285 cm')
  })
  it('uses decimal comma and trims trailing zeros', () => {
    expect(composeDimensions(80.5, 100)).toBe('80,5 x 100 cm')
  })
  it('returns empty string when a side is missing', () => {
    expect(composeDimensions(undefined, 100)).toBe('')
    expect(composeDimensions(NaN, 100)).toBe('')
  })
})
