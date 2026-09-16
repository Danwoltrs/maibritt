# Life Story: scrollable memoir and its editor

Date: 2026-09-15
Status: approved design, ready for an implementation plan
Design canvas: https://claude.ai/artifact/3LKM4Zextn9zSUhbGsr39D

## Purpose

A personal storytelling section of the site. Visitors scroll through
Mai-Britt's life story as a full-screen, cinematic sequence of chapters.
She builds and edits the story herself in a deliberately simple editor:
large text, big buttons with words, plain language, no jargon.

Two routes:

- `/story` — the public story, rendered from the published document.
- `/story/edit` — her editor, behind the existing admin login.
- `/story/preview` — the draft rendered with the public story component,
  behind the same login.

One story only. One language only: whatever she writes. Every word on
the public page is hers; the app ships no sample copy.

## Data model

### One document, two copies

A single row in a new `story` table holds the whole story as JSON:

| column | type | notes |
| --- | --- | --- |
| `id` | uuid, pk | one row; the app reads the first row |
| `draft` | jsonb | what the editor edits |
| `published` | jsonb, nullable | what visitors see; `null` until first publish |
| `draft_updated_at` | timestamptz | set by the editor on every autosave |
| `published_at` | timestamptz, nullable | set by publish |

Autosave writes the whole `draft`. Publish copies `draft` into
`published` on the server. Undo is an in-memory stack of previous
drafts. Last write wins if two tabs edit at once; acceptable for a
single author.

RLS: public may `select` the row (only `published` is rendered publicly;
the draft column is readable but not linked from anywhere, which we
accept for a personal site). Authenticated users may `update` the row.
Inserts happen once, in the migration.

### Document shape (`StoryDocument`)

```ts
type StoryDocument = {
  version: 1
  opening: {
    name: string            // "Mai-Britt Wolthers"
    title: string           // story subtitle
    portrait: ImageRef | null
    cover: ImageRef | null  // background photo on the opening screen
  }
  chapters: Chapter[]
}

type Chapter = { id: string; title: string; blocks: Block[] }

type ImageRef = { url: string; width: number; height: number; thumbnailUrl: string }
type AudioRef = { url: string; durationSec: number; transcript: string }

type Block =
  | { id; kind: 'text';      heading: string; body: string }              // body: plain text, blank line = new paragraph
  | { id; kind: 'photo';     image: ImageRef; caption: string }
  | { id; kind: 'gallery';   images: (ImageRef & { caption: string })[] }
  | { id; kind: 'slideshow'; images: (ImageRef & { caption: string })[];
                             timing: { mode: 'interval'; seconds: 3 | 5 | 8 } | { mode: 'audio' };
                             audio: AudioRef | null }
  | { id; kind: 'audio';     heading: string; audio: AudioRef }
  | { id; kind: 'video';     source: { type: 'upload'; url: string; poster: ImageRef | null; durationSec: number }
                                   | { type: 'link'; provider: 'youtube' | 'vimeo'; videoId: string; url: string };
                             caption: string }
```

Speed slider values map to interval seconds: slow 8, medium 5, fast 3.
A slideshow with `timing.mode === 'audio'` and `audio === null` plays at
5 seconds until a recording is added; the editor shows "Add your voice
to make the photos follow it" on that block.

Ids are `crypto.randomUUID()` generated in the browser.

Pure document helpers live in `src/lib/story/document.ts` and are unit
tested: `createEmptyDocument`, `addChapter`, `renameChapter`,
`removeChapter`, `moveChapter`, `insertBlock(chapterId, index, block)`,
`updateBlock`, `removeBlock`, `moveBlock(chapterId, blockId, delta)`,
`reorderBlocks(chapterId, orderedIds)`, `slideshowIntervalMs(block)`.

## Media

New public storage bucket `story`, file size limit 500 MB, folders
`photos/`, `audio/`, `video/`, `posters/`.

- **Photos** go through the existing `StorageService.uploadImages`,
  whose bucket union gains `'story'`. It already produces original,
  display (1920) and thumbnail (400) variants; the document stores the
  display URL as `url` and the thumbnail as `thumbnailUrl`.
- **Video uploads** use resumable uploads (`tus-js-client`, Supabase's
  documented path for files over 6 MB) with a progress bar. Accepted
  types: mp4, mov, webm, m4v. After upload the browser loads the file
  in a `<video>`, seeks to one second, draws the frame to a canvas and
  uploads the JPEG as the poster through `StorageService`.
