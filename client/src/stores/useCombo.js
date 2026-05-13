import { create } from 'zustand'

/**
 * Combo state — client-side only (never persisted).
 *
 * Multiplier curve (from design doc):
 *   1-2   : x1.0
 *   3-4   : x2.0
 *   5-9   : x3.0
 *   10-19 : x5.0
 *   20+   : x7.0
 *
 * Rules:
 *   - correct answer: combo += 1
 *   - wrong answer:   combo = 0 (unless shielded — TODO)
 *   - timeout:        combo = floor(combo * 0.5)
 */

export function comboMultiplier(combo) {
  if (combo >= 20) return 7
  if (combo >= 10) return 5
  if (combo >= 5)  return 3
  if (combo >= 3)  return 2
  return 1
}

export function comboTier(combo) {
  if (combo >= 20) return 'fever'
  if (combo >= 10) return 'flame'
  if (combo >= 5)  return 'hot'
  if (combo >= 3)  return 'warm'
  return 'base'
}

const useCombo = create((set, get) => ({
  combo: 0,
  best: 0,           // best of current session

  increment: () =>
    set((s) => {
      const next = s.combo + 1
      return { combo: next, best: Math.max(s.best, next) }
    }),

  break: () => set({ combo: 0 }),

  timeout: () => set((s) => ({ combo: Math.floor(s.combo * 0.5) })),

  reset: () => set({ combo: 0, best: 0 }),

  multiplier: () => comboMultiplier(get().combo),
  tier: () => comboTier(get().combo),
}))

export default useCombo
