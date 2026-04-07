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
export async function fetchLeaderboard() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('user_progress')
    .select('user_id, total_points, streak, profiles(display_name)')
    .order('total_points', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}
