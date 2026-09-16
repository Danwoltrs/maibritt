import { describe, it, expect } from 'vitest'
import { chapterLabel, setWord, voiceLabel, wordsFor, WORD_DEFAULTS } from './words'
import { DEFAULT_LOOK } from './look'

describe('wordsFor', () => {
  it('returns every default when nothing is overridden', () => {
    expect(wordsFor(DEFAULT_LOOK)).toEqual(WORD_DEFAULTS)
  })
  it('applies overrides, including an empty chapter word', () => {
    const words = wordsFor({ ...DEFAULT_LOOK, words: { begin: 'Começar', chapterWord: '' } })
    expect(words.begin).toBe('Começar')
    expect(words.chapterWord).toBe('')
    expect(words.eyebrow).toBe('The life story of')
  })
})

describe('chapterLabel', () => {
  it('spells the number in words with the chapter word', () => {
    expect(chapterLabel(0, 'Childhood', 'Chapter')).toBe('Chapter one · Childhood')
    expect(chapterLabel(1, '', 'Chapter')).toBe('Chapter two')
    expect(chapterLabel(2, 'Santos', 'Capítulo')).toBe('Capítulo three · Santos')
  })
  it('falls back to digits past twelve', () => {
    expect(chapterLabel(12, '', 'Chapter')).toBe('Chapter 13')
  })
  it('shows only the title when the chapter word is blank', () => {
    expect(chapterLabel(0, 'Childhood', '')).toBe('Childhood')
    expect(chapterLabel(0, '', '   ')).toBe('')
  })
})

describe('voiceLabel', () => {
  it('uses the first name', () => {
    expect(voiceLabel('Mai-Britt Wolthers', '')).toBe('Mai-Britt, in her own voice')
    expect(voiceLabel('', '')).toBe('In her own voice')
  })
  it('uses an override verbatim', () => {
    expect(voiceLabel('Mai-Britt', 'Na minha voz')).toBe('Na minha voz')
  })
})

describe('setWord', () => {
  it('stores a value that differs from the default and removes one that matches', () => {
    let look = setWord(DEFAULT_LOOK, 'begin', 'Começar')
    expect(look.words).toEqual({ begin: 'Começar' })
    look = setWord(look, 'begin', 'Begin the story')
    expect(look.words).toEqual({})
  })
  it('keeps an empty chapter word but drops other empty values', () => {
    expect(setWord(DEFAULT_LOOK, 'chapterWord', '').words).toEqual({ chapterWord: '' })
    expect(setWord(DEFAULT_LOOK, 'eyebrow', '').words).toEqual({})
    expect(setWord(DEFAULT_LOOK, 'voiceLabel', '').words).toEqual({})
  })
  it('does not mutate the input', () => {
    const before = { ...DEFAULT_LOOK, words: {} }
    setWord(before, 'begin', 'x')
    expect(before.words).toEqual({})
  })
})
