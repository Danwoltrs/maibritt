import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEditorStore, type StoreService } from './store'
import { createEmptyDocument, addChapter } from '@/lib/story/document'

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
