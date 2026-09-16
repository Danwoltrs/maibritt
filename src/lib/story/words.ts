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
