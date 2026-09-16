# Life Story: Look & Arrange Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Mai-Britt choose every word, the fonts, the colours, and the position of every piece of each screen of her life story, from the same editor, with autosave and Undo.

**Architecture:** The story document gains a `look` (fonts, colours, word overrides) and optional per-section grid `layout`s; a normaliser upgrades stored version-1 documents on read so nothing changes until she changes it. Pure helpers in `src/lib/story/` (words, look, fonts, layout) are unit tested; a `StoryTheme` wrapper turns the look into the CSS variables the page already reads; an `Arranged` component renders a section either as its existing markup (no layout), a 12 × 8 CSS grid (wide screens) or a reading-order stack (phones). The editor gains a Look screen (fonts / colours / words with a live scaled preview) and an Arrange screen (drag and resize tiles on a grid with @dnd-kit).

**Tech Stack:** Next.js 14 App Router, TypeScript, zustand, framer-motion, @dnd-kit/core + sortable + utilities (already installed), next/font/google, Tailwind 3.4 with arbitrary px values, vitest + jsdom.

**Spec:** `docs/superpowers/specs/2026-09-16-story-look-and-arrange-design.md` (extends `docs/superpowers/specs/2026-09-15-life-story-design.md`).

## Global Constraints

- Editor rules: text ≥ 18 px, buttons 56 px tall (`se-btn`), radius 10 px on controls, dialogs 14/22 px, every control is a word, no jargon.
- No SQL, no migration. The document version becomes `2`; `normalizeDocument` must accept `null`, version 1 and partial version 2.
- Components never render `<main>`; the root layout owns it.
- Every file stays under 400 lines for `src/components/story/*` and well under 2000 everywhere.
- The editor's own chrome must not be wrapped in `StoryTheme`; only the story, the preview and the Look/Arrange previews are.
- Media elements passed to `SoundProvider.register` set `crossOrigin="anonymous"` (existing rule; untouched code keeps it).
- Never run SQL against the project. Never touch the untracked `src/app/(admin)/exhibitions/page.tsx`. `npm run typecheck` is expected to show only the 8 pre-existing errors in that file.
- Commit on branch `feat/story-look`. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Verification commands: `npx vitest run` (baseline 226 passing), `npm run typecheck`.

---

## File map

Create:
- `src/lib/story/words.ts` (+ `words.test.ts`) — phrase defaults, overrides, chapter and voice labels.
- `src/lib/story/look.ts` (+ `look.test.ts`) — default look, palettes, colour maths, theme variables, readability note.
- `src/lib/story/fonts.ts` — the sixteen-font catalogue (pure).
- `src/lib/story/layout.ts` (+ `layout.test.ts`) — grid constants, tile keys, default layouts, move/resize/order helpers, layout setters.
- `src/app/story/fonts.ts` — `next/font/google` loaders for the catalogue.
- `src/components/story/StoryTheme.tsx` — look → CSS variables wrapper.
- `src/components/story/Arranged.tsx` — grid / stack / passthrough renderer.
- `src/components/story-editor/look/LookScreen.tsx`, `LookPreview.tsx`, `FontSection.tsx`, `FontPicker.tsx`, `ColourSection.tsx`, `WordSection.tsx`.
- `src/components/story-editor/arrange/ArrangeScreen.tsx`, `ArrangeCanvas.tsx`, `tiles.tsx`.

Modify:
- `src/lib/story/types.ts`, `src/lib/story/document.ts` (+ test), `src/services/story.service.ts`, `src/app/story/page.tsx`, `src/app/story/layout.tsx`, `src/app/story/story.css`.
- `src/components/story/Story.tsx`, `Opening.tsx`, `StoryChrome.tsx`, `NotReady.tsx`, `AudioPlayer.tsx`, `blocks/TextBlock.tsx`, `PhotoBlock.tsx`, `SlideshowBlock.tsx`, `AudioBlock.tsx`, `VideoBlock.tsx`, `GalleryBlock.tsx`.
- `src/components/story-editor/screens.ts`, `ui.tsx`, `TopBar.tsx`, `EditorApp.tsx`, `StoryOverview.tsx`, `BlockCard.tsx`.
- `src/components/Header.tsx`, `src/components/admin/Layout/AdminSidebar.tsx`, `src/app/dashboard/page.tsx`.

---

### Task 1: Site links (header, sidebar, dashboard)

**Files:**
- Modify: `src/components/Header.tsx:39-45`
- Modify: `src/components/admin/Layout/AdminSidebar.tsx:100-106` (+ the lucide import list at the top)
- Modify: `src/app/dashboard/page.tsx:21-45`

**Interfaces:** none.

- [ ] **Step 1: Header nav item**

In `src/components/Header.tsx` change the array to:

```ts
  const allNavigationItems = [
    { name: 'Portfolio', href: '/#hero', namePt: 'Portfolio' },
    { name: 'Exhibitions', href: '/#exhibitions', namePt: 'Exposicoes' },
    { name: 'About', href: '/#statement', namePt: 'Sobre' },
    { name: 'Story', href: '/story', namePt: 'História' },
    { name: 'Available Works', href: '/#availability', namePt: 'Trabalhos Disponíveis' },
    { name: 'Contact', href: '/#blog', namePt: 'Contato' },
  ]
```

- [ ] **Step 2: Admin sidebar item**

In `src/components/admin/Layout/AdminSidebar.tsx` add `BookOpen` to the `lucide-react` import list, then after the Journal entry (ends at line 105) add:

```ts
  {
    name: 'Life Story',
    href: '/story/edit',
    icon: BookOpen,
    description: 'Her story, in her words',
  },
```

- [ ] **Step 3: Dashboard quick action**

In `src/app/dashboard/page.tsx` append to `quickActions` (after the "New Journal Entry" entry):

```ts
  {
    title: 'Life Story',
    description: 'Write or edit her story',
    href: '/story/edit',
  },
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck 2>&1 | grep -v "exhibitions/page.tsx" | grep "error" ; echo done`
Expected: no lines before `done`.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx src/components/admin/Layout/AdminSidebar.tsx src/app/dashboard/page.tsx
git commit -m "feat(story): link the life story from the header, sidebar and dashboard

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Document version 2 — types, font catalogue, default look, normaliser

**Files:**
- Modify: `src/lib/story/types.ts`
- Create: `src/lib/story/fonts.ts`
- Create: `src/lib/story/look.ts` (defaults only in this task; maths in Task 4)
- Create: `src/lib/story/words.ts` (keys and defaults only in this task; helpers in Task 3)
- Modify: `src/lib/story/document.ts`, `src/lib/story/document.test.ts`
- Modify: `src/services/story.service.ts`, `src/app/story/page.tsx`

**Interfaces:**
- Produces: `StoryDocument.version = 2`, `StoryDocument.look: StoryLook`, `layout?: SectionLayout` on `StoryOpening` and every block; `DEFAULT_LOOK`, `DEFAULT_COLORS`; `FONTS`, `fontById(id)`, `FONT_KIND_LABEL`, `DEFAULT_HEADING_FONT`, `DEFAULT_BODY_FONT`; `WORD_KEYS`, `WORD_DEFAULTS`; `normalizeDocument(raw: unknown): StoryDocument`, `setLook(doc, look)`.

- [ ] **Step 1: Types**

Replace the bottom of `src/lib/story/types.ts` (from `export type TextBlock` to the end) with:

```ts
export type GridRect = { x: number; y: number; w: number; h: number }
export type SectionLayout = { cols: 12; rows: 8; tiles: Record<string, GridRect> }
type WithLayout = { layout?: SectionLayout }

export type TextBlock = WithLayout & { id: string; kind: 'text'; heading: string; body: string }
export type PhotoBlock = WithLayout & { id: string; kind: 'photo'; image: ImageRef; caption: string }
export type GalleryBlock = WithLayout & { id: string; kind: 'gallery'; images: CaptionedImage[] }
export type SlideshowBlock = WithLayout & {
  id: string
  kind: 'slideshow'
  images: CaptionedImage[]
  timing: SlideshowTiming
  audio: AudioRef | null
}
export type AudioBlock = WithLayout & { id: string; kind: 'audio'; heading: string; audio: AudioRef }
export type VideoBlock = WithLayout & { id: string; kind: 'video'; source: VideoSource; caption: string }

export type Block = TextBlock | PhotoBlock | GalleryBlock | SlideshowBlock | AudioBlock | VideoBlock
export type BlockKind = Block['kind']

export type Chapter = { id: string; title: string; blocks: Block[] }

export type StoryOpening = WithLayout & {
  name: string
  title: string
  portrait: ImageRef | null
  cover: ImageRef | null
}

export type WordKey =
  | 'eyebrow'
  | 'begin'
  | 'soundNote'
  | 'chapterWord'
  | 'voiceLabel'
  | 'ownWords'
  | 'readAlong'
  | 'soundOn'
  | 'soundOff'
  | 'notReady'

export type StoryColors = { page: string; text: string; accent: string; accentText: string; backdrop: string }

export type StoryLook = {
  fonts: { heading: string; body: string }
  colors: StoryColors
  words: Partial<Record<WordKey, string>>
}

export type StoryDocument = {
  version: 2
  opening: StoryOpening
  chapters: Chapter[]
  look: StoryLook
}
```

- [ ] **Step 2: Font catalogue**

Create `src/lib/story/fonts.ts`:

```ts
export type FontKind = 'serif' | 'display' | 'sans' | 'hand' | 'typewriter'
export type FontEntry = { id: string; name: string; kind: FontKind; cssVar: string }

export const DEFAULT_HEADING_FONT = 'cormorant'
export const DEFAULT_BODY_FONT = 'source-sans'

export const FONTS: FontEntry[] = [
  { id: 'cormorant', name: 'Cormorant Garamond', kind: 'serif', cssVar: '--font-cormorant' },
  { id: 'playfair', name: 'Playfair Display', kind: 'serif', cssVar: '--font-playfair' },
  { id: 'libre-baskerville', name: 'Libre Baskerville', kind: 'serif', cssVar: '--font-libre-baskerville' },
  { id: 'eb-garamond', name: 'EB Garamond', kind: 'serif', cssVar: '--font-eb-garamond' },
  { id: 'lora', name: 'Lora', kind: 'serif', cssVar: '--font-lora' },
  { id: 'fraunces', name: 'Fraunces', kind: 'serif', cssVar: '--font-fraunces' },
  { id: 'dm-serif', name: 'DM Serif Display', kind: 'display', cssVar: '--font-dm-serif' },
  { id: 'abril', name: 'Abril Fatface', kind: 'display', cssVar: '--font-abril' },
  { id: 'source-sans', name: 'Source Sans 3', kind: 'sans', cssVar: '--font-source-sans' },
  { id: 'inter', name: 'Inter', kind: 'sans', cssVar: '--font-inter-story' },
  { id: 'jost', name: 'Jost', kind: 'sans', cssVar: '--font-jost-story' },
  { id: 'nunito', name: 'Nunito', kind: 'sans', cssVar: '--font-nunito' },
  { id: 'raleway', name: 'Raleway', kind: 'sans', cssVar: '--font-raleway' },
  { id: 'caveat', name: 'Caveat', kind: 'hand', cssVar: '--font-caveat' },
  { id: 'dancing', name: 'Dancing Script', kind: 'hand', cssVar: '--font-dancing' },
  { id: 'special-elite', name: 'Special Elite', kind: 'typewriter', cssVar: '--font-special-elite' },
]

export const FONT_KIND_LABEL: Record<FontKind, string> = {
  serif: 'Elegant',
  display: 'Bold',
  sans: 'Clear',
  hand: 'Handwritten',
  typewriter: 'Typewriter',
}

export const FONT_KIND_ORDER: FontKind[] = ['serif', 'sans', 'hand', 'typewriter', 'display']

export function fontById(id: string): FontEntry {
  return FONTS.find((f) => f.id === id) ?? FONTS[0]
}
```

- [ ] **Step 3: Default look and word defaults**

Create `src/lib/story/look.ts`:

```ts
import type { StoryColors, StoryLook, StoryDocument } from './types'
import { DEFAULT_BODY_FONT, DEFAULT_HEADING_FONT } from './fonts'

export const DEFAULT_COLORS: StoryColors = {
  page: '#f5f0e8',
  text: '#2a2521',
  accent: '#b5623a',
  accentText: '#fbf9f5',
  backdrop: '#1e1712',
}

export const DEFAULT_LOOK: StoryLook = {
  fonts: { heading: DEFAULT_HEADING_FONT, body: DEFAULT_BODY_FONT },
  colors: DEFAULT_COLORS,
  words: {},
}

export function cloneLook(look: StoryLook): StoryLook {
  return { fonts: { ...look.fonts }, colors: { ...look.colors }, words: { ...look.words } }
}

export function setLook(doc: StoryDocument, look: StoryLook): StoryDocument {
  return { ...doc, look: cloneLook(look) }
}
```

