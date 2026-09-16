import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEditorStore, type StoreService } from './store'
import { createEmptyDocument, addChapter } from '@/lib/story/document'
import type { StoryDocument } from '@/lib/story/types'

function fakeService() {
  const svc = {
    saves: 0,
    fail: false,
    getDraft: vi.fn(async () => createEmptyDocument()),
    saveDraft: vi.fn(async () => {
      svc.saves += 1
      if (svc.fail) throw new Error('offline')
    }),
  }
  return svc satisfies StoreService & { saves: number; fail: boolean }
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

  it('undo falls back to the first remaining chapter when the selected one disappears', async () => {
    const svc = fakeService()
    const store = createEditorStore(svc, 800)
    await store.getState().load()
    store.getState().apply((d) => addChapter(d, 'One').doc)
    const firstId = store.getState().document?.chapters[0].id
    store.getState().selectChapter(firstId ?? null)
    store.getState().apply((d) => addChapter(d, 'Two').doc)
    const secondId = store.getState().document?.chapters[1].id
    store.getState().selectChapter(secondId ?? null)
    // Undo removes "Two", so the previously selected chapter no longer exists.
    store.getState().undo()
    expect(store.getState().document?.chapters.map((c) => c.title)).toEqual(['One'])
    expect(store.getState().selectedChapterId).toBe(firstId)
    // Undo again removes "One" too, leaving no chapters at all.
    store.getState().undo()
    expect(store.getState().document?.chapters).toEqual([])
    expect(store.getState().selectedChapterId).toBeNull()
  })

  it('flushSave runs a pending debounced save immediately', async () => {
    const svc = fakeService()
    const store = createEditorStore(svc, 800)
    await store.getState().load()
    store.getState().apply((d) => addChapter(d, 'A').doc)
    expect(svc.saves).toBe(0)
    await store.getState().flushSave()
    expect(svc.saves).toBe(1)
    expect(store.getState().status).toBe('saved')
  })

  it('flushSave resolves immediately when nothing is pending', async () => {
    const svc = fakeService()
    const store = createEditorStore(svc, 800)
    await store.getState().load()
    await store.getState().flushSave()
    expect(svc.saves).toBe(0)
  })

  it('flushSave saves an edit that was made while an earlier save was still in flight', async () => {
    const saved: StoryDocument[] = []
    let releaseFirstSave: () => void = () => {}
    const svc: StoreService = {
      getDraft: async () => createEmptyDocument(),
      saveDraft: async (doc) => {
        saved.push(doc)
        if (saved.length === 1) await new Promise<void>((resolve) => { releaseFirstSave = resolve })
      },
    }
    const store = createEditorStore(svc, 800)
    await store.getState().load()

    // Edit A: let the debounce fire so its save is genuinely in flight.
    store.getState().apply((d) => addChapter(d, 'A').doc)
    await vi.advanceTimersByTimeAsync(800)
    expect(saved).toHaveLength(1)

    // Edit B lands while A is still saving, then the user asks for a preview.
    store.getState().apply((d) => addChapter(d, 'B').doc)
    const flushed = store.getState().flushSave()
    releaseFirstSave()
    await flushed

    expect(saved).toHaveLength(2)
    expect(saved[1].chapters.map((c) => c.title)).toEqual(['A', 'B'])
    expect(store.getState().status).toBe('saved')
  })

  it('flushSave rejects when the save failed, so the caller does not navigate away', async () => {
    const svc = fakeService()
    const store = createEditorStore(svc, 800)
    await store.getState().load()
    svc.fail = true
    store.getState().apply((d) => addChapter(d, 'A').doc)
    await expect(store.getState().flushSave()).rejects.toThrow()
    expect(store.getState().status).toBe('error')
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
