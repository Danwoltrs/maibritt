# Life Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A public, scrollable, cinematic life story at `/story` and a very simple editor at `/story/edit` that Mai-Britt uses to build it herself.

**Architecture:** One `story` row holds the whole story as JSON twice (`draft`, `published`). The editor autosaves the draft through `StoryService`; a server route copies draft to published. The public page renders the published document with framer-motion scroll effects; the editor is a zustand store plus screen components that all use pure helpers from `src/lib/story/`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase (Postgres + Storage), framer-motion 12, zustand 5, react-dropzone, dnd-kit, tus-js-client (resumable video upload), @breezystack/lamejs (MP3 encoding in a worker), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-15-life-story-design.md`

## Global Constraints

- One story, one language. The app ships no sample copy; every string on the public page comes from the document.
- Editor: text never below 18 px, buttons 56 px tall, radius 10 px, every control has a word label. No "block", "embed", "parallax", "section settings" in visible copy.
- Palette tokens (CSS variables): paper `#F5F0E8`, paper-2 `#ECE5D9`, paper-3 `#E2D9CA`, white `#FBF9F5`, ink `#2A2521`, ink-2 `#6E655C`, ink-3 `#9A9086`, line `#D8CFC2`, accent `#B5623A`, accent-2 `#8F4C2C`, accent-soft `#F3E4DA`, red `#C43D33`.
- Fonts: headlines Cormorant Garamond (existing `--font-serif`), body Source Sans 3 (`--font-story-sans`).
- Reduced motion (`useReducedMotion()`) replaces parallax and pinning with opacity fades.
- Storage bucket `story`, public, 500 MB per file. Speed slider: slow 8 s, medium 5 s, fast 3 s.
- No file over 2000 lines. Story components under `src/components/story/`, editor under `src/components/story-editor/`, helpers under `src/lib/story/`.
- Commit after every task. Commit message style: `feat(story): ...`, `test(story): ...`.
- The user applies SQL migrations by hand: paste the SQL into chat when the migration task is done.

---

## File structure

| Path | Responsibility |
| --- | --- |
| `migrations/20260915_life_story.sql` | `story` table, RLS, seed row, `story` bucket and policies |
| `src/lib/story/types.ts` | `StoryDocument`, `Chapter`, `Block`, refs |
| `src/lib/story/document.ts` | pure document helpers (create, add, move, remove) |
| `src/lib/story/timing.ts` | slideshow interval maths, speed mapping |
| `src/lib/story/videoLinks.ts` | parse YouTube / Vimeo links, build embed URLs |
| `src/lib/story/media.ts` | browser helpers: image dimensions, audio duration, video poster capture |
| `src/services/story.service.ts` | read/write the story row, upload photos, audio, video, posters |
| `src/app/story/layout.tsx`, `story.css` | fonts, theme tokens, film treatment classes |
| `src/app/story/page.tsx` | public page: reads `published`, renders `<Story>` |
| `src/app/story/preview/page.tsx` | draft rendered with `<Story>` behind login |
| `src/app/story/edit/page.tsx`, `layout.tsx` | editor route behind `AuthGuard` |
| `src/app/api/story/publish/route.ts` | copies draft to published |
| `src/components/story/*` | public story: providers, chrome, opening, blocks, player |
| `src/components/story-editor/*` | editor: store, screens, cards, recorder, pickers |
| `src/middleware.ts` | protect `/story/edit`, `/story/preview`, `/api/story` |
| `src/components/ConditionalHeader.tsx` | hide the site header on `/story*` |
| `src/services/storage.service.ts` | add `'story'` to the bucket unions |

---

### Task 1: Migration, document types and pure document helpers

**Files:**
- Create: `migrations/20260915_life_story.sql`
- Create: `src/lib/story/types.ts`
- Create: `src/lib/story/document.ts`
- Test: `src/lib/story/document.test.ts`

**Interfaces:**
- Produces: every type below, and the helper functions `createEmptyDocument`, `addChapter`, `renameChapter`, `removeChapter`, `moveChapter`, `insertBlock`, `updateBlock`, `removeBlock`, `moveBlock`, `reorderBlocks`, `findBlock`, `newId`.

- [ ] **Step 1: Write the migration**

`migrations/20260915_life_story.sql`:

```sql
-- Life story: one row holding the draft and the published document
CREATE TABLE IF NOT EXISTS story (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft jsonb NOT NULL,
  published jsonb,
  draft_updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

ALTER TABLE story ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of story" ON story;
CREATE POLICY "Allow public read of story"
  ON story FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated update of story" ON story;
CREATE POLICY "Allow authenticated update of story"
  ON story FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Exactly one row, created empty
INSERT INTO story (draft)
SELECT '{"version":1,"opening":{"name":"","title":"","portrait":null,"cover":null},"chapters":[]}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM story);

-- Storage bucket for photos, audio, video and posters (500 MB per file)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('story', 'story', true, 524288000)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 524288000;

DROP POLICY IF EXISTS "Allow public read of story media" ON storage.objects;
CREATE POLICY "Allow public read of story media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'story');

DROP POLICY IF EXISTS "Allow authenticated upload to story bucket" ON storage.objects;
CREATE POLICY "Allow authenticated upload to story bucket"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'story');

DROP POLICY IF EXISTS "Allow authenticated update in story bucket" ON storage.objects;
CREATE POLICY "Allow authenticated update in story bucket"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'story') WITH CHECK (bucket_id = 'story');

DROP POLICY IF EXISTS "Allow authenticated delete from story bucket" ON storage.objects;
CREATE POLICY "Allow authenticated delete from story bucket"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'story');
```

- [ ] **Step 2: Write the types**

`src/lib/story/types.ts`:

```ts
export type ImageRef = {
  url: string
  thumbnailUrl: string
  width: number
  height: number
}

export type CaptionedImage = ImageRef & { caption: string }

export type AudioRef = {
  url: string
  durationSec: number
  transcript: string
}

export type SlideshowTiming =
  | { mode: 'interval'; seconds: 3 | 5 | 8 }
  | { mode: 'audio' }

export type VideoSource =
  | { type: 'upload'; url: string; poster: ImageRef | null; durationSec: number }
  | { type: 'link'; provider: 'youtube' | 'vimeo'; videoId: string; url: string }

export type TextBlock = { id: string; kind: 'text'; heading: string; body: string }
export type PhotoBlock = { id: string; kind: 'photo'; image: ImageRef; caption: string }
export type GalleryBlock = { id: string; kind: 'gallery'; images: CaptionedImage[] }
export type SlideshowBlock = {
  id: string
  kind: 'slideshow'
  images: CaptionedImage[]
  timing: SlideshowTiming
  audio: AudioRef | null
}
export type AudioBlock = { id: string; kind: 'audio'; heading: string; audio: AudioRef }
export type VideoBlock = { id: string; kind: 'video'; source: VideoSource; caption: string }

export type Block = TextBlock | PhotoBlock | GalleryBlock | SlideshowBlock | AudioBlock | VideoBlock
export type BlockKind = Block['kind']

export type Chapter = { id: string; title: string; blocks: Block[] }

export type StoryOpening = {
  name: string
  title: string
  portrait: ImageRef | null
  cover: ImageRef | null
}

export type StoryDocument = {
  version: 1
  opening: StoryOpening
  chapters: Chapter[]
}
```

- [ ] **Step 3: Write the failing tests**

`src/lib/story/document.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  createEmptyDocument,
  addChapter,
  renameChapter,
  removeChapter,
  moveChapter,
  insertBlock,
  updateBlock,
  removeBlock,
  moveBlock,
  reorderBlocks,
  findBlock,
} from './document'
import type { TextBlock, StoryDocument } from './types'

const text = (id: string): TextBlock => ({ id, kind: 'text', heading: id, body: '' })

function docWithBlocks(): { doc: StoryDocument; chapterId: string } {
  const { doc, chapterId } = addChapter(createEmptyDocument(), 'One')
  let d = insertBlock(doc, chapterId, 0, text('a'))
  d = insertBlock(d, chapterId, 1, text('b'))
  d = insertBlock(d, chapterId, 2, text('c'))
  return { doc: d, chapterId }
}

const ids = (doc: StoryDocument, chapterId: string) =>
  doc.chapters.find((c) => c.id === chapterId)!.blocks.map((b) => b.id)

describe('createEmptyDocument', () => {
  it('has no chapters and an empty opening', () => {
    const doc = createEmptyDocument()
    expect(doc.version).toBe(1)
    expect(doc.chapters).toEqual([])
    expect(doc.opening).toEqual({ name: '', title: '', portrait: null, cover: null })
  })
})

describe('chapters', () => {
  it('adds a chapter at the end and returns its id', () => {
    const { doc, chapterId } = addChapter(createEmptyDocument(), 'Childhood')
    expect(doc.chapters).toHaveLength(1)
    expect(doc.chapters[0].id).toBe(chapterId)
    expect(doc.chapters[0].title).toBe('Childhood')
  })

  it('renames a chapter without touching others', () => {
    const a = addChapter(createEmptyDocument(), 'A')
    const b = addChapter(a.doc, 'B')
    const doc = renameChapter(b.doc, a.chapterId, 'A2')
    expect(doc.chapters.map((c) => c.title)).toEqual(['A2', 'B'])
  })

  it('removes a chapter', () => {
    const a = addChapter(createEmptyDocument(), 'A')
    const b = addChapter(a.doc, 'B')
    expect(removeChapter(b.doc, a.chapterId).chapters.map((c) => c.title)).toEqual(['B'])
  })

  it('moves a chapter and clamps at the ends', () => {
    const a = addChapter(createEmptyDocument(), 'A')
    const b = addChapter(a.doc, 'B')
    const c = addChapter(b.doc, 'C')
    expect(moveChapter(c.doc, c.chapterId, -1).chapters.map((x) => x.title)).toEqual(['A', 'C', 'B'])
    expect(moveChapter(c.doc, a.chapterId, -1).chapters.map((x) => x.title)).toEqual(['A', 'B', 'C'])
    expect(moveChapter(c.doc, c.chapterId, 1).chapters.map((x) => x.title)).toEqual(['A', 'B', 'C'])
  })
})

describe('blocks', () => {
  it('inserts at an index', () => {
    const { doc, chapterId } = docWithBlocks()
    const d = insertBlock(doc, chapterId, 1, text('x'))
    expect(ids(d, chapterId)).toEqual(['a', 'x', 'b', 'c'])
  })

  it('does not mutate the input document', () => {
    const { doc, chapterId } = docWithBlocks()
    insertBlock(doc, chapterId, 0, text('x'))
    expect(ids(doc, chapterId)).toEqual(['a', 'b', 'c'])
  })

  it('updates a block by id', () => {
    const { doc, chapterId } = docWithBlocks()
    const d = updateBlock(doc, chapterId, 'b', { ...text('b'), heading: 'New' })
    expect(findBlock(d, 'b')?.block).toMatchObject({ heading: 'New' })
  })

  it('removes a block and keeps order', () => {
    const { doc, chapterId } = docWithBlocks()
    expect(ids(removeBlock(doc, chapterId, 'b'), chapterId)).toEqual(['a', 'c'])
  })

  it('moves a block up and down and clamps at the ends', () => {
    const { doc, chapterId } = docWithBlocks()
    expect(ids(moveBlock(doc, chapterId, 'c', -1), chapterId)).toEqual(['a', 'c', 'b'])
    expect(ids(moveBlock(doc, chapterId, 'a', -1), chapterId)).toEqual(['a', 'b', 'c'])
    expect(ids(moveBlock(doc, chapterId, 'c', 1), chapterId)).toEqual(['a', 'b', 'c'])
  })

  it('reorders by an explicit id list', () => {
    const { doc, chapterId } = docWithBlocks()
    expect(ids(reorderBlocks(doc, chapterId, ['c', 'a', 'b']), chapterId)).toEqual(['c', 'a', 'b'])
  })

  it('finds a block with its chapter', () => {
    const { doc, chapterId } = docWithBlocks()
    expect(findBlock(doc, 'b')).toMatchObject({ chapterId, index: 1 })
    expect(findBlock(doc, 'zzz')).toBeNull()
  })
})
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npx vitest run src/lib/story/document.test.ts`
Expected: FAIL, "Failed to resolve import './document'".

- [ ] **Step 5: Implement the helpers**

`src/lib/story/document.ts`:

```ts
import type { Block, Chapter, StoryDocument } from './types'

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function createEmptyDocument(): StoryDocument {
  return { version: 1, opening: { name: '', title: '', portrait: null, cover: null }, chapters: [] }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function mapChapter(doc: StoryDocument, chapterId: string, fn: (c: Chapter) => Chapter): StoryDocument {
  return { ...doc, chapters: doc.chapters.map((c) => (c.id === chapterId ? fn(clone(c)) : c)) }
}

function clampedMove<T>(items: T[], from: number, delta: number): T[] {
  const to = Math.max(0, Math.min(items.length - 1, from + delta))
  if (from < 0 || to === from) return items
  const next = items.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function addChapter(doc: StoryDocument, title: string): { doc: StoryDocument; chapterId: string } {
  const chapterId = newId()
  return { doc: { ...doc, chapters: [...doc.chapters, { id: chapterId, title, blocks: [] }] }, chapterId }
}

export function renameChapter(doc: StoryDocument, chapterId: string, title: string): StoryDocument {
  return mapChapter(doc, chapterId, (c) => ({ ...c, title }))
}

export function removeChapter(doc: StoryDocument, chapterId: string): StoryDocument {
  return { ...doc, chapters: doc.chapters.filter((c) => c.id !== chapterId) }
}

export function moveChapter(doc: StoryDocument, chapterId: string, delta: number): StoryDocument {
  const from = doc.chapters.findIndex((c) => c.id === chapterId)
  return { ...doc, chapters: clampedMove(doc.chapters, from, delta) }
}

export function insertBlock(doc: StoryDocument, chapterId: string, index: number, block: Block): StoryDocument {
  return mapChapter(doc, chapterId, (c) => {
    const blocks = c.blocks.slice()
    blocks.splice(Math.max(0, Math.min(blocks.length, index)), 0, clone(block))
    return { ...c, blocks }
  })
}

export function updateBlock(doc: StoryDocument, chapterId: string, blockId: string, block: Block): StoryDocument {
  return mapChapter(doc, chapterId, (c) => ({
    ...c,
    blocks: c.blocks.map((b) => (b.id === blockId ? clone({ ...block, id: blockId }) : b)),
  }))
}

export function removeBlock(doc: StoryDocument, chapterId: string, blockId: string): StoryDocument {
  return mapChapter(doc, chapterId, (c) => ({ ...c, blocks: c.blocks.filter((b) => b.id !== blockId) }))
}

export function moveBlock(doc: StoryDocument, chapterId: string, blockId: string, delta: number): StoryDocument {
  return mapChapter(doc, chapterId, (c) => {
    const from = c.blocks.findIndex((b) => b.id === blockId)
    return { ...c, blocks: clampedMove(c.blocks, from, delta) }
  })
}

export function reorderBlocks(doc: StoryDocument, chapterId: string, orderedIds: string[]): StoryDocument {
  return mapChapter(doc, chapterId, (c) => {
    const byId = new Map(c.blocks.map((b) => [b.id, b]))
    const ordered = orderedIds.map((id) => byId.get(id)).filter((b): b is Block => Boolean(b))
    const missing = c.blocks.filter((b) => !orderedIds.includes(b.id))
    return { ...c, blocks: [...ordered, ...missing] }
  })
}

export function findBlock(
  doc: StoryDocument,
  blockId: string
): { chapterId: string; index: number; block: Block } | null {
  for (const chapter of doc.chapters) {
    const index = chapter.blocks.findIndex((b) => b.id === blockId)
    if (index >= 0) return { chapterId: chapter.id, index, block: chapter.blocks[index] }
  }
  return null
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/lib/story/document.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 7: Paste the SQL to the user and commit**

Paste the full contents of `migrations/20260915_life_story.sql` into chat; the user applies it.

```bash
git add migrations/20260915_life_story.sql src/lib/story/types.ts src/lib/story/document.ts src/lib/story/document.test.ts
git commit -m "feat(story): story table migration, document types and helpers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Timing and video link helpers

**Files:**
- Create: `src/lib/story/timing.ts`
- Create: `src/lib/story/videoLinks.ts`
- Test: `src/lib/story/timing.test.ts`, `src/lib/story/videoLinks.test.ts`

**Interfaces:**
- Produces: `speedToSeconds(speed: Speed): 3 | 5 | 8`, `secondsToSpeed(seconds): Speed`, `slideshowIntervalMs(block: SlideshowBlock): number`, `slideIndexForTime(timeSec, durationSec, count): number`; `parseVideoLink(url: string): LinkSource | null`, `embedUrl(source: LinkSource, autoplay: boolean): string`.

- [ ] **Step 1: Write the failing tests**

`src/lib/story/timing.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { speedToSeconds, secondsToSpeed, slideshowIntervalMs, slideIndexForTime } from './timing'
import type { SlideshowBlock, CaptionedImage } from './types'

const img = (n: number): CaptionedImage => ({ url: `${n}`, thumbnailUrl: `${n}`, width: 1, height: 1, caption: '' })
const base = (n: number): Omit<SlideshowBlock, 'timing' | 'audio'> => ({ id: 's', kind: 'slideshow', images: Array.from({ length: n }, (_, i) => img(i)) })

describe('speed mapping', () => {
  it('maps slow / medium / fast to 8 / 5 / 3 seconds', () => {
    expect(speedToSeconds('slow')).toBe(8)
    expect(speedToSeconds('medium')).toBe(5)
    expect(speedToSeconds('fast')).toBe(3)
    expect(secondsToSpeed(8)).toBe('slow')
    expect(secondsToSpeed(3)).toBe('fast')
  })
})

describe('slideshowIntervalMs', () => {
  it('uses the fixed interval', () => {
    expect(slideshowIntervalMs({ ...base(4), timing: { mode: 'interval', seconds: 5 }, audio: null })).toBe(5000)
  })
  it('spreads photos evenly across the recording', () => {
    const block: SlideshowBlock = { ...base(4), timing: { mode: 'audio' }, audio: { url: 'a', durationSec: 60, transcript: '' } }
    expect(slideshowIntervalMs(block)).toBe(15000)
  })
  it('falls back to 5 seconds when audio mode has no recording yet', () => {
    expect(slideshowIntervalMs({ ...base(4), timing: { mode: 'audio' }, audio: null })).toBe(5000)
  })
})

describe('slideIndexForTime', () => {
  it('picks the slide for a time and clamps to the last slide', () => {
    expect(slideIndexForTime(0, 60, 4)).toBe(0)
    expect(slideIndexForTime(14.9, 60, 4)).toBe(0)
    expect(slideIndexForTime(15, 60, 4)).toBe(1)
    expect(slideIndexForTime(60, 60, 4)).toBe(3)
    expect(slideIndexForTime(10, 0, 4)).toBe(0)
  })
})
```

