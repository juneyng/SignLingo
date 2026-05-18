import { supabase, isSupabaseConfigured } from './supabase'

// Lessons
export async function fetchLessons() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .order('order')
  if (error) throw error
  return data
}

export async function fetchLesson(id) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('lessons')
    .select('*, lesson_signs(sign_id, signs(*))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Signs
export async function fetchSignsByCategory(category) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('signs')
    .select('*')
    .eq('category', category)
    .order('difficulty')
  if (error) throw error
  return data
}

// Progress
export async function fetchProgress(userId) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function completeSign(userId, signId, score) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('completed_signs')
    .upsert(
      { user_id: userId, sign_id: signId, best_score: score },
      { onConflict: 'user_id,sign_id' }
    )
    .select()
  if (error) throw error

  await supabase.rpc('add_points', { p_user_id: userId, p_points: Math.floor(score / 10) })

  return data
}

// Leaderboard
// We fetch progress and profiles in two steps because user_progress.user_id
// references auth.users (not public.profiles), so PostgREST can't infer an
// FK relationship for a single embedded select.
export async function fetchLeaderboard() {
  if (!isSupabaseConfigured) return []
  const { data: progressRows, error: e1 } = await supabase
    .from('user_progress')
    .select('user_id, total_points, xp, streak')
    .order('xp', { ascending: false })
    .limit(20)
  if (e1) throw e1
  if (!progressRows || progressRows.length === 0) return []

  const userIds = progressRows.map((r) => r.user_id)
  const { data: profileRows, error: e2 } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds)
  if (e2) console.warn('[fetchLeaderboard] profiles fetch failed:', e2.message)

  const nameById = new Map((profileRows || []).map((p) => [p.id, p.display_name]))
  return progressRows.map((r) => ({
    ...r,
    profiles: { display_name: nameById.get(r.user_id) || null },
  }))
}

// ============================================================
// Gamification — XP / Stars / Hearts / Streak
// ============================================================

export async function ensureProgressRow(userId) {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.rpc('ensure_progress_row', { p_user_id: userId })
  if (error) throw error
}

export async function touchStreak(userId) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.rpc('touch_streak', { p_user_id: userId })
  if (error) throw error
  return data
}

export async function refillHearts(userId) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.rpc('refill_hearts', { p_user_id: userId })
  if (error) throw error
  return data
}

export async function consumeHeart(userId) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.rpc('consume_heart', { p_user_id: userId })
  if (error) throw error
  return data
}

/**
 * Add XP. Returns { granted, row } — granted may be less than requested
 * if the daily 800 cap was hit (50% reduction past cap).
 */
export async function addXp(userId, amount) {
  if (!isSupabaseConfigured) return { granted: 0, row: null }
  const { data, error } = await supabase.rpc('add_xp', {
    p_user_id: userId,
    p_amount: amount,
  })
  if (error) throw error
  const first = Array.isArray(data) ? data[0] : data
  return { granted: first?.granted ?? 0, row: first?.progress ?? null }
}

export async function addStars(userId, amount) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.rpc('add_stars', {
    p_user_id: userId,
    p_amount: amount,
  })
  if (error) throw error
  return data
}

// ============================================================
// Daily missions
// ============================================================

export async function rotateDailyMissions(userId) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.rpc('rotate_daily_missions', { p_user_id: userId })
  if (error) throw error
  return data
}

export async function bumpMissionProgress(userId, kind) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.rpc('bump_mission_progress', {
    p_user_id: userId,
    p_kind: kind,
  })
  if (error) throw error
  return data
}

/**
 * Claim a mission reward.
 * Returns { claimed, xp_granted, stars_granted, missions }.
 */
export async function claimMissionReward(userId, missionKey) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.rpc('claim_mission_reward', {
    p_user_id: userId,
    p_mission: missionKey,
  })
  if (error) throw error
  const first = Array.isArray(data) ? data[0] : data
  return {
    claimed: first?.claimed ?? false,
    xpGranted: first?.xp_granted ?? 0,
    starsGranted: first?.stars_granted ?? 0,
    missions: first?.missions ?? null,
  }
}
