import { create } from 'zustand'
import { levelFromXp } from '@/utils/leveling'

/**
 * User progress store — single source of truth for gamification state.
 * Server is authoritative; this store mirrors the last fetched row.
 */
const useProgress = create((set, get) => ({
  // Server-mirrored row (null until first fetch)
  row: null,
  loading: false,
  error: null,

  setRow: (row) => set({ row }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Derived getters
  getLevel: () => {
    const row = get().row
    return levelFromXp(row?.xp ?? 0)
  },

  // Optimistic updates — apply a partial patch to the row immediately
  // (server response will overwrite when it arrives).
  patch: (partial) =>
    set((state) => ({
      row: state.row ? { ...state.row, ...partial } : state.row,
    })),
}))

export default useProgress