`src/lib/story/videoLinks.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseVideoLink, embedUrl } from './videoLinks'

describe('parseVideoLink', () => {
  it('parses the YouTube forms', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
    ]) {
      expect(parseVideoLink(url)).toMatchObject({ provider: 'youtube', videoId: 'dQw4w9WgXcQ' })
    }
  })
  it('parses the Vimeo forms', () => {
    for (const url of ['https://vimeo.com/76979871', 'https://player.vimeo.com/video/76979871', 'vimeo.com/channels/staffpicks/76979871']) {
      expect(parseVideoLink(url)).toMatchObject({ provider: 'vimeo', videoId: '76979871' })
    }
  })
  it('rejects everything else', () => {
    expect(parseVideoLink('https://example.com/video.mp4')).toBeNull()
    expect(parseVideoLink('not a link')).toBeNull()
    expect(parseVideoLink('')).toBeNull()
  })
})

describe('embedUrl', () => {
  it('uses the privacy embeds', () => {
    const yt = parseVideoLink('https://youtu.be/dQw4w9WgXcQ')!
    expect(embedUrl(yt, true)).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1&playsinline=1')
    const vm = parseVideoLink('https://vimeo.com/76979871')!
    expect(embedUrl(vm, false)).toBe('https://player.vimeo.com/video/76979871?dnt=1&autoplay=0')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/story/timing.test.ts src/lib/story/videoLinks.test.ts`
Expected: FAIL, imports unresolved.

- [ ] **Step 3: Implement**

`src/lib/story/timing.ts`:

```ts
import type { SlideshowBlock } from './types'

export type Speed = 'slow' | 'medium' | 'fast'

const SPEED_SECONDS: Record<Speed, 3 | 5 | 8> = { slow: 8, medium: 5, fast: 3 }

export function speedToSeconds(speed: Speed): 3 | 5 | 8 {
  return SPEED_SECONDS[speed]
}

export function secondsToSpeed(seconds: number): Speed {
  if (seconds >= 8) return 'slow'
  if (seconds <= 3) return 'fast'
  return 'medium'
}

export function slideshowIntervalMs(block: SlideshowBlock): number {
  const count = Math.max(1, block.images.length)
  if (block.timing.mode === 'audio' && block.audio && block.audio.durationSec > 0) {
    return (block.audio.durationSec * 1000) / count
  }
  if (block.timing.mode === 'interval') return block.timing.seconds * 1000
  return 5000
}

export function slideIndexForTime(timeSec: number, durationSec: number, count: number): number {
  if (count <= 1 || durationSec <= 0) return 0
  const per = durationSec / count
  return Math.max(0, Math.min(count - 1, Math.floor(timeSec / per)))
}
```

`src/lib/story/videoLinks.ts`:

```ts
export type LinkSource = { type: 'link'; provider: 'youtube' | 'vimeo'; videoId: string; url: string }

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const VIMEO_ID = /^\d{6,12}$/

function toUrl(input: string): URL | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
}

export function parseVideoLink(input: string): LinkSource | null {
  const url = toUrl(input)
  if (!url) return null
  const host = url.hostname.replace(/^www\.|^m\./, '')
  const parts = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be') {
    const id = parts[0]
    return id && YOUTUBE_ID.test(id) ? { type: 'link', provider: 'youtube', videoId: id, url: url.toString() } : null
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    let id = url.searchParams.get('v')
    if (!id && (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live')) id = parts[1] ?? null
    return id && YOUTUBE_ID.test(id) ? { type: 'link', provider: 'youtube', videoId: id, url: url.toString() } : null
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = [...parts].reverse().find((p) => VIMEO_ID.test(p))
    return id ? { type: 'link', provider: 'vimeo', videoId: id, url: url.toString() } : null
  }
  return null
}

export function embedUrl(source: LinkSource, autoplay: boolean): string {
  if (source.provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${source.videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`
  }
  return `https://player.vimeo.com/video/${source.videoId}?dnt=1&autoplay=${autoplay ? 1 : 0}`
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/story/timing.test.ts src/lib/story/videoLinks.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/story/timing.ts src/lib/story/timing.test.ts src/lib/story/videoLinks.ts src/lib/story/videoLinks.test.ts
git commit -m "feat(story): slideshow timing and video link helpers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Dependencies, StoryService, media helpers, route protection

**Files:**
- Modify: `package.json` (add `tus-js-client`, `@breezystack/lamejs`)
- Modify: `src/services/storage.service.ts` (bucket unions)
- Create: `src/lib/story/media.ts`
- Create: `src/services/story.service.ts`
- Modify: `src/middleware.ts:5-18`
- Modify: `src/components/ConditionalHeader.tsx`
- Create: `src/types/lamejs.d.ts`

**Interfaces:**
- Consumes: `StoryDocument`, `ImageRef`, `AudioRef` from Task 1.
- Produces: `StoryService.getPublished(): Promise<StoryDocument | null>`, `getDraft(): Promise<StoryDocument>`, `saveDraft(doc): Promise<void>`, `uploadPhotos(files: File[], onProgress?: (pct: number) => void): Promise<ImageRef[]>`, `uploadAudio(blob: Blob, extension: string): Promise<AudioRef>`, `uploadVideo(file: File, onProgress?: (pct: number) => void): Promise<{ url: string; durationSec: number; poster: ImageRef | null }>`; media helpers `readImageSize(file | blob)`, `readAudioDuration(blob)`, `captureVideoPoster(file)`.

- [ ] **Step 1: Install dependencies**

Run: `npm install tus-js-client @breezystack/lamejs`

Then create `src/types/lamejs.d.ts` (the package ships loose types; this keeps the worker strict):

```ts
declare module '@breezystack/lamejs' {
  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number)
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array
    flush(): Int8Array
  }
}
```

- [ ] **Step 2: Add the bucket to StorageService**

In `src/services/storage.service.ts`, every union `'artworks' | 'exhibitions' | 'series' | 'quotes' | 'journal'` and `'artworks' | 'exhibitions' | 'series' | 'journal'` gains `| 'story'`. There are four occurrences (`uploadImages`, `uploadSingleImage`, `deleteImages`, `listFiles`).

- [ ] **Step 3: Write the browser media helpers**

`src/lib/story/media.ts`:

```ts
export function readImageSize(source: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read this photo'))
    }
    img.src = url
  })
}

export function readAudioDuration(source: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source)
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      const d = audio.duration
      URL.revokeObjectURL(url)
      // Chrome reports Infinity for some webm blobs; callers pass a known duration then.
      resolve(Number.isFinite(d) ? d : 0)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read this recording'))
    }
    audio.src = url
  })
}

export async function captureVideoPoster(file: File): Promise<{ poster: Blob | null; durationSec: number }> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('Could not read this video'))
      video.src = url
    })
    const durationSec = Number.isFinite(video.duration) ? video.duration : 0
    try {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve()
        video.onerror = () => reject(new Error('seek failed'))
        video.currentTime = Math.min(1, durationSec / 2 || 0)
      })
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      if (!canvas.width || !canvas.height) return { poster: null, durationSec }
      canvas.getContext('2d')!.drawImage(video, 0, 0)
      const poster = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
      return { poster, durationSec }
    } catch {
      return { poster: null, durationSec }
    }
  } finally {
    URL.revokeObjectURL(url)
    video.removeAttribute('src')
  }
}
```

- [ ] **Step 4: Write StoryService**

`src/services/story.service.ts`:

```ts
import * as tus from 'tus-js-client'
import { supabase } from '@/lib/supabase'
import { config } from '@/lib/config'
import { StorageService } from './storage.service'
import { createEmptyDocument } from '@/lib/story/document'
import { readImageSize, readAudioDuration, captureVideoPoster } from '@/lib/story/media'
import type { StoryDocument, ImageRef, AudioRef } from '@/lib/story/types'

const BUCKET = 'story'

function uniqueName(extension: string): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`
}

export class StoryService {
  static async getPublished(): Promise<StoryDocument | null> {
    const { data, error } = await supabase.from('story').select('published').limit(1).maybeSingle()
    if (error) throw error
    return (data?.published as StoryDocument | null) ?? null
  }

  static async getDraft(): Promise<StoryDocument> {
    const { data, error } = await supabase.from('story').select('draft').limit(1).maybeSingle()
    if (error) throw error
    return (data?.draft as StoryDocument | null) ?? createEmptyDocument()
  }

  static async saveDraft(document: StoryDocument): Promise<void> {
    const { data: row, error: readError } = await supabase.from('story').select('id').limit(1).single()
    if (readError) throw readError
    const { error } = await supabase
      .from('story')
      .update({ draft: document, draft_updated_at: new Date().toISOString() })
      .eq('id', row.id)
    if (error) throw error
  }

  static async uploadPhotos(files: File[], onProgress?: (pct: number) => void): Promise<ImageRef[]> {
    const sizes = await Promise.all(files.map((f) => readImageSize(f)))
    const results = await StorageService.uploadImages(files, BUCKET, (p) => onProgress?.(p.percentage))
    return results.map((r, i) => ({
      url: r.urls.display,
      thumbnailUrl: r.urls.thumbnail,
      width: sizes[i].width,
      height: sizes[i].height,
    }))
  }

  static async uploadPosterBlob(blob: Blob): Promise<ImageRef> {
    const file = new File([blob], 'poster.jpg', { type: 'image/jpeg' })
    const [ref] = await this.uploadPhotos([file])
    return ref
  }

  static async uploadAudio(blob: Blob, extension: string, knownDurationSec?: number): Promise<AudioRef> {
    const path = `audio/${uniqueName(extension)}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: blob.type || 'audio/mpeg',
    })
    if (error) throw error
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const measured = knownDurationSec && knownDurationSec > 0 ? knownDurationSec : await readAudioDuration(blob)
    return { url: data.publicUrl, durationSec: Math.round(measured * 10) / 10, transcript: '' }
  }

  static async uploadVideo(
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<{ url: string; durationSec: number; poster: ImageRef | null }> {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) throw new Error('You are not signed in')

    const extension = (file.name.split('.').pop() || 'mp4').toLowerCase()
    const objectName = `video/${uniqueName(extension)}`

    await new Promise<void>((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: `${config.supabase.url}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: { authorization: `Bearer ${token}`, 'x-upsert': 'false' },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        chunkSize: 6 * 1024 * 1024,
        metadata: {
          bucketName: BUCKET,
          objectName,
          contentType: file.type || 'video/mp4',
          cacheControl: '3600',
        },
        onError: (err) => reject(err),
        onProgress: (sent, total) => onProgress?.(Math.round((sent / total) * 100)),
        onSuccess: () => resolve(),
      })
      upload.findPreviousUploads().then((previous) => {
        if (previous.length) upload.resumeFromPreviousUpload(previous[0])
        upload.start()
      })
    })

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectName)
    const { poster, durationSec } = await captureVideoPoster(file)
    const posterRef = poster ? await this.uploadPosterBlob(poster) : null
    return { url: data.publicUrl, durationSec: Math.round(durationSec), poster: posterRef }
  }
}
```

Check `src/lib/config.ts` exports `config.supabase.url` (it does; `src/lib/supabase.ts` already uses it).

- [ ] **Step 5: Protect the editor routes and hide the header**

In `src/middleware.ts`, inside `isAdminRoute`, add before the closing `)`:

```ts
    pathname.startsWith('/story/edit') ||
    pathname.startsWith('/story/preview') ||
    pathname.startsWith('/api/story') ||
```

Replace `src/components/ConditionalHeader.tsx`:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/Header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  if (pathname === '/story' || pathname.startsWith('/story/')) return null
  return <Header />
}
```

- [ ] **Step 6: Typecheck and commit**

Run: `npm run typecheck`
Expected: no errors. (If `tus-js-client` types complain about `findPreviousUploads`, it is present in v4; confirm `node -e "console.log(require('tus-js-client/package.json').version)"` prints 4.x.)

```bash
git add package.json package-lock.json src/types/lamejs.d.ts src/services/storage.service.ts src/lib/story/media.ts src/services/story.service.ts src/middleware.ts src/components/ConditionalHeader.tsx
git commit -m "feat(story): StoryService, media helpers, editor route protection

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Public story shell — layout, theme, sound, chrome, opening, text

**Files:**
- Create: `src/app/story/layout.tsx`, `src/app/story/story.css`, `src/app/story/page.tsx`
- Create: `src/components/story/SoundProvider.tsx`, `StoryChrome.tsx`, `Opening.tsx`, `blocks/TextBlock.tsx`, `Story.tsx`, `NotReady.tsx`, `useIsPhone.ts`

**Interfaces:**
- Consumes: `StoryDocument`, `Block` types; `StoryService` is not used here (server page uses a plain client).
- Produces: `useSound()` returning `{ begun, muted, begin(), toggleMuted(), register(el), play(el), stop(el) }`; `<Story document preview? />`; `<Opening opening onBegin />`; `<TextBlock block />`; `useIsPhone(): boolean`; `renderBlock(block)` in `Story.tsx` (later tasks add cases).

- [ ] **Step 1: Layout and theme**

`src/app/story/layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Source_Sans_3 } from 'next/font/google'
import './story.css'

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-story-sans',
})

export default function StoryLayout({ children }: { children: ReactNode }) {
  return <div className={`${sourceSans.variable} story-theme`}>{children}</div>
}
```

`src/app/story/story.css`:

```css
.story-theme {
  --paper: #f5f0e8;
  --paper-2: #ece5d9;
  --paper-3: #e2d9ca;
  --white: #fbf9f5;
  --ink: #2a2521;
  --ink-2: #6e655c;
  --ink-3: #9a9086;
  --line: #d8cfc2;
  --accent: #b5623a;
  --accent-2: #8f4c2c;
  --accent-soft: #f3e4da;
  --red: #c43d33;
  font-family: var(--font-story-sans), 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: var(--ink);
  background: var(--paper);
  -webkit-font-smoothing: antialiased;
}

.story-serif {
  font-family: var(--font-serif), 'Cormorant Garamond', Georgia, serif;
}

.story-photo {
  filter: sepia(0.16) contrast(0.94) saturate(0.86) brightness(1.02);
}

.story-grain::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.16;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.2 0 0 0 0 0.15 0 0 0 0 0.1 0 0 0 0.55 0'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>");
}

.story-vignette::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 50%, rgba(28, 18, 10, 0.42) 100%);
}

.story-tabular {
  font-variant-numeric: tabular-nums;
}

/* Editor controls (Task 9 onwards) */
.se-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 56px;
  padding: 0 26px;
  border-radius: 10px;
  font-size: 20px;
  font-weight: 600;
  white-space: nowrap;
  border: 2px solid transparent;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
.se-btn:disabled { opacity: 0.5; cursor: default; }
.se-btn-primary { background: var(--accent); color: var(--white); border-color: var(--accent); }
.se-btn-primary:hover:not(:disabled) { background: var(--accent-2); border-color: var(--accent-2); }
.se-btn-secondary { background: var(--white); color: var(--ink); border-color: var(--ink); }
.se-btn-secondary:hover:not(:disabled) { background: var(--paper-2); }
.se-btn-quiet { background: transparent; color: var(--ink); text-decoration: underline; text-underline-offset: 4px; }
.se-btn-danger { background: var(--ink); color: var(--white); border-color: var(--ink); }
.se-btn-small { height: 48px; font-size: 18px; padding: 0 20px; }

.se-field {
  width: 100%;
  box-sizing: border-box;
  padding: 16px 22px;
  border-radius: 12px;
  border: 2px solid var(--line);
  background: var(--white);
  font-size: 22px;
  line-height: 1.6;
  color: var(--ink);
  font-family: inherit;
}
.se-field:focus { outline: none; border-color: var(--accent); }
.se-field-big { font-size: 40px; line-height: 1.15; padding: 22px 24px; }
```

- [ ] **Step 2: Sound provider**

`src/components/story/SoundProvider.tsx`:

```tsx
'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type Media = HTMLMediaElement
type Wired = { gain: GainNode | null }

type SoundContextValue = {
  begun: boolean
  muted: boolean
  begin: () => void
  toggleMuted: () => void
  register: (el: Media) => () => void
  play: (el: Media) => Promise<void>
  stop: (el: Media) => void
}

const SoundContext = createContext<SoundContextValue | null>(null)

const FADE_MS = 1000

export function SoundProvider({ children }: { children: ReactNode }) {
  const [begun, setBegun] = useState(false)
  const [muted, setMuted] = useState(false)
  const mutedRef = useRef(false)
  const elements = useRef(new Map<Media, Wired>())
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const currentRef = useRef<Media | null>(null)
  const fadeTimers = useRef(new Map<Media, number>())

  const wire = useCallback((el: Media) => {
    const ctx = ctxRef.current
    const entry = elements.current.get(el)
    if (!ctx || !masterRef.current || !entry || entry.gain) return
    try {
      const source = ctx.createMediaElementSource(el)
      const gain = ctx.createGain()
      source.connect(gain).connect(masterRef.current)
      entry.gain = gain
    } catch {
      entry.gain = null
    }
  }, [])

  const register = useCallback(
    (el: Media) => {
      elements.current.set(el, { gain: null })
      if (ctxRef.current) wire(el)
      return () => {
        elements.current.delete(el)
      }
    },
    [wire]
  )

  const begin = useCallback(() => {
    if (!ctxRef.current) {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new Ctx()
        const master = ctx.createGain()
        master.connect(ctx.destination)
        ctxRef.current = ctx
        masterRef.current = master
        elements.current.forEach((_, el) => wire(el))
      } catch {
        ctxRef.current = null
      }
    }
    ctxRef.current?.resume().catch(() => {})
    // Inside the tap: touch every element once so browsers allow later playback.
    elements.current.forEach((_, el) => {
      const p = el.play()
      if (p && typeof p.then === 'function') {
        p.then(() => {
          el.pause()
          el.currentTime = 0
        }).catch(() => {})
      }
    })
    setBegun(true)
  }, [wire])

  const rampTo = useCallback((el: Media, target: number, onDone?: () => void) => {
    const entry = elements.current.get(el)
    const ctx = ctxRef.current
    const existing = fadeTimers.current.get(el)
    if (existing) window.clearInterval(existing)
    if (entry?.gain && ctx) {
      const now = ctx.currentTime
      entry.gain.gain.cancelScheduledValues(now)
      entry.gain.gain.setValueAtTime(entry.gain.gain.value, now)
      entry.gain.gain.linearRampToValueAtTime(target, now + FADE_MS / 1000)
      if (onDone) fadeTimers.current.set(el, window.setTimeout(onDone, FADE_MS) as unknown as number)
      return
    }
    // Fallback: ramp element.volume (ignored on iOS, where the fade becomes a plain stop).
    const start = el.volume
    const steps = 20
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      el.volume = Math.max(0, Math.min(1, start + ((target - start) * i) / steps))
      if (i >= steps) {
        window.clearInterval(id)
        fadeTimers.current.delete(el)
        onDone?.()
      }
    }, FADE_MS / steps)
    fadeTimers.current.set(el, id)
  }, [])

  const stop = useCallback(
    (el: Media) => {
      if (el.paused) return
      rampTo(el, 0, () => {
        el.pause()
        const entry = elements.current.get(el)
        if (entry?.gain) entry.gain.gain.value = 1
        else el.volume = 1
      })
      if (currentRef.current === el) currentRef.current = null
    },
    [rampTo]
  )

  const play = useCallback(
    async (el: Media) => {
      if (mutedRef.current) return
      if (currentRef.current && currentRef.current !== el) stop(currentRef.current)
      currentRef.current = el
      const entry = elements.current.get(el)
      if (entry?.gain) entry.gain.gain.value = 0
      else el.volume = 0
      try {
        await el.play()
        rampTo(el, 1)
      } catch {
        // Browser refused (no gesture yet): leave the element paused.
      }
    },
    [rampTo, stop]
  )

  const toggleMuted = useCallback(() => {
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    if (masterRef.current) masterRef.current.gain.value = next ? 0 : 1
    elements.current.forEach((entry, el) => {
      if (!entry.gain) el.muted = next
    })
  }, [])

  const value = useMemo<SoundContextValue>(
    () => ({ begun, muted, begin, toggleMuted, register, play, stop }),
    [begun, muted, begin, toggleMuted, register, play, stop]
  )

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext)
  if (!ctx) throw new Error('useSound must be used inside SoundProvider')
  return ctx
}
```

Note for media elements: any `<audio>` or `<video>` that goes through `register` must set `crossOrigin="anonymous"` so the Web Audio graph can read it.

- [ ] **Step 3: Chrome (progress bar and sound toggle)**

`src/components/story/StoryChrome.tsx`:

```tsx
'use client'