- **Video links**: YouTube (`youtube.com/watch?v=`, `youtu.be/`,
  `youtube.com/shorts/`) and Vimeo (`vimeo.com/<id>`). Parsed by a pure
  function in `src/lib/story/videoLinks.ts` (unit tested). Rendered with
  the privacy-enhanced embed (`youtube-nocookie.com`, `player.vimeo.com`
  with `dnt=1`), no autoplay, controls shown.
- **Voice recordings** are captured with `MediaRecorder`, decoded with
  `AudioContext.decodeAudioData`, and encoded to MP3 in a Web Worker
  with `lamejs` (`@breezystack/lamejs`) so they play on every device.
  Duration comes from the decoded buffer. Uploaded audio files (mp3,
  m4a, wav, aac) are stored as-is; duration is read from a temporary
  `<audio>` element's `loadedmetadata`.
- Deleting a block does not delete its files (undo must still work).
  Orphan cleanup is out of scope.

## Public story (`/story`)

`src/app/story/page.tsx` is a server component: it reads the `story`
row with the anon client, and if `published` is null renders a quiet
"This story is not ready yet" page. Otherwise it renders
`<Story document={published} />`.

`src/components/story/` (client components, all under 400 lines each):

- `Story.tsx` — providers, progress bar, sound toggle, opening screen,
  then chapters in order.
- `Opening.tsx` — cover photo with the film treatment, portrait, name,
  title, "Begin the story". The tap does three things: marks the story
  as begun, unlocks audio, and scrolls to the first chapter.
- `blocks/TextBlock.tsx`, `PhotoBlock.tsx`, `GalleryBlock.tsx`,
  `SlideshowBlock.tsx`, `AudioBlock.tsx`, `VideoBlock.tsx`.
- `AudioPlayer.tsx` — pause/play, thin progress bar with dot,
  elapsed / total, replay, optional "Read along" transcript.
- `SoundProvider.tsx` — `unlocked`, `muted`, `registerElement(el)`,
  `fadeIn(el)`, `fadeOut(el)`. Unlock iterates every registered
  `<audio>` and `<video>` element inside the tap handler and calls
  `play()` then `pause()` on each. Fades run through a Web Audio
  `GainNode` per element (`MediaElementAudioSourceNode`, elements set
  `crossOrigin="anonymous"`); if the AudioContext cannot be created the
  provider falls back to a `volume` ramp, and if that has no effect
  (iOS) to plain pause.
- `StoryChrome.tsx` — the 3 px top progress bar driven by
  `useScroll().scrollYProgress`, and the sound toggle.

Motion, with `useReducedMotion()` from framer-motion switching every
item below to a simple opacity fade:

- Text blocks fade and rise 16 px on entering view (`whileInView`,
  once).
- Photo blocks: the image is scaled 1.12 and translated by
  `useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])` relative to the
  section.
- Gallery on screens 768 px and wider: a section of height
  `(images.length) * 100vh` with a sticky 100vh child; the row is
  translated in x by scroll progress so the last image ends aligned to
  the right edge; a thin line shows sideways progress and "n of N".
  Under 768 px (phones): the "one at a time" treatment — same tall
  section, sticky child, and each image crossfades and rises in as
  progress crosses its index; the previous image stays dimmed behind.
- Slideshow: images crossfade every `slideshowIntervalMs`, or, with
  `timing.mode === 'audio'`, at `durationSec / images.length` seconds
  driven by the audio element's `timeupdate`; the attached player sits
  bottom-left.
- Audio block: `useInView` with `amount: 0.5` starts playback via
  `fadeIn` and `fadeOut` on leave (about one second). Only one audio
  element plays at a time; starting one fades out the others.
- Video: poster with a large play button. Uploaded videos play inline
  with native controls after the tap; sound follows the global toggle.
  Link videos render the embed only after the tap (no iframe until
  then).

Chrome: `ConditionalHeader` returns null for pathnames starting with
`/story`. The route sets `metadata` with her name and title. Fonts:
Cormorant Garamond via the existing `--font-serif`; Source Sans 3 is
loaded with `next/font/google` in `src/app/story/layout.tsx` and
exposed as `--font-story-sans`. Tailwind gets no new config; the story
and editor use CSS variables declared in `src/app/story/story.css` for
the palette (paper `#F5F0E8`, ink `#2A2521`, accent `#B5623A`, etc.).

## Editor (`/story/edit`)

Routes live in `src/app/story/edit/` with their own `layout.tsx`
(wraps in `AuthGuard`, no admin sidebar). Middleware `isAdminRoute`
gains `/story/edit`, `/story/preview` and `/api/story`.

State: a zustand store in `src/components/story-editor/store.ts`:

- `document`, `selectedChapterId`, `status: 'saved' | 'saving' | 'error'`,
  `undoStack` (max 50).
