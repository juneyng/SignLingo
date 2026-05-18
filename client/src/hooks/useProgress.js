import { useEffect, useCallback, useRef } from 'react'
import useStore from '@/stores/useStore'
import useProgressStore from '@/stores/useProgress'
import {
  fetchProgress,
  touchStreak,
  rotateDailyMissions,
  addXp as apiAddXp,
  addStars as apiAddStars,
  bumpMissionProgress as apiBumpMission,
  claimMissionReward as apiClaimMission,
} from '@/services/api'

/**
 * Bridge between Supabase user_progress row and the Zustand store.
 *
 * The init effect runs at most ONCE per (mount instance × user.id) AND
 * is gated by a module-level "in-flight" flag so that multiple consumers
 * of useProgress() don't fire duplicate fetches that can clobber each
 * other (race-condition where a stale fetch lands after a fresh addXp).
 */

// Module-level singleton state
let inFlightForUser = null  // user.id currently being initialized
let initializedForUser = null // user.id whose row has been loaded at least once

export default function useProgress() {
  const user = useStore((s) => s.user)
  const { row, loading, error, setRow, setLoading, setError, getLevel } = useProgressStore()
  const localRunRef = useRef(false)

  useEffect(() => {
    if (!user?.id) {
      setRow(null)
      initializedForUser = null
      inFlightForUser = null
      return
    }
    // Already initialized for this user — nothing to do.
    if (initializedForUser === user.id) return
    // Another component is fetching right now — wait.
    if (inFlightForUser === user.id) return

    inFlightForUser = user.id
    localRunRef.current = true
    setLoading(true)
    ;(async () => {
      try {
        await touchStreak(user.id)
        await rotateDailyMissions(user.id)
        const fresh = await fetchProgress(user.id)
        // Only commit if user hasn't switched since we started.
        if (user.id === inFlightForUser) {
          setRow(fresh)
          setError(null)
          initializedForUser = user.id
        }
      } catch (e) {
        if (user.id === inFlightForUser) setError(e.message)
        console.error('[useProgress] init failed:', e)
      } finally {
        if (inFlightForUser === user.id) inFlightForUser = null
        setLoading(false)
      }
    })()
    return () => {
      // If this component unmounts mid-fetch, leave the in-flight flag alone
      // so siblings don't kick off a duplicate request.
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

  const refresh = useCallback(async () => {
    if (!user?.id) return null
    const fresh = await fetchProgress(user.id)
    if (fresh) setRow(fresh)
    return fresh
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
    refresh,
    bumpMission,
    claimMission,
  }
}