import { motion, useScroll } from 'framer-motion'
import { useSound } from './SoundProvider'

function SpeakerIcon({ off }: { off: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
      {off ? (
        <>
          <path d="M16 9.5l5 5" />
          <path d="M21 9.5l-5 5" />
        </>
      ) : (
        <>
          <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
          <path d="M18 7a7 7 0 0 1 0 10" />
        </>
      )}
    </svg>
  )
}

export function StoryChrome({ onDark }: { onDark: boolean }) {
  const { scrollYProgress } = useScroll()
  const { muted, toggleMuted, begun } = useSound()
  const label = begun ? (muted ? 'Sound off' : 'Sound on') : 'Sound off'

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px]" style={{ background: onDark ? 'rgba(255,255,255,0.18)' : 'rgba(42,37,33,0.10)' }}>
        <motion.div className="h-[3px] origin-left" style={{ scaleX: scrollYProgress, background: 'var(--accent)' }} />
      </div>
      <button
        type="button"
        onClick={toggleMuted}
        aria-label={label}
        className="fixed z-50 flex items-center gap-3 top-6 right-5 md:top-7 md:right-8"
      >
        <span className="hidden md:inline text-[13px] tracking-[0.14em] uppercase" style={{ color: onDark ? 'rgba(251,249,245,0.78)' : 'var(--ink-2)' }}>
          {label}
        </span>
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm"
          style={{
            border: `1px solid ${onDark ? 'rgba(251,249,245,0.45)' : 'var(--line)'}`,
            background: onDark ? 'rgba(20,14,10,0.35)' : 'var(--white)',
            color: onDark ? 'var(--white)' : 'var(--ink)',
          }}
        >
          <SpeakerIcon off={muted || !begun} />
        </span>
      </button>
    </>
  )
}
```

- [ ] **Step 4: Opening screen**

`src/components/story/Opening.tsx`:

```tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { StoryOpening } from '@/lib/story/types'

export function Opening({ opening, onBegin }: { opening: StoryOpening; onBegin: () => void }) {
  const reduce = useReducedMotion()
  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1.2, delay, ease: 'easeOut' as const },
  })

  return (
    <section className="story-grain relative flex h-[100svh] w-full items-center justify-center overflow-hidden" style={{ background: '#1e1712' }}>
      {opening.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={opening.cover.url} alt="" className="story-photo absolute inset-[-4%] h-[108%] w-[108%] object-cover opacity-55" />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.25) 0%, rgba(20,14,10,0.15) 45%, rgba(20,14,10,0.7) 100%)' }} />
      <div className="relative z-10 flex flex-col items-center gap-7 px-7 text-center md:px-30">
        {opening.portrait && (
          <motion.div {...rise(0)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={opening.portrait.url} alt={opening.name} className="story-photo h-[132px] w-[132px] rounded-full object-cover md:h-[172px] md:w-[172px]" style={{ border: '1.5px solid rgba(251,249,245,0.6)' }} />
          </motion.div>
        )}
        <motion.div {...rise(0.35)} className="flex flex-col items-center gap-4">
          <span className="text-[12px] uppercase tracking-[0.22em] md:text-[14px]" style={{ color: 'rgba(251,249,245,0.78)' }}>
            The life story of
          </span>
          <h1 className="story-serif m-0 text-[54px] font-medium leading-none md:text-[104px]" style={{ color: 'var(--white)', letterSpacing: '-0.01em' }}>
            {opening.name}
          </h1>
          {opening.title && (
            <p className="story-serif m-0 text-[24px] italic leading-tight md:text-[36px]" style={{ color: 'rgba(251,249,245,0.9)' }}>
              {opening.title}
            </p>
          )}
        </motion.div>
        <motion.div {...rise(0.7)} className="mt-2 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={onBegin}
            className="flex h-[60px] items-center justify-center rounded-full px-9 text-[19px] font-semibold md:h-16 md:px-11 md:text-[21px]"
            style={{ background: 'var(--accent)', color: 'var(--white)' }}
          >
            Begin the story
          </button>
          <span className="text-[14px] md:text-[15px]" style={{ color: 'rgba(251,249,245,0.7)' }}>
            This story is told with sound
          </span>
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Text block and phone hook**

`src/components/story/useIsPhone.ts`:

```ts
'use client'

import { useEffect, useState } from 'react'

export function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsPhone(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return isPhone
}
```

`src/components/story/blocks/TextBlock.tsx`:

```tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { TextBlock as TextBlockType } from '@/lib/story/types'

export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function TextBlock({ block, chapterLabel }: { block: TextBlockType; chapterLabel: string }) {
  const reduce = useReducedMotion()
  const reveal = {
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 1.2, ease: 'easeOut' as const },
  }
  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center px-6 py-24 md:px-24" style={{ background: 'var(--paper)' }}>
      <div className="flex w-full max-w-[680px] flex-col gap-7 md:gap-8">
        <motion.div {...reveal} className="flex items-center gap-4">
          <span className="h-px w-10" style={{ background: 'var(--accent)' }} />
          <span className="text-[13px] uppercase tracking-[0.2em] md:text-[14px]" style={{ color: 'var(--accent)' }}>
            {chapterLabel}
          </span>
        </motion.div>
        {block.heading && (
          <motion.h2 {...reveal} className="story-serif m-0 text-[44px] font-medium leading-[1.02] md:text-[76px]" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            {block.heading}
          </motion.h2>
        )}
        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.3 }} className="flex flex-col gap-5 text-[19px] leading-[1.65] md:text-[21px]" style={{ color: 'var(--ink)' }}>
          {paragraphs(block.body).map((p, i) => (
            <p key={i} className="m-0">
              {p}
            </p>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Story assembly and the public page**

`src/components/story/NotReady.tsx`:

```tsx
export function NotReady() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center px-6 text-center" style={{ background: 'var(--paper)' }}>
      <p className="story-serif text-[28px] italic" style={{ color: 'var(--ink-2)' }}>
        This story is still being written.
      </p>
    </main>
  )
}
```

`src/components/story/Story.tsx` (later tasks add block cases to `renderBlock`):

```tsx
'use client'

import { useCallback, useRef } from 'react'
import type { Block, StoryDocument } from '@/lib/story/types'
import { SoundProvider, useSound } from './SoundProvider'
import { StoryChrome } from './StoryChrome'
import { Opening } from './Opening'
import { TextBlock } from './blocks/TextBlock'

export function chapterLabel(index: number, title: string): string {
  const words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
  const n = words[index] ?? String(index + 1)
  return title ? `Chapter ${n} · ${title}` : `Chapter ${n}`
}

function renderBlock(block: Block, label: string) {
  switch (block.kind) {
    case 'text':
      return <TextBlock key={block.id} block={block} chapterLabel={label} />
    default:
      return null
  }
}

function StoryBody({ document }: { document: StoryDocument }) {
  const { begin } = useSound()
  const firstChapter = useRef<HTMLDivElement>(null)

  const onBegin = useCallback(() => {
    begin()
    firstChapter.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [begin])

  return (
    <main className="story-theme">
      <StoryChrome onDark={false} />
      <Opening opening={document.opening} onBegin={onBegin} />
      {document.chapters.map((chapter, i) => (
        <div key={chapter.id} ref={i === 0 ? firstChapter : undefined}>
          {chapter.blocks.map((block) => renderBlock(block, chapterLabel(i, chapter.title)))}
        </div>
      ))}
    </main>
  )
}

export function Story({ document }: { document: StoryDocument }) {
  return (
    <SoundProvider>
      <StoryBody document={document} />
    </SoundProvider>
  )
}
```

`src/app/story/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Story } from '@/components/story/Story'
import { NotReady } from '@/components/story/NotReady'
import type { StoryDocument } from '@/lib/story/types'

export const dynamic = 'force-dynamic'

async function loadPublished(): Promise<StoryDocument | null> {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data } = await client.from('story').select('published').limit(1).maybeSingle()
  return (data?.published as StoryDocument | null) ?? null
}

export async function generateMetadata(): Promise<Metadata> {
  const doc = await loadPublished()
  const name = doc?.opening.name || 'Life story'
  return {
    title: doc?.opening.title ? `${name} — ${doc.opening.title}` : name,
    description: doc?.opening.title || undefined,
    openGraph: doc?.opening.cover ? { images: [{ url: doc.opening.cover.url }] } : undefined,
  }
}

export default async function StoryPage() {
  const doc = await loadPublished()
  if (!doc || !doc.opening.name || doc.chapters.length === 0) return <NotReady />
  return <Story document={doc} />
}
```

- [ ] **Step 7: Run it**

Run: `npm run typecheck && npm run dev`, open `http://localhost:3000/story`.
Expected: with no published story, the "still being written" page in the paper palette with no site header. To see the opening, temporarily run in Supabase SQL: `update story set published = jsonb_build_object('version',1,'opening',jsonb_build_object('name','Test','title','A test','portrait',null,'cover',null),'chapters',jsonb_build_array(jsonb_build_object('id','c1','title','One','blocks',jsonb_build_array(jsonb_build_object('id','b1','kind','text','heading','Hello','body','First.\n\nSecond.')))));` then reload. Pressing "Begin the story" scrolls to the text. Reset with `update story set published = null;`.

- [ ] **Step 8: Commit**

```bash
git add src/app/story src/components/story
git commit -m "feat(story): public story shell with opening, sound provider and text blocks

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Photo block and gallery block (pinned sideways on desktop, page-turn on phones)

**Files:**
- Create: `src/components/story/blocks/PhotoBlock.tsx`, `src/components/story/blocks/GalleryBlock.tsx`
- Modify: `src/components/story/Story.tsx` (`renderBlock` cases)

**Interfaces:**
- Consumes: `useIsPhone`, `PhotoBlock`, `GalleryBlock` types.
- Produces: `<PhotoBlock block chapterLabel />`, `<GalleryBlock block />`.

- [ ] **Step 1: Photo block**

`src/components/story/blocks/PhotoBlock.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { PhotoBlock as PhotoBlockType } from '@/lib/story/types'

