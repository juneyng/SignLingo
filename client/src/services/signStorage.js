/**
 * Storage for recorded sign reference data — Supabase only.
 * Table:   sign_recordings
 * Bucket:  sign-videos (public)
 */

import { supabase, isSupabaseConfigured } from './supabase'

const VIDEO_BUCKET = 'sign-videos'
const cache = new Map()

/**
 * Fetch all recorded signs from Supabase and cache them.
 */
export async function preloadRecordedSigns() {
  if (!isSupabaseConfigured) {
    console.warn('[signStorage] Supabase NOT configured — recordings will not work')
    return
  }
  try {
    const { data, error } = await supabase
      .from('sign_recordings')
      .select('*')
    if (error) throw error
    console.log(`[signStorage] Loaded ${data?.length || 0} recordings from Supabase`)
    for (const row of data || []) {
      cache.set(row.sign_id, {
        sequence: row.sequence,
        landmarks: row.landmarks,
        poseLandmarks: row.pose_landmarks,
        refHandPosition: row.ref_hand_position,
        videoUrl: row.video_url,
        totalFrames: row.total_frames,
        savedAt: row.uploaded_at,
      })
    }
  } catch (e) {
    console.error('[signStorage] preload failed:', e.message)
  }
}

export function getRecordedSign(signId) {
  return cache.get(signId) || null
}

export function getRecordedSigns() {
  const result = {}
  for (const [k, v] of cache.entries()) result[k] = v
  return result
}

export function getRecordedCount() {
  return cache.size
}

/**
 * Save recording to Supabase (table + Storage).
 */
export async function saveRecordedSign(signId, data, videoBlob = null) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured')
  }

  let videoUrl = null
  if (videoBlob) {
    const ext = (videoBlob.type?.split('/')[1] || 'mp4').replace(/[^a-z0-9]/g, '')
    const path = `${signId}.${ext}`
    const { error: upErr } = await supabase.storage
      .from(VIDEO_BUCKET)
      .upload(path, videoBlob, { upsert: true, contentType: videoBlob.type || 'video/mp4' })
    if (upErr) {
      console.warn('[signStorage] video upload failed:', upErr.message)
    } else {
      const { data: urlData } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path)
      videoUrl = urlData.publicUrl
    }
  }

  const row = {
    sign_id: signId,
    sequence: data.sequence,
    landmarks: data.landmarks,
    pose_landmarks: data.poseLandmarks,
    ref_hand_position: data.refHandPosition,
    video_url: videoUrl,
    total_frames: data.totalFrames,
    duration: data.duration,
    detection_rate: data.detectionRate,
    uploaded_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('sign_recordings').upsert(row)
  if (error) throw error

  cache.set(signId, {
    sequence: data.sequence,
    landmarks: data.landmarks,
    poseLandmarks: data.poseLandmarks,
    refHandPosition: data.refHandPosition,
    videoUrl,
    totalFrames: data.totalFrames,
    savedAt: row.uploaded_at,
  })
}

export async function deleteRecordedSign(signId) {
  cache.delete(signId)
  if (!isSupabaseConfigured) return
  await supabase.from('sign_recordings').delete().eq('sign_id', signId)
  for (const ext of ['mp4', 'webm', 'mov']) {
    try { await supabase.storage.from(VIDEO_BUCKET).remove([`${signId}.${ext}`]) } catch {}
  }
}

export async function getSignVideo(signId) {
  const cached = cache.get(signId)
  return cached?.videoUrl || null
}
