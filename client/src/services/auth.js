import { supabase, isSupabaseConfigured } from './supabase'

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured — skipping auth')
    return null
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAuthStateChanged(callback) {
  if (!isSupabaseConfigured) {
    callback(null)
    return { unsubscribe: () => {} }
  }
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null)
    }
  )
  return subscription
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
