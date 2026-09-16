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
  flushSave: () => Promise<void>
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
      if (!doc) {
        // Nothing to save; drop the flag so flushSave's loop cannot spin forever.
        dirty = false
        return
      }
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
      // Mark the document dirty as soon as a save is scheduled. flush() clears
      // the flag right before it starts saving, so anything edited after that
      // point stays flagged and flushSave() can still catch it.
      dirty = true
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
        const selected = get().selectedChapterId
        const stillThere = previous.chapters.some((c) => c.id === selected)
        set({
          document: previous,
          undoStack: stack.slice(0, -1),
          selectedChapterId: stillThere ? selected : previous.chapters[0]?.id ?? null,
        })
        schedule()
      },

      canUndo: () => get().undoStack.length > 0,

      retrySave: () => schedule(),

      flushSave: async () => {
        // Keep clearing any scheduled timer and forcing an immediate save
        // until nothing is scheduled, nothing is queued, and nothing is
        // still saving — guarantees the latest edits are persisted before
        // the caller navigates away (e.g. to preview the story).
        while (timer || dirty || inFlight) {
          if (timer) {
            clearTimeout(timer)
            timer = null
          }
          if (inFlight) {
            await inFlight
            continue
          }
          await flush()
        }
        // The caller (e.g. Preview) must not move on as if everything landed.
        if (get().status === 'error') throw new Error('The last change could not be saved.')
      },

      selectChapter: (id) => set({ selectedChapterId: id }),
    }
  })

  return store
}

export const editorStore = createEditorStore(StoryService, 800)

export function useEditorStore<T>(selector: (state: EditorState) => T): T {
  return useStore(editorStore, selector)
}
