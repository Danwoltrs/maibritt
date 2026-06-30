import { create } from 'zustand'

interface FabVisibilityState {
  /** When true, the global quick-upload FAB is hidden (e.g. while the bulk-action bar is showing). */
  suppressed: boolean
  setSuppressed: (suppressed: boolean) => void
}

export const useFabVisibilityStore = create<FabVisibilityState>((set) => ({
  suppressed: false,
  setSuppressed: (suppressed) => set({ suppressed }),
}))