Create `src/lib/story/words.ts`:

```ts
import type { WordKey } from './types'

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
```

(`voiceLabel`'s default is empty because it is built from her name at render time; Task 3 adds that.)

- [ ] **Step 4: Failing tests for the document**

In `src/lib/story/document.test.ts` add `normalizeDocument` to the import from `./document`, add `import { DEFAULT_LOOK } from './look'`, change the `createEmptyDocument` test and add a new describe:

```ts
describe('createEmptyDocument', () => {
  it('is version 2 with an empty opening, no chapters and the default look', () => {
    const doc = createEmptyDocument()
    expect(doc.version).toBe(2)
    expect(doc.chapters).toEqual([])
    expect(doc.opening).toEqual({ name: '', title: '', portrait: null, cover: null })
    expect(doc.look).toEqual(DEFAULT_LOOK)
    expect(doc.look).not.toBe(DEFAULT_LOOK)
  })
})

describe('normalizeDocument', () => {
  it('turns null into an empty version-2 document', () => {
    expect(normalizeDocument(null)).toEqual(createEmptyDocument())
  })

  it('upgrades a version-1 document and keeps its content', () => {
    const v1 = { version: 1, opening: { name: 'Mai', title: 'A life', portrait: null, cover: null }, chapters: [{ id: 'c', title: 'One', blocks: [] }] }
    const doc = normalizeDocument(v1)
    expect(doc.version).toBe(2)
    expect(doc.opening.name).toBe('Mai')
    expect(doc.chapters).toHaveLength(1)
    expect(doc.look).toEqual(DEFAULT_LOOK)
  })

  it('fills a partial look and drops unknown word keys', () => {
    const doc = normalizeDocument({ version: 2, opening: { name: 'M' }, chapters: [], look: { colors: { accent: '#123456' }, words: { begin: 'Começar', bogus: 'x' } } })
    expect(doc.look.fonts).toEqual(DEFAULT_LOOK.fonts)
    expect(doc.look.colors).toEqual({ ...DEFAULT_LOOK.colors, accent: '#123456' })
    expect(doc.look.words).toEqual({ begin: 'Começar' })
    expect(doc.opening).toEqual({ name: 'M', title: '', portrait: null, cover: null })
  })

  it('keeps section layouts as they are', () => {
    const layout = { cols: 12, rows: 8, tiles: { name: { x: 0, y: 0, w: 6, h: 2 } } }
    const doc = normalizeDocument({ version: 2, opening: { name: 'M', layout }, chapters: [], look: DEFAULT_LOOK })
    expect(doc.opening.layout).toEqual(layout)
  })

  it('does not share the default look object between documents', () => {
    const a = normalizeDocument(null)
    const b = normalizeDocument(null)
    a.look.colors.accent = '#000000'
    expect(b.look.colors.accent).toBe(DEFAULT_LOOK.colors.accent)
  })
})
```

- [ ] **Step 5: Run to see them fail**

Run: `npx vitest run src/lib/story/document.test.ts`
Expected: FAIL — `normalizeDocument` is not exported; version expected 2 received 1.

- [ ] **Step 6: Implement**

In `src/lib/story/document.ts` replace the imports and `createEmptyDocument` with:

```ts
import type { Block, Chapter, StoryDocument, StoryLook, WordKey } from './types'
import { DEFAULT_LOOK, cloneLook } from './look'
import { WORD_KEYS } from './words'

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function createEmptyDocument(): StoryDocument {
  return { version: 2, opening: { name: '', title: '', portrait: null, cover: null }, chapters: [], look: cloneLook(DEFAULT_LOOK) }
}

type Loose = {
  opening?: Partial<StoryDocument['opening']>
  chapters?: unknown
  look?: { fonts?: Partial<StoryLook['fonts']>; colors?: Partial<StoryLook['colors']>; words?: Record<string, unknown> }
}

/** Accepts whatever the database holds (null, version 1, a partial version 2) and returns a complete version-2 document. */
export function normalizeDocument(raw: unknown): StoryDocument {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Loose
  const base = createEmptyDocument()
  const words: Partial<Record<WordKey, string>> = {}
  for (const key of WORD_KEYS) {
    const value = r.look?.words?.[key]
    if (typeof value === 'string') words[key] = value
  }
  return {
    version: 2,
    opening: { ...base.opening, ...(r.opening ?? {}) },
    chapters: Array.isArray(r.chapters) ? (r.chapters as Chapter[]) : [],
    look: {
      fonts: { ...base.look.fonts, ...(r.look?.fonts ?? {}) },
      colors: { ...base.look.colors, ...(r.look?.colors ?? {}) },
      words,
    },
  }
}
```

Keep everything else in the file as it is.

- [ ] **Step 7: Use the normaliser on every read**

In `src/services/story.service.ts` import `normalizeDocument` next to `createEmptyDocument` and change the two readers:

```ts
  static async getPublished(): Promise<StoryDocument | null> {
    const { data, error } = await supabase.from('story').select('published').limit(1).maybeSingle()
    if (error) throw error
    return data?.published ? normalizeDocument(data.published) : null
  }

  static async getDraft(): Promise<StoryDocument> {
    const { data, error } = await supabase.from('story').select('draft').limit(1).maybeSingle()
    if (error) throw error
    return data?.draft ? normalizeDocument(data.draft) : createEmptyDocument()
  }
```

In `src/app/story/page.tsx` add `import { normalizeDocument } from '@/lib/story/document'` and change the last line of `loadPublished` to `return data?.published ? normalizeDocument(data.published) : null`.

- [ ] **Step 8: Run all tests and typecheck**

Run: `npx vitest run` — Expected: all pass (226 + 5 new).
Run: `npm run typecheck 2>&1 | grep -v "exhibitions/page.tsx" | grep error; echo done` — Expected: nothing before `done`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/story src/services/story.service.ts src/app/story/page.tsx
git commit -m "feat(story): document version 2 with a look; normalise older documents on read

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Words — helpers and the public page reads them

**Files:**
- Modify: `src/lib/story/words.ts`; Create: `src/lib/story/words.test.ts`
- Modify: `src/components/story/Story.tsx`, `Opening.tsx`, `StoryChrome.tsx`, `NotReady.tsx`, `blocks/AudioBlock.tsx`, `src/app/story/page.tsx`

**Interfaces:**
- Produces: `wordsFor(look): Record<WordKey, string>`, `chapterLabel(index, title, chapterWord)`, `voiceLabel(name, override)`, `setWord(look, key, value): StoryLook`, `WORD_INFO` (labels/hints for the editor). `Opening` takes `words`; `StoryChrome` takes `soundOn`/`soundOff`; `AudioBlock` takes `ownWords`/`readAlong`; `NotReady` takes `text`.

- [ ] **Step 1: Failing tests**

Create `src/lib/story/words.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/lib/story/words.test.ts` — Expected: FAIL, `wordsFor` is not a function.

- [ ] **Step 3: Implement helpers**

Append to `src/lib/story/words.ts`:

```ts
import type { StoryLook } from './types'

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
```

Move the `import type { WordKey } from './types'` line at the top to `import type { StoryLook, WordKey } from './types'` and delete the duplicate import you just appended.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/story/words.test.ts` — Expected: PASS.

- [ ] **Step 5: Public components read the words**

`src/components/story/Story.tsx`: delete the local `chapterLabel` and `voiceLabel` functions and import them: `import { chapterLabel, voiceLabel, wordsFor } from '@/lib/story/words'` and `import type { Block, StoryDocument, WordKey } from '@/lib/story/types'`. Change `renderBlock` and `StoryBody`:

```tsx
type Words = Record<WordKey, string>

function renderBlock(block: Block, label: string, voice: string, words: Words) {
  switch (block.kind) {
    case 'text':
      return <TextBlock key={block.id} block={block} chapterLabel={label} />
    case 'photo':
      return <PhotoBlock key={block.id} block={block} chapterLabel={label} />
    case 'gallery':
      return <GalleryBlock key={block.id} block={block} />
    case 'audio':
      return <AudioBlock key={block.id} block={block} voiceLabel={voice} ownWords={words.ownWords} readAlong={words.readAlong} />
    case 'slideshow':
      return <SlideshowBlock key={block.id} block={block} chapterLabel={label} voiceLabel={voice} />
    case 'video':
      return <VideoBlock key={block.id} block={block} chapterLabel={label} />
    default:
      return null
  }
}

function StoryBody({ document, preview }: { document: StoryDocument; preview: boolean }) {
  const { begin } = useSound()
  const firstChapter = useRef<HTMLDivElement>(null)
  const words = wordsFor(document.look)
  const voice = voiceLabel(document.opening.name, words.voiceLabel)

  const onBegin = useCallback(() => {
    begin()
    firstChapter.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [begin])

  return (
    <div className="story-theme">
      <StoryChrome onDark={false} preview={preview} soundOn={words.soundOn} soundOff={words.soundOff} />
      <Opening opening={document.opening} words={words} onBegin={onBegin} />
      {document.chapters.map((chapter, i) => (
        <div key={chapter.id} ref={i === 0 ? firstChapter : undefined}>
          {chapter.blocks.map((block) => renderBlock(block, chapterLabel(i, chapter.title, words.chapterWord), voice, words))}
        </div>
      ))}
    </div>
  )
}
```

`src/components/story/Opening.tsx`: change the signature to `export function Opening({ opening, words, onBegin }: { opening: StoryOpening; words: Record<WordKey, string>; onBegin: () => void })` (import `WordKey`), and replace the three literals: the eyebrow span renders `{words.eyebrow}` and is only rendered when `words.eyebrow` is non-empty; the button renders `{words.begin}`; the note span renders `{words.soundNote}` and is only rendered when non-empty.

`src/components/story/StoryChrome.tsx`: signature `({ onDark, preview = false, soundOn, soundOff }: { onDark: boolean; preview?: boolean; soundOn: string; soundOff: string })` and `const label = begun ? (muted ? soundOff : soundOn) : soundOff`.

`src/components/story/blocks/AudioBlock.tsx`: signature `({ block, voiceLabel, ownWords, readAlong }: { block: AudioBlockType; voiceLabel: string; ownWords: string; readAlong: string })`; the "In her own words" span renders `{ownWords}` only when non-empty; the "Read along" span renders `{readAlong}` only when non-empty.

`src/components/story/NotReady.tsx`:

```tsx
import { WORD_DEFAULTS } from '@/lib/story/words'

export function NotReady({ text = WORD_DEFAULTS.notReady }: { text?: string }) {
  return (
    <div className="flex min-h-[100svh] items-center justify-center px-6 text-center" style={{ background: 'var(--paper)' }}>
      <p className="story-serif text-[28px] italic" style={{ color: 'var(--ink-2)' }}>
        {text}
      </p>
    </div>
  )
}
```

`src/app/story/page.tsx`: import `wordsFor` and change the page body:

```tsx
export default async function StoryPage() {
  const doc = await loadPublished()
  if (!doc || !doc.opening.name || doc.chapters.length === 0) return <NotReady text={doc ? wordsFor(doc.look).notReady : undefined} />
  return <Story document={doc} />
}
```

- [ ] **Step 6: Tests and typecheck**

Run: `npx vitest run` and `npm run typecheck 2>&1 | grep -v "exhibitions/page.tsx" | grep error; echo done`. Expected: all pass; nothing before `done`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/story/words.ts src/lib/story/words.test.ts src/components/story src/app/story/page.tsx
git commit -m "feat(story): every fixed phrase on the page comes from her words, with the original as the template

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Look maths — palettes, mixing, contrast, theme variables

**Files:**
- Modify: `src/lib/story/look.ts`; Create: `src/lib/story/look.test.ts`

**Interfaces:**
- Produces: `PALETTES: { id, name, colors }[]`, `isHex(s)`, `mix(a, b, t)`, `contrastRatio(a, b)`, `themeVars(colors): Record<string, string>`, `readabilityNote(colors): string | null`, `ROLE_INFO`.

- [ ] **Step 1: Failing tests**

Create `src/lib/story/look.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/lib/story/look.test.ts` — Expected: FAIL, `mix` is not a function.

- [ ] **Step 3: Implement**

Append to `src/lib/story/look.ts`:

```ts
export const PALETTES: { id: string; name: string; colors: StoryColors }[] = [
  { id: 'paper', name: 'Paper & terracotta', colors: DEFAULT_COLORS },
  { id: 'ink', name: 'Ink & cream', colors: { page: '#fbf7ef', text: '#1c1a17', accent: '#1c1a17', accentText: '#fbf7ef', backdrop: '#141210' } },
  { id: 'sea', name: 'Sea', colors: { page: '#eef3f2', text: '#15302f', accent: '#1f6f6a', accentText: '#f4fbfa', backdrop: '#0f2321' } },
  { id: 'night', name: 'Night', colors: { page: '#171a1f', text: '#f1ede4', accent: '#d9a066', accentText: '#171a1f', backdrop: '#0b0d10' } },
  { id: 'rose', name: 'Rose', colors: { page: '#f8eef0', text: '#3a2229', accent: '#b04a63', accentText: '#fff6f8', backdrop: '#2a1519' } },
  { id: 'forest', name: 'Forest', colors: { page: '#f0f2ea', text: '#1f2a1d', accent: '#4b6b3c', accentText: '#f5f8f0', backdrop: '#131a11' } },
]

export const ROLE_INFO: { key: keyof StoryColors; label: string; hint: string }[] = [
  { key: 'page', label: 'Page', hint: 'The background behind your words' },
  { key: 'text', label: 'Text', hint: 'Your words and headings' },
  { key: 'accent', label: 'Accent', hint: 'Buttons, the thin progress line, chapter labels' },
  { key: 'accentText', label: 'Button text', hint: 'The words on your buttons' },
  { key: 'backdrop', label: 'Behind photos', hint: 'The dark colour behind the first screen, photos and videos' },
]

export function isHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}

function toRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

function toHex(rgb: [number, number, number]): string {
  return '#' + rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')
}

export function mix(a: string, b: string, t: number): string {
  const k = Math.max(0, Math.min(1, t))
  const ra = toRgb(a)
  const rb = toRgb(b)
  return toHex([ra[0] + (rb[0] - ra[0]) * k, ra[1] + (rb[1] - ra[1]) * k, ra[2] + (rb[2] - ra[2]) * k])
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

function safeColors(colors: StoryColors): StoryColors {
  const out = { ...DEFAULT_COLORS }
  for (const key of Object.keys(DEFAULT_COLORS) as (keyof StoryColors)[]) {
    if (isHex(colors[key])) out[key] = colors[key].toLowerCase()
  }
  return out
}

const PAPER_WHITE = '#fbf9f5'

export function themeVars(colors: StoryColors): Record<string, string> {
  const c = safeColors(colors)
  const onBackdrop = contrastRatio(PAPER_WHITE, c.backdrop) >= contrastRatio(c.text, c.backdrop) ? PAPER_WHITE : c.text
  return {
    '--paper': c.page,
    '--paper-2': mix(c.page, c.text, 0.06),
    '--paper-3': mix(c.page, c.text, 0.12),
    '--line': mix(c.page, c.text, 0.22),
    '--white': mix(c.page, '#ffffff', 0.4),
    '--ink': c.text,
    '--ink-2': mix(c.text, c.page, 0.35),
    '--ink-3': mix(c.text, c.page, 0.55),
    '--accent': c.accent,
    '--accent-2': mix(c.accent, '#000000', 0.2),
    '--accent-soft': mix(c.accent, c.page, 0.8),
    '--accent-text': c.accentText,
    '--backdrop': c.backdrop,
    '--on-backdrop': onBackdrop,
  }
}

export function readabilityNote(colors: StoryColors): string | null {
  const c = safeColors(colors)
  if (contrastRatio(c.text, c.page) < 4.5) return 'Your text may be hard to read on this page colour.'
  if (contrastRatio(c.accentText, c.accent) < 3) return 'The words on your buttons may be hard to read on this accent colour.'
  return null
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/story/look.test.ts` — Expected: PASS. If a palette fails the readability check, darken that palette's `text` or `accent` until it passes; do not loosen the thresholds.

- [ ] **Step 5: Commit**

```bash
git add src/lib/story/look.ts src/lib/story/look.test.ts
git commit -m "feat(story): palettes, colour mixing, contrast and theme variables

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Fonts loaded, StoryTheme applied, backdrop colour everywhere

**Files:**
- Create: `src/app/story/fonts.ts`, `src/components/story/StoryTheme.tsx`
- Modify: `src/app/story/layout.tsx`, `src/app/story/story.css`, `src/components/story/Story.tsx`, `Opening.tsx`, `AudioPlayer.tsx`, `blocks/PhotoBlock.tsx`, `SlideshowBlock.tsx`, `VideoBlock.tsx`, `GalleryBlock.tsx`

**Interfaces:**
- Produces: `StoryTheme({ look, className?, style?, children })`; `STORY_FONT_CLASSES: string` (all `next/font` variable classes joined).

- [ ] **Step 1: Font loaders**

Create `src/app/story/fonts.ts`:

```ts
import {
  Cormorant_Garamond,
  Playfair_Display,
  Libre_Baskerville,
  EB_Garamond,
  Lora,
  Fraunces,
  DM_Serif_Display,
  Abril_Fatface,
  Source_Sans_3,
  Inter,
  Jost,
  Nunito,
  Raleway,
  Caveat,
  Dancing_Script,
  Special_Elite,
} from 'next/font/google'

// One loader per entry in src/lib/story/fonts.ts. `preload: false` so the
// page carries no preload links; a browser fetches a family only when text
// uses it, so visitors download the two she chose.
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-cormorant' })
const playfair = Playfair_Display({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-playfair' })
const libreBaskerville = Libre_Baskerville({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-libre-baskerville' })
const ebGaramond = EB_Garamond({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-eb-garamond' })
const lora = Lora({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-lora' })
const fraunces = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-fraunces' })
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-dm-serif' })
const abril = Abril_Fatface({ subsets: ['latin'], weight: ['400'], display: 'swap', preload: false, variable: '--font-abril' })
const sourceSans = Source_Sans_3({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-source-sans' })
const inter = Inter({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-inter-story' })
const jost = Jost({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-jost-story' })
const nunito = Nunito({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-nunito' })
const raleway = Raleway({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', preload: false, variable: '--font-raleway' })
const caveat = Caveat({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-caveat' })
const dancing = Dancing_Script({ subsets: ['latin'], display: 'swap', preload: false, variable: '--font-dancing' })
const specialElite = Special_Elite({ subsets: ['latin'], weight: ['400'], display: 'swap', preload: false, variable: '--font-special-elite' })

export const STORY_FONT_CLASSES = [
  cormorant, playfair, libreBaskerville, ebGaramond, lora, fraunces, dmSerif, abril,
  sourceSans, inter, jost, nunito, raleway, caveat, dancing, specialElite,
]
  .map((f) => f.variable)
  .join(' ')
```

If `next build` complains that a family is not variable and needs `weight`, add `weight: ['400', '700']` to that loader. If it complains a style is unavailable, drop `style` for that loader.

- [ ] **Step 2: Layout applies the classes; CSS reads the chosen fonts**

`src/app/story/layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import './story.css'
import { STORY_FONT_CLASSES } from './fonts'

export default function StoryLayout({ children }: { children: ReactNode }) {
  return <div className={`${STORY_FONT_CLASSES} story-theme`}>{children}</div>
}
```

In `src/app/story/story.css` change two declarations:

```css
.story-theme {
  /* …existing variables unchanged… */
  --accent-text: #fbf9f5;
  --backdrop: #1e1712;
  --on-backdrop: #fbf9f5;
  font-family: var(--story-body-font, var(--font-source-sans)), 'Helvetica Neue', Helvetica, Arial, sans-serif;
  /* rest unchanged */
}

.story-serif {
  font-family: var(--story-heading-font, var(--font-cormorant)), 'Cormorant Garamond', Georgia, serif;
}
```

(The editor's chrome keeps these defaults because it is not wrapped in `StoryTheme`; the old `--font-story-sans` name is gone, so grep for it and replace any remaining use with `--font-source-sans`.)

- [ ] **Step 3: StoryTheme**

Create `src/components/story/StoryTheme.tsx`:

```tsx
import type { CSSProperties, ReactNode } from 'react'
import type { StoryLook } from '@/lib/story/types'
import { themeVars } from '@/lib/story/look'
import { fontById } from '@/lib/story/fonts'

export function lookStyle(look: StoryLook): CSSProperties {
  return {
    ...themeVars(look.colors),
    '--story-heading-font': `var(${fontById(look.fonts.heading).cssVar})`,
    '--story-body-font': `var(${fontById(look.fonts.body).cssVar})`,
  } as CSSProperties
}

export function StoryTheme({ look, className = '', style, children }: { look: StoryLook; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={`story-theme ${className}`} style={{ ...lookStyle(look), ...style }}>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: The story renders through the theme**

In `src/components/story/Story.tsx` import `StoryTheme` and replace `<div className="story-theme">…</div>` in `StoryBody` with `<StoryTheme look={document.look}>…</StoryTheme>`.

- [ ] **Step 5: Backdrop and on-backdrop colours**

Replace every `background: '#1e1712'` in `Opening.tsx`, `blocks/PhotoBlock.tsx`, `SlideshowBlock.tsx`, `VideoBlock.tsx` (both sections) and `GalleryBlock.tsx` (`PageTurnGallery`) with `background: 'var(--backdrop)'`. In `VideoBlock.tsx` the link-video radial gradient becomes `radial-gradient(ellipse at center, var(--paper-3) -300%, var(--backdrop) 70%)` — keep it simple: `background: 'var(--backdrop)'`.

Replace `color: 'var(--white)'` with `color: 'var(--on-backdrop)'` in: `Opening.tsx` (the `h1`), `PhotoBlock.tsx` caption, `SlideshowBlock.tsx` caption, `VideoBlock.tsx` caption, `GalleryBlock.tsx` (`Caption` when `onDark`, and the page-turn caption), and `AudioPlayer.tsx` (`fg` when `onDark`, and the play button's `background` when `onDark`).

In `Opening.tsx` the Begin button becomes `style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}`.

Run: `grep -rn "#1e1712\|var(--white)" src/components/story` — Expected: `var(--white)` remains only where it is a background over a photo (the video play button is `rgba`, so nothing should remain); `#1e1712` nowhere.

- [ ] **Step 6: Typecheck, tests, dev smoke**

Run: `npm run typecheck 2>&1 | grep -v "exhibitions/page.tsx" | grep error; echo done` and `npx vitest run`.
Then `grep -rn "font-story-sans" src` — Expected: no results.

- [ ] **Step 7: Commit**

```bash
git add src/app/story src/components/story
git commit -m "feat(story): sixteen fonts on the layout, StoryTheme turns the look into CSS variables, backdrop colour is hers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Layout helpers

**Files:**
- Create: `src/lib/story/layout.ts`, `src/lib/story/layout.test.ts`

**Interfaces:**
- Produces: `GRID`, `SectionKind = 'opening' | BlockKind`, `TILE_KEYS`, `TILE_LABEL`, `defaultLayout(kind)`, `clampRect(rect)`, `moveTile(layout, key, dx, dy)`, `resizeTile(layout, key, dw, dh)`, `readingOrder(layout)`, `alignmentFor(rect)`, `setOpeningLayout(doc, layout | null)`, `setBlockLayout(doc, chapterId, blockId, layout | null)`, `sectionLayoutOf(doc, target)`, `ArrangeTarget`.

- [ ] **Step 1: Failing tests**

Create `src/lib/story/layout.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { GRID, TILE_KEYS, alignmentFor, clampRect, defaultLayout, moveTile, readingOrder, resizeTile, setBlockLayout, setOpeningLayout, type SectionKind } from './layout'
import { addChapter, createEmptyDocument, insertBlock } from './document'
import type { TextBlock } from './types'

const KINDS: SectionKind[] = ['opening', 'text', 'photo', 'gallery', 'slideshow', 'audio', 'video']

describe('defaultLayout', () => {
  it('lists exactly the tile keys for each kind and keeps every tile inside the grid', () => {
    for (const kind of KINDS) {
      const layout = defaultLayout(kind)
      expect(Object.keys(layout.tiles).sort()).toEqual([...TILE_KEYS[kind]].sort())
      for (const r of Object.values(layout.tiles)) {
        expect(r.x).toBeGreaterThanOrEqual(0)
        expect(r.y).toBeGreaterThanOrEqual(0)
        expect(r.x + r.w).toBeLessThanOrEqual(GRID.cols)
        expect(r.y + r.h).toBeLessThanOrEqual(GRID.rows)
        expect(r.w).toBeGreaterThanOrEqual(1)
        expect(r.h).toBeGreaterThanOrEqual(1)
      }
    }
    expect(TILE_KEYS.gallery).toEqual([])
  })
  it('returns a fresh object each time', () => {
    const a = defaultLayout('text')
    a.tiles.body.x = 11
    expect(defaultLayout('text').tiles.body.x).not.toBe(11)
  })
})

describe('clampRect', () => {
  it('keeps the rect inside the grid and at least one cell', () => {
    expect(clampRect({ x: -2, y: -1, w: 3, h: 2 })).toEqual({ x: 0, y: 0, w: 3, h: 2 })
    expect(clampRect({ x: 11, y: 7, w: 3, h: 3 })).toEqual({ x: 9, y: 5, w: 3, h: 3 })
    expect(clampRect({ x: 0, y: 0, w: 0, h: 0 })).toEqual({ x: 0, y: 0, w: 1, h: 1 })
    expect(clampRect({ x: 0, y: 0, w: 20, h: 20 })).toEqual({ x: 0, y: 0, w: 12, h: 8 })
  })
})

describe('moveTile and resizeTile', () => {
  it('move by cells, clamped, without mutating', () => {
    const layout = defaultLayout('text')
    const moved = moveTile(layout, 'body', 100, -100)
    expect(moved.tiles.body).toEqual({ x: 12 - layout.tiles.body.w, y: 0, w: layout.tiles.body.w, h: layout.tiles.body.h })
    expect(layout.tiles.body.x).toBe(defaultLayout('text').tiles.body.x)
  })
  it('resize by cells with a 1×1 minimum', () => {
    const layout = defaultLayout('text')
    expect(resizeTile(layout, 'heading', -100, -100).tiles.heading).toMatchObject({ w: 1, h: 1 })
    const grown = resizeTile(layout, 'heading', 100, 100).tiles.heading
    expect(grown.x + grown.w).toBe(12)
    expect(grown.y + grown.h).toBe(8)
  })
  it('ignores an unknown key', () => {
    const layout = defaultLayout('text')
    expect(moveTile(layout, 'nope', 1, 1)).toEqual(layout)
  })
})

describe('readingOrder', () => {
  it('orders by row then column', () => {
    const layout = { cols: 12 as const, rows: 8 as const, tiles: { a: { x: 6, y: 2, w: 2, h: 1 }, b: { x: 0, y: 2, w: 2, h: 1 }, c: { x: 3, y: 0, w: 2, h: 1 } } }
    expect(readingOrder(layout)).toEqual(['c', 'b', 'a'])
  })
})

describe('alignmentFor', () => {
  it('uses the horizontal centre in thirds', () => {
    expect(alignmentFor({ x: 0, y: 0, w: 2, h: 1 })).toBe('left')
    expect(alignmentFor({ x: 4, y: 0, w: 4, h: 1 })).toBe('center')
    expect(alignmentFor({ x: 9, y: 0, w: 3, h: 1 })).toBe('right')
    expect(alignmentFor({ x: 0, y: 0, w: 12, h: 1 })).toBe('center')
  })
})

describe('layout setters', () => {
  const text = (id: string): TextBlock => ({ id, kind: 'text', heading: id, body: '' })
  it('set and remove the opening layout', () => {
    const doc = createEmptyDocument()
    const withLayout = setOpeningLayout(doc, defaultLayout('opening'))
    expect(withLayout.opening.layout).toEqual(defaultLayout('opening'))
    expect(doc.opening.layout).toBeUndefined()
    expect(setOpeningLayout(withLayout, null).opening.layout).toBeUndefined()
  })
  it('set and remove a block layout without touching neighbours', () => {
    const { doc, chapterId } = addChapter(createEmptyDocument(), 'One')
    let d = insertBlock(doc, chapterId, 0, text('a'))
    d = insertBlock(d, chapterId, 1, text('b'))
    const withLayout = setBlockLayout(d, chapterId, 'b', defaultLayout('text'))
    const blocks = withLayout.chapters[0].blocks
    expect(blocks[0].layout).toBeUndefined()
    expect(blocks[1].layout).toEqual(defaultLayout('text'))
    expect(setBlockLayout(withLayout, chapterId, 'b', null).chapters[0].blocks[1].layout).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/lib/story/layout.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

Create `src/lib/story/layout.ts`:

```ts
import type { Block, BlockKind, GridRect, SectionLayout, StoryDocument } from './types'

export const GRID = { cols: 12, rows: 8 } as const

export type SectionKind = 'opening' | BlockKind
export type ArrangeTarget = { type: 'opening' } | { type: 'block'; chapterId: string; blockId: string }
export type Alignment = 'left' | 'center' | 'right'

export const TILE_KEYS: Record<SectionKind, string[]> = {
  opening: ['portrait', 'eyebrow', 'name', 'title', 'begin'],
  text: ['label', 'heading', 'body'],
  photo: ['label', 'caption'],
  gallery: [],
  slideshow: ['label', 'player', 'caption'],
  audio: ['label', 'heading', 'player', 'transcript'],
  video: ['label', 'caption'],
}

export const TILE_LABEL: Record<string, string> = {
  portrait: 'Portrait',
  eyebrow: 'Small line',
  name: 'Your name',
  title: 'Title',
  begin: 'Button',
  label: 'Chapter label',
  heading: 'Heading',
  body: 'Words',
  caption: 'Caption',
  player: 'Player',
  transcript: 'Read along',
}

const DEFAULTS: Record<SectionKind, Record<string, GridRect>> = {
  opening: {
    portrait: { x: 5, y: 0, w: 2, h: 2 },
    eyebrow: { x: 3, y: 2, w: 6, h: 1 },
    name: { x: 1, y: 3, w: 10, h: 2 },
    title: { x: 3, y: 5, w: 6, h: 1 },
    begin: { x: 4, y: 6, w: 4, h: 2 },
  },
  text: {
    label: { x: 3, y: 0, w: 6, h: 1 },
    heading: { x: 3, y: 1, w: 6, h: 2 },
    body: { x: 3, y: 3, w: 6, h: 4 },
  },
  photo: {
    label: { x: 0, y: 0, w: 4, h: 1 },
    caption: { x: 1, y: 5, w: 7, h: 2 },
  },
  gallery: {},
  slideshow: {
    label: { x: 0, y: 0, w: 4, h: 1 },
    player: { x: 1, y: 5, w: 5, h: 2 },
    caption: { x: 7, y: 5, w: 4, h: 2 },
  },
  audio: {
    label: { x: 3, y: 0, w: 6, h: 1 },
    heading: { x: 3, y: 1, w: 6, h: 2 },
    player: { x: 3, y: 3, w: 6, h: 1 },
    transcript: { x: 3, y: 4, w: 6, h: 3 },
  },
  video: {
    label: { x: 0, y: 0, w: 4, h: 1 },
    caption: { x: 1, y: 5, w: 7, h: 2 },
  },
}

function cloneLayout(layout: SectionLayout): SectionLayout {
  const tiles: Record<string, GridRect> = {}
  for (const [k, r] of Object.entries(layout.tiles)) tiles[k] = { ...r }
  return { cols: 12, rows: 8, tiles }
}

export function defaultLayout(kind: SectionKind): SectionLayout {
  return cloneLayout({ cols: 12, rows: 8, tiles: DEFAULTS[kind] })
}

export function clampRect(rect: GridRect): GridRect {
  const w = Math.max(1, Math.min(GRID.cols, Math.round(rect.w)))
  const h = Math.max(1, Math.min(GRID.rows, Math.round(rect.h)))
  const x = Math.max(0, Math.min(GRID.cols - w, Math.round(rect.x)))
  const y = Math.max(0, Math.min(GRID.rows - h, Math.round(rect.y)))
  return { x, y, w, h }
}

function withTile(layout: SectionLayout, key: string, fn: (r: GridRect) => GridRect): SectionLayout {
  const current = layout.tiles[key]
  if (!current) return layout
  const next = cloneLayout(layout)
  next.tiles[key] = clampRect(fn(current))
  return next
}

export function moveTile(layout: SectionLayout, key: string, dx: number, dy: number): SectionLayout {
  return withTile(layout, key, (r) => ({ ...r, x: r.x + dx, y: r.y + dy }))
}

export function resizeTile(layout: SectionLayout, key: string, dw: number, dh: number): SectionLayout {
  return withTile(layout, key, (r) => {
    const w = Math.max(1, Math.min(GRID.cols - r.x, r.w + dw))
    const h = Math.max(1, Math.min(GRID.rows - r.y, r.h + dh))
    return { ...r, w, h }
  })
}

export function readingOrder(layout: SectionLayout): string[] {
  return Object.entries(layout.tiles)
    .sort(([, a], [, b]) => a.y - b.y || a.x - b.x)
    .map(([key]) => key)
}

export function alignmentFor(rect: GridRect): Alignment {
  const centre = rect.x + rect.w / 2
  if (centre < GRID.cols / 3) return 'left'
  if (centre > (GRID.cols * 2) / 3) return 'right'
  return 'center'
}

function withoutLayout<T extends { layout?: SectionLayout }>(item: T): T {
  const { layout: _dropped, ...rest } = item
  void _dropped
  return rest as T
}

export function setOpeningLayout(doc: StoryDocument, layout: SectionLayout | null): StoryDocument {
  const opening = layout ? { ...doc.opening, layout: cloneLayout(layout) } : withoutLayout(doc.opening)
  return { ...doc, opening }
}

export function setBlockLayout(doc: StoryDocument, chapterId: string, blockId: string, layout: SectionLayout | null): StoryDocument {
  return {
    ...doc,
    chapters: doc.chapters.map((c) =>
      c.id !== chapterId
        ? c
        : {
            ...c,
            blocks: c.blocks.map((b): Block => (b.id !== blockId ? b : layout ? { ...b, layout: cloneLayout(layout) } : withoutLayout(b))),
          }
    ),
  }
}

export function sectionLayoutOf(doc: StoryDocument, target: ArrangeTarget): SectionLayout | undefined {
  if (target.type === 'opening') return doc.opening.layout
  return doc.chapters.find((c) => c.id === target.chapterId)?.blocks.find((b) => b.id === target.blockId)?.layout
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/story/layout.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/story/layout.ts src/lib/story/layout.test.ts
git commit -m "feat(story): grid layout helpers — defaults, move, resize, reading order, setters

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: `Arranged` renderer and tile-aware public blocks

**Files:**
- Create: `src/components/story/Arranged.tsx`
- Modify: `src/components/story/Opening.tsx`, `blocks/TextBlock.tsx`, `PhotoBlock.tsx`, `SlideshowBlock.tsx`, `AudioBlock.tsx`, `VideoBlock.tsx`

**Interfaces:**
- Produces: `Arranged({ layout, tiles, children })`; per-block exported tile builders used by the Arrange canvas in Task 10: `openingTiles(opening, words, onBegin)`, `textTiles(block, chapterLabel)`, `photoTiles(block, chapterLabel)`, `slideshowTiles(...)` (see below), `audioTiles(block, voiceLabel, ownWords, readAlong, active)`, `videoTiles(block, chapterLabel)`. Each returns `Record<string, ReactNode>` keyed by `TILE_KEYS[kind]`.

- [ ] **Step 1: Arranged**

Create `src/components/story/Arranged.tsx`:

```tsx
'use client'

import type { ReactNode } from 'react'
import type { SectionLayout } from '@/lib/story/types'
import { alignmentFor, readingOrder } from '@/lib/story/layout'
import { useIsPhone } from './useIsPhone'

const ALIGN_ITEMS = { left: 'flex-start', center: 'center', right: 'flex-end' } as const

/**
 * Without a layout: renders `children` (the block's hand-tuned markup).
 * With a layout on a wide screen: a 12 × 8 grid of the named tiles.
 * With a layout on a phone: the tiles stacked in reading order.
 */
export function Arranged({ layout, tiles, children, stackJustify = 'center' }: { layout?: SectionLayout; tiles: Record<string, ReactNode>; children: ReactNode; stackJustify?: 'center' | 'end' }) {
  const isPhone = useIsPhone()
  if (!layout) return <>{children}</>
  const keys = readingOrder(layout).filter((k) => tiles[k])

  if (isPhone) {
    return (
      <div className={`relative z-10 flex min-h-[100svh] flex-col gap-7 px-6 py-16 ${stackJustify === 'end' ? 'justify-end' : 'justify-center'}`}>
        {keys.map((k) => (
          <div key={k}>{tiles[k]}</div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="relative z-10 grid min-h-[100svh]"
      style={{
        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
        gridTemplateRows: 'repeat(8, minmax(calc((100svh - 80px) / 8), auto))',
        padding: '40px 48px',
        columnGap: 16,
      }}
    >
      {keys.map((k) => {
        const r = layout.tiles[k]
        const align = alignmentFor(r)
        return (
          <div
            key={k}
            className="flex min-w-0 flex-col justify-center"
            style={{ gridColumn: `${r.x + 1} / span ${r.w}`, gridRow: `${r.y + 1} / span ${r.h}`, textAlign: align, alignItems: ALIGN_ITEMS[align] }}
          >
            {tiles[k]}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Opening**

Rewrite `src/components/story/Opening.tsx`:

```tsx
'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { StoryOpening, WordKey } from '@/lib/story/types'
import { Arranged } from './Arranged'

type Words = Record<WordKey, string>

function Rise({ delay, children }: { delay: number; children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  )
}

export function Portrait({ opening }: { opening: StoryOpening }) {
  if (!opening.portrait) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={opening.portrait.url} alt={opening.name} className="story-photo h-[132px] w-[132px] rounded-full object-cover md:h-[172px] md:w-[172px]" style={{ border: '1.5px solid rgba(251,249,245,0.6)' }} />
}

export function Eyebrow({ text }: { text: string }) {
  if (!text) return null
  return <span className="block text-[12px] uppercase tracking-[0.22em] md:text-[14px]" style={{ color: 'rgba(251,249,245,0.78)' }}>{text}</span>
}

export function Name({ text }: { text: string }) {
  return <h1 className="story-serif m-0 text-[54px] font-medium leading-none md:text-[104px]" style={{ color: 'var(--on-backdrop)', letterSpacing: '-0.01em' }}>{text}</h1>
}

export function Title({ text }: { text: string }) {
  if (!text) return null
  return <p className="story-serif m-0 text-[24px] italic leading-tight md:text-[36px]" style={{ color: 'rgba(251,249,245,0.9)' }}>{text}</p>
}

export function Begin({ words, onBegin }: { words: Words; onBegin: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <button type="button" onClick={onBegin} className="flex h-[60px] items-center justify-center rounded-full px-9 text-[19px] font-semibold md:h-16 md:px-11 md:text-[21px]" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
        {words.begin}
      </button>
      {words.soundNote && <span className="text-[14px] md:text-[15px]" style={{ color: 'rgba(251,249,245,0.7)' }}>{words.soundNote}</span>}
    </div>
  )
}

export function openingTiles(opening: StoryOpening, words: Words, onBegin: () => void): Record<string, ReactNode> {
  return {
    portrait: <Portrait opening={opening} />,
    eyebrow: <Eyebrow text={words.eyebrow} />,
    name: <Name text={opening.name} />,
    title: <Title text={opening.title} />,
    begin: <Begin words={words} onBegin={onBegin} />,
  }
}

export function Opening({ opening, words, onBegin }: { opening: StoryOpening; words: Words; onBegin: () => void }) {
  const tiles = openingTiles(opening, words, onBegin)
  return (
    <section className={`story-grain relative w-full overflow-hidden ${opening.layout ? 'min-h-[100svh]' : 'flex h-[100svh] items-center justify-center'}`} style={{ background: 'var(--backdrop)' }}>
      {opening.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={opening.cover.url} alt="" className="story-photo absolute inset-[-4%] h-[108%] w-[108%] object-cover opacity-55" />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.25) 0%, rgba(20,14,10,0.15) 45%, rgba(20,14,10,0.7) 100%)' }} />
      <Arranged layout={opening.layout} tiles={Object.fromEntries(Object.entries(tiles).map(([k, node], i) => [k, <Rise key={k} delay={0.15 * i}>{node}</Rise>]))}>
        <div className="relative z-10 flex flex-col items-center gap-7 px-7 text-center md:px-[120px]">
          {opening.portrait && <Rise delay={0}>{tiles.portrait}</Rise>}
          <Rise delay={0.35}>
            <div className="flex flex-col items-center gap-4">
              {tiles.eyebrow}
              {tiles.name}
              {tiles.title}
            </div>
          </Rise>
          <Rise delay={0.7}>
            <div className="mt-2">{tiles.begin}</div>
          </Rise>
        </div>
      </Arranged>
    </section>
  )
}
```

- [ ] **Step 3: TextBlock**

Rewrite `src/components/story/blocks/TextBlock.tsx`:

```tsx
'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { TextBlock as TextBlockType } from '@/lib/story/types'
import { Arranged } from '../Arranged'

export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function Reveal({ delay = 0, children }: { delay?: number; children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1.2, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  )
}

export function ChapterLabel({ text, onDark = false }: { text: string; onDark?: boolean }) {
  if (!text) return null
  if (onDark) return <span className="block text-[12px] uppercase tracking-[0.16em] md:text-[13px]" style={{ color: 'rgba(251,249,245,0.72)' }}>{text}</span>
  return (
    <span className="inline-flex items-center gap-4">
      <span className="h-px w-10" style={{ background: 'var(--accent)' }} />
      <span className="text-[13px] uppercase tracking-[0.2em] md:text-[14px]" style={{ color: 'var(--accent)' }}>{text}</span>
    </span>
  )
}

export function Heading({ text }: { text: string }) {
  if (!text) return null
  return <h2 className="story-serif m-0 text-[44px] font-medium leading-[1.02] md:text-[76px]" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>{text}</h2>
}

export function Body({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-5 text-[19px] leading-[1.65] md:text-[21px]" style={{ color: 'var(--ink)' }}>
      {paragraphs(text).map((p, i) => (
        <p key={i} className="m-0">{p}</p>
      ))}
    </div>
  )
}

export function textTiles(block: TextBlockType, chapterLabel: string): Record<string, ReactNode> {
  return {
    label: <Reveal><ChapterLabel text={chapterLabel} /></Reveal>,
    heading: <Reveal><Heading text={block.heading} /></Reveal>,
    body: <Reveal delay={0.3}><Body text={block.body} /></Reveal>,
  }
}

export function TextBlock({ block, chapterLabel }: { block: TextBlockType; chapterLabel: string }) {
  const tiles = textTiles(block, chapterLabel)
  return (
    <section className={`relative w-full ${block.layout ? 'min-h-[100svh]' : 'flex min-h-[100svh] items-center justify-center px-6 py-24 md:px-24'}`} style={{ background: 'var(--paper)' }}>
      <Arranged layout={block.layout} tiles={tiles}>
        <div className="flex w-full max-w-[680px] flex-col gap-7 md:gap-8">
          {tiles.label}
          {block.heading && tiles.heading}
          {tiles.body}
        </div>
      </Arranged>
    </section>
  )
}
```

- [ ] **Step 4: PhotoBlock**

Rewrite `src/components/story/blocks/PhotoBlock.tsx`:

```tsx
'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { PhotoBlock as PhotoBlockType } from '@/lib/story/types'
import { Arranged } from '../Arranged'
import { ChapterLabel } from './TextBlock'

export function DarkCaption({ text, size = 'large' }: { text: string; size?: 'large' | 'small' }) {
  if (!text) return null
  const cls = size === 'large' ? 'text-[24px] md:text-[34px]' : 'text-[22px] md:text-[26px]'
  return <p className={`story-serif m-0 italic leading-tight ${cls}`} style={{ color: 'var(--on-backdrop)' }}>{text}</p>
}

export function photoTiles(block: PhotoBlockType, chapterLabel: string): Record<string, ReactNode> {
  return {
    label: <ChapterLabel text={chapterLabel} onDark />,
    caption: <DarkCaption text={block.caption} />,
  }
}

export function PhotoBlock({ block, chapterLabel }: { block: PhotoBlockType; chapterLabel: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])
  const tiles = photoTiles(block, chapterLabel)

  return (
    <section ref={ref} className={`story-grain story-vignette relative w-full overflow-hidden ${block.layout ? 'min-h-[100svh]' : 'h-[100svh]'}`} style={{ background: 'var(--backdrop)' }}>
      <motion.img src={block.image.url} alt={block.caption} className="story-photo absolute left-0 top-[-6%] h-[112%] w-full object-cover" style={reduce ? undefined : { y }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.12) 0%, rgba(20,14,10,0) 40%, rgba(20,14,10,0.62) 100%)' }} />
      <Arranged layout={block.layout} tiles={tiles} stackJustify="end">
        <div className="absolute left-6 top-8 z-10 md:left-10">{tiles.label}</div>
        {block.caption && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute bottom-12 left-6 right-6 z-10 flex max-w-[720px] flex-col gap-2 md:bottom-[88px] md:left-24"
          >
            {tiles.caption}
          </motion.div>
        )}
      </Arranged>
    </section>
  )
}
```

- [ ] **Step 5: SlideshowBlock**

In `src/components/story/blocks/SlideshowBlock.tsx` import `Arranged`, `ChapterLabel` (from `./TextBlock`) and `DarkCaption` (from `./PhotoBlock`), and replace everything from the `if (count === 0) return null` line to the end of the component with:

```tsx
  if (count === 0) return null
  const caption = block.images[active]?.caption ?? ''

  const dots = (
    <div className="flex items-center gap-2.5">
      {block.images.map((_, i) => (
        <span key={i} className="rounded-full" style={{ width: i === active ? 8 : 6, height: i === active ? 8 : 6, background: i === active ? 'var(--on-backdrop)' : 'rgba(251,249,245,0.45)' }} />
      ))}
    </div>
  )
  const player = block.audio ? (
    <AudioPlayer
      audio={block.audio}
      label={voiceLabel}
      onDark
      active={inView}
      className="md:max-w-[460px]"
      onTime={followsAudio ? (t) => setActive(slideIndexForTime(t, block.audio!.durationSec, count)) : undefined}
      onPlayingChange={setVoicePlaying}
    />
  ) : null
  const tiles = {
    label: <ChapterLabel text={chapterLabel} onDark />,
    player,
    caption: (
      <div className="flex flex-col gap-4">
        <DarkCaption text={caption} size="small" />
        {dots}
      </div>
    ),
  }

  return (
    <section ref={ref} className={`story-grain story-vignette relative w-full overflow-hidden ${block.layout ? 'min-h-[100svh]' : 'h-[100svh]'}`} style={{ background: 'var(--backdrop)' }}>
      {block.images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={img.url} alt={img.caption} className="story-photo absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out" style={{ opacity: i === active ? 1 : 0 }} />
      ))}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.1) 0%, rgba(20,14,10,0) 40%, rgba(20,14,10,0.7) 100%)' }} />
      <Arranged layout={block.layout} tiles={tiles} stackJustify="end">
        <div className="absolute left-6 top-8 z-10 md:left-10">{tiles.label}</div>
        <div className="absolute bottom-10 left-6 right-6 z-10 flex flex-col gap-6 md:bottom-[72px] md:left-24 md:right-24 md:flex-row md:items-end md:justify-between md:gap-[60px]">
          {player ?? <span />}
          <div className="flex flex-col gap-4 md:max-w-[520px] md:items-end md:text-right">{tiles.caption}</div>
        </div>
      </Arranged>
    </section>
  )
```

The slideshow's tiles depend on hooks inside the component, so there is no exported `slideshowTiles`; Task 10's canvas builds slideshow tiles from the first image and a static player (see there).

- [ ] **Step 6: AudioBlock**

Rewrite `src/components/story/blocks/AudioBlock.tsx`:

```tsx
'use client'

import { useRef, type ReactNode } from 'react'
import { useInView } from 'framer-motion'
import type { AudioBlock as AudioBlockType } from '@/lib/story/types'
import { AudioPlayer } from '../AudioPlayer'
import { Arranged } from '../Arranged'

export function SmallLine({ text }: { text: string }) {
  if (!text) return null
  return <span className="block text-[13px] uppercase tracking-[0.2em] md:text-[14px]" style={{ color: 'var(--accent)' }}>{text}</span>
}

export function VoiceHeading({ text }: { text: string }) {
  if (!text) return null
  return <h3 className="story-serif m-0 text-[40px] font-medium leading-[1.05] md:text-[56px]" style={{ color: 'var(--ink)' }}>{text}</h3>
}

export function Transcript({ text, readAlong }: { text: string; readAlong: string }) {
  if (!text) return null
  return (
    <div className="flex flex-col gap-3 border-t pt-6" style={{ borderColor: 'var(--line)' }}>
      {readAlong && <span className="text-[12px] uppercase tracking-[0.14em] md:text-[13px]" style={{ color: 'var(--ink-3)' }}>{readAlong}</span>}
      <p className="story-serif m-0 whitespace-pre-line text-[20px] italic leading-[1.45] md:text-[25px]" style={{ color: 'var(--ink)' }}>{text}</p>
    </div>
  )
}

export function audioTiles(block: AudioBlockType, voiceLabel: string, ownWords: string, readAlong: string, active: boolean): Record<string, ReactNode> {
  return {
    label: <SmallLine text={ownWords} />,
    heading: <VoiceHeading text={block.heading} />,
    player: <AudioPlayer audio={block.audio} label={voiceLabel} active={active} />,
    transcript: <Transcript text={block.audio.transcript} readAlong={readAlong} />,
  }
}

export function AudioBlock({ block, voiceLabel, ownWords, readAlong }: { block: AudioBlockType; voiceLabel: string; ownWords: string; readAlong: string }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const tiles = audioTiles(block, voiceLabel, ownWords, readAlong, inView)

  return (
    <section ref={ref} className={`relative w-full ${block.layout ? 'min-h-[100svh]' : 'flex min-h-[100svh] items-center justify-center px-6 py-24 md:px-24'}`} style={{ background: 'var(--paper)' }}>
      <Arranged layout={block.layout} tiles={tiles}>
        <div className="flex w-full max-w-[600px] flex-col gap-8">
          <div className="flex flex-col gap-3">
            {tiles.label}
            {tiles.heading}
          </div>
          {tiles.player}
          {tiles.transcript}
        </div>
      </Arranged>
    </section>
  )
}
```

- [ ] **Step 7: VideoBlock**

In `src/components/story/blocks/VideoBlock.tsx` import `Arranged`, `ChapterLabel` and `DarkCaption`, add before the component:

```tsx
export function videoTiles(block: VideoBlockType, chapterLabel: string, timeLine?: ReactNode): Record<string, ReactNode> {
  return {
    label: <ChapterLabel text={chapterLabel} onDark />,
    caption: (
      <div className="flex flex-col gap-2">
        <DarkCaption text={block.caption} size="small" />
        {timeLine}
      </div>
    ),
  }
}
```

(import `type ReactNode` from react). Inside the component build `timeLine` (the existing `formatTime(time) / formatTime(duration)` span, or `null` for link videos / zero duration) and `const tiles = videoTiles(block, chapterLabel, timeLine)`. Then in both returned sections:

- section class: `story-grain [story-vignette] relative w-full overflow-hidden ${block.layout ? 'min-h-[100svh]' : 'h-[100svh]'}`, `background: 'var(--backdrop)'`.
- replace the raw chapter-label `<div>` with `<div className="absolute left-6 top-8 z-10 md:left-10">{tiles.label}</div>` **inside** the `Arranged` children, and replace the `caption` constant's inner content with `tiles.caption`.
- Wrap the label and caption (not the iframe/video/play button, which stay as siblings before it) in `<Arranged layout={block.layout} tiles={tiles} stackJustify="end">…</Arranged>`. For the link video, only render the `Arranged` when `!started`; for the upload video, render it when `!started` too (the caption already hid once started; the label is fine to hide as well once the native controls show).

- [ ] **Step 8: Verify nothing changed visually without a layout**

Run: `npm run typecheck 2>&1 | grep -v "exhibitions/page.tsx" | grep error; echo done` and `npx vitest run`.
Run `npm run dev` and open `/story/preview` (needs a valid local anon key; if the environment problem from the handoff still stands, skip and rely on the review in Task 12): the opening and blocks look as before.

- [ ] **Step 9: Commit**

```bash
git add src/components/story
git commit -m "feat(story): sections render through Arranged — existing design without a layout, a 12×8 grid or a phone stack with one

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Editor plumbing — screens, icons, top bar, cards

**Files:**
- Modify: `src/components/story-editor/screens.ts`, `ui.tsx`, `TopBar.tsx`, `StoryOverview.tsx`, `BlockCard.tsx`, `EditorApp.tsx`
- Create: placeholder-free `src/components/story-editor/look/LookScreen.tsx` and `src/components/story-editor/arrange/ArrangeScreen.tsx` are created in Tasks 9 and 11; in this task `EditorApp` imports them, so create both files now with the real `PageTop` shell and an empty body that Tasks 9/11 fill:

```tsx
// src/components/story-editor/look/LookScreen.tsx (shell; Task 9 replaces the body)
'use client'
import { PageTop } from '../ui'
export function LookScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-[100svh]">
      <PageTop title="The look of my story" onBack={onBack} />
    </div>
  )
}
```

```tsx
// src/components/story-editor/arrange/ArrangeScreen.tsx (shell; Task 11 replaces the body)
'use client'
import { PageTop } from '../ui'
import type { ArrangeTarget } from '@/lib/story/layout'
export function ArrangeScreen({ target, onBack }: { target: ArrangeTarget; onBack: () => void }) {
  void target
  return (
    <div className="min-h-[100svh]">
      <PageTop title="Move things around" onBack={onBack} />
    </div>
  )
}
```

**Interfaces:**
- Produces: `Screen` gains `{ kind: 'look' }` and `{ kind: 'arrange'; target: ArrangeTarget }`; `Icon` gains `palette`, `grid`; `TopBar` gains `onLook`; `BlockCard` gains `onArrange?: () => void`.

- [ ] **Step 1: Screens**

In `src/components/story-editor/screens.ts` add `import type { ArrangeTarget } from '@/lib/story/layout'` and two union members:

```ts
  | { kind: 'look' }
  | { kind: 'arrange'; target: ArrangeTarget }
```

- [ ] **Step 2: Icons**

In `ui.tsx` `PATHS` add:

```ts
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.9 2-2 0-.6-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1 .9-1.8 2-1.8h2a4 4 0 0 0 4-4c0-4.2-4-7.5-9-7.5z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
```

- [ ] **Step 3: TopBar Look button**

`TopBar` signature: `({ onPublish, onLook }: { onPublish: () => void; onLook: () => void })`. Between Undo and Preview add `<EButton onClick={onLook} icon={<Icon name="palette" />}>Look</EButton>`.

- [ ] **Step 4: Cards**

`BlockCard` props gain `onArrange?: () => void`; in the button row, after the Change button and before Remove, render `{onArrange && <EButton small icon={<Icon name="grid" size={20} />} onClick={onArrange}>Move things around</EButton>}`. Under the kind label row add `{block.layout && <span className="text-[18px]" style={{ color: 'var(--accent-2)' }}>Arranged by you</span>}`.

In `StoryOverview`:
- `<TopBar onPublish={() => setPublishing(true)} onLook={() => go({ kind: 'look' })} />`.
- The opening card's button area becomes:

```tsx
          <div className="flex flex-wrap gap-3">
            <EButton small icon={<Icon name="pencil" size={20} />} onClick={() => go({ kind: 'opening' })}>Change the opening</EButton>
            <EButton small icon={<Icon name="grid" size={20} />} onClick={() => go({ kind: 'arrange', target: { type: 'opening' } })}>Move things around</EButton>
          </div>
```

and under the "Opening screen" label add `{document.opening.layout && <span className="text-[18px]" style={{ color: 'var(--accent-2)' }}>Arranged by you</span>}`.

- Each `BlockCard` gets `onArrange={block.kind === 'gallery' ? undefined : () => go({ kind: 'arrange', target: { type: 'block', chapterId: chapter.id, blockId: block.id } })}`.

- [ ] **Step 5: EditorApp routes**

Import `LookScreen` and `ArrangeScreen`; add cases:

```tsx
    case 'look':
      return <LookScreen onBack={back} />
    case 'arrange':
      return <ArrangeScreen target={screen.target} onBack={back} />
```

- [ ] **Step 6: Typecheck and commit**

Run: `npm run typecheck 2>&1 | grep -v "exhibitions/page.tsx" | grep error; echo done` — nothing before `done`.

```bash
git add src/components/story-editor
git commit -m "feat(story-editor): Look and Move things around entry points, screens and icons

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Look screen — preview, fonts, colours, words

**Files:**
- Modify: `src/components/story-editor/look/LookScreen.tsx`
- Create: `look/LookPreview.tsx`, `look/FontSection.tsx`, `look/FontPicker.tsx`, `look/ColourSection.tsx`, `look/WordSection.tsx`

**Interfaces:**
- Consumes: `setLook`, `DEFAULT_LOOK`, `PALETTES`, `ROLE_INFO`, `readabilityNote` (look.ts); `FONTS`, `FONT_KIND_LABEL`, `FONT_KIND_ORDER`, `fontById` (fonts.ts); `WORD_KEYS`, `WORD_INFO`, `WORD_DEFAULTS`, `wordsFor`, `setWord` (words.ts); `StoryTheme`, `Opening`, `TextBlock`, `SoundProvider`.
- Produces: `LookScreen({ onBack })`.

- [ ] **Step 1: LookPreview**

Create `src/components/story-editor/look/LookPreview.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import type { StoryDocument, StoryLook, TextBlock as TextBlockType } from '@/lib/story/types'
import { chapterLabel, wordsFor } from '@/lib/story/words'
import { StoryTheme } from '@/components/story/StoryTheme'
import { SoundProvider } from '@/components/story/SoundProvider'
import { Opening } from '@/components/story/Opening'
import { TextBlock } from '@/components/story/blocks/TextBlock'

const FRAME_WIDTH = 1280

const SAMPLE: TextBlockType = {
  id: 'sample',
  kind: 'text',
  heading: 'How it all began',
  body: 'This is a sample of your reading text. Um dia de sol em Santos, et lille hus i Danmark.\n\nAdd a chapter with some words and it will appear here instead.',
}

export function LookPreview({ document, look }: { document: StoryDocument; look: StoryLook }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setScale(el.clientWidth / FRAME_WIDTH)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const words = wordsFor(look)
  const firstChapter = document.chapters[0]
  const firstText = firstChapter?.blocks.find((b): b is TextBlockType => b.kind === 'text')
  const block = firstText ?? SAMPLE
  const label = firstChapter ? chapterLabel(0, firstChapter.title, words.chapterWord) : chapterLabel(0, 'Sample', words.chapterWord)

  return (
    <div ref={box} className="w-full overflow-hidden rounded-[14px]" style={{ border: '2px solid var(--line)', height: FRAME_WIDTH * 1.25 * scale, pointerEvents: 'none' }} aria-hidden="true">
      <div style={{ width: FRAME_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <MotionConfig reducedMotion="always">
          <SoundProvider>
            <StoryTheme look={{ ...document.look, ...look }}>
              <div style={{ height: 800, overflow: 'hidden' }}>
                <Opening opening={document.opening.name ? document.opening : { ...document.opening, name: 'Your name' }} words={words} onBegin={() => {}} />
              </div>
              <div style={{ height: 800, overflow: 'hidden' }}>
                <TextBlock block={block} chapterLabel={label} />
              </div>
            </StoryTheme>
          </SoundProvider>
        </MotionConfig>
      </div>
      {block === SAMPLE && <span className="sr-only">sample</span>}
    </div>
  )
}
```

The sections use `100svh` for height; inside the frame they are clipped to 800 px each, so the frame shows the top of both. That is enough to judge fonts and colours.

- [ ] **Step 2: FontPicker and FontSection**

Create `src/components/story-editor/look/FontPicker.tsx`:

```tsx
'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { FONTS, FONT_KIND_LABEL, FONT_KIND_ORDER } from '@/lib/story/fonts'
import { EButton, Icon } from '../ui'

export function FontPicker({ open, title, sample, value, onChoose, onClose }: { open: boolean; title: string; sample: string; value: string; onChoose: (id: string) => void; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="story-theme max-h-[92svh] max-w-[860px] overflow-y-auto rounded-[22px] border-0 p-8 [&>button]:hidden" style={{ background: 'var(--paper)' }}>
        <DialogTitle className="story-serif text-[34px] font-medium md:text-[38px]" style={{ color: 'var(--ink)' }}>{title}</DialogTitle>
        {FONT_KIND_ORDER.map((kind) => (
          <div key={kind} className="flex flex-col gap-3">
            <span className="text-[18px] uppercase tracking-[0.08em]" style={{ color: 'var(--ink-2)' }}>{FONT_KIND_LABEL[kind]}</span>
            <div className="grid gap-3 md:grid-cols-2">
              {FONTS.filter((f) => f.kind === kind).map((f) => {
                const selected = f.id === value
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onChoose(f.id)}
                    className="relative flex min-h-[96px] flex-col justify-center gap-1 rounded-[14px] px-6 py-4 text-left"
                    style={{ border: `${selected ? 3 : 2}px solid ${selected ? 'var(--accent)' : 'var(--line)'}`, background: selected ? 'var(--accent-soft)' : 'var(--white)' }}
                  >
                    {selected && <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'var(--accent)', color: 'var(--white)' }}><Icon name="check" size={18} /></span>}
                    <span className="truncate text-[30px] leading-tight" style={{ fontFamily: `var(${f.cssVar})`, color: 'var(--ink)' }}>{sample}</span>
                    <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{f.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <EButton variant="quiet" onClick={onClose}>Never mind</EButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

Create `src/components/story-editor/look/FontSection.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { StoryLook } from '@/lib/story/types'
import { fontById } from '@/lib/story/fonts'
import { EButton, Icon } from '../ui'
import { FontPicker } from './FontPicker'

const READING_SAMPLE = 'Um dia de sol em Santos, et lille hus i Danmark'

function FontRow({ label, sample, value, onChange, pickerTitle }: { label: string; sample: string; value: string; onChange: (id: string) => void; pickerTitle: string }) {
  const [open, setOpen] = useState(false)
  const font = fontById(value)
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
      <div className="flex min-w-[240px] flex-grow flex-col gap-1">
        <span className="text-[18px] uppercase tracking-[0.08em]" style={{ color: 'var(--ink-2)' }}>{label} · {font.name}</span>
        <span className="truncate text-[34px] leading-tight" style={{ fontFamily: `var(${font.cssVar})`, color: 'var(--ink)' }}>{sample}</span>
      </div>
      <EButton small icon={<Icon name="pencil" size={20} />} onClick={() => setOpen(true)}>Change</EButton>
      <FontPicker open={open} title={pickerTitle} sample={sample} value={value} onChoose={(id) => { onChange(id); setOpen(false) }} onClose={() => setOpen(false)} />
    </div>
  )
}

export function FontSection({ look, name, onChange }: { look: StoryLook; name: string; onChange: (fonts: StoryLook['fonts']) => void }) {
  const headingSample = name.trim() || 'Your name'
  return (
    <section className="flex flex-col gap-4">
      <h2 className="story-serif m-0 text-[36px] font-medium" style={{ color: 'var(--ink)' }}>Fonts</h2>
      <FontRow label="For headings" sample={headingSample} value={look.fonts.heading} pickerTitle="A font for your headings" onChange={(heading) => onChange({ ...look.fonts, heading })} />
      <FontRow label="For reading" sample={READING_SAMPLE} value={look.fonts.body} pickerTitle="A font for reading" onChange={(body) => onChange({ ...look.fonts, body })} />
    </section>
  )
}
```

- [ ] **Step 3: ColourSection**

Create `src/components/story-editor/look/ColourSection.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import type { StoryColors } from '@/lib/story/types'
import { DEFAULT_COLORS, PALETTES, ROLE_INFO, readabilityNote } from '@/lib/story/look'
import { EButton, Icon } from '../ui'

function samePalette(a: StoryColors, b: StoryColors): boolean {
  return (Object.keys(a) as (keyof StoryColors)[]).every((k) => a[k].toLowerCase() === b[k].toLowerCase())
}

function Swatch({ colors, selected, name, onClick }: { colors: StoryColors; selected: boolean; name: string; onClick: () => void }) {
  const stripes = [colors.page, colors.text, colors.accent, colors.accentText, colors.backdrop]
  return (
    <button type="button" onClick={onClick} className="flex w-[104px] flex-col items-center gap-2 rounded-[14px] p-2" style={{ background: selected ? 'var(--accent-soft)' : 'transparent' }} aria-pressed={selected}>
      <span className="flex h-16 w-16 overflow-hidden rounded-full" style={{ boxShadow: selected ? '0 0 0 3px var(--accent)' : '0 0 0 2px var(--line)' }}>
        {stripes.map((c, i) => (
          <span key={i} className="h-full flex-1" style={{ background: c }} />
        ))}
      </span>
      <span className="text-center text-[18px] leading-tight" style={{ color: 'var(--ink)' }}>{name}</span>
    </button>
  )
}

function RoleRow({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (hex: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
      <span className="h-14 w-14 shrink-0 rounded-[10px]" style={{ background: value, border: '2px solid var(--line)' }} />
      <div className="flex min-w-[200px] flex-grow flex-col gap-1">
        <span className="text-[20px] font-semibold" style={{ color: 'var(--ink)' }}>{label}</span>
        <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{hint}</span>
      </div>
      <label className="relative">
        <input ref={input} type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`Choose the ${label.toLowerCase()} colour`} className="absolute inset-0 h-14 w-full cursor-pointer opacity-0" />
        <EButton small icon={<Icon name="pencil" size={20} />} onClick={() => input.current?.click()}>Change</EButton>
      </label>
    </div>
  )
}

export function ColourSection({ colors, onChange }: { colors: StoryColors; onChange: (colors: StoryColors) => void }) {
  const note = readabilityNote(colors)
  return (
    <section className="flex flex-col gap-5">
      <h2 className="story-serif m-0 text-[36px] font-medium" style={{ color: 'var(--ink)' }}>Colours</h2>
      <div className="flex flex-wrap gap-2">
        {PALETTES.map((p) => (
          <Swatch key={p.id} colors={p.colors} name={p.name} selected={samePalette(p.colors, colors)} onClick={() => onChange({ ...p.colors })} />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {ROLE_INFO.map((r) => (
          <RoleRow key={r.key} label={r.label} hint={r.hint} value={colors[r.key]} onChange={(hex) => onChange({ ...colors, [r.key]: hex })} />
        ))}
      </div>
      {note && <p className="m-0 text-[18px]" style={{ color: 'var(--ink-2)' }}>{note}</p>}
      {!samePalette(colors, DEFAULT_COLORS) && (
        <div>
          <EButton variant="quiet" onClick={() => onChange({ ...DEFAULT_COLORS })}>Back to the original colours</EButton>
        </div>
      )}
    </section>
  )
}
```

Native colour inputs fire `change` when the picker closes (and on every tick in some browsers). The section calls `onChange` for each event; `LookScreen` commits to the store on `change` only, so a drag through a picker is one undo step (see Step 5).

- [ ] **Step 4: WordSection**

Create `src/components/story-editor/look/WordSection.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import type { StoryLook, WordKey } from '@/lib/story/types'
import { WORD_DEFAULTS, WORD_INFO, WORD_KEYS, setWord } from '@/lib/story/words'
import { EButton, Field, TextInput } from '../ui'

function WordField({ look, keyName, name, onCommit }: { look: StoryLook; keyName: WordKey; name: string; onCommit: (look: StoryLook) => void }) {
  const stored = look.words[keyName]
  const [value, setValue] = useState(stored ?? '')
  useEffect(() => setValue(stored ?? ''), [stored])
  const info = WORD_INFO[keyName]
  const placeholder = keyName === 'voiceLabel' ? `${name.trim().split(/\s+/)[0] || 'Mai-Britt'}, in her own voice` : WORD_DEFAULTS[keyName]
  const overridden = stored !== undefined
  const commit = () => {
    if (value === (stored ?? '')) return
    onCommit(setWord(look, keyName, value))
  }
  return (
    <div className="flex flex-col gap-2">
      <Field label={info.label} hint={info.hint || undefined}>
        <TextInput value={value} placeholder={placeholder} onChange={(e) => setValue(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} />
      </Field>
      {overridden && (
        <div>
          <EButton variant="quiet" small onClick={() => { setValue(''); onCommit(setWord(look, keyName, keyName === 'chapterWord' ? WORD_DEFAULTS.chapterWord : '')) }}>Use the original</EButton>
        </div>
      )}
    </div>
  )
}

export function WordSection({ look, name, onCommit }: { look: StoryLook; name: string; onCommit: (look: StoryLook) => void }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="story-serif m-0 text-[36px] font-medium" style={{ color: 'var(--ink)' }}>Words on the page</h2>
        <p className="m-0 text-[18px]" style={{ color: 'var(--ink-2)' }}>The grey text is what the page says now. Type over it to say it your way.</p>
      </div>
      {WORD_KEYS.map((k) => (
        <WordField key={k} look={look} keyName={k} name={name} onCommit={onCommit} />
      ))}
    </section>
  )
}
```

- [ ] **Step 5: LookScreen**

Replace `src/components/story-editor/look/LookScreen.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useEditorStore } from '../store'
import { setLook } from '@/lib/story/look'
import type { StoryLook } from '@/lib/story/types'
import { PageTop } from '../ui'
import { LookPreview } from './LookPreview'
import { FontSection } from './FontSection'
import { ColourSection } from './ColourSection'
import { WordSection } from './WordSection'

export function LookScreen({ onBack }: { onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  // Local copy so the preview follows every tap immediately; each discrete change is also committed to the store.
  const [look, setLocal] = useState<StoryLook>(document.look)

  const commit = (next: StoryLook) => {
    setLocal(next)
    apply((d) => setLook(d, next))
  }

  return (
    <div className="min-h-[100svh]">
      <PageTop title="The look of my story" onBack={onBack} />
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-6 py-8 md:flex-row md:items-start md:gap-12 md:px-8 md:py-11">
        <div className="sticky top-0 z-20 -mx-6 px-6 py-3 md:order-2 md:mx-0 md:w-[480px] md:shrink-0 md:px-0 md:py-0" style={{ background: 'var(--paper)' }}>
          <span className="mb-2 block text-[18px] uppercase tracking-[0.08em]" style={{ color: 'var(--ink-2)' }}>How it will look</span>
          <LookPreview document={document} look={look} />
        </div>
        <div className="flex min-w-0 flex-grow flex-col gap-12 md:order-1">
          <FontSection look={look} name={document.opening.name} onChange={(fonts) => commit({ ...look, fonts })} />
          <ColourSection colors={look.colors} onChange={(colors) => commit({ ...look, colors })} />
          <WordSection look={look} name={document.opening.name} onCommit={commit} />
        </div>
      </div>
    </div>
  )
}
```

Note on undo granularity: the colour `<input type="color">` fires `change` only when the picker is dismissed in Safari and Firefox, but Chrome fires `change` on every tick. To keep one undo step per pick in Chrome, `ColourSection`'s `RoleRow` should call `onChange` from the input's `onBlur`/close instead: change the input to use `onInput={(e) => setLive(e.currentTarget.value)}` for the swatch preview (local state `live`) and `onBlur={() => onChange(live)}` plus `onChange={(e) => setLive(e.target.value)}`. Implement it that way: the swatch and the preview follow `live` through a second callback `onPreview(hex)` that `LookScreen` feeds into `setLocal` only (no `apply`), and `onChange` (blur) commits. Wire `ColourSection({ colors, onPreview, onChange })` and in `LookScreen`: `onPreview={(colors) => setLocal({ ...look, colors })}`.

- [ ] **Step 6: Typecheck; try it**

Run: `npm run typecheck 2>&1 | grep -v "exhibitions/page.tsx" | grep error; echo done`.
With a working local Supabase key: `npm run dev`, `/story/edit` → Look. Pick fonts, a palette, a colour, edit two words. The preview follows; Back to my story → Preview my story shows the same; Undo steps back; reload keeps it.

- [ ] **Step 7: Commit**

```bash
git add src/components/story-editor/look
git commit -m "feat(story-editor): the Look screen — fonts, colours and words with a live preview

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Arrange canvas — tiles, drag, resize, keyboard

**Files:**
- Create: `src/components/story-editor/arrange/tiles.tsx`, `src/components/story-editor/arrange/ArrangeCanvas.tsx`

**Interfaces:**
- Consumes: `openingTiles`, `textTiles`, `photoTiles`, `audioTiles`, `videoTiles`, `ChapterLabel`, `DarkCaption`, `AudioPlayer`, `StoryTheme`, `SoundProvider`; `GRID`, `moveTile`, `resizeTile`, `TILE_LABEL`.
- Produces: `sectionTiles(doc, target): { kind: SectionKind; tiles: Record<string, ReactNode>; backdrop: { image: string | null; dark: boolean } }`; `ArrangeCanvas({ look, layout, tiles, backdrop, selected, onSelect, onChange })`.

- [ ] **Step 1: tiles.tsx — build the real content for a section**

```tsx
'use client'

import type { ReactNode } from 'react'
import type { StoryDocument } from '@/lib/story/types'
import type { ArrangeTarget, SectionKind } from '@/lib/story/layout'
import { chapterLabel, voiceLabel, wordsFor } from '@/lib/story/words'
import { openingTiles } from '@/components/story/Opening'
import { textTiles, ChapterLabel } from '@/components/story/blocks/TextBlock'
import { photoTiles, DarkCaption } from '@/components/story/blocks/PhotoBlock'
import { audioTiles } from '@/components/story/blocks/AudioBlock'
import { videoTiles } from '@/components/story/blocks/VideoBlock'
import { AudioPlayer } from '@/components/story/AudioPlayer'

export type SectionContent = { kind: SectionKind; tiles: Record<string, ReactNode>; backdrop: { image: string | null; dark: boolean } }

export function sectionTiles(doc: StoryDocument, target: ArrangeTarget): SectionContent | null {
  const words = wordsFor(doc.look)
  if (target.type === 'opening') {
    return { kind: 'opening', tiles: openingTiles(doc.opening, words, () => {}), backdrop: { image: doc.opening.cover?.url ?? null, dark: true } }
  }
  const chapterIndex = doc.chapters.findIndex((c) => c.id === target.chapterId)
  const chapter = doc.chapters[chapterIndex]
  const block = chapter?.blocks.find((b) => b.id === target.blockId)
  if (!chapter || !block) return null
  const label = chapterLabel(chapterIndex, chapter.title, words.chapterWord)
  const voice = voiceLabel(doc.opening.name, words.voiceLabel)
  switch (block.kind) {
    case 'text':
      return { kind: 'text', tiles: textTiles(block, label), backdrop: { image: null, dark: false } }
    case 'photo':
      return { kind: 'photo', tiles: photoTiles(block, label), backdrop: { image: block.image.url, dark: true } }
    case 'audio':
      return { kind: 'audio', tiles: audioTiles(block, voice, words.ownWords, words.readAlong, false), backdrop: { image: null, dark: false } }
    case 'video':
      return { kind: 'video', tiles: videoTiles(block, label), backdrop: { image: block.source.type === 'upload' ? block.source.poster?.url ?? null : null, dark: true } }
    case 'slideshow':
      return {
        kind: 'slideshow',
        tiles: {
          label: <ChapterLabel text={label} onDark />,
          player: block.audio ? <AudioPlayer audio={block.audio} label={voice} onDark active={false} /> : null,
          caption: <DarkCaption text={block.images[0]?.caption ?? ''} size="small" />,
        },
        backdrop: { image: block.images[0]?.url ?? null, dark: true },
      }
    case 'gallery':
      return null
  }
}
```

- [ ] **Step 2: ArrangeCanvas**

```tsx
'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DndContext, PointerSensor, useDraggable, useSensor, useSensors, type DragEndEvent, type Modifier } from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { MotionConfig } from 'framer-motion'
import type { SectionLayout, StoryLook } from '@/lib/story/types'
import { GRID, TILE_LABEL, moveTile, resizeTile } from '@/lib/story/layout'
import { StoryTheme } from '@/components/story/StoryTheme'
import { SoundProvider } from '@/components/story/SoundProvider'

const FRAME_WIDTH = 1280
const ASPECT = 10 / 16

type Props = {
  look: StoryLook
  layout: SectionLayout
  tiles: Record<string, ReactNode>
  backdrop: { image: string | null; dark: boolean }
  selected: string | null
  onSelect: (key: string | null) => void
  onChange: (layout: SectionLayout) => void
}

function Tile({ id, rect, cell, scale, selected, onSelect, onResize, children }: { id: string; rect: { x: number; y: number; w: number; h: number }; cell: { w: number; h: number }; scale: number; selected: boolean; onSelect: () => void; onResize: (dw: number, dh: number) => void; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const [grow, setGrow] = useState({ w: 0, h: 0 })
  const start = useRef<{ x: number; y: number } | null>(null)
  const width = rect.w * cell.w + grow.w
  const height = rect.h * cell.h + grow.h

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDownCapture={onSelect}
      className="absolute cursor-grab select-none"
      style={{
        left: rect.x * cell.w,
        top: rect.y * cell.h,
        width,
        height,
        touchAction: 'none',
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        outline: selected ? '2px solid var(--accent)' : '1px dashed rgba(181,98,58,0.55)',
        outlineOffset: -1,
        zIndex: isDragging || selected ? 3 : 2,
        opacity: isDragging ? 0.85 : 1,
      }}
      aria-label={`${TILE_LABEL[id] ?? id}. Drag to move, use the arrow keys to nudge.`}
    >
      <div className="pointer-events-none flex h-full w-full flex-col justify-center overflow-hidden" style={{ width: width / scale, height: height / scale, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
      <span className="pointer-events-none absolute left-1 top-1 rounded px-1.5 py-0.5 text-[12px] font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>{TILE_LABEL[id] ?? id}</span>
      <button
        type="button"
        aria-label={`Resize ${TILE_LABEL[id] ?? id}`}
        className="absolute bottom-0 right-0 h-7 w-7 cursor-nwse-resize rounded-tl-[8px]"
        style={{ background: 'var(--accent)', touchAction: 'none' }}
        onPointerDown={(e) => {
          e.stopPropagation()
          e.currentTarget.setPointerCapture(e.pointerId)
          start.current = { x: e.clientX, y: e.clientY }
        }}
        onPointerMove={(e) => {
          if (!start.current) return
          setGrow({ w: e.clientX - start.current.x, h: e.clientY - start.current.y })
        }}
        onPointerUp={(e) => {
          if (!start.current) return
          const dw = Math.round((e.clientX - start.current.x) / cell.w)
          const dh = Math.round((e.clientY - start.current.y) / cell.h)
          start.current = null
          setGrow({ w: 0, h: 0 })
          if (dw || dh) onResize(dw, dh)
        }}
      />
    </div>
  )
}

export function ArrangeCanvas({ look, layout, tiles, backdrop, selected, onSelect, onChange }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(960)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const height = width * ASPECT
  const cell = { w: width / GRID.cols, h: height / GRID.rows }
  const scale = width / FRAME_WIDTH
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const snap: Modifier = ({ transform }) => ({
    ...transform,
    x: Math.round(transform.x / cell.w) * cell.w,
    y: Math.round(transform.y / cell.h) * cell.h,
  })

  const onDragEnd = (e: DragEndEvent) => {
    const dx = Math.round(e.delta.x / cell.w)
    const dy = Math.round(e.delta.y / cell.h)
    if (dx || dy) onChange(moveTile(layout, String(e.active.id), dx, dy))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!selected) return
    const step: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    if (e.key === 'Escape') return onSelect(null)
    const d = step[e.key]
    if (!d) return
    e.preventDefault()
    onChange(moveTile(layout, selected, d[0], d[1]))
  }

  const gridLines = `linear-gradient(to right, rgba(181,98,58,0.35) 1px, transparent 1px) 0 0 / ${cell.w}px ${cell.h}px, linear-gradient(to bottom, rgba(181,98,58,0.35) 1px, transparent 1px) 0 0 / ${cell.w}px ${cell.h}px`

  return (
    <div ref={box} className="w-full" tabIndex={0} onKeyDown={onKeyDown} onPointerDown={(e) => e.target === e.currentTarget && onSelect(null)}>
      <MotionConfig reducedMotion="always">
        <SoundProvider>
          <StoryTheme look={look} className="relative overflow-hidden rounded-[14px]" style={{ width, height, background: backdrop.dark ? 'var(--backdrop)' : 'var(--paper)', border: '2px solid var(--line)' }}>
            {backdrop.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={backdrop.image} alt="" className="story-photo absolute inset-0 h-full w-full object-cover" style={{ opacity: 0.55 }} />
            )}
            <div className="absolute inset-0" style={{ background: gridLines, backgroundRepeat: 'repeat' }} aria-hidden="true" />
            <DndContext sensors={sensors} modifiers={[snap, restrictToParentElement]} onDragEnd={onDragEnd}>
              {Object.entries(layout.tiles).map(([key, rect]) =>
                tiles[key] ? (
                  <Tile key={key} id={key} rect={rect} cell={cell} scale={scale} selected={selected === key} onSelect={() => onSelect(key)} onResize={(dw, dh) => onChange(resizeTile(layout, key, dw, dh))}>
                    {tiles[key]}
                  </Tile>
                ) : null
              )}
            </DndContext>
          </StoryTheme>
        </SoundProvider>
      </MotionConfig>
    </div>
  )
}
```

`@dnd-kit/modifiers` is not installed: run `npm install @dnd-kit/modifiers@^9.0.0` (peer of `@dnd-kit/core@6`). If npm cannot reach the registry, replace `restrictToParentElement` with an inline modifier that clamps `transform.x/y` so the tile stays within `[0, width - tileWidth]` / `[0, height - tileHeight]` using `args.draggingNodeRect` and `args.containerNodeRect`.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck 2>&1 | grep -v "exhibitions/page.tsx" | grep error; echo done`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/story-editor/arrange
git commit -m "feat(story-editor): arrange canvas — real content on a 12×8 grid, drag, resize and arrow keys

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Arrange screen — local state, phone order, Done, Put it back

**Files:**
- Modify: `src/components/story-editor/arrange/ArrangeScreen.tsx`

**Interfaces:**
- Consumes: `sectionTiles`, `ArrangeCanvas`, `defaultLayout`, `readingOrder`, `sectionLayoutOf`, `setOpeningLayout`, `setBlockLayout`, `TILE_LABEL`.

- [ ] **Step 1: Implement**

```tsx
'use client'

import { useMemo, useState } from 'react'
import { useEditorStore } from '../store'
import { EButton, Icon, PageTop } from '../ui'
import { defaultLayout, readingOrder, sectionLayoutOf, setBlockLayout, setOpeningLayout, TILE_LABEL, type ArrangeTarget } from '@/lib/story/layout'
import type { SectionLayout } from '@/lib/story/types'
import { sectionTiles } from './tiles'
import { ArrangeCanvas } from './ArrangeCanvas'

export function ArrangeScreen({ target, onBack }: { target: ArrangeTarget; onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  const content = useMemo(() => sectionTiles(document, target), [document, target])
  const stored = sectionLayoutOf(document, target)
  // null = "put it back as it was" (no layout); otherwise the layout being edited. Nothing is saved until Done.
  const [layout, setLayout] = useState<SectionLayout | null>(stored ?? (content ? defaultLayout(content.kind) : null))
  const [selected, setSelected] = useState<string | null>(null)

  if (!content) {
    return (
      <div className="min-h-[100svh]">
        <PageTop title="Move things around" onBack={onBack} />
        <p className="px-6 py-10 text-[20px]" style={{ color: 'var(--ink-2)' }}>This part cannot be moved around.</p>
      </div>
    )
  }

  const done = () => {
    apply((d) => (target.type === 'opening' ? setOpeningLayout(d, layout) : setBlockLayout(d, target.chapterId, target.blockId, layout)))
    onBack()
  }

  const shown = layout ?? defaultLayout(content.kind)
  const order = readingOrder(shown).filter((k) => content.tiles[k])

  return (
    <div className="min-h-[100svh]">
      <PageTop title="Move things around" onBack={onBack} right={<EButton variant="primary" icon={<Icon name="check" />} onClick={done}>Done</EButton>} />
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-7 px-6 py-8 md:px-8 md:py-11">
        <p className="m-0 text-[20px]" style={{ color: 'var(--ink-2)' }}>Drag a piece to move it. Pull the small corner to make it bigger or smaller. Everything snaps to the squares.</p>
        <ArrangeCanvas look={document.look} layout={shown} tiles={content.tiles} backdrop={content.backdrop} selected={selected} onSelect={setSelected} onChange={setLayout} />
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>On a phone, things stack in this order:</span>
          {order.map((k, i) => (
            <span key={k} className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[18px]" style={{ background: 'var(--white)', border: '2px solid var(--line)', color: 'var(--ink)' }}>
              <span className="font-semibold" style={{ color: 'var(--accent)' }}>{i + 1}</span>
              {TILE_LABEL[k] ?? k}
            </span>
          ))}
        </div>
        <div>
          <EButton variant="quiet" icon={<Icon name="undo" size={20} />} onClick={() => { setLayout(null); setSelected(null) }} disabled={layout === null}>Put it back as it was</EButton>
        </div>
      </div>
    </div>
  )
}
```

Behaviour: opening the screen for a section without a stored layout starts from `defaultLayout`, so Done with no change stores the default layout (the section is then rendered on the grid, which looks like the design). "Put it back as it was" sets `null`; Done then removes the layout. Any drag after that starts again from the default: `ArrangeCanvas` calls `onChange(moveTile(shown, …))` where `shown` is the default when `layout` is `null`.

- [ ] **Step 2: Typecheck, try it**

Run: `npm run typecheck 2>&1 | grep -v "exhibitions/page.tsx" | grep error; echo done`.
With a working local key: Move things around on the opening: drag the name, resize it, arrow-key it, Done; the overview card says "Arranged by you"; Preview shows the grid on desktop; a narrow window stacks in the strip's order.

- [ ] **Step 3: Commit**

```bash
git add src/components/story-editor/arrange/ArrangeScreen.tsx
git commit -m "feat(story-editor): the Move things around screen — phone order strip, Done, Put it back as it was

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Whole-branch verification and review

**Files:** none new.

- [ ] **Step 1: Tests, typecheck, build**

Run: `npx vitest run` — Expected: all pass (226 baseline + words 9 + look 9 + layout 9 + document 5 ≈ 258).
Run: `npm run typecheck 2>&1 | grep -v "exhibitions/page.tsx" | grep error; echo done` — nothing before `done`.
Build in a clean worktree so the untracked exhibitions page cannot clash:

```bash
git worktree add /tmp/story-look-build feat/story-look
cd /tmp/story-look-build && npm ci --silent && npx next build 2>&1 | tail -30
cd - && git worktree remove /tmp/story-look-build --force
```

Expected: build succeeds; the sixteen font families download. If a `next/font` loader errors, fix it as Task 5 Step 1 describes and re-run.

- [ ] **Step 2: Line counts**

Run: `wc -l src/components/story/*.tsx src/components/story/blocks/*.tsx src/components/story-editor/**/*.tsx | sort -n | tail -5` — every story component under 400 lines.

- [ ] **Step 3: Code review**

Use `superpowers:requesting-code-review` on the diff `main...feat/story-look` against the spec. Fix what it finds; commit as `fix(story): review — …`.

- [ ] **Step 4: Handoff**

Update `docs/superpowers/handoffs/2026-09-15-life-story-handoff.md` (or add `2026-09-16-story-look-handoff.md` with a "supersedes" note): branch state, what shipped, the manual pass from the spec's Testing section, and the unchanged environment problems (local anon key, exhibitions page clash). Commit `docs(handoff): …`.