export function PhotoBlock({ block, chapterLabel }: { block: PhotoBlockType; chapterLabel: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])

  return (
    <section ref={ref} className="story-grain story-vignette relative h-[100svh] w-full overflow-hidden" style={{ background: '#1e1712' }}>
      <motion.img
        src={block.image.url}
        alt={block.caption}
        className="story-photo absolute left-0 top-[-6%] h-[112%] w-full object-cover"
        style={reduce ? undefined : { y }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.12) 0%, rgba(20,14,10,0) 40%, rgba(20,14,10,0.62) 100%)' }} />
      <div className="absolute left-6 top-8 z-10 text-[12px] uppercase tracking-[0.16em] md:left-10 md:text-[13px]" style={{ color: 'rgba(251,249,245,0.72)' }}>
        {chapterLabel}
      </div>
      {block.caption && (
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute bottom-12 left-6 right-6 z-10 flex max-w-[720px] flex-col gap-2 md:bottom-22 md:left-24"
        >
          <p className="story-serif m-0 text-[24px] italic leading-tight md:text-[34px]" style={{ color: 'var(--white)' }}>
            {block.caption}
          </p>
        </motion.div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Gallery block**

`src/components/story/blocks/GalleryBlock.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { GalleryBlock as GalleryBlockType, CaptionedImage } from '@/lib/story/types'
import { useIsPhone } from '../useIsPhone'

const heights = [300, 360, 470, 380, 320]

function Caption({ text, onDark }: { text: string; onDark?: boolean }) {
  if (!text) return null
  return (
    <span className="story-serif text-[18px] italic md:text-[19px]" style={{ color: onDark ? 'var(--white)' : 'var(--ink-2)' }}>
      {text}
    </span>
  )
}

function StackedGallery({ images }: { images: CaptionedImage[] }) {
  return (
    <section className="flex w-full flex-col gap-10 px-6 py-24 md:px-24" style={{ background: 'var(--paper)' }}>
      {images.map((img, i) => (
        <motion.figure
          key={i}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1 }}
          className="m-0 flex flex-col gap-3"
          style={{ marginLeft: i % 2 ? 36 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.caption} className="story-photo block w-full max-w-[900px] object-cover" />
          <Caption text={img.caption} />
        </motion.figure>
      ))}
    </section>
  )
}

function SidewaysGallery({ images }: { images: CaptionedImage[] }) {
  const ref = useRef<HTMLElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const [maxShift, setMaxShift] = useState(0)
  const [index, setIndex] = useState(1)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  useEffect(() => {
    const measure = () => {
      const row = rowRef.current
      if (!row) return
      setMaxShift(Math.max(0, row.scrollWidth - window.innerWidth + 96))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [images.length])

  const x = useTransform(scrollYProgress, [0.06, 0.94], [0, -maxShift])
  const lineWidth = useTransform(scrollYProgress, [0.06, 0.94], ['0%', '100%'])
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const p = Math.max(0, Math.min(1, (v - 0.06) / 0.88))
    setIndex(Math.min(images.length, 1 + Math.floor(p * images.length)))
  })

  return (
    <section ref={ref} className="relative w-full" style={{ height: `${Math.max(2, images.length) * 100}vh`, background: 'var(--paper)' }}>
      <div className="sticky top-0 flex h-[100svh] w-full flex-col justify-center overflow-hidden">
        <motion.div ref={rowRef} className="flex items-start gap-10 pl-24" style={{ x }}>
          {images.map((img, i) => (
            <figure key={i} className="m-0 flex shrink-0 flex-col gap-3" style={{ marginTop: (i * 37) % 60 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption} className="story-photo block object-cover" style={{ height: heights[i % heights.length], width: 'auto', maxWidth: '60vw' }} />
              <Caption text={img.caption} />
            </figure>
          ))}
        </motion.div>
        <div className="absolute bottom-16 left-24 right-24 flex items-center gap-5">
          <span className="story-tabular whitespace-nowrap text-[15px]" style={{ color: 'var(--ink-2)' }}>
            {index} of {images.length}
          </span>
          <div className="relative h-px flex-grow" style={{ background: 'var(--line)' }}>
            <motion.div className="absolute left-0 top-0 h-px" style={{ width: lineWidth, background: 'var(--accent)' }} />
          </div>
        </div>
      </div>
    </section>
  )
}

function PageTurnGallery({ images }: { images: CaptionedImage[] }) {
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.max(0, Math.min(images.length - 1, Math.floor(v * images.length))))
  })

  return (
    <section ref={ref} className="relative w-full" style={{ height: `${images.length * 100}vh`, background: '#1e1712' }}>
      <div className="story-grain story-vignette sticky top-0 h-[100svh] w-full overflow-hidden">
        {images.map((img, i) => {
          const state = i < active ? 'behind' : i === active ? 'front' : 'next'
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.url}
              alt={img.caption}
              className="story-photo absolute left-0 top-0 h-full w-full object-cover transition-all duration-700 ease-out"
              style={{
                opacity: state === 'next' ? 0 : state === 'behind' ? 0.35 : 1,
                transform: state === 'next' ? 'translateY(8%) scale(1.02)' : state === 'behind' ? 'scale(1.04)' : 'none',
                zIndex: state === 'front' ? 2 : 1,
              }}
            />
          )
        })}
        <div className="absolute inset-0 z-[3]" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.35) 0%, rgba(20,14,10,0) 30%, rgba(20,14,10,0.75) 100%)' }} />
        <div className="absolute bottom-11 left-6 right-6 z-[4] flex flex-col gap-4">
          <p className="story-serif m-0 text-[26px] italic leading-tight" style={{ color: 'var(--white)' }}>
            {images[active]?.caption}
          </p>
          <div className="flex items-center justify-between">
            <span className="story-tabular text-[14px]" style={{ color: 'rgba(251,249,245,0.72)' }}>
              {active + 1} of {images.length}
            </span>
            <div className="flex items-center gap-2">
              {images.map((_, i) => (
                <span key={i} className="rounded-full" style={{ width: i === active ? 8 : 6, height: i === active ? 8 : 6, background: i === active ? 'var(--white)' : 'rgba(251,249,245,0.45)' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function GalleryBlock({ block }: { block: GalleryBlockType }) {
  const reduce = useReducedMotion()
  const isPhone = useIsPhone()
  if (block.images.length === 0) return null
  if (reduce) return <StackedGallery images={block.images} />
  return isPhone ? <PageTurnGallery images={block.images} /> : <SidewaysGallery images={block.images} />
}
```

- [ ] **Step 3: Wire into Story.tsx**

In `src/components/story/Story.tsx` add imports and cases:

```tsx
import { PhotoBlock } from './blocks/PhotoBlock'
import { GalleryBlock } from './blocks/GalleryBlock'
// inside renderBlock:
    case 'photo':
      return <PhotoBlock key={block.id} block={block} chapterLabel={label} />
    case 'gallery':
      return <GalleryBlock key={block.id} block={block} />
```

- [ ] **Step 4: Check in the browser and commit**

Run: `npm run typecheck`. In the browser, publish a test document with a `photo` and a `gallery` block (URLs from any public image) using the SQL pattern from Task 4 step 7. Desktop: the gallery pins and slides sideways, counter and line advance. Phone width (device toolbar, 390 px): photos turn page by page. With "Reduce motion" on in the OS, both become a vertical stack of fading photos.

```bash
git add src/components/story
git commit -m "feat(story): photo block with parallax and gallery block with pinned sideways / page-turn treatments

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Audio player, voice block and slideshow block

**Files:**
- Create: `src/components/story/AudioPlayer.tsx`, `src/components/story/blocks/AudioBlock.tsx`, `src/components/story/blocks/SlideshowBlock.tsx`
- Modify: `src/components/story/Story.tsx`

**Interfaces:**
- Consumes: `useSound`, `slideIndexForTime`, `slideshowIntervalMs`.
- Produces: `<AudioPlayer audio label onDark active onTime? />`, `<AudioBlock block />`, `<SlideshowBlock block />`, `formatTime(sec)`.

- [ ] **Step 1: Audio player**

`src/components/story/AudioPlayer.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import type { AudioRef } from '@/lib/story/types'
import { useSound } from './SoundProvider'

export function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

type Props = {
  audio: AudioRef
  label: string
  onDark?: boolean
  active: boolean
  onTime?: (sec: number) => void
  className?: string
}

export function AudioPlayer({ audio, label, onDark = false, active, onTime, className }: Props) {
  const ref = useRef<HTMLAudioElement>(null)
  const { register, play, stop, begun, muted } = useSound()
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const duration = audio.durationSec || 0
  const pct = duration ? Math.min(100, (time / duration) * 100) : 0

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return register(el)
  }, [register])

  useEffect(() => {
    const el = ref.current
    if (!el || !begun) return
    if (active && !muted) void play(el)
    else stop(el)
  }, [active, begun, muted, play, stop])

  const fg = onDark ? 'var(--white)' : 'var(--ink)'
  const sub = onDark ? 'rgba(251,249,245,0.72)' : 'var(--ink-2)'
  const track = onDark ? 'rgba(251,249,245,0.28)' : 'var(--line)'

  return (
    <div className={`flex w-full flex-col gap-3 ${className ?? ''}`}>
      <audio
        ref={ref}
        src={audio.url}
        preload="metadata"
        crossOrigin="anonymous"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime
          setTime(t)
          onTime?.(t)
        }}
      />
      <span className="text-[13px] uppercase tracking-[0.14em]" style={{ color: sub }}>
        {label}
      </span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={() => {
            const el = ref.current
            if (!el) return
            if (playing) el.pause()
            else void play(el)
          }}
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full"
          style={{ background: onDark ? 'var(--white)' : 'var(--ink)', color: onDark ? 'var(--ink)' : 'var(--white)' }}
        >
          {playing ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="5" width="3.5" height="14" rx="0.5" /><rect x="13.5" y="5" width="3.5" height="14" rx="0.5" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10-6.5z" /></svg>
          )}
        </button>
        <div className="flex flex-grow flex-col gap-2">
          <div
            className="relative h-[2px] cursor-pointer"
            style={{ background: track }}
            onClick={(e) => {
              const el = ref.current
              if (!el || !duration) return
              const rect = e.currentTarget.getBoundingClientRect()
              el.currentTime = ((e.clientX - rect.left) / rect.width) * duration
            }}
          >
            <div className="h-[2px]" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
            <div className="absolute top-[-4px] h-[10px] w-[10px] -translate-x-1/2 rounded-full" style={{ left: `${pct}%`, background: 'var(--accent)' }} />
          </div>
          <div className="story-tabular flex justify-between text-[15px]" style={{ color: sub }}>
            <span>{formatTime(time)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Play again from the start"
          onClick={() => {
            const el = ref.current
            if (!el) return
            el.currentTime = 0
            void play(el)
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ border: `1px solid ${track}`, color: fg }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 4.5v4.2h4.2" /></svg>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Voice block**

`src/components/story/blocks/AudioBlock.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { useInView } from 'framer-motion'
import type { AudioBlock as AudioBlockType } from '@/lib/story/types'
import { AudioPlayer } from '../AudioPlayer'

export function AudioBlock({ block, voiceLabel }: { block: AudioBlockType; voiceLabel: string }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { amount: 0.5 })

  return (
    <section ref={ref} className="flex min-h-[100svh] w-full items-center justify-center px-6 py-24 md:px-24" style={{ background: 'var(--paper)' }}>
      <div className="flex w-full max-w-[600px] flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="text-[13px] uppercase tracking-[0.2em] md:text-[14px]" style={{ color: 'var(--accent)' }}>
            In her own words
          </span>
          {block.heading && (
            <h3 className="story-serif m-0 text-[40px] font-medium leading-[1.05] md:text-[56px]" style={{ color: 'var(--ink)' }}>
              {block.heading}
            </h3>
          )}
        </div>
        <AudioPlayer audio={block.audio} label={voiceLabel} active={inView} />
        {block.audio.transcript && (
          <div className="flex flex-col gap-3 border-t pt-6" style={{ borderColor: 'var(--line)' }}>
            <span className="text-[12px] uppercase tracking-[0.14em] md:text-[13px]" style={{ color: 'var(--ink-3)' }}>
              Read along
            </span>
            <p className="story-serif m-0 whitespace-pre-line text-[20px] italic leading-[1.45] md:text-[25px]" style={{ color: 'var(--ink)' }}>
              {block.audio.transcript}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Slideshow block**

`src/components/story/blocks/SlideshowBlock.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import type { SlideshowBlock as SlideshowBlockType } from '@/lib/story/types'
import { slideIndexForTime, slideshowIntervalMs } from '@/lib/story/timing'
import { AudioPlayer } from '../AudioPlayer'

export function SlideshowBlock({ block, chapterLabel, voiceLabel }: { block: SlideshowBlockType; chapterLabel: string; voiceLabel: string }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const [active, setActive] = useState(0)
  const count = block.images.length
  const followsAudio = block.timing.mode === 'audio' && block.audio && block.audio.durationSec > 0

  useEffect(() => {
    if (followsAudio || !inView || count < 2) return
    const id = window.setInterval(() => setActive((a) => (a + 1) % count), slideshowIntervalMs(block))
    return () => window.clearInterval(id)
  }, [block, count, followsAudio, inView])

  if (count === 0) return null
  const caption = block.images[active]?.caption

  return (
    <section ref={ref} className="story-grain story-vignette relative h-[100svh] w-full overflow-hidden" style={{ background: '#1e1712' }}>
      {block.images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={img.url}
          alt={img.caption}
          className="story-photo absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.1) 0%, rgba(20,14,10,0) 40%, rgba(20,14,10,0.7) 100%)' }} />
      <div className="absolute left-6 top-8 z-10 text-[12px] uppercase tracking-[0.16em] md:left-10 md:text-[13px]" style={{ color: 'rgba(251,249,245,0.72)' }}>
        {chapterLabel}
      </div>
      <div className="absolute bottom-10 left-6 right-6 z-10 flex flex-col gap-6 md:bottom-18 md:left-24 md:right-24 md:flex-row md:items-end md:justify-between md:gap-15">
        {block.audio ? (
          <AudioPlayer
            audio={block.audio}
            label={voiceLabel}
            onDark
            active={inView}
            className="md:max-w-[460px]"
            onTime={followsAudio ? (t) => setActive(slideIndexForTime(t, block.audio!.durationSec, count)) : undefined}
          />
        ) : (
          <span />
        )}
        <div className="flex flex-col gap-4 md:max-w-[520px] md:items-end md:text-right">
          {caption && (
            <p className="story-serif m-0 text-[22px] italic leading-tight md:text-[26px]" style={{ color: 'var(--white)' }}>
              {caption}
            </p>
          )}
          <div className="flex items-center gap-2.5">
            {block.images.map((_, i) => (
              <span key={i} className="rounded-full" style={{ width: i === active ? 8 : 6, height: i === active ? 8 : 6, background: i === active ? 'var(--white)' : 'rgba(251,249,245,0.45)' }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Wire into Story.tsx**

The voice label is her first name from the opening: add to `Story.tsx`:

```tsx
import { AudioBlock } from './blocks/AudioBlock'
import { SlideshowBlock } from './blocks/SlideshowBlock'

export function voiceLabel(name: string): string {
  const first = name.trim().split(/\s+/)[0]
  return first ? `${first}, in her own voice` : 'In her own voice'
}
```

`renderBlock` gains a third parameter `voice: string` and the cases:

```tsx
    case 'audio':
      return <AudioBlock key={block.id} block={block} voiceLabel={voice} />
    case 'slideshow':
      return <SlideshowBlock key={block.id} block={block} chapterLabel={label} voiceLabel={voice} />
```

and the call site passes `voiceLabel(document.opening.name)`.

- [ ] **Step 5: Check in the browser and commit**

Run: `npm run typecheck`. Publish a test document with an `audio` block (any public mp3 URL and its duration) and a `slideshow` with `timing: {"mode":"audio"}` plus the same audio. Press Begin, scroll to the voice section: playback starts and fades out when scrolled past. The slideshow's photos advance in step with the recording; with `{"mode":"interval","seconds":3}` they advance every 3 seconds while in view. The corner toggle silences everything.

```bash
git add src/components/story
git commit -m "feat(story): audio player, voice block and slideshow block

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Video block and the preview page

**Files:**
- Create: `src/components/story/blocks/VideoBlock.tsx`, `src/app/story/preview/page.tsx`
- Modify: `src/components/story/Story.tsx`

**Interfaces:**
- Consumes: `useSound`, `embedUrl`, `StoryService.getDraft`, `AuthGuard`.
- Produces: `<VideoBlock block chapterLabel />`; `<Story document preview />` where `preview` adds the dark bar.

- [ ] **Step 1: Video block**

`src/components/story/blocks/VideoBlock.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import type { VideoBlock as VideoBlockType } from '@/lib/story/types'
import { embedUrl } from '@/lib/story/videoLinks'
import { useSound } from '../SoundProvider'
import { formatTime } from '../AudioPlayer'

function PlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Play the video"
      className="absolute left-1/2 top-1/2 z-10 flex h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full md:h-28 md:w-28"
      style={{ background: 'rgba(251,249,245,0.92)', color: 'var(--ink)', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.6)' }}
    >
      <svg width="52" height="52" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10-6.5z" /></svg>
    </button>
  )
}

export function VideoBlock({ block, chapterLabel }: { block: VideoBlockType; chapterLabel: string }) {
  const { register, play, stop, begun, muted } = useSound()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const [time, setTime] = useState(0)
  const source = block.source

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    return register(el)
  }, [register])

  const caption = (
    <div className="absolute bottom-10 left-6 right-6 z-10 flex flex-col gap-2 md:bottom-18 md:left-24 md:right-24 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-[720px] flex-col gap-2">
        {block.caption && (
          <p className="story-serif m-0 text-[22px] italic leading-tight md:text-[30px]" style={{ color: 'var(--white)' }}>
            {block.caption}
          </p>
        )}
        {source.type === 'upload' && source.durationSec > 0 && (
          <span className="story-tabular text-[14px] uppercase tracking-[0.1em] md:text-[15px]" style={{ color: 'rgba(251,249,245,0.72)' }}>
            {formatTime(time)} / {formatTime(source.durationSec)}
          </span>
        )}
      </div>
    </div>
  )

  if (source.type === 'link') {
    return (
      <section className="story-grain relative h-[100svh] w-full overflow-hidden" style={{ background: '#1e1712' }}>
        <div className="absolute left-6 top-8 z-10 text-[12px] uppercase tracking-[0.16em] md:left-10 md:text-[13px]" style={{ color: 'rgba(251,249,245,0.72)' }}>{chapterLabel}</div>
        {started ? (
          <iframe
            src={embedUrl(source, true)}
            title={block.caption || 'Video'}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, #3a2e26 0%, #1e1712 70%)' }} />
            <PlayButton onClick={() => setStarted(true)} />
            {caption}
          </>
        )}
      </section>
    )
  }

  return (
    <section className="story-grain story-vignette relative h-[100svh] w-full overflow-hidden" style={{ background: '#1e1712' }}>
      <video
        ref={videoRef}
        src={source.url}
        poster={source.poster?.url}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
        controls={started}
        muted={muted}
        className={`absolute inset-0 h-full w-full object-cover ${started ? '' : 'story-photo'}`}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onPause={() => setStarted(false)}
        onPlay={() => setStarted(true)}
      />
      {!started && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,10,0.15) 0%, rgba(20,14,10,0) 40%, rgba(20,14,10,0.68) 100%)' }} />}
      <div className="absolute left-6 top-8 z-10 text-[12px] uppercase tracking-[0.16em] md:left-10 md:text-[13px]" style={{ color: 'rgba(251,249,245,0.72)' }}>{chapterLabel}</div>
      {!started && (
        <PlayButton
          onClick={() => {
            const el = videoRef.current
            if (!el) return
            if (begun) void play(el)
            else void el.play().catch(() => {})
          }}
        />
      )}
      {!started && caption}
      {started && (
        <button type="button" className="sr-only" onClick={() => videoRef.current && stop(videoRef.current)}>
          Stop
        </button>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Wire into Story.tsx and add the preview bar**

In `Story.tsx`:

```tsx
import { VideoBlock } from './blocks/VideoBlock'
// renderBlock case:
    case 'video':
      return <VideoBlock key={block.id} block={block} chapterLabel={label} />
```

Change the `Story` export to accept `preview`:

```tsx
export function Story({ document, preview = false }: { document: StoryDocument; preview?: boolean }) {
  return (
    <SoundProvider>
      {preview && (
        <div className="sticky top-0 z-[60] flex h-[72px] items-center justify-between px-6 md:px-12" style={{ background: 'var(--ink)', color: 'var(--white)' }}>
          <span className="text-[18px] md:text-[20px]">This is exactly what visitors will see</span>
          <a href="/story/edit" className="se-btn se-btn-secondary se-btn-small" style={{ background: 'transparent', color: 'var(--white)', borderColor: 'var(--white)' }}>
            Back to editing
          </a>
        </div>
      )}
      <StoryBody document={document} />
    </SoundProvider>
  )
}
```

Because the preview bar is sticky and 72 px tall, `StoryChrome`'s progress bar stays at the very top (z-50 under the bar's z-60); that is acceptable.

- [ ] **Step 3: Preview page**

`src/app/story/preview/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Story } from '@/components/story/Story'
import { StoryService } from '@/services/story.service'
import type { StoryDocument } from '@/lib/story/types'

export default function StoryPreviewPage() {
  const [doc, setDoc] = useState<StoryDocument | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    StoryService.getDraft().then(setDoc).catch(() => setError('Could not load your story. Check your internet and try again.'))
  }, [])

  return (
    <AuthGuard redirectTo="/login">
      {error ? (
        <main className="flex min-h-[100svh] items-center justify-center px-6 text-[20px]" style={{ color: 'var(--ink)' }}>{error}</main>
      ) : doc ? (
        <Story document={doc} preview />
      ) : (
        <main className="flex min-h-[100svh] items-center justify-center text-[20px]" style={{ color: 'var(--ink-2)' }}>Loading your story…</main>
      )}
    </AuthGuard>
  )
}
```

- [ ] **Step 4: Check and commit**

Run: `npm run typecheck`. Publish a test document with a `video` link block (`{"type":"link","provider":"youtube","videoId":"dQw4w9WgXcQ","url":"https://youtu.be/dQw4w9WgXcQ"}`): the play button appears; tapping it loads the embed. Open `/story/preview` while logged in: the draft renders under the dark bar; logged out it redirects to `/login`.

```bash
git add src/components/story src/app/story/preview
git commit -m "feat(story): video block and draft preview page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Editor store with autosave and undo

**Files:**
- Create: `src/components/story-editor/store.ts`
- Test: `src/components/story-editor/store.test.ts`

**Interfaces:**
- Consumes: document helpers, `StoryDocument`.
- Produces: `createEditorStore(service, debounceMs)` and the shared `useEditorStore`; state `{ document, selectedChapterId, status, savedAt, undoStack, load(), apply(fn), undo(), canUndo(), retrySave(), selectChapter(id) }`.

- [ ] **Step 1: Write the failing test**

`src/components/story-editor/store.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEditorStore, type StoreService } from './store'
import { createEmptyDocument, addChapter } from '@/lib/story/document'

function fakeService(): StoreService & { saves: number; fail: boolean } {
  const svc = {
    saves: 0,
    fail: false,
    getDraft: vi.fn(async () => createEmptyDocument()),
    saveDraft: vi.fn(async () => {
      svc.saves += 1
      if (svc.fail) throw new Error('offline')
    }),
  }
  return svc
}

describe('editor store', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('loads the draft and selects the first chapter', async () => {
    const svc = fakeService()
    svc.getDraft.mockResolvedValueOnce(addChapter(createEmptyDocument(), 'One').doc)
    const store = createEditorStore(svc, 800)
    await store.getState().load()
    expect(store.getState().document?.chapters[0].title).toBe('One')
    expect(store.getState().selectedChapterId).toBe(store.getState().document?.chapters[0].id)
    expect(store.getState().status).toBe('saved')
  })

  it('coalesces rapid edits into one save after the debounce', async () => {
    const svc = fakeService()
    const store = createEditorStore(svc, 800)
    await store.getState().load()
    store.getState().apply((d) => addChapter(d, 'A').doc)
    store.getState().apply((d) => addChapter(d, 'B').doc)
    expect(store.getState().status).toBe('saving')
    expect(svc.saves).toBe(0)
    await vi.advanceTimersByTimeAsync(800)
    expect(svc.saves).toBe(1)
    expect(store.getState().status).toBe('saved')
    expect(store.getState().document?.chapters.map((c) => c.title)).toEqual(['A', 'B'])
  })

  it('undo restores the previous document and saves it', async () => {
    const svc = fakeService()
    const store = createEditorStore(svc, 800)
    await store.getState().load()
    store.getState().apply((d) => addChapter(d, 'A').doc)
    expect(store.getState().canUndo()).toBe(true)
    store.getState().undo()
    expect(store.getState().document?.chapters).toEqual([])
    expect(store.getState().canUndo()).toBe(false)
    await vi.advanceTimersByTimeAsync(800)
    expect(svc.saves).toBe(1)
  })

  it('keeps at most 50 undo steps', async () => {
    const svc = fakeService()
    const store = createEditorStore(svc, 800)
    await store.getState().load()
    for (let i = 0; i < 60; i++) store.getState().apply((d) => addChapter(d, String(i)).doc)
    expect(store.getState().undoStack).toHaveLength(50)
  })

  it('reports an error and retries', async () => {
    const svc = fakeService()
    const store = createEditorStore(svc, 800)
    await store.getState().load()
    svc.fail = true
    store.getState().apply((d) => addChapter(d, 'A').doc)
    await vi.advanceTimersByTimeAsync(800)
    expect(store.getState().status).toBe('error')
    svc.fail = false
    store.getState().retrySave()
    await vi.advanceTimersByTimeAsync(800)
    expect(store.getState().status).toBe('saved')
    expect(svc.saves).toBe(2)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/story-editor/store.test.ts`
Expected: FAIL, cannot resolve `./store`.

- [ ] **Step 3: Implement the store**

`src/components/story-editor/store.ts`:

```ts
import { createStore, useStore, type StoreApi } from 'zustand'
import { StoryService } from '@/services/story.service'
import type { StoryDocument } from '@/lib/story/types'

export type StoreService = {
  getDraft: () => Promise<StoryDocument>
  saveDraft: (doc: StoryDocument) => Promise<void>
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export type EditorState = {
  document: StoryDocument | null
  selectedChapterId: string | null
  status: SaveStatus
  savedAt: number | null
  undoStack: StoryDocument[]
  load: () => Promise<void>
  apply: (mutate: (doc: StoryDocument) => StoryDocument) => void
  undo: () => void
  canUndo: () => boolean
  retrySave: () => void
  selectChapter: (id: string | null) => void
}

const MAX_UNDO = 50

export function createEditorStore(service: StoreService, debounceMs: number): StoreApi<EditorState> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let inFlight: Promise<void> | null = null
  let dirty = false

  const store = createStore<EditorState>((set, get) => {
    const flush = async () => {
      timer = null
      if (inFlight) {
        dirty = true
        return
      }
      const doc = get().document
      if (!doc) return
      dirty = false
      inFlight = service
        .saveDraft(doc)
        .then(() => set({ status: 'saved', savedAt: Date.now() }))
        .catch(() => set({ status: 'error' }))
        .finally(() => {
          inFlight = null
          if (dirty) schedule()
        })
      await inFlight
    }

    const schedule = () => {
      set({ status: 'saving' })
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => void flush(), debounceMs)
    }

    return {
      document: null,
      selectedChapterId: null,
      status: 'idle',
      savedAt: null,
      undoStack: [],

      load: async () => {
        const doc = await service.getDraft()
        set({ document: doc, selectedChapterId: doc.chapters[0]?.id ?? null, status: 'saved', undoStack: [] })
      },

      apply: (mutate) => {
        const current = get().document
        if (!current) return
        const next = mutate(current)
        const undoStack = [...get().undoStack, current].slice(-MAX_UNDO)
        const selected = get().selectedChapterId
        const stillThere = next.chapters.some((c) => c.id === selected)
        set({ document: next, undoStack, selectedChapterId: stillThere ? selected : next.chapters[0]?.id ?? null })
        schedule()
      },

      undo: () => {
        const stack = get().undoStack
        if (stack.length === 0) return
        const previous = stack[stack.length - 1]
        set({ document: previous, undoStack: stack.slice(0, -1) })
        schedule()
      },

      canUndo: () => get().undoStack.length > 0,

      retrySave: () => schedule(),

      selectChapter: (id) => set({ selectedChapterId: id }),
    }
  })

  return store
}

export const editorStore = createEditorStore(StoryService, 800)

export function useEditorStore<T>(selector: (state: EditorState) => T): T {
  return useStore(editorStore, selector)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/story-editor/store.test.ts`
Expected: PASS, 5 tests. (If importing `StoryService` pulls Supabase into the test and it complains about env, add to `vitest.setup.ts`: `process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://localhost'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'anon'`.)

- [ ] **Step 5: Commit**

```bash
git add src/components/story-editor/store.ts src/components/story-editor/store.test.ts vitest.setup.ts
git commit -m "feat(story): editor store with debounced autosave and undo

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Editor shell — route, overview, block cards, add menu, remove confirmation, text and opening editors

**Files:**
- Create: `src/app/story/edit/layout.tsx`, `src/app/story/edit/page.tsx`
- Create: `src/components/story-editor/ui.tsx`, `EditorApp.tsx`, `screens.ts`, `TopBar.tsx`, `ChapterPills.tsx`, `StoryOverview.tsx`, `BlockCard.tsx`, `AddMenu.tsx`, `ConfirmRemove.tsx`, `TextEditor.tsx`, `OpeningEditor.tsx`, `NameChapter.tsx`

**Interfaces:**
- Consumes: `useEditorStore`, document helpers, `AuthGuard`, radix `AlertDialog` and `Dialog` from `src/components/ui`.
- Produces: `Screen` union in `screens.ts`; `EditorApp` owns `screen` state and passes `go(screen)`; every sub-screen gets `{ chapterId, insertIndex, blockId?, onDone(block), onCancel }` in later tasks. `BLOCK_KIND_LABEL`, `EButton`, `Field`.

- [ ] **Step 1: Route**

`src/app/story/edit/layout.tsx`:

```tsx
'use client'

import type { ReactNode } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function StoryEditLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard redirectTo="/login">
      <div className="min-h-[100svh]" style={{ background: 'var(--paper)' }}>{children}</div>
    </AuthGuard>
  )
}
```

`src/app/story/edit/page.tsx`:

```tsx
import { EditorApp } from '@/components/story-editor/EditorApp'

export const metadata = { title: 'My story' }

export default function StoryEditPage() {
  return <EditorApp />
}
```

- [ ] **Step 2: Shared editor controls**

`src/components/story-editor/ui.tsx`:

```tsx
'use client'

import type { ButtonHTMLAttributes, ReactNode, TextareaHTMLAttributes, InputHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'

export function EButton({
  variant = 'secondary',
  small = false,
  icon,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean; icon?: ReactNode }) {
  return (
    <button type="button" className={`se-btn se-btn-${variant} ${small ? 'se-btn-small' : ''} ${className}`} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex w-full flex-col gap-2.5">
      <span className="flex items-baseline gap-3">
        <span className="text-[20px] font-semibold" style={{ color: 'var(--ink)' }}>{label}</span>
        {hint && <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{hint}</span>}
      </span>
      {children}
    </label>
  )
}

export function TextInput({ big = false, className = '', ...rest }: InputHTMLAttributes<HTMLInputElement> & { big?: boolean }) {
  return <input className={`se-field ${big ? 'se-field-big story-serif' : ''} ${className}`} {...rest} />
}

export function TextArea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`se-field ${className}`} {...rest} />
}

export function PageTop({ title, backLabel = 'Back to my story', onBack, right }: { title: string; backLabel?: string; onBack: () => void; right?: ReactNode }) {
  return (
    <div className="flex h-24 items-center justify-between border-b px-6 md:px-12" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-[19px]" style={{ color: 'var(--ink)' }}>
        <Icon name="chevronLeft" />
        <span>{backLabel}</span>
      </button>
      <span className="story-serif text-[30px] font-medium" style={{ color: 'var(--ink)' }}>{title}</span>
      <div className="flex min-w-[120px] justify-end">{right}</div>
    </div>
  )
}

const PATHS: Record<string, string> = {
  chevronLeft: '<path d="M15 5l-7 7 7 7"/>',
  arrowRight: '<path d="M4 12h16"/><path d="M14 6l6 6-6 6"/>',
  up: '<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h9.5a6.5 6.5 0 0 1 0 13H10"/>',
  eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  send: '<path d="M4 12l16-7-5 16-3.5-6.5L4 12z"/>',
  text: '<path d="M5 6h14"/><path d="M12 6v13"/><path d="M8.5 19h7"/>',
  photo: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20 15.5l-4.5-4.5-7 7"/>',
  gallery: '<rect x="2.5" y="7" width="8" height="10" rx="1.5"/><rect x="13.5" y="7" width="8" height="10" rx="1.5"/>',
  slides: '<rect x="6.5" y="7.5" width="14" height="11" rx="1.5"/><path d="M3.5 15V6.5A1.5 1.5 0 0 1 5 5h11"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/><path d="M8.5 21h7"/>',
  upload: '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  trash: '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/>',
  pencil: '<path d="M4 20l4.5-1L19 8.5a2 2 0 0 0-3-3L5.5 16 4 20z"/>',
  grip: '<circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  play: '<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
}

export function Icon({ name, size = 22 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  )
}
```

- [ ] **Step 3: Screens and the app shell**

`src/components/story-editor/screens.ts`:

```ts
import type { BlockKind } from '@/lib/story/types'

export type Screen =
  | { kind: 'overview' }
  | { kind: 'opening' }
  | { kind: 'name-chapter'; chapterId?: string }
  | { kind: 'text'; chapterId: string; insertIndex: number; blockId?: string }
  | { kind: 'photos'; mode: 'photo' | 'gallery' | 'slideshow'; chapterId: string; insertIndex: number; blockId?: string }
  | { kind: 'record'; chapterId: string; insertIndex: number; blockId?: string }
  | { kind: 'video'; chapterId: string; insertIndex: number; blockId?: string }

export const BLOCK_KIND_LABEL: Record<BlockKind, string> = {
  text: 'Text',
  photo: 'Photo',
  gallery: 'Photo gallery',
  slideshow: 'Slideshow',
  audio: 'Voice recording',
  video: 'Video',
}

export function screenForKind(kind: BlockKind, chapterId: string, insertIndex: number, blockId?: string): Screen {
  switch (kind) {
    case 'text':
      return { kind: 'text', chapterId, insertIndex, blockId }
    case 'photo':
    case 'gallery':
    case 'slideshow':
      return { kind: 'photos', mode: kind, chapterId, insertIndex, blockId }
    case 'audio':
      return { kind: 'record', chapterId, insertIndex, blockId }
    case 'video':
      return { kind: 'video', chapterId, insertIndex, blockId }
  }
}
```

`src/components/story-editor/EditorApp.tsx` (Tasks 10 to 12 add the `photos`, `record` and `video` cases; until then those return `null`):

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useEditorStore } from './store'
import type { Screen } from './screens'
import { StoryOverview } from './StoryOverview'
import { TextEditor } from './TextEditor'
import { OpeningEditor } from './OpeningEditor'
import { NameChapter } from './NameChapter'

export function EditorApp() {
  const load = useEditorStore((s) => s.load)
  const document = useEditorStore((s) => s.document)
  const [screen, setScreen] = useState<Screen>({ kind: 'overview' })
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    load().catch(() => setLoadError(true))
  }, [load])

  if (loadError) {
    return <main className="flex min-h-[100svh] items-center justify-center px-6 text-[20px]">Could not load your story. Check your internet and reload the page.</main>
  }
  if (!document) {
    return <main className="flex min-h-[100svh] items-center justify-center text-[20px]" style={{ color: 'var(--ink-2)' }}>Loading your story…</main>
  }

  const back = () => setScreen({ kind: 'overview' })

  switch (screen.kind) {
    case 'overview':
      return <StoryOverview go={setScreen} />
    case 'opening':
      return <OpeningEditor onBack={back} />
    case 'name-chapter':
      return <NameChapter chapterId={screen.chapterId} onBack={back} />
    case 'text':
      return <TextEditor screen={screen} onBack={back} />
    default:
      return null
  }
}
```

- [ ] **Step 4: Top bar, chapter pills, overview**

`src/components/story-editor/TopBar.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useEditorStore } from './store'
import { EButton, Icon } from './ui'

function relative(savedAt: number | null, now: number): string {
  if (!savedAt) return 'Saved'
  const s = Math.round((now - savedAt) / 1000)
  if (s < 60) return 'Saved a moment ago'
  const m = Math.round(s / 60)
  return m === 1 ? 'Saved a minute ago' : `Saved ${m} minutes ago`
}

export function TopBar({ onPublish }: { onPublish: () => void }) {
  const status = useEditorStore((s) => s.status)
  const savedAt = useEditorStore((s) => s.savedAt)
  const undo = useEditorStore((s) => s.undo)
  const canUndo = useEditorStore((s) => s.undoStack.length > 0)
  const retry = useEditorStore((s) => s.retrySave)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4 md:h-24 md:px-12 md:py-0" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
      <div className="flex items-baseline gap-4">
        <span className="story-serif text-[34px] font-medium" style={{ color: 'var(--ink)' }}>My story</span>
        {status === 'error' ? (
          <span className="flex items-center gap-3 text-[18px]" style={{ color: 'var(--red)' }}>
            Could not save. Check your internet.
            <button type="button" onClick={retry} className="underline underline-offset-4">Try again</button>
          </span>
        ) : (
          <span className="flex items-center gap-2 text-[18px]" style={{ color: 'var(--ink-2)' }}>
            {status === 'saving' ? (
              <span>Saving…</span>
            ) : (
              <>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full" style={{ background: '#e3ebdd', color: '#3f6b3a' }}><Icon name="check" size={14} /></span>
                <span>{relative(savedAt, now)}</span>
              </>
            )}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <EButton onClick={undo} disabled={!canUndo} icon={<Icon name="undo" />}>Undo</EButton>
        <a href="/story/preview" className="se-btn se-btn-secondary"><Icon name="eye" /><span>Preview my story</span></a>
        <EButton variant="primary" onClick={onPublish} icon={<Icon name="send" />}>Publish</EButton>
      </div>
    </div>
  )
}
```

`src/components/story-editor/ChapterPills.tsx`:

```tsx
'use client'

import { useEditorStore } from './store'
import { Icon } from './ui'

export function ChapterPills({ onNewChapter }: { onNewChapter: () => void }) {
  const chapters = useEditorStore((s) => s.document?.chapters ?? [])
  const selected = useEditorStore((s) => s.selectedChapterId)
  const select = useEditorStore((s) => s.selectChapter)

  return (
    <div className="flex flex-wrap items-center gap-3 border-b px-6 py-5 md:px-12" style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}>
      <span className="mr-2 text-[18px] uppercase tracking-[0.1em]" style={{ color: 'var(--ink-2)' }}>Chapters</span>
      {chapters.map((c) => {
        const active = c.id === selected
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => select(c.id)}
            className="inline-flex h-[52px] items-center rounded-full px-5 text-[19px]"
            style={{
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--white)' : 'var(--ink)',
              background: active ? 'var(--ink)' : 'transparent',
              border: `2px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
            }}
          >
            {c.title || 'Untitled chapter'}
          </button>
        )
      })}
      <button type="button" onClick={onNewChapter} className="inline-flex h-[52px] items-center gap-2 rounded-full px-4 text-[19px]" style={{ color: 'var(--accent)', border: '2px dashed var(--accent)' }}>
        <Icon name="plus" size={18} />
        <span>New chapter</span>
      </button>
    </div>
  )
}
```

`src/components/story-editor/StoryOverview.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useEditorStore } from './store'
import { moveBlock, removeBlock, removeChapter, reorderBlocks, moveChapter } from '@/lib/story/document'
import type { Screen } from './screens'
import { screenForKind } from './screens'
import { TopBar } from './TopBar'
import { ChapterPills } from './ChapterPills'
import { BlockCard } from './BlockCard'
import { AddMenu } from './AddMenu'
import { ConfirmRemove } from './ConfirmRemove'
import { PublishDialog } from './PublishDialog'
import { EButton, Icon } from './ui'
import type { BlockKind } from '@/lib/story/types'

