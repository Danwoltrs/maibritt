import { createStore, useStore, type StoreApi } from 'zustand'
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

// The real StoryService (Supabase-backed) is injected by the editor when it
// creates its store instance (Task 9) — this module stays free of that
// import so it has no Supabase dependency at load time.
export function useEditorStore<T>(store: StoreApi<EditorState>, selector: (state: EditorState) => T): T {
  return useStore(store, selector)
}
