import { create } from 'zustand'

/**
 * Profile store — mirrors the public.profiles row for the current user.
 * Kept separate from useProgress so consent UI doesn't depend on
 * gamification state.
 */
const useProfileStore = create((set) => ({
  profile: null,
  loading: false,
  loaded: false,   // true once a successful fetch has resolved
  error: null,

  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setLoaded: (loaded) => set({ loaded }),
  setError: (error) => set({ error }),

  patch: (partial) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...partial } : state.profile,
    })),
}))

export default useProfileStore