function AddBetween({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <div className="flex h-[72px] items-center gap-5">
      <div className="h-px flex-grow" style={{ background: 'var(--line)' }} />
      <button type="button" onClick={onClick} className="inline-flex h-14 items-center gap-2.5 rounded-full px-7 text-[20px] font-semibold" style={{ color: open ? 'var(--white)' : 'var(--accent)', background: open ? 'var(--accent)' : 'var(--white)', border: '2px solid var(--accent)' }}>
        <Icon name="plus" size={20} />
        <span>Add</span>
      </button>
      <div className="h-px flex-grow" style={{ background: 'var(--line)' }} />
    </div>
  )
}

export function StoryOverview({ go }: { go: (s: Screen) => void }) {
  const document = useEditorStore((s) => s.document)!
  const selectedId = useEditorStore((s) => s.selectedChapterId)
  const apply = useEditorStore((s) => s.apply)
  const chapter = document.chapters.find((c) => c.id === selectedId) ?? null
  const [addAt, setAddAt] = useState<number | null>(null)
  const [removing, setRemoving] = useState<{ kind: 'block'; id: string; label: string } | { kind: 'chapter' } | null>(null)
  const [publishing, setPublishing] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const onDragEnd = (e: DragEndEvent) => {
    if (!chapter || !e.over || e.active.id === e.over.id) return
    const ids = chapter.blocks.map((b) => b.id)
    const next = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)))
    apply((d) => reorderBlocks(d, chapter.id, next))
  }

  const chooseKind = (kind: BlockKind) => {
    if (!chapter || addAt === null) return
    setAddAt(null)
    go(screenForKind(kind, chapter.id, addAt))
  }

  return (
    <main className="min-h-[100svh]">
      <TopBar onPublish={() => setPublishing(true)} />
      <ChapterPills onNewChapter={() => go({ kind: 'name-chapter' })} />
      <div className="mx-auto flex w-full max-w-[880px] flex-col px-6 pb-16 pt-10 md:px-0">
        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
          <div className="flex flex-grow flex-col gap-1">
            <span className="text-[16px] uppercase tracking-[0.08em]" style={{ color: 'var(--ink-2)' }}>Opening screen</span>
            <span className="story-serif text-[28px]" style={{ color: 'var(--ink)' }}>{document.opening.name || 'Add your name and a title'}</span>
          </div>
          <EButton small icon={<Icon name="pencil" size={20} />} onClick={() => go({ kind: 'opening' })}>Change the opening</EButton>
        </div>

        {!chapter ? (
          <div className="flex flex-col items-center gap-6 rounded-[20px] border-2 border-dashed px-10 py-16 text-center" style={{ borderColor: 'var(--line)' }}>
            <p className="max-w-[520px] text-[22px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>Your story has no chapters yet. Start with the first one.</p>
            <EButton variant="primary" icon={<Icon name="plus" />} onClick={() => go({ kind: 'name-chapter' })}>Start a chapter</EButton>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
              <h2 className="story-serif m-0 text-[44px] font-medium" style={{ color: 'var(--ink)' }}>{chapter.title || 'Untitled chapter'}</h2>
              <div className="flex gap-2">
                <EButton variant="quiet" small icon={<Icon name="pencil" size={20} />} onClick={() => go({ kind: 'name-chapter', chapterId: chapter.id })}>Change the title</EButton>
                <EButton variant="quiet" small icon={<Icon name="up" size={20} />} onClick={() => apply((d) => moveChapter(d, chapter.id, -1))}>Earlier</EButton>
                <EButton variant="quiet" small icon={<Icon name="down" size={20} />} onClick={() => apply((d) => moveChapter(d, chapter.id, 1))}>Later</EButton>
              </div>
            </div>

            {chapter.blocks.length === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-6 rounded-[20px] border-2 border-dashed px-10 py-16 text-center" style={{ borderColor: 'var(--line)' }}>
                <p className="max-w-[520px] text-[22px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>This chapter is empty. Add the first thing — a few words, a photo, or your voice.</p>
                <button type="button" onClick={() => setAddAt(0)} className="inline-flex h-16 items-center gap-3 rounded-full px-9 text-[22px] font-semibold" style={{ background: 'var(--accent)', color: 'var(--white)' }}>
                  <Icon name="plus" size={24} />
                  <span>Add</span>
                </button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={chapter.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <AddBetween onClick={() => setAddAt(0)} open={addAt === 0} />
                  {chapter.blocks.map((block, i) => (
                    <div key={block.id} className="flex flex-col">
                      <BlockCard
                        block={block}
                        isFirst={i === 0}
                        isLast={i === chapter.blocks.length - 1}
                        onChange={() => go(screenForKind(block.kind, chapter.id, i, block.id))}
                        onRemove={(label) => setRemoving({ kind: 'block', id: block.id, label })}
                        onMove={(delta) => apply((d) => moveBlock(d, chapter.id, block.id, delta))}
                      />
                      <AddBetween onClick={() => setAddAt(i + 1)} open={addAt === i + 1} />
                    </div>
                  ))}
                </SortableContext>
              </DndContext>
            )}

            <div className="mt-10 flex justify-center">
              <EButton variant="quiet" icon={<Icon name="trash" size={20} />} onClick={() => setRemoving({ kind: 'chapter' })}>Remove this chapter</EButton>
            </div>
          </>
        )}
      </div>

      <AddMenu open={addAt !== null} onClose={() => setAddAt(null)} onChoose={chooseKind} />
      <ConfirmRemove
        open={removing !== null}
        title={removing?.kind === 'chapter' ? 'Remove this whole chapter?' : `Remove this ${removing?.kind === 'block' ? removing.label.toLowerCase() : ''}?`}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (!chapter || !removing) return
          if (removing.kind === 'chapter') apply((d) => removeChapter(d, chapter.id))
          else apply((d) => removeBlock(d, chapter.id, removing.id))
          setRemoving(null)
        }}
      />
      <PublishDialog open={publishing} onClose={() => setPublishing(false)} />
    </main>
  )
}
```

`PublishDialog` is written in Task 13; until then create a stub `src/components/story-editor/PublishDialog.tsx` exporting `export function PublishDialog(_: { open: boolean; onClose: () => void }) { return null }`.

- [ ] **Step 5: Block card, add menu, confirm**

`src/components/story-editor/BlockCard.tsx`:

```tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Block } from '@/lib/story/types'
import { BLOCK_KIND_LABEL } from './screens'
import { EButton, Icon } from './ui'
import { formatTime } from '@/components/story/AudioPlayer'

function Thumbs({ urls }: { urls: string[] }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {urls.slice(0, 6).map((u, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={u} alt="" className="story-photo h-[96px] w-[96px] rounded-md object-cover" />
      ))}
      {urls.length > 6 && <span className="self-center text-[18px]" style={{ color: 'var(--ink-2)' }}>and {urls.length - 6} more</span>}
    </div>
  )
}