- Every mutating action pushes the previous document on the undo
  stack, applies a helper from `lib/story/document.ts`, and schedules
  a save. Saves are debounced 800 ms and coalesced; the status shows
  "Saving…" then "Saved a moment ago" (relative time, updated each
  minute). On error the bar shows "Could not save. Check your internet
  and try again." with a Retry button.
- `undo()` pops the stack and saves.

Screens (each a client component under `src/components/story-editor/`):

- `StoryOverview` — top bar (My story, saved status, Undo, Preview my
  story, Publish), chapter pills plus "New chapter", the selected
  chapter's title with "Change the title", the block list with "+ Add"
  between items, and "Remove this chapter" at the bottom.
- `BlockCard` — kind label in words, a preview (text excerpt,
  thumbnails, player, video poster), Change and Remove buttons, Move
  up / Move down 56 px buttons, and a dnd-kit handle.
- `AddMenu` — a dialog listing Text, Photo, Photo gallery, Slideshow,
  Video, Voice recording, each with a one-line description.
- `TextEditor` — Heading field and a plain textarea. No rich text.
- `PhotoPicker` — react-dropzone area plus "Choose photos from my
  computer", multi-select, thumbnails with ticks, upload progress.
  Used for Photo (single), Gallery and Slideshow (many).
- `PhotoStyleChooser` — the sideways / fade choice, then for fade the
  "Match my voice recording" / speed slider choice. Choosing "Match my
  voice recording" offers Record or Upload inline using `Recorder`.
- `Recorder` — Record (red, 168 px), timer, live level bars, Stop;
  then Listen back, Record again, Keep it; "Use a recording I already
  have"; optional "Write down what you said" textarea.
- `VideoAdder` — drag area, "Choose a video from my phone or computer",
  upload progress, or "Paste the link here" with validation feedback
  ("That doesn't look like a YouTube or Vimeo link").
- `ConfirmRemove` — radix AlertDialog restyled to the editor scale.
- `OpeningEditor` — name, title, portrait, cover photo.
- `PublishDialog` — confirms, calls the publish route, then shows
  "Your story is online" with the link and Copy the link.

Editor typography and controls: minimum 18 px, buttons 56 px tall,
radius 10 px, ink on paper with a single accent, exactly as the design
canvas. Everything is a word; icons only accompany words.

Preview: `src/app/story/preview/page.tsx` (client, behind AuthGuard)
loads the draft and renders `<Story document={draft} />` under a dark
bar "This is exactly what visitors will see" with "Back to editing".

Publish: `POST /api/story/publish` (`src/app/api/story/publish/route.ts`)
creates a server client from cookies, refuses without a user, runs
`update story set published = draft, published_at = now()` and returns
`{ publishedAt }`. Copying on the server keeps draft and published in
one place and avoids sending the document back up.

## Services

`src/services/story.service.ts` (`StoryService`): `getPublished()`,
`getDraft()`, `saveDraft(document)`, `uploadPhotos(files, onProgress)`,
`uploadAudio(blob | file, onProgress)`, `uploadVideo(file, onProgress)`
(resumable), `uploadPoster(blob)`. Follows the camelCase-in-app
convention; the document itself is stored as-is in jsonb.

## Errors

- Upload failures show a plain message on the card ("This photo could
  not be uploaded. Try again.") and keep the block in place.
- Microphone permission denied: "Your browser did not allow the
  microphone. You can still upload a recording."
- Unsupported recorder: hide Record and show upload only.
- Publish failure: "Could not publish. Nothing changed online. Try
  again in a moment."
- Public page with no published story: a calm placeholder page, no
  error.

## Testing

- Vitest, in `src/lib/story/`: `document.test.ts` (every helper,
  including move at the ends, remove keeps order, publish copy is
  deep), `videoLinks.test.ts` (accepted and rejected URLs),
  `timing.test.ts` (interval mapping and audio-spread timing).
- Vitest for the store's autosave debounce and undo stack with a fake
  service.
- Manual checklist before calling it done: iPhone Safari audio unlock
  and fade, gallery pin on desktop and page-turn on phone, reduced
  motion in macOS settings, a 200 MB video upload over Wi-Fi.

## Out of scope

Translation, multiple stories, comments, analytics, orphaned media
cleanup, editing a video's trim or a recording's trim.

## Migration

`migrations/20260915_life_story.sql`: create table `story`, RLS
policies, insert the single empty row, create bucket `story` with a 500
MB limit and the four policies (public read, authenticated insert,
update, delete). The user applies migrations by hand; the SQL is pasted
into chat as well.
