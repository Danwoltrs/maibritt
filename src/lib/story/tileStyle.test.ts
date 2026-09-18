import { describe, it, expect } from 'vitest'
import { MENU_FOR, SCALE_STEPS, TILE_ROLE, clearTileStyle, nextScale, setTileStyle, styleOf, tileCss } from './tileStyle'
import { TILE_KEYS, defaultLayout } from './layout'
import type { SectionLayout } from './types'

const base = (): SectionLayout => defaultLayout('opening')

describe('nextScale', () => {
  it('walks the ladder and stops at both ends', () => {
    expect(nextScale(1, 1)).toBe(SCALE_STEPS[SCALE_STEPS.indexOf(1) + 1])
    expect(nextScale(1, -1)).toBe(SCALE_STEPS[SCALE_STEPS.indexOf(1) - 1])
    expect(nextScale(SCALE_STEPS[SCALE_STEPS.length - 1], 1)).toBe(SCALE_STEPS[SCALE_STEPS.length - 1])
    expect(nextScale(SCALE_STEPS[0], -1)).toBe(SCALE_STEPS[0])
  })
  it('snaps an unknown value onto the ladder', () => {
    expect(SCALE_STEPS).toContain(nextScale(1.07, 1))
  })
})

describe('setTileStyle', () => {
  it('merges without mutating and reads back', () => {
    const layout = base()
    const a = setTileStyle(layout, 'name', { font: 'caveat' })
    const b = setTileStyle(a, 'name', { color: '#112233' })
    expect(styleOf(b, 'name')).toEqual({ font: 'caveat', color: '#112233' })
    expect(styleOf(layout, 'name')).toEqual({})
    expect(layout.styles).toBeUndefined()
  })
  it('merges into the box rather than replacing it', () => {
    const a = setTileStyle(base(), 'name', { box: { background: '#000000' } })
    const b = setTileStyle(a, 'name', { box: { padding: 2 } })
    expect(styleOf(b, 'name').box).toEqual({ background: '#000000', padding: 2 })
  })
  it('removes a key set to undefined, then prunes the style and the map', () => {
    const a = setTileStyle(base(), 'name', { font: 'caveat' })
    const b = setTileStyle(a, 'name', { font: undefined })
    expect(b.styles).toBeUndefined()
  })
  it('keeps other tiles when one is cleared', () => {
    let l = setTileStyle(base(), 'name', { font: 'caveat' })
    l = setTileStyle(l, 'title', { color: '#ffffff' })
    const cleared = clearTileStyle(l, 'name')
    expect(styleOf(cleared, 'name')).toEqual({})
    expect(styleOf(cleared, 'title')).toEqual({ color: '#ffffff' })
  })
  it('clearing the last style removes the map entirely', () => {
    const l = setTileStyle(base(), 'name', { font: 'caveat' })
    expect(clearTileStyle(l, 'name').styles).toBeUndefined()
  })
  it('ignores an unknown tile key', () => {
    expect(setTileStyle(base(), 'nope', { font: 'caveat' }).styles).toBeUndefined()
  })
})

describe('tileCss', () => {
  it('is empty for an empty style', () => {
    const { css, boxCss } = tileCss({}, 'text')
    expect(css).toEqual({})
    expect(boxCss).toBeNull()
  })
  it('scales a portrait as a whole rather than by font size', () => {
    const { css } = tileCss({ scale: 1.6 }, 'image')
    expect(css.transform).toBe('scale(1.6)')
    expect((css as unknown as Record<string, unknown>)['--piece-scale']).toBeUndefined()
    expect(tileCss({ scale: 1.6 }, 'player').css.transform).toBe('scale(1.6)')
  })
  it('declares the family as well as the variables so any piece follows', () => {
    const { css } = tileCss({ font: 'inter' }, 'text')
    expect(css.fontFamily).toBe('var(--font-inter-story)')
  })
  it('maps scale, align and indent', () => {
    const { css } = tileCss({ scale: 1.35, align: 'right', indent: 2 }, 'text')
    expect(css['--piece-scale' as keyof typeof css]).toBe(1.35)
    expect(css.textAlign).toBe('right')
    expect(css.alignItems).toBe('flex-end')
    expect(css.paddingLeft).toBe(64)
  })
  it('paints a box when asked', () => {
    const { boxCss } = tileCss({ box: { background: '#102030', padding: 2, radius: 3 } }, 'text')
    expect(boxCss).toMatchObject({ background: '#102030', padding: 16, borderRadius: 18 })
  })
  it('sets both font variables, from the catalogue, so any piece follows', () => {
    const { css } = tileCss({ font: 'inter' }, 'text') as unknown as { css: Record<string, string> }
    expect(css['--story-heading-font']).toBe('var(--font-inter-story)')
    expect(css['--story-body-font']).toBe('var(--font-inter-story)')
    expect((tileCss({ font: 'caveat' }, 'text').css as Record<string, string>)['--story-body-font']).toBe('var(--font-caveat)')
  })
  it('falls back to the default family for an unknown font id', () => {
    const { css } = tileCss({ font: 'not-a-font' }, 'text') as unknown as { css: Record<string, string> }
    expect(css['--story-heading-font']).toBe('var(--font-cormorant)')
  })
  it('repaints just this button through the accent variables', () => {
    const { css } = tileCss({ button: { background: '#112233', label: '#ffffff', corners: 'square' } }, 'button') as unknown as { css: Record<string, string> }
    expect(css['--accent']).toBe('#112233')
    expect(css['--accent-text']).toBe('#ffffff')
    expect(css['--begin-radius']).toBe('4px')
  })
  it('drops the default round corners rather than storing them', () => {
    const l = setTileStyle(defaultLayout('opening'), 'begin', { button: { corners: 'round' } })
    expect(l.styles).toBeUndefined()
  })
  it('puts colour on text but not on a button', () => {
    expect((tileCss({ color: '#abcdef' }, 'text').css as unknown as Record<string, string>)['--piece-color']).toBe('#abcdef')
    expect((tileCss({ color: '#abcdef' }, 'button').css as unknown as Record<string, string>)['--piece-color']).toBeUndefined()
  })
})

describe('roles and menus', () => {
  it('gives every tile in every section a role with a menu', () => {
    for (const keys of Object.values(TILE_KEYS)) {
      for (const key of keys) {
        const role = TILE_ROLE[key]
        expect(role, `no role for ${key}`).toBeTruthy()
        expect(MENU_FOR[role].length).toBeGreaterThan(0)
      }
    }
  })
  it('every menu ends with the reset', () => {
    for (const sections of Object.values(MENU_FOR)) {
      expect(sections[sections.length - 1]).toBe('reset')
    }
  })
  it('only text offers writing marks and alignment', () => {
    expect(MENU_FOR.text).toContain('align')
    expect(MENU_FOR.button).not.toContain('align')
    expect(MENU_FOR.image).not.toContain('font')
  })
})