function Preview({ block }: { block: Block }) {
  switch (block.kind) {
    case 'text':
      return (
        <p className="story-serif m-0 line-clamp-2 text-[24px] leading-[1.35]" style={{ color: 'var(--ink)' }}>
          {block.heading || block.body.slice(0, 160) || 'Nothing written yet'}
        </p>
      )
    case 'photo':
      return (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.image.thumbnailUrl} alt="" className="story-photo h-[130px] w-[200px] rounded-md object-cover" />
          {block.caption && <p className="story-serif m-0 text-[20px] italic" style={{ color: 'var(--ink-2)' }}>“{block.caption}”</p>}
        </div>
      )
    case 'gallery':
    case 'slideshow':
      return <Thumbs urls={block.images.map((i) => i.thumbnailUrl)} />
    case 'audio':
      return (
        <div className="flex items-center gap-4 text-[18px]" style={{ color: 'var(--ink-2)' }}>
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full" style={{ background: 'var(--ink)', color: 'var(--white)' }}><Icon name="play" /></span>
          <span>{block.heading || 'Your voice'} · {formatTime(block.audio.durationSec)}</span>
        </div>
      )
    case 'video':
      return (
        <div className="flex items-center gap-4">
          {block.source.type === 'upload' && block.source.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.source.poster.thumbnailUrl} alt="" className="story-photo h-[130px] w-[200px] rounded-md object-cover" />
          ) : (
            <span className="flex h-[130px] w-[200px] items-center justify-center rounded-md" style={{ background: 'var(--paper-2)', color: 'var(--ink-2)' }}><Icon name="video" size={40} /></span>
          )}
          <p className="story-serif m-0 text-[20px] italic" style={{ color: 'var(--ink-2)' }}>{block.caption || (block.source.type === 'link' ? `From ${block.source.provider === 'youtube' ? 'YouTube' : 'Vimeo'}` : 'Your video')}</p>
        </div>
      )
  }
}

function kindDetail(block: Block): string {
  if (block.kind === 'gallery') return 'Photo gallery · slides sideways'
  if (block.kind === 'slideshow') return block.timing.mode === 'audio' ? 'Slideshow · follows your voice' : `Slideshow · every ${block.timing.seconds} seconds`
  if (block.kind === 'audio') return `Voice recording · ${formatTime(block.audio.durationSec)}`
  return BLOCK_KIND_LABEL[block.kind]
}

const CHANGE_LABEL: Record<Block['kind'], string> = {
  text: 'Change the words',
  photo: 'Change the photo',
  gallery: 'Change the photos',
  slideshow: 'Change the photos',
  audio: 'Record again',
  video: 'Change the video',
}

const ICON: Record<Block['kind'], 'text' | 'photo' | 'gallery' | 'slides' | 'mic' | 'video'> = {
  text: 'text',
  photo: 'photo',
  gallery: 'gallery',
  slideshow: 'slides',
  audio: 'mic',
  video: 'video',
}

type Props = {
  block: Block
  isFirst: boolean
  isLast: boolean
  onChange: () => void
  onRemove: (label: string) => void
  onMove: (delta: -1 | 1) => void
}

export function BlockCard({ block, isFirst, isLast, onChange, onRemove, onMove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }

  return (
    <div ref={setNodeRef} style={{ ...style, borderColor: 'var(--line)', background: 'var(--white)' }} className="flex gap-5 rounded-2xl border p-6 md:gap-7 md:p-7">
      <button type="button" aria-label="Drag to move" className="hidden cursor-grab items-center md:flex" style={{ color: 'var(--ink-3)' }} {...attributes} {...listeners}>
        <Icon name="grip" />
      </button>
      <div className="flex min-w-0 flex-grow flex-col gap-4">
        <div className="flex items-center gap-2.5" style={{ color: 'var(--ink-2)' }}>
          <Icon name={ICON[block.kind]} size={20} />
          <span className="text-[18px] uppercase tracking-[0.08em]">{kindDetail(block)}</span>
        </div>
        <Preview block={block} />
        <div className="flex flex-wrap gap-3">
          <EButton small icon={<Icon name="pencil" size={20} />} onClick={onChange}>{CHANGE_LABEL[block.kind]}</EButton>
          <EButton small variant="quiet" icon={<Icon name="trash" size={20} />} onClick={() => onRemove(BLOCK_KIND_LABEL[block.kind])}>Remove</EButton>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-2">
        <button type="button" aria-label="Move up" disabled={isFirst} onClick={() => onMove(-1)} className="flex h-14 w-14 items-center justify-center rounded-[10px] disabled:opacity-40" style={{ border: '2px solid var(--line)', background: 'var(--white)', color: 'var(--ink)' }}><Icon name="up" size={26} /></button>
        <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>Move</span>
        <button type="button" aria-label="Move down" disabled={isLast} onClick={() => onMove(1)} className="flex h-14 w-14 items-center justify-center rounded-[10px] disabled:opacity-40" style={{ border: '2px solid var(--line)', background: 'var(--white)', color: 'var(--ink)' }}><Icon name="down" size={26} /></button>
      </div>
    </div>
  )
}
```

`src/components/story-editor/AddMenu.tsx`:

```tsx
'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { BlockKind } from '@/lib/story/types'
import { EButton, Icon } from './ui'

const CHOICES: { kind: BlockKind; icon: 'text' | 'photo' | 'gallery' | 'slides' | 'video' | 'mic'; name: string; desc: string }[] = [
  { kind: 'text', icon: 'text', name: 'Text', desc: 'A heading and a few paragraphs' },
  { kind: 'photo', icon: 'photo', name: 'Photo', desc: 'One big photo, with a caption if you like' },
  { kind: 'gallery', icon: 'gallery', name: 'Photo gallery', desc: 'Several photos, side by side' },
  { kind: 'slideshow', icon: 'slides', name: 'Slideshow', desc: 'Photos that fade one into another' },
  { kind: 'video', icon: 'video', name: 'Video', desc: 'A film clip from your phone or computer, or a link to one online' },
  { kind: 'audio', icon: 'mic', name: 'Voice recording', desc: 'Tell this part of the story in your own voice' },
]

export function AddMenu({ open, onClose, onChoose }: { open: boolean; onClose: () => void; onChoose: (kind: BlockKind) => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="story-theme max-w-[640px] rounded-[22px] border-0 p-8" style={{ background: 'var(--paper)' }}>
        <DialogTitle className="story-serif text-[34px] font-medium md:text-[38px]" style={{ color: 'var(--ink)' }}>
          What would you like to add?
        </DialogTitle>
        <div className="flex flex-col gap-3">
          {CHOICES.map((c) => (
            <button
              key={c.kind}
              type="button"
              onClick={() => onChoose(c.kind)}
              className="flex min-h-[92px] items-center gap-5 rounded-[14px] px-6 text-left transition-colors hover:bg-[var(--accent-soft)]"
              style={{ border: '2px solid var(--line)', background: 'var(--white)' }}
            >
              <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent-2)' }}><Icon name={c.icon} size={26} /></span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[23px] font-semibold" style={{ color: 'var(--ink)' }}>{c.name}</span>
                <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{c.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <EButton variant="quiet" onClick={onClose}>Never mind</EButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

`src/components/story-editor/ConfirmRemove.tsx`:

```tsx
'use client'

import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog'
import { EButton, Icon } from './ui'

export function ConfirmRemove({ open, title, onCancel, onConfirm }: { open: boolean; title: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className="story-theme max-w-[560px] rounded-[22px] border-0 p-9" style={{ background: 'var(--paper)' }}>
        <AlertDialogTitle className="story-serif text-[36px] font-medium leading-tight" style={{ color: 'var(--ink)' }}>{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-[19px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
          It will disappear from your story. If you change your mind, press Undo straight afterwards.
        </AlertDialogDescription>
        <div className="flex justify-end gap-3.5 pt-2">
          <EButton onClick={onCancel}>Keep it</EButton>
          <EButton variant="danger" icon={<Icon name="trash" />} onClick={onConfirm}>Yes, remove it</EButton>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 6: Text editor, chapter naming, opening editor**

`src/components/story-editor/TextEditor.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useEditorStore } from './store'
import { findBlock, insertBlock, newId, updateBlock } from '@/lib/story/document'
import type { Screen } from './screens'
import { EButton, Field, Icon, PageTop, TextArea, TextInput } from './ui'
import type { TextBlock } from '@/lib/story/types'

export function TextEditor({ screen, onBack }: { screen: Extract<Screen, { kind: 'text' }>; onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  const existing = screen.blockId ? (findBlock(document, screen.blockId)?.block as TextBlock | undefined) : undefined
  const [heading, setHeading] = useState(existing?.heading ?? '')
  const [body, setBody] = useState(existing?.body ?? '')

  const done = () => {
    const block: TextBlock = { id: existing?.id ?? newId(), kind: 'text', heading: heading.trim(), body: body.trim() }
    if (existing) apply((d) => updateBlock(d, screen.chapterId, existing.id, block))
    else apply((d) => insertBlock(d, screen.chapterId, screen.insertIndex, block))
    onBack()
  }

  return (
    <main className="min-h-[100svh]">
      <PageTop title="Text" onBack={onBack} right={<EButton variant="primary" icon={<Icon name="check" />} onClick={done} disabled={!heading.trim() && !body.trim()}>Done</EButton>} />
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8 px-6 py-11 md:px-0">
        <Field label="Heading">
          <TextInput big value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="For example: How it all began" />
        </Field>
        <Field label="Your words" hint="Leave an empty line between paragraphs">
          <TextArea value={body} onChange={(e) => setBody(e.target.value)} rows={12} placeholder="Write here…" />
        </Field>
        <p className="text-[18px]" style={{ color: 'var(--ink-2)' }}>Press <strong>Done</strong> when you are finished. It is saved to your story straight away.</p>
      </div>
    </main>
  )
}
```

`src/components/story-editor/NameChapter.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useEditorStore } from './store'
import { addChapter, renameChapter } from '@/lib/story/document'
import { EButton, Field, Icon, PageTop, TextInput } from './ui'

export function NameChapter({ chapterId, onBack }: { chapterId?: string; onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  const select = useEditorStore((s) => s.selectChapter)
  const existing = chapterId ? document.chapters.find((c) => c.id === chapterId) : undefined
  const [title, setTitle] = useState(existing?.title ?? '')

  const done = () => {
    const t = title.trim()
    if (!t) return
    if (existing) apply((d) => renameChapter(d, existing.id, t))
    else {
      let newId = ''
      apply((d) => {
        const r = addChapter(d, t)
        newId = r.chapterId
        return r.doc
      })
      select(newId)
    }
    onBack()
  }

  return (
    <main className="min-h-[100svh]">
      <PageTop title={existing ? 'Chapter title' : 'New chapter'} onBack={onBack} />
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-9 px-6 py-16 text-center md:px-0">
        <div className="flex flex-col gap-2.5">
          <h2 className="story-serif m-0 text-[46px] font-medium" style={{ color: 'var(--ink)' }}>{existing ? 'Change the title' : 'Let’s start a new chapter'}</h2>
          <p className="text-[20px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>Give this part of your story a name. You can always change it later.</p>
        </div>
        <Field label="What is this part of your story called?">
          <TextInput big autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && done()} placeholder="For example: Childhood" />
        </Field>
        <div className="flex gap-3.5">
          <EButton variant="quiet" onClick={onBack}>Not now</EButton>
          <EButton variant="primary" icon={<Icon name="arrowRight" />} onClick={done} disabled={!title.trim()}>{existing ? 'Save the title' : 'Start this chapter'}</EButton>
        </div>
      </div>
    </main>
  )
}
```

`src/components/story-editor/OpeningEditor.tsx` (uses `PhotoPicker` from Task 10 for the portrait and cover; write it with the single-file `PickOnePhoto` helper defined there):

```tsx
'use client'

import { useState } from 'react'
import { useEditorStore } from './store'
import { EButton, Field, Icon, PageTop, TextInput } from './ui'
import { PickOnePhoto } from './PhotoPicker'
import type { ImageRef } from '@/lib/story/types'

export function OpeningEditor({ onBack }: { onBack: () => void }) {
  const opening = useEditorStore((s) => s.document!.opening)
  const apply = useEditorStore((s) => s.apply)
  const [name, setName] = useState(opening.name)
  const [title, setTitle] = useState(opening.title)
  const [portrait, setPortrait] = useState<ImageRef | null>(opening.portrait)
  const [cover, setCover] = useState<ImageRef | null>(opening.cover)

  const done = () => {
    apply((d) => ({ ...d, opening: { name: name.trim(), title: title.trim(), portrait, cover } }))
    onBack()
  }

  return (
    <main className="min-h-[100svh]">
      <PageTop title="Opening screen" onBack={onBack} right={<EButton variant="primary" icon={<Icon name="check" />} onClick={done} disabled={!name.trim()}>Done</EButton>} />
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8 px-6 py-11 md:px-0">
        <Field label="Your name" hint="Shown large on the first screen">
          <TextInput big value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="A title for your story" hint="One line, for example: A life in colour">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <div className="grid gap-8 md:grid-cols-2">
          <PickOnePhoto label="Your portrait" hint="A photo of you, shown in a circle" value={portrait} onChange={setPortrait} round />
          <PickOnePhoto label="Background photo" hint="Sits softly behind your name" value={cover} onChange={setCover} />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 7: Check and commit**

Run: `npm run typecheck` (OpeningEditor will fail until Task 10 adds `PickOnePhoto`; commit this task together with Task 10 if you prefer, or temporarily export a stub `PickOnePhoto` that renders nothing). Log in, open `/story/edit`: name a chapter, add a text item, edit it, move it, remove it with the confirmation, undo. The saved indicator cycles "Saving…" then "Saved a moment ago". Reload: the changes are there.

```bash
git add src/app/story/edit src/components/story-editor
git commit -m "feat(story): editor shell with chapter list, text editing, add menu and remove confirmation

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Photo picker and the "how should these photos appear" chooser

**Files:**
- Create: `src/components/story-editor/PhotoPicker.tsx`, `src/components/story-editor/PhotoStyleChooser.tsx`, `src/components/story-editor/PhotosFlow.tsx`
- Modify: `src/components/story-editor/EditorApp.tsx` (add the `photos` case)

**Interfaces:**
- Consumes: `StoryService.uploadPhotos`, `speedToSeconds`, `secondsToSpeed`, document helpers, `Recorder` (Task 11; until then the "Match my voice recording" option shows only the upload button).
- Produces: `<PhotoPicker multiple value onChange />`, `<PickOnePhoto label hint value onChange round? />`, `<PhotoStyleChooser ... />`, `<PhotosFlow screen onBack />`.

- [ ] **Step 1: Photo picker**

`src/components/story-editor/PhotoPicker.tsx`:

```tsx
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { StoryService } from '@/services/story.service'
import type { CaptionedImage, ImageRef } from '@/lib/story/types'
import { EButton, Field, Icon, TextInput } from './ui'

const ACCEPT = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }

type Props = {
  value: CaptionedImage[]
  onChange: (images: CaptionedImage[]) => void
  multiple: boolean
  withCaptions?: boolean
}

export function PhotoPicker({ value, onChange, multiple, withCaptions = true }: Props) {
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      setError(null)
      setProgress(0)
      try {
        const refs = await StoryService.uploadPhotos(multiple ? files : files.slice(0, 1), setProgress)
        const added = refs.map((r) => ({ ...r, caption: '' }))
        onChange(multiple ? [...value, ...added] : added)
      } catch {
        setError('These photos could not be uploaded. Check your internet and try again.')
      } finally {
        setProgress(null)
      }
    },
    [multiple, onChange, value]
  )

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({ onDrop, accept: ACCEPT, multiple, noClick: true })

  return (
    <div className="flex w-full flex-col gap-7">
      <div
        {...getRootProps()}
        className="flex flex-col items-center gap-4 rounded-[20px] px-6 py-10 text-center md:px-10 md:py-12"
        style={{ border: '3px dashed var(--accent)', background: isDragActive ? 'var(--accent)' : 'var(--accent-soft)', color: isDragActive ? 'var(--white)' : 'var(--ink)' }}
      >
        <input {...getInputProps()} />
        <span style={{ color: isDragActive ? 'var(--white)' : 'var(--accent-2)' }}><Icon name="upload" size={48} /></span>
        <span className="story-serif text-[30px] font-medium md:text-[34px]">{multiple ? 'Drag your photos here' : 'Drag a photo here'}</span>
        <span className="text-[18px]" style={{ color: isDragActive ? 'var(--white)' : 'var(--ink-2)' }}>or</span>
        <EButton icon={<Icon name="photo" />} onClick={open} disabled={progress !== null}>
          {multiple ? 'Choose photos from my computer' : 'Choose a photo from my computer'}
        </EButton>
        {multiple && <span className="text-[18px]" style={{ color: isDragActive ? 'var(--white)' : 'var(--ink-2)' }}>You can pick several at once.</span>}
      </div>

      {progress !== null && (
        <div className="flex flex-col gap-2">
          <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>Uploading… {progress}%</span>
          <div className="h-2 w-full rounded-full" style={{ background: 'var(--line)' }}><div className="h-2 rounded-full" style={{ width: `${progress}%`, background: 'var(--accent)' }} /></div>
        </div>
      )}
      {error && <p className="text-[18px]" style={{ color: 'var(--red)' }}>{error}</p>}

      {value.length > 0 && (
        <div className="flex flex-col gap-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[20px] font-semibold" style={{ color: 'var(--ink)' }}>{multiple ? 'Chosen so far' : 'Your photo'}</span>
            {multiple && <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{value.length} {value.length === 1 ? 'photo' : 'photos'}</span>}
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {value.map((img, i) => (
              <li key={img.url} className="flex flex-wrap items-center gap-4 rounded-xl border p-3" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.thumbnailUrl} alt="" className="story-photo h-[96px] w-[96px] rounded-md object-cover" />
                {withCaptions && (
                  <div className="min-w-[240px] flex-grow">
                    <TextInput placeholder="A few words about this photo (optional)" value={img.caption} onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, caption: e.target.value } : v)))} style={{ fontSize: 19, padding: '12px 16px' }} />
                  </div>
                )}
                {multiple && (
                  <div className="flex gap-1">
                    <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => onChange(swap(value, i, i - 1))} className="flex h-12 w-12 items-center justify-center rounded-[10px] disabled:opacity-40" style={{ border: '2px solid var(--line)' }}><Icon name="up" /></button>
                    <button type="button" aria-label="Move later" disabled={i === value.length - 1} onClick={() => onChange(swap(value, i, i + 1))} className="flex h-12 w-12 items-center justify-center rounded-[10px] disabled:opacity-40" style={{ border: '2px solid var(--line)' }}><Icon name="down" /></button>
                  </div>
                )}
                <EButton small variant="quiet" icon={<Icon name="trash" size={18} />} onClick={() => onChange(value.filter((_, j) => j !== i))}>Remove</EButton>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function swap<T>(items: T[], a: number, b: number): T[] {
  const next = items.slice()
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}

export function PickOnePhoto({ label, hint, value, onChange, round = false }: { label: string; hint?: string; value: ImageRef | null; onChange: (v: ImageRef | null) => void; round?: boolean }) {
  return (
    <Field label={label} hint={hint}>
      {value ? (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.thumbnailUrl} alt="" className={`story-photo h-[120px] w-[120px] object-cover ${round ? 'rounded-full' : 'rounded-md'}`} />
          <EButton small variant="quiet" icon={<Icon name="trash" size={18} />} onClick={() => onChange(null)}>Remove</EButton>
        </div>
      ) : (
        <PhotoPicker multiple={false} withCaptions={false} value={[]} onChange={(imgs) => onChange(imgs[0] ? { url: imgs[0].url, thumbnailUrl: imgs[0].thumbnailUrl, width: imgs[0].width, height: imgs[0].height } : null)} />
      )}
    </Field>
  )
}
```

- [ ] **Step 2: Style chooser**

`src/components/story-editor/PhotoStyleChooser.tsx`:

```tsx
'use client'

import type { ReactNode } from 'react'
import { Icon } from './ui'
import { secondsToSpeed, speedToSeconds, type Speed } from '@/lib/story/timing'
import type { AudioRef, CaptionedImage, SlideshowTiming } from '@/lib/story/types'

export type PhotoStyle = 'gallery' | 'slideshow'

function ChoiceCard({ selected, onClick, title, desc, illo }: { selected: boolean; onClick: () => void; title: string; desc: string; illo: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="relative flex w-full flex-col gap-4 rounded-[18px] p-7 text-left" style={{ border: `${selected ? 3 : 2}px solid ${selected ? 'var(--accent)' : 'var(--line)'}`, background: selected ? 'var(--accent-soft)' : 'var(--white)' }}>
      {selected && <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'var(--accent)', color: 'var(--white)' }}><Icon name="check" size={18} /></span>}
      <div className="h-[88px] overflow-hidden">{illo}</div>
      <span className="text-[23px] font-semibold" style={{ color: 'var(--ink)' }}>{title}</span>
      <span className="text-[18px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{desc}</span>
    </button>
  )
}

