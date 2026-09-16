import type { StoryLook, WordKey } from './types'

export const WORD_KEYS: WordKey[] = [
  'eyebrow',
  'begin',
  'soundNote',
  'chapterWord',
  'voiceLabel',
  'ownWords',
  'readAlong',
  'soundOn',
  'soundOff',
  'notReady',
]

export const WORD_DEFAULTS: Record<WordKey, string> = {
  eyebrow: 'The life story of',
  begin: 'Begin the story',
  soundNote: 'This story is told with sound',
  chapterWord: 'Chapter',
  voiceLabel: '',
  ownWords: 'In her own words',
  readAlong: 'Read along',
  soundOn: 'Sound on',
  soundOff: 'Sound off',
  notReady: 'This story is still being written.',
}

export const WORD_INFO: Record<WordKey, { label: string; hint: string }> = {
  eyebrow: { label: 'Small line above your name', hint: 'On the first screen' },
  begin: { label: 'The button that starts the story', hint: 'On the first screen' },
  soundNote: { label: 'Note under the button', hint: 'Tells visitors the story has sound' },
  chapterWord: { label: 'The word before each chapter number', hint: 'Leave this empty to show only your chapter titles' },
  voiceLabel: { label: 'Label on your voice recordings', hint: 'Usually your first name, in her own voice' },
  ownWords: { label: 'Small line above a voice recording', hint: '' },
  readAlong: { label: 'Heading above a written-down recording', hint: '' },
  soundOn: { label: 'Sound button, when on', hint: 'Top right corner' },
  soundOff: { label: 'Sound button, when off', hint: 'Top right corner' },
  notReady: { label: 'Shown before you publish', hint: 'Visitors see this until your story is online' },
}

const NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']

export function wordsFor(look: StoryLook): Record<WordKey, string> {
  const out = { ...WORD_DEFAULTS }
  for (const key of WORD_KEYS) {
    const value = look.words[key]
    if (typeof value === 'string') out[key] = value
  }
  return out
}

export function chapterLabel(index: number, title: string, chapterWord: string): string {
  const word = chapterWord.trim()
  const name = title.trim()
  if (!word) return name
  const n = NUMBER_WORDS[index] ?? String(index + 1)
  return name ? `${word} ${n} · ${name}` : `${word} ${n}`
}

export function voiceLabel(name: string, override: string): string {
  if (override.trim()) return override
  const first = name.trim().split(/\s+/)[0]
  return first ? `${first}, in her own voice` : 'In her own voice'
}

/** Stores only overrides. An empty chapter word is meaningful (numbering off); any other empty value means "use the original". */
export function setWord(look: StoryLook, key: WordKey, value: string): StoryLook {
  const words = { ...look.words }
  const keepEmpty = key === 'chapterWord'
  if (value === WORD_DEFAULTS[key] || (value === '' && !keepEmpty)) delete words[key]
  else words[key] = value
  return { ...look, words }
}
