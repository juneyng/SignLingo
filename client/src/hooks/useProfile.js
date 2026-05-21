import { useEffect, useCallback } from 'react'
import useStore from '@/stores/useStore'
import useProfileStore from '@/stores/useProfileStore'
import { fetchProfile, updateProfile as apiUpdateProfile } from '@/services/api'

/**
 * Same singleton-init pattern as useProgress — every consumer shares a
 * single fetch so we don't race on profile updates.
 *
 * Exposes:
 *   profile, loading, loaded, error
 *   refresh()                — re-fetch from DB
 *   complete(displayName)    — set display_name + consent_at = now()
 *   updateName(displayName)  — update just display_name
 */

let inFlightForUser = null
let initializedForUser = null

export default function useProfile() {
  const user = useStore((s) => s.user)
  const {
    profile, loading, loaded, error,
    setProfile, setLoading, setLoaded, setError,
  } = useProfileStore()

  useEffect(() => {
    if (!user?.id) {
      setProfile(null)
      setLoaded(false)
      initializedForUser = null
      inFlightForUser = null
      return
    }
    if (initializedForUser === user.id) return
    if (inFlightForUser === user.id) return

    inFlightForUser = user.id
    setLoading(true)
    ;(async () => {
      try {
        const row = await fetchProfile(user.id)
        if (user.id === inFlightForUser) {
          setProfile(row)
          setLoaded(true)
          setError(null)
          initializedForUser = user.id
        }
      } catch (e) {
        if (user.id === inFlightForUser) setError(e.message)
        // intentionally NOT marking loaded=true on error so the UI
        // does not falsely show the consent modal on a network blip
        console.error('[useProfile] init failed:', e)
      } finally {
        if (inFlightForUser === user.id) inFlightForUser = null
        setLoading(false)
      }
    })()
  }, [user?.id, setProfile, setLoading, setLoaded, setError])

  const refresh = useCallback(async () => {
    if (!user?.id) return null
    const row = await fetchProfile(user.id)
    if (row) {
      setProfile(row)
      setLoaded(true)
    }
    return row
  }, [user?.id, setProfile, setLoaded])

  /**
   * Finish onboarding in one call.
   *
   * Accepts EITHER:
   *   - a string (legacy: just the display name), or
   *   - an object: { display_name, birth_year, gender,
   *                  ksl_experience, learning_purpose, occupation_type }
   *
   * consent_at is stamped server-side time-of-call. Any field omitted
   * stays null in DB (matches "선택 안 함").
   */
  const complete = useCallback(
    async (input) => {
      if (!user?.id) throw new Error('No user')
      const payload = typeof input === 'string'
        ? { display_name: input }
        : { ...(input || {}) }
      const updated = await apiUpdateProfile(user.id, {
        ...payload,
        consent_at: new Date().toISOString(),
      })
      if (updated) {
        setProfile(updated)
        setLoaded(true)
      }
      return updated
    },
    [user?.id, setProfile, setLoaded]
  )

  const updateName = useCallback(
    async (displayName) => {
      if (!user?.id) throw new Error('No user')
      const updated = await apiUpdateProfile(user.id, { display_name: displayName })
      if (updated) setProfile(updated)
      return updated
    },
    [user?.id, setProfile]
  )

  return { profile, loading, loaded, error, refresh, complete, updateName }
}