function OptionRow({ selected, onClick, title, desc, children }: { selected: boolean; onClick: () => void; title: string; desc?: string; children?: ReactNode }) {
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()} className="flex flex-wrap items-center gap-5 rounded-[14px] px-6 py-5" style={{ border: `${selected ? 3 : 2}px solid ${selected ? 'var(--accent)' : 'var(--line)'}`, background: selected ? 'var(--accent-soft)' : 'var(--white)', cursor: 'pointer' }}>
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full" style={{ border: `2.5px solid ${selected ? 'var(--accent)' : 'var(--ink-3)'}`, background: selected ? 'var(--accent)' : 'transparent', color: 'var(--white)' }}>{selected && <Icon name="check" size={16} />}</span>
      <span className="flex min-w-[200px] flex-grow flex-col gap-1">
        <span className="text-[21px] font-semibold" style={{ color: 'var(--ink)' }}>{title}</span>
        {desc && <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{desc}</span>}
      </span>
      {children}
    </div>
  )
}

type Props = {
  images: CaptionedImage[]
  style: PhotoStyle
  onStyle: (s: PhotoStyle) => void
  timing: SlideshowTiming
  onTiming: (t: SlideshowTiming) => void
  audio: AudioRef | null
  voiceControl: ReactNode
}

export function PhotoStyleChooser({ images, style, onStyle, timing, onTiming, audio, voiceControl }: Props) {
  const speed: Speed = timing.mode === 'interval' ? secondsToSpeed(timing.seconds) : 'medium'
  const thumbs = images.slice(0, 4)
  return (
    <div className="flex w-full flex-col gap-8">
      <h2 className="story-serif m-0 text-center text-[36px] font-medium md:text-[40px]" style={{ color: 'var(--ink)' }}>How should these photos appear?</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <ChoiceCard
          selected={style === 'gallery'}
          onClick={() => onStyle('gallery')}
          title="Slide sideways as people scroll"
          desc="The photos line up in a row and glide past as the reader scrolls down."
          illo={<div className="flex gap-2.5">{thumbs.map((t) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={t.url} src={t.thumbnailUrl} alt="" className="story-photo h-20 w-[120px] shrink-0 rounded-md object-cover" />
          ))}</div>}
        />
        <ChoiceCard
          selected={style === 'slideshow'}
          onClick={() => onStyle('slideshow')}
          title="Fade one into another"
          desc="The photos stay in one place and gently change, like a slideshow."
          illo={<div className="relative h-[88px]">{thumbs.slice(0, 2).map((t, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={t.url} src={t.thumbnailUrl} alt="" className="story-photo absolute top-0 h-20 w-[200px] rounded-md object-cover" style={{ left: 60 + i * 20, top: i * 6, opacity: i === 0 ? 0.35 : 1 }} />
          ))}</div>}
        />
      </div>

      {style === 'slideshow' && (
        <div className="flex flex-col gap-3.5">
          <span className="text-[20px] font-semibold" style={{ color: 'var(--ink)' }}>How quickly should they change?</span>
          <OptionRow
            selected={timing.mode === 'audio'}
            onClick={() => onTiming({ mode: 'audio' })}
            title="Match my voice recording"
            desc={audio ? `The photos will spread evenly across your ${Math.round(audio.durationSec)} second recording` : 'Record or add your voice and the photos will follow it'}
          >
            {timing.mode === 'audio' && <div className="w-full pt-2">{voiceControl}</div>}
          </OptionRow>
          <OptionRow selected={timing.mode === 'interval'} onClick={() => onTiming({ mode: 'interval', seconds: speedToSeconds(speed) })} title="Choose a speed">
            <div className="flex w-[300px] shrink-0 flex-col gap-2.5">
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={['slow', 'medium', 'fast'].indexOf(speed)}
                onChange={(e) => onTiming({ mode: 'interval', seconds: speedToSeconds((['slow', 'medium', 'fast'] as Speed[])[Number(e.target.value)]) })}
                aria-label="Speed"
                className="h-2 w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[18px]" style={{ color: 'var(--ink-2)' }}><span>Slow</span><span>Medium</span><span>Fast</span></div>
            </div>
          </OptionRow>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: The photos flow (photo, gallery, slideshow)**

`src/components/story-editor/PhotosFlow.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useEditorStore } from './store'
import { findBlock, insertBlock, newId, updateBlock } from '@/lib/story/document'
import type { Screen } from './screens'
import { EButton, Field, Icon, PageTop, TextInput } from './ui'
import { PhotoPicker } from './PhotoPicker'
import { PhotoStyleChooser, type PhotoStyle } from './PhotoStyleChooser'
import { VoiceForSlideshow } from './VoiceForSlideshow'
import type { AudioRef, Block, CaptionedImage, SlideshowTiming } from '@/lib/story/types'

type Step = 'pick' | 'style'

export function PhotosFlow({ screen, onBack }: { screen: Extract<Screen, { kind: 'photos' }>; onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  const existing = screen.blockId ? findBlock(document, screen.blockId)?.block : undefined
  const single = screen.mode === 'photo'

  const initialImages: CaptionedImage[] =
    existing?.kind === 'photo' ? [{ ...existing.image, caption: existing.caption }] : existing?.kind === 'gallery' || existing?.kind === 'slideshow' ? existing.images : []
  const [images, setImages] = useState<CaptionedImage[]>(initialImages)
  const [step, setStep] = useState<Step>('pick')
  const [style, setStyle] = useState<PhotoStyle>(existing?.kind === 'slideshow' ? 'slideshow' : screen.mode === 'slideshow' ? 'slideshow' : 'gallery')
  const [timing, setTiming] = useState<SlideshowTiming>(existing?.kind === 'slideshow' ? existing.timing : { mode: 'interval', seconds: 5 })
  const [audio, setAudio] = useState<AudioRef | null>(existing?.kind === 'slideshow' ? existing.audio : null)

  const save = () => {
    let block: Block
    if (single) {
      const img = images[0]
      block = { id: existing?.id ?? newId(), kind: 'photo', image: { url: img.url, thumbnailUrl: img.thumbnailUrl, width: img.width, height: img.height }, caption: img.caption }
    } else if (style === 'gallery') {
      block = { id: existing?.id ?? newId(), kind: 'gallery', images }
    } else {
      block = { id: existing?.id ?? newId(), kind: 'slideshow', images, timing, audio }
    }
    if (existing) apply((d) => updateBlock(d, screen.chapterId, existing.id, block))
    else apply((d) => insertBlock(d, screen.chapterId, screen.insertIndex, block))
    onBack()
  }

  const title = single ? 'Add a photo' : 'Add photos'

  if (step === 'style') {
    return (
      <main className="min-h-[100svh]">
        <PageTop title={title} backLabel="Back to the photos" onBack={() => setStep('pick')} />
        <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8 px-6 py-10 md:px-0">
          <PhotoStyleChooser
            images={images}
            style={style}
            onStyle={setStyle}
            timing={timing}
            onTiming={setTiming}
            audio={audio}
            voiceControl={<VoiceForSlideshow audio={audio} onChange={setAudio} />}
          />
          <div className="flex justify-center gap-4">
            <EButton icon={<Icon name="chevronLeft" />} onClick={() => setStep('pick')}>Back</EButton>
            <EButton variant="primary" icon={<Icon name="check" />} onClick={save}>Add these photos to my story</EButton>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[100svh]">
      <PageTop title={title} onBack={onBack} />
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8 px-6 py-10 md:px-0">
        <PhotoPicker multiple={!single} value={images} onChange={setImages} />
        {single && images[0] && (
          <Field label="A few words about it" hint="Optional">
            <TextInput value={images[0].caption} onChange={(e) => setImages([{ ...images[0], caption: e.target.value }])} />
          </Field>
        )}
        <div className="flex justify-center gap-4">
          <EButton icon={<Icon name="chevronLeft" />} onClick={onBack}>Back</EButton>
          {single ? (
            <EButton variant="primary" icon={<Icon name="check" />} disabled={images.length === 0} onClick={save}>Add this photo to my story</EButton>
          ) : (
            <EButton variant="primary" icon={<Icon name="arrowRight" />} disabled={images.length === 0} onClick={() => setStep('style')}>Next: how should they appear?</EButton>
          )}
        </div>
      </div>
    </main>
  )
}
```

`VoiceForSlideshow` is written in Task 11. Until then create `src/components/story-editor/VoiceForSlideshow.tsx` with:

```tsx
'use client'
import type { AudioRef } from '@/lib/story/types'
export function VoiceForSlideshow(_: { audio: AudioRef | null; onChange: (a: AudioRef | null) => void }) {
  return null
}
```

- [ ] **Step 4: Wire the screen**

In `EditorApp.tsx`: `import { PhotosFlow } from './PhotosFlow'` and add `case 'photos': return <PhotosFlow screen={screen} onBack={back} />`.

- [ ] **Step 5: Check and commit**

Run: `npm run typecheck`. In `/story/edit`: Add → Photo: drop a JPEG, write a caption, add it; the card shows the thumbnail. Add → Photo gallery: choose three photos, reorder one, Next, keep "Slide sideways", add. Add → Slideshow: choose photos, pick "Fade", move the speed slider, add. Open `/story/preview`: all three render. Change the opening's portrait and background photo.

```bash
git add src/components/story-editor
git commit -m "feat(story): photo picker, display style chooser and photo flows

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Voice recorder, MP3 encoding, voice flow and the slideshow voice control

**Files:**
- Create: `src/components/story-editor/recorder/mp3.worker.ts`, `src/components/story-editor/recorder/encodeMp3.ts`, `src/components/story-editor/recorder/useRecorder.ts`, `src/components/story-editor/Recorder.tsx`, `src/components/story-editor/RecordFlow.tsx`
- Modify: `src/components/story-editor/VoiceForSlideshow.tsx` (replace the stub), `EditorApp.tsx` (add the `record` case)

**Interfaces:**
- Consumes: `StoryService.uploadAudio`, `readAudioDuration`, `formatTime`.
- Produces: `useRecorder()` → `{ state, seconds, levels, result, start, stop, reset, error }`; `encodeMp3(blob): Promise<{ mp3: Blob; durationSec: number }>`; `<Recorder onKeep(audio: AudioRef) onCancel />`; `<RecordFlow screen onBack />`; `<VoiceForSlideshow audio onChange />`.

- [ ] **Step 1: MP3 worker and the encode helper**

`src/components/story-editor/recorder/mp3.worker.ts`:

```ts
import * as lamejs from '@breezystack/lamejs'

type Input = { channels: Float32Array[]; sampleRate: number }

function toInt16(f: Float32Array): Int16Array {
  const out = new Int16Array(f.length)
  for (let i = 0; i < f.length; i++) {
    const s = Math.max(-1, Math.min(1, f[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

self.onmessage = (e: MessageEvent<Input>) => {
  const { channels, sampleRate } = e.data
  const stereo = channels.length > 1
  const encoder = new lamejs.Mp3Encoder(stereo ? 2 : 1, sampleRate, 128)
  const left = toInt16(channels[0])
  const right = stereo ? toInt16(channels[1]) : undefined
  const parts: Uint8Array[] = []
  const block = 1152
  for (let i = 0; i < left.length; i += block) {
    const chunk = right ? encoder.encodeBuffer(left.subarray(i, i + block), right.subarray(i, i + block)) : encoder.encodeBuffer(left.subarray(i, i + block))
    if (chunk.length) parts.push(new Uint8Array(chunk))
  }
  const tail = encoder.flush()
  if (tail.length) parts.push(new Uint8Array(tail))
  self.postMessage(new Blob(parts, { type: 'audio/mpeg' }))
}
```

`src/components/story-editor/recorder/encodeMp3.ts`:

```ts
export async function encodeMp3(recording: Blob): Promise<{ mp3: Blob; durationSec: number }> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new Ctx()
  try {
    const buffer = await ctx.decodeAudioData(await recording.arrayBuffer())
    const channels: Float32Array[] = []
    for (let c = 0; c < Math.min(2, buffer.numberOfChannels); c++) channels.push(buffer.getChannelData(c))
    const worker = new Worker(new URL('./mp3.worker.ts', import.meta.url))
    const mp3 = await new Promise<Blob>((resolve, reject) => {
      worker.onmessage = (e: MessageEvent<Blob>) => resolve(e.data)
      worker.onerror = () => reject(new Error('Could not prepare the recording'))
      worker.postMessage({ channels, sampleRate: buffer.sampleRate })
    })
    worker.terminate()
    return { mp3, durationSec: buffer.duration }
  } finally {
    void ctx.close()
  }
}
```

- [ ] **Step 2: The recorder hook**

`src/components/story-editor/recorder/useRecorder.ts`:

```ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { encodeMp3 } from './encodeMp3'

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'processing' | 'done' | 'unsupported' | 'denied' | 'error'

export type RecorderResult = { mp3: Blob; durationSec: number; url: string }

const BARS = 48

export function useRecorder() {
  const [state, setState] = useState<RecorderState>('idle')
  const [seconds, setSeconds] = useState(0)
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0))
  const [result, setResult] = useState<RecorderResult | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<number | null>(null)
  const raf = useRef<number | null>(null)
  const analyser = useRef<{ ctx: AudioContext; node: AnalyserNode } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined')) setState('unsupported')
  }, [])

  const cleanup = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current)
    if (raf.current) cancelAnimationFrame(raf.current)
    timer.current = null
    raf.current = null
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    void analyser.current?.ctx.close()
    analyser.current = null
  }, [])

  const start = useCallback(async () => {
    setState('requesting')
    setResult(null)
    setSeconds(0)
    chunks.current = []
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = s
      const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported(m))
      const rec = new MediaRecorder(s, mime ? { mimeType: mime } : undefined)
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
      rec.onstop = async () => {
        const raw = new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' })
        cleanup()
        setState('processing')
        try {
          const { mp3, durationSec } = await encodeMp3(raw)
          setResult({ mp3, durationSec, url: URL.createObjectURL(mp3) })
          setState('done')
        } catch {
          setState('error')
        }
      }
      recorder.current = rec
      rec.start(1000)

      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      const node = ctx.createAnalyser()
      node.fftSize = 256
      ctx.createMediaStreamSource(s).connect(node)
      analyser.current = { ctx, node }
      const data = new Uint8Array(node.frequencyBinCount)
      const tick = () => {
        node.getByteTimeDomainData(data)
        let peak = 0
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128) / 128)
        setLevels((prev) => [...prev.slice(1), Math.min(1, peak * 1.6)])
        raf.current = requestAnimationFrame(tick)
      }
      raf.current = requestAnimationFrame(tick)

      const startedAt = Date.now()
      timer.current = window.setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 250)
      setState('recording')
    } catch (err) {
      cleanup()
      setState(err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError') ? 'denied' : 'error')
    }
  }, [cleanup])

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop()
  }, [])

  const reset = useCallback(() => {
    cleanup()
    if (result) URL.revokeObjectURL(result.url)
    setResult(null)
    setSeconds(0)
    setLevels(Array(BARS).fill(0))
    setState('idle')
  }, [cleanup, result])

  useEffect(() => () => cleanup(), [cleanup])

  return { state, seconds, levels, result, start, stop, reset }
}
```

- [ ] **Step 3: Recorder screen component**

`src/components/story-editor/Recorder.tsx`:

```tsx
'use client'

import { useRef, useState } from 'react'
import { useRecorder } from './recorder/useRecorder'
import { StoryService } from '@/services/story.service'
import { readAudioDuration } from '@/lib/story/media'
import { formatTime } from '@/components/story/AudioPlayer'
import type { AudioRef } from '@/lib/story/types'
import { EButton, Field, Icon, TextArea } from './ui'

function Bars({ levels, active }: { levels: number[]; active: boolean }) {
  return (
    <div className="flex h-14 items-center gap-1">
      {levels.map((l, i) => (
        <div key={i} className="w-1 rounded-sm" style={{ height: 8 + l * 48, background: active ? 'var(--accent)' : 'var(--line)' }} />
      ))}
    </div>
  )
}

