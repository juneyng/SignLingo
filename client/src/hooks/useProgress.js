import { useEffect, useCallback } from 'react'
import useStore from '@/stores/useStore'
import useProgressStore from '@/stores/useProgress'
import {
  fetchProgress,
  touchStreak,
  refillHearts,
  consumeHeart,
  addXp as apiAddXp,
  addStars as apiAddStars,
  rotateDailyMissions,
  bumpMissionProgress as apiBumpMission,
  claimMissionReward as apiClaimMission,
} from '@/services/api'

/**
 * Bridge between Supabase user_progress row and the Zustand store.
 *
 * On mount (and whenever user changes):
 *   1. Ensures a user_progress row exists (touchStreak handles it).
 *   2. Updates streak based on last_login_date.
 *   3. Refills hearts based on elapsed time.
 *
 * Exposes update helpers that hit Supabase RPCs and patch the store.
 */
export default function useProgress() {
  const user = useStore((s) => s.user)
  const { row, loading, error, setRow, setLoading, setError, getLevel } = useProgressStore()

  // Initial load — runs on login + once per session.
  useEffect(() => {
    if (!user?.id) {
      setRow(null)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        await touchStreak(user.id)
        await refillHearts(user.id)
        await rotateDailyMissions(user.id)
        const fresh = await fetchProgress(user.id)
        if (!cancelled) {
          setRow(fresh)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
        console.error('[useProgress] init failed:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, setRow, setLoading, setError])

  const addXp = useCallback(
    async (amount) => {
      if (!user?.id) return { granted: 0 }
      const { granted, row: updated } = await apiAddXp(user.id, amount)
      if (updated) setRow(updated)
      return { granted }
    },
    [user?.id, setRow]
  )

  const addStars = useCallback(
    async (amount) => {
      if (!user?.id) return null
      const updated = await apiAddStars(user.id, amount)
      if (updated) setRow(updated)
      return updated
    },
    [user?.id, setRow]
  )

  const useHeart = useCallback(async () => {
    if (!user?.id) return null
    const updated = await consumeHeart(user.id)
    if (updated) setRow(updated)
    return updated
  }, [user?.id, setRow])

  const refresh = useCallback(async () => {
    if (!user?.id) return
    const fresh = await fetchProgress(user.id)
    if (fresh) setRow(fresh)
  }, [user?.id, setRow])

  const bumpMission = useCallback(
    async (kind) => {
      if (!user?.id) return null
      try {
        const missions = await apiBumpMission(user.id, kind)
        if (missions) setRow({ ...(useProgressStore.getState().row ?? {}), daily_missions: missions })
        return missions
      } catch (e) {
        console.warn('[useProgress] bumpMission failed:', e.message)
        return null
      }
    },
    [user?.id, setRow]
  )

  const claimMission = useCallback(
    async (missionKey) => {
      if (!user?.id) return null
      const result = await apiClaimMission(user.id, missionKey)
      if (result?.claimed) {
        await refresh()
      }
      return result
    },
    [user?.id, refresh]
  )

  return {
    row,
    loading,
    error,
    level: getLevel(),
    addXp,
    addStars,
    useHeart,
    refresh,
    bumpMission,
    claimMission,
  }
}
