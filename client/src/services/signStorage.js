/**
 * Storage for recorded sign reference data — backed by Supabase.
 * Table:   sign_recordings
 * Bucket:  sign-videos (public)
 *
 * In-memory cache keeps recent lookups fast.
 * When Supabase isn't configured, falls back to localStorage/IndexedDB.
 */

import { supabase, isSupabaseConfigured } from './supabase'

const VIDEO_BUCKET = 'sign-videos'

// ============================================================
// In-memory cache
// ============================================================
const cache = new Map() // signId → { sequence, landmarks, poseLandmarks, refHandPosition, videoUrl }
const videoCache = new Map() // signId → object URL (for IndexedDB fallback)

// ============================================================
// Public API (mostly async now — update callers)
// ============================================================

/**
 * Fetch all recorded signs once and cache them.
 * Call early on app start to warm the cache.
 */
export async function preloadRecordedSigns() {
  if (!isSupabaseConfigured) {
    console.log('[signStorage] Supabase NOT configured — using localStorage only')
    return
  }
  try {
    const { data, error } = await supabase
      .from('sign_recordings')
      .select('*')
    if (error) throw error
    console.log(`[signStorage] Loaded ${data?.length || 0} recordings from Supabase:`,
      data?.map(r => ({
        sign_id: r.sign_id,
        hasSequence: !!r.sequence,
        sequenceFrames: r.sequence?.length || 0,
        hasVideo: !!r.video_url,
      })))
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
    console.error('[signStorage] preload failed:', e.message, e)
  }
}

/**
 * Synchronous lookup from cache (used in comparison hot path).
 * Returns null if not in cache.
 */
export function getRecordedSign(signId) {
  if (cache.has(signId)) return cache.get(signId)
  // Fallback to legacy localStorage entry if present
  try {
    const legacy = JSON.parse(localStorage.getItem('signlingo_recorded_signs') || '{}')
    if (legacy[signId]) return legacy[signId]
  } catch {}
  return null
}

/**
 * Get all currently cached sign recordings (for listings).
 */
export function getRecordedSigns() {
  const result = {}
  for (const [k, v] of cache.entries()) result[k] = v
  return result
}

export function getRecordedCount() {
  return cache.size
}

/**
 * Save a recording to Supabase (table + Storage).
 * @param {string} signId
 * @param {object} data - { sequence, landmarks, poseLandmarks, refHandPosition, totalFrames, duration, detectionRate }
 * @param {Blob|File|null} videoBlob - optional video file
 */
export async function saveRecordedSign(signId, data, videoBlob = null) {
  if (!isSupabaseConfigured) {
    // Fallback: localStorage only
    const legacy = JSON.parse(localStorage.getItem('signlingo_recorded_signs') || '{}')
    legacy[signId] = {
      sequence: data.sequence,
      landmarks: data.landmarks,
      poseLandmarks: data.poseLandmarks,
      refHandPosition: data.refHandPosition,
      savedAt: new Date().toISOString(),
      totalFrames: data.totalFrames,
    }
    localStorage.setItem('signlingo_recorded_signs', JSON.stringify(legacy))
    cache.set(signId, legacy[signId])
    if (videoBlob) await saveSignVideoLocal(signId, videoBlob)
    return
  }

  // 1. Upload video to Storage (if provided)
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

  // 2. Upsert row into sign_recordings
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
  console.log('[signStorage] Upserting row:', {
    sign_id: row.sign_id,
    sequenceFrames: row.sequence?.length,
    hasLandmarks: !!row.landmarks,
    hasVideoUrl: !!row.video_url,
  })
  const { error } = await supabase.from('sign_recordings').upsert(row)
  if (error) {
    console.error('[signStorage] Upsert FAILED:', error)
    throw error
  }
  console.log('[signStorage] Upsert succeeded for', signId)

  // 3. Update cache
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
  if (!isSupabaseConfigured) {
    const legacy = JSON.parse(localStorage.getItem('signlingo_recorded_signs') || '{}')
    delete legacy[signId]
    localStorage.setItem('signlingo_recorded_signs', JSON.stringify(legacy))
    return
  }
  await supabase.from('sign_recordings').delete().eq('sign_id', signId)
  // Best-effort video delete (ignore errors)
  for (const ext of ['mp4', 'webm', 'mov']) {
    try { await supabase.storage.from(VIDEO_BUCKET).remove([`${signId}.${ext}`]) } catch {}
  }
}

/**
 * Get the video URL for a sign (from cache).
 * Returns null if no video registered.
 */
export function getSignVideoUrl(signId) {
  return cache.get(signId)?.videoUrl || null
}

// ============================================================
// Legacy IndexedDB fallback (only used when Supabase not configured)
// ============================================================
const DB_NAME = 'signlingo_videos'
const DB_VERSION = 1
const STORE_NAME = 'videos'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveSignVideoLocal(signId, videoBlob) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(videoBlob, signId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Get blob or URL for sign video — checks Supabase cache first, then IndexedDB.
 * LessonPlay uses this to show the reference video.
 */
export async function getSignVideo(signId) {
  // Supabase path
  const cached = cache.get(signId)
  if (cached?.videoUrl) return cached.videoUrl

  // Legacy IndexedDB
  try {
    if (videoCache.has(signId)) return videoCache.get(signId)
    const db = await openDB()
    const blob = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(signId)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
    if (blob) {
      const url = URL.createObjectURL(blob)
      videoCache.set(signId, url)
      return url
    }
  } catch {}

  return null
}
