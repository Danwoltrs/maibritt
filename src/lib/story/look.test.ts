import { describe, it, expect } from 'vitest'
import { DEFAULT_COLORS, PALETTES, contrastRatio, isHex, mix, readabilityNote, themeVars } from './look'

describe('mix', () => {
  it('interpolates in sRGB and clamps t', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000')
    expect(mix('#000000', '#ffffff', 2)).toBe('#ffffff')
  })
})

describe('contrastRatio', () => {
  it('matches WCAG for known pairs', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 3)
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1)
  })
})

describe('themeVars', () => {
  it('produces every variable the page reads', () => {
    const vars = themeVars(DEFAULT_COLORS)
    for (const name of ['--paper', '--paper-2', '--paper-3', '--white', '--ink', '--ink-2', '--ink-3', '--line', '--accent', '--accent-2', '--accent-soft', '--accent-text', '--backdrop', '--on-backdrop']) {
      expect(isHex(vars[name])).toBe(true)
    }
    expect(vars['--paper']).toBe('#f5f0e8')
    expect(vars['--ink']).toBe('#2a2521')
    expect(vars['--accent']).toBe('#b5623a')
    expect(vars['--on-backdrop']).toBe('#fbf9f5')
  })
  it('substitutes the default for a malformed colour', () => {
    expect(themeVars({ ...DEFAULT_COLORS, accent: 'red' })['--accent']).toBe('#b5623a')
  })
  it('puts dark text on a light backdrop', () => {
    expect(themeVars({ ...DEFAULT_COLORS, backdrop: '#fafafa' })['--on-backdrop']).toBe('#2a2521')
  })
})

describe('readabilityNote', () => {
  it('is null for the defaults and every palette', () => {
    expect(readabilityNote(DEFAULT_COLORS)).toBeNull()
    for (const p of PALETTES) expect(readabilityNote(p.colors)).toBeNull()
  })
  it('warns about text on page, then button text on accent', () => {
    expect(readabilityNote({ ...DEFAULT_COLORS, text: '#e0dcd4' })).toMatch(/hard to read on this page colour/)
    expect(readabilityNote({ ...DEFAULT_COLORS, accentText: '#b5623a' })).toMatch(/buttons/)
  })
})

describe('PALETTES', () => {
  it('has six, the first being the defaults', () => {
    expect(PALETTES).toHaveLength(6)
    expect(PALETTES[0].colors).toEqual(DEFAULT_COLORS)
    expect(new Set(PALETTES.map((p) => p.id)).size).toBe(6)
  })
})