export function Recorder({ onKeep, onCancel, initialTranscript = '' }: { onKeep: (audio: AudioRef) => void; onCancel: () => void; initialTranscript?: string }) {
  const rec = useRecorder()
  const [transcript, setTranscript] = useState(initialTranscript)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const preview = useRef<HTMLAudioElement>(null)

  const keep = async () => {
    if (!rec.result) return
    setUploading(true)
    setError(null)
    try {
      const audio = await StoryService.uploadAudio(rec.result.mp3, 'mp3', rec.result.durationSec)
      onKeep({ ...audio, transcript: transcript.trim() })
    } catch {
      setError('The recording could not be saved. Check your internet and try again.')
      setUploading(false)
    }
  }

  const useFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const ext = (file.name.split('.').pop() || 'mp3').toLowerCase()
      const duration = await readAudioDuration(file).catch(() => 0)
      const audio = await StoryService.uploadAudio(file, ext, duration)
      onKeep({ ...audio, transcript: transcript.trim() })
    } catch {
      setError('That file could not be used. Try an mp3, m4a or wav file.')
      setUploading(false)
    }
  }

  const uploadButton = (
    <>
      <input ref={fileInput} type="file" accept="audio/*,.mp3,.m4a,.wav,.aac" className="hidden" onChange={(e) => e.target.files?.[0] && useFile(e.target.files[0])} />
      <EButton icon={<Icon name="upload" />} onClick={() => fileInput.current?.click()} disabled={uploading}>Use a recording I already have</EButton>
    </>
  )

  if (rec.state === 'done' && rec.result) {
    return (
      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="story-serif m-0 text-[40px] font-medium md:text-[46px]" style={{ color: 'var(--ink)' }}>Here is your recording</h2>
          <span className="text-[20px]" style={{ color: 'var(--ink-2)' }}>{formatTime(rec.result.durationSec)}</span>
        </div>
        <audio ref={preview} src={rec.result.url} controls className="w-full max-w-[760px]" />
        <div className="flex flex-wrap justify-center gap-4">
          <EButton icon={<Icon name="play" />} onClick={() => preview.current?.play()}>Listen back</EButton>
          <EButton icon={<Icon name="mic" />} onClick={rec.reset} disabled={uploading}>Record again</EButton>
          <EButton variant="primary" icon={<Icon name="check" />} onClick={keep} disabled={uploading}>{uploading ? 'Saving…' : 'Keep it'}</EButton>
        </div>
        {error && <p className="text-[18px]" style={{ color: 'var(--red)' }}>{error}</p>}
        <div className="w-full max-w-[760px]">
          <Field label="Write down what you said" hint="Optional — for people who would rather read along">
            <TextArea rows={4} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
          </Field>
        </div>
      </div>
    )
  }

  const recording = rec.state === 'recording'
  return (
    <div className="flex w-full flex-col items-center gap-9 text-center">
      <div className="flex flex-col items-center gap-2.5">
        <div className="flex items-center gap-2.5 text-[19px]" style={{ color: recording ? 'var(--red)' : 'var(--ink-2)' }}>
          {recording && <span className="h-3 w-3 rounded-full" style={{ background: 'var(--red)' }} />}
          <span>{rec.state === 'processing' ? 'One moment…' : recording ? 'Recording' : rec.state === 'requesting' ? 'Waiting for the microphone…' : 'Ready when you are'}</span>
        </div>
        <span className="story-serif story-tabular text-[80px] font-medium leading-none md:text-[96px]" style={{ color: 'var(--ink)' }}>{formatTime(rec.seconds)}</span>
      </div>
      <Bars levels={rec.levels} active={recording} />
      {rec.state !== 'unsupported' && (
        <button
          type="button"
          aria-label={recording ? 'Stop recording' : 'Start recording'}
          onClick={recording ? rec.stop : rec.start}
          disabled={rec.state === 'requesting' || rec.state === 'processing'}
          className="relative flex h-[168px] w-[168px] items-center justify-center rounded-full disabled:opacity-60"
          style={{ background: 'var(--red)', boxShadow: '0 16px 36px -14px rgba(196,61,51,0.7)' }}
        >
          {recording && <span className="absolute inset-0 animate-ping rounded-full opacity-40" style={{ background: 'var(--red)' }} />}
          {recording ? <span className="relative h-[52px] w-[52px] rounded-[10px]" style={{ background: 'var(--white)' }} /> : <span className="relative" style={{ color: 'var(--white)' }}><Icon name="mic" size={64} /></span>}
        </button>
      )}
      <span className="text-[24px] font-semibold" style={{ color: 'var(--ink)' }}>
        {rec.state === 'unsupported' ? 'This browser cannot record, but you can add a recording you already have.' : recording ? 'Press the red button when you are finished' : 'Press the red button to start'}
      </span>
      {rec.state === 'denied' && <p className="max-w-[520px] text-[19px]" style={{ color: 'var(--red)' }}>Your browser did not allow the microphone. You can still add a recording you already have.</p>}
      {rec.state === 'error' && <p className="max-w-[520px] text-[19px]" style={{ color: 'var(--red)' }}>Something went wrong with the recording. Please try again.</p>}
      {!recording && <p className="max-w-[520px] text-[19px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>Take your time. If you make a mistake, just keep going — you can record it again afterwards.</p>}
      {error && <p className="text-[18px]" style={{ color: 'var(--red)' }}>{error}</p>}
      <div className="flex flex-wrap justify-center gap-3.5">
        {uploadButton}
        <EButton variant="quiet" onClick={onCancel}>Cancel</EButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: The voice flow and the slideshow voice control**

`src/components/story-editor/RecordFlow.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useEditorStore } from './store'
import { findBlock, insertBlock, newId, updateBlock } from '@/lib/story/document'
import type { Screen } from './screens'
import { EButton, Field, Icon, PageTop, TextInput } from './ui'
import { Recorder } from './Recorder'
import type { AudioBlock, AudioRef } from '@/lib/story/types'

export function RecordFlow({ screen, onBack }: { screen: Extract<Screen, { kind: 'record' }>; onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  const existing = screen.blockId ? (findBlock(document, screen.blockId)?.block as AudioBlock | undefined) : undefined
  const [heading, setHeading] = useState(existing?.heading ?? '')
  const [audio, setAudio] = useState<AudioRef | null>(existing?.audio ?? null)
  const [rerecord, setRerecord] = useState(!existing)

  const save = (a: AudioRef) => {
    const block: AudioBlock = { id: existing?.id ?? newId(), kind: 'audio', heading: heading.trim(), audio: a }
    if (existing) apply((d) => updateBlock(d, screen.chapterId, existing.id, block))
    else apply((d) => insertBlock(d, screen.chapterId, screen.insertIndex, block))
    onBack()
  }

  return (
    <main className="min-h-[100svh]">
      <PageTop title="Record my voice" onBack={onBack} />
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-10 px-6 py-10 md:px-0">
        <Field label="A short title for this part" hint="Optional, shown above the player">
          <TextInput value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="For example: The tablecloth" />
        </Field>
        {rerecord || !audio ? (
          <Recorder onKeep={save} onCancel={onBack} initialTranscript={existing?.audio.transcript ?? ''} />
        ) : (
          <div className="flex flex-col items-center gap-6">
            <audio src={audio.url} controls className="w-full" />
            <div className="flex gap-4">
              <EButton icon={<Icon name="mic" />} onClick={() => setRerecord(true)}>Record again</EButton>
              <EButton variant="primary" icon={<Icon name="check" />} onClick={() => save(audio)}>Keep it</EButton>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
```

Replace the stub `src/components/story-editor/VoiceForSlideshow.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Recorder } from './Recorder'
import { EButton, Icon } from './ui'
import { formatTime } from '@/components/story/AudioPlayer'
import type { AudioRef } from '@/lib/story/types'

export function VoiceForSlideshow({ audio, onChange }: { audio: AudioRef | null; onChange: (a: AudioRef | null) => void }) {
  const [recording, setRecording] = useState(false)
  if (recording) {
    return (
      <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--line)', background: 'var(--white)' }} onClick={(e) => e.stopPropagation()}>
        <Recorder onKeep={(a) => { onChange(a); setRecording(false) }} onCancel={() => setRecording(false)} />
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-4" onClick={(e) => e.stopPropagation()}>
      {audio ? (
        <>
          <audio src={audio.url} controls className="max-w-full" />
          <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{formatTime(audio.durationSec)}</span>
          <EButton small icon={<Icon name="mic" size={18} />} onClick={() => setRecording(true)}>Record again</EButton>
          <EButton small variant="quiet" icon={<Icon name="trash" size={18} />} onClick={() => onChange(null)}>Remove</EButton>
        </>
      ) : (
        <EButton icon={<Icon name="mic" />} onClick={() => setRecording(true)}>Record my voice for these photos</EButton>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Wire the screen, check, commit**

In `EditorApp.tsx`: `import { RecordFlow } from './RecordFlow'` and `case 'record': return <RecordFlow screen={screen} onBack={back} />`.

Run: `npm run typecheck`. In `/story/edit`: Add → Voice recording, press the red button, speak for ten seconds, press it again, Listen back, Keep it. The card shows "Voice recording · 0:10". Preview: the recording plays when that section scrolls in, and the downloaded file is an `.mp3` (check the Network tab). In a slideshow, pick "Match my voice recording" and record; the preview advances photos in step. Also try "Use a recording I already have" with an `.m4a`.

```bash
git add src/components/story-editor
git commit -m "feat(story): voice recorder with browser MP3 encoding, voice flow and slideshow voice control

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Adding a video (upload or link)

**Files:**
- Create: `src/components/story-editor/VideoFlow.tsx`
- Modify: `src/components/story-editor/EditorApp.tsx` (add the `video` case)

**Interfaces:**
- Consumes: `StoryService.uploadVideo`, `parseVideoLink`, document helpers.
- Produces: `<VideoFlow screen onBack />`.

- [ ] **Step 1: Video flow**

`src/components/story-editor/VideoFlow.tsx`:

```tsx
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useEditorStore } from './store'
import { findBlock, insertBlock, newId, updateBlock } from '@/lib/story/document'
import { parseVideoLink } from '@/lib/story/videoLinks'
import { StoryService } from '@/services/story.service'
import type { Screen } from './screens'
import { EButton, Field, Icon, PageTop, TextInput } from './ui'
import type { VideoBlock, VideoSource } from '@/lib/story/types'

const ACCEPT = { 'video/mp4': ['.mp4', '.m4v'], 'video/quicktime': ['.mov'], 'video/webm': ['.webm'] }

export function VideoFlow({ screen, onBack }: { screen: Extract<Screen, { kind: 'video' }>; onBack: () => void }) {
  const document = useEditorStore((s) => s.document)!
  const apply = useEditorStore((s) => s.apply)
  const existing = screen.blockId ? (findBlock(document, screen.blockId)?.block as VideoBlock | undefined) : undefined
  const [source, setSource] = useState<VideoSource | null>(existing?.source ?? null)
  const [caption, setCaption] = useState(existing?.caption ?? '')
  const [link, setLink] = useState(existing?.source.type === 'link' ? existing.source.url : '')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setError(null)
    setProgress(0)
    try {
      const { url, durationSec, poster } = await StoryService.uploadVideo(file, setProgress)
      setSource({ type: 'upload', url, durationSec, poster })
    } catch {
      setError('The video could not be uploaded. Check your internet and try again.')
    } finally {
      setProgress(null)
    }
  }, [])

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({ onDrop, accept: ACCEPT, multiple: false, noClick: true })

  const useLink = () => {
    const parsed = parseVideoLink(link)
    if (!parsed) {
      setLinkError('That doesn’t look like a YouTube or Vimeo link.')
      return
    }
    setLinkError(null)
    setSource(parsed)
  }

  const save = () => {
    if (!source) return
    const block: VideoBlock = { id: existing?.id ?? newId(), kind: 'video', source, caption: caption.trim() }
    if (existing) apply((d) => updateBlock(d, screen.chapterId, existing.id, block))
    else apply((d) => insertBlock(d, screen.chapterId, screen.insertIndex, block))
    onBack()
  }

  return (
    <main className="min-h-[100svh]">
      <PageTop title="Add a video" onBack={onBack} />
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8 px-6 py-10 md:px-0">
        {source ? (
          <div className="flex flex-wrap items-center gap-5 rounded-2xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
            {source.type === 'upload' ? (
              <video src={source.url} poster={source.poster?.url} controls playsInline className="max-h-[300px] w-full max-w-[480px] rounded-md bg-black" />
            ) : (
              <span className="flex items-center gap-3 text-[20px]" style={{ color: 'var(--ink)' }}><Icon name="link" /><span>Video from {source.provider === 'youtube' ? 'YouTube' : 'Vimeo'}</span></span>
            )}
            <EButton small variant="quiet" icon={<Icon name="trash" size={18} />} onClick={() => setSource(null)}>Use a different video</EButton>
          </div>
        ) : (
          <>
            <div {...getRootProps()} className="flex flex-col items-center gap-4 rounded-[20px] px-6 py-10 text-center md:px-10 md:py-11" style={{ border: '3px dashed var(--accent)', background: isDragActive ? 'var(--accent)' : 'var(--accent-soft)', color: isDragActive ? 'var(--white)' : 'var(--ink)' }}>
              <input {...getInputProps()} />
              <span style={{ color: isDragActive ? 'var(--white)' : 'var(--accent-2)' }}><Icon name="video" size={48} /></span>
              <span className="story-serif text-[30px] font-medium md:text-[34px]">Drag your video here</span>
              <span className="text-[18px]" style={{ color: isDragActive ? 'var(--white)' : 'var(--ink-2)' }}>or</span>
              <EButton icon={<Icon name="upload" />} onClick={open} disabled={progress !== null}>Choose a video from my phone or computer</EButton>
              <span className="text-[18px]" style={{ color: isDragActive ? 'var(--white)' : 'var(--ink-2)' }}>Films up to about 10 minutes work best.</span>
            </div>
            {progress !== null && (
              <div className="flex flex-col gap-2">
                <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{progress < 100 ? `Uploading… ${progress}%` : 'Almost done…'}</span>
                <div className="h-2 w-full rounded-full" style={{ background: 'var(--line)' }}><div className="h-2 rounded-full" style={{ width: `${progress}%`, background: 'var(--accent)' }} /></div>
              </div>
            )}
            {error && <p className="text-[18px]" style={{ color: 'var(--red)' }}>{error}</p>}
            <div className="flex items-center gap-4"><div className="h-px flex-grow" style={{ background: 'var(--line)' }} /><span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>or, if the video is already online</span><div className="h-px flex-grow" style={{ background: 'var(--line)' }} /></div>
            <Field label="Paste the link here">
              <div className="flex flex-wrap items-center gap-3">
                <TextInput className="min-w-[240px] flex-grow" value={link} onChange={(e) => setLink(e.target.value)} placeholder="youtube.com/… or vimeo.com/…" onKeyDown={(e) => e.key === 'Enter' && useLink()} />
                <EButton onClick={useLink} disabled={!link.trim()}>Use this link</EButton>
              </div>
            </Field>
            {linkError && <p className="text-[18px]" style={{ color: 'var(--red)' }}>{linkError}</p>}
          </>
        )}

        <Field label="A few words about it" hint="Optional">
          <TextInput value={caption} onChange={(e) => setCaption(e.target.value)} />
        </Field>

        <div className="flex justify-center gap-4">
          <EButton icon={<Icon name="chevronLeft" />} onClick={onBack}>Back</EButton>
          <EButton variant="primary" icon={<Icon name="check" />} disabled={!source} onClick={save}>Add this video to my story</EButton>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Wire, check, commit**

In `EditorApp.tsx`: `import { VideoFlow } from './VideoFlow'` and `case 'video': return <VideoFlow screen={screen} onBack={back} />`.

Run: `npm run typecheck`. Upload a 50 MB mp4: the progress bar climbs, a poster appears, the card shows it, the preview plays it after the tap. Paste `https://vimeo.com/76979871`: "Video from Vimeo"; paste `example.com`: the link error shows.

```bash
git add src/components/story-editor
git commit -m "feat(story): add a video by upload or link

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: Publish route, publish dialog, project notes and the manual pass

**Files:**
- Create: `src/app/api/story/publish/route.ts`
- Modify: `src/components/story-editor/PublishDialog.tsx` (replace the stub)
- Modify: `CLAUDE.md` (Key Services and Current State)

**Interfaces:**
- Consumes: the `story` row, `Dialog` primitives, `EButton`.
- Produces: `POST /api/story/publish` → `{ publishedAt: string }` or `{ error }`.

- [ ] **Step 1: Publish route**

`src/app/api/story/publish/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { data: row, error: readError } = await supabase.from('story').select('id, draft').limit(1).single()
  if (readError || !row) return NextResponse.json({ error: 'Story not found' }, { status: 404 })

  const publishedAt = new Date().toISOString()
  const { error } = await supabase.from('story').update({ published: row.draft, published_at: publishedAt }).eq('id', row.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ publishedAt })
}
```

- [ ] **Step 2: Publish dialog**

Replace `src/components/story-editor/PublishDialog.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useEditorStore } from './store'
import { EButton, Icon } from './ui'

type Phase = 'ask' | 'working' | 'done' | 'error'

export function PublishDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const status = useEditorStore((s) => s.status)
  const [phase, setPhase] = useState<Phase>('ask')
  const [copied, setCopied] = useState(false)
  const link = typeof window !== 'undefined' ? `${window.location.origin}/story` : '/story'

  useEffect(() => {
    if (open) {
      setPhase('ask')
      setCopied(false)
    }
  }, [open])

  const publish = async () => {
    setPhase('working')
    try {
      const res = await fetch('/api/story/publish', { method: 'POST' })
      if (!res.ok) throw new Error(String(res.status))
      setPhase('done')
    } catch {
      setPhase('error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="story-theme max-w-[680px] rounded-[22px] border-0 p-10 text-center" style={{ background: 'var(--paper)' }}>
        {phase === 'done' ? (
          <div className="flex flex-col items-center gap-6">
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full" style={{ background: '#e3ebdd', color: '#3f6b3a' }}><Icon name="check" size={36} /></span>
            <DialogTitle className="story-serif text-[42px] font-medium" style={{ color: 'var(--ink)' }}>Your story is online</DialogTitle>
            <DialogDescription className="max-w-[520px] text-[20px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              Anyone with this link can read it. When you change something and publish again, the link stays the same.
            </DialogDescription>
            <div className="flex w-full flex-wrap items-center gap-3.5 rounded-xl border p-3.5 pl-5" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
              <span className="flex-grow text-left text-[20px]" style={{ color: 'var(--ink)' }}>{link}</span>
              <EButton small onClick={() => navigator.clipboard.writeText(link).then(() => setCopied(true))}>{copied ? 'Copied' : 'Copy the link'}</EButton>
            </div>
            <div className="flex flex-wrap justify-center gap-3.5">
              <a href="/story" target="_blank" rel="noreferrer" className="se-btn se-btn-secondary"><Icon name="eye" /><span>See it as visitors do</span></a>
              <EButton variant="primary" onClick={onClose}>Keep editing</EButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <DialogTitle className="story-serif text-[40px] font-medium leading-tight" style={{ color: 'var(--ink)' }}>Put your story online?</DialogTitle>
            <DialogDescription className="max-w-[520px] text-[20px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              {status === 'saving' ? 'Your latest change is still saving. Wait a moment, then try again.' : 'Everything you have now will replace what visitors see. You can publish again any time.'}
            </DialogDescription>
            {phase === 'error' && <p className="text-[18px]" style={{ color: 'var(--red)' }}>Could not publish. Nothing changed online. Try again in a moment.</p>}
            <div className="flex flex-wrap justify-center gap-3.5">
              <EButton onClick={onClose}>Not yet</EButton>
              <EButton variant="primary" icon={<Icon name="send" />} onClick={publish} disabled={phase === 'working' || status === 'saving'}>{phase === 'working' ? 'Publishing…' : 'Yes, publish it'}</EButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Project notes**

In `CLAUDE.md`, under Key Services add `- \`StoryService\` - Life story draft/published document, photo/audio/video uploads` and under Current State add `- Life story at /story (public), /story/edit (her editor), /story/preview; spec in docs/superpowers/specs/2026-09-15-life-story-design.md`.

- [ ] **Step 4: Full verification**

Run: `npm run typecheck && npm run lint && npm test`
Expected: clean typecheck, no lint errors (warnings about `<img>` are suppressed inline), all story tests pass.

Manual pass (record results in the commit message body):

1. Desktop Chrome: build a chapter with every kind, preview, publish, open `/story` in a private window. Progress bar, sound toggle, text fade, photo parallax, sideways gallery, slideshow timing, voice fade in/out, video play.
2. iPhone Safari: "Begin the story" then scroll; the voice section plays without another tap; the toggle silences it; the gallery turns page by page.
3. macOS "Reduce motion" on: no parallax, no pinning, everything fades.
4. Editor on an iPad in Safari: record a voice clip, upload three photos from the camera roll, upload a 200 MB video over Wi-Fi.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/story src/components/story-editor/PublishDialog.tsx CLAUDE.md
git commit -m "feat(story): publish route and dialog; project notes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Self-review notes

- Spec coverage: data model (T1), media (T3, T10–T12), public story with every block and reduced motion (T4–T7), editor screens including opening, chapters, add menu, cards, confirm, undo, autosave (T8–T9), photo styles and voice matching (T10–T11), video upload and link (T12), preview (T7), publish (T13), error copy (each screen), tests (T1, T2, T8), manual checklist (T13).
- Known simplification: link videos (YouTube/Vimeo) do not obey the corner sound toggle; their own controls do. Noted in the spec's video section.
- `OpeningEditor` (T9) depends on `PickOnePhoto` (T10); execute T9 and T10 back to back or use the stub noted in T9 step 7.
