import { describe, it, expect } from 'vitest'
import { buildYearOptions, parseYearInput } from './yearOptions'

describe('buildYearOptions', () => {
  it('sorts newest to oldest', () => {
    expect(buildYearOptions([1998, 2019, 2004], 2019, 2026)).toEqual([2026, 2019, 2004, 1998])
  })

  it('always includes the current year even when no artwork uses it', () => {
    expect(buildYearOptions([1998], undefined, 2026)).toEqual([2026, 1998])
  })

  it('includes the selected year even when it is not in the catalogue', () => {
    expect(buildYearOptions([2019], 1987, 2026)).toContain(1987)
  })

  it('de-duplicates years', () => {
    expect(buildYearOptions([2026, 2026, 2019], 2019, 2026)).toEqual([2026, 2019])
  })

  it('drops nullish and non-finite entries', () => {
    const years = [2019, null, undefined, NaN] as unknown as number[]
    expect(buildYearOptions(years, undefined, 2026)).toEqual([2026, 2019])
  })

  it('returns just the current year for an empty catalogue', () => {
    expect(buildYearOptions([], undefined, 2026)).toEqual([2026])
  })
})

describe('parseYearInput', () => {
  it('accepts a plain four-digit year', () => {
    expect(parseYearInput('1987')).toBe(1987)
  })

  it('trims surrounding whitespace', () => {
    expect(parseYearInput('  2001 ')).toBe(2001)
  })

  it('rejects non-numeric input', () => {
    expect(parseYearInput('nineteen')).toBeNull()
  })

  it('rejects years outside the plausible range', () => {
    expect(parseYearInput('987')).toBeNull()
    expect(parseYearInput('12345')).toBeNull()
    expect(parseYearInput('1899')).toBeNull()
  })

  it('rejects an empty string', () => {
    expect(parseYearInput('   ')).toBeNull()
  })

  it('rejects decimals', () => {
    expect(parseYearInput('1987.5')).toBeNull()
  })
})
