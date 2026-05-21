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

// Leaderboard — uses a security-definer RPC because user_progress and
// profiles both have RLS restricting SELECT to the owner. The RPC only
// returns public-safe columns (user_id, display_name, xp, streak).
export async function fetchLeaderboard(limit = 20) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: limit })
  if (error) throw error
  return (data || []).map((r) => ({
    user_id: r.user_id,
    xp: r.xp,
    streak: r.streak,
    total_points: r.xp, // legacy alias for older callers
    profiles: { display_name: r.display_name },
  }))
}

// ============================================================
// Profile
// ============================================================

export async function fetchProfile(userId) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email, consent_at, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Update the caller's profile. `updates` may include display_name
 * and/or consent_at. RLS guarantees the user can only update their
 * own row.
 */
export async function updateProfile(userId, updates) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle()
  if (error) throw error
  return data
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
