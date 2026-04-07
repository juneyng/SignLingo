/**
 * Storage for recorded sign reference data.
 * - sequence data → localStorage (small, fast)
 * - video files → IndexedDB (large files OK)
 */

const STORAGE_KEY = 'signlingo_recorded_signs'
const DB_NAME = 'signlingo_videos'
const DB_VERSION = 1
const STORE_NAME = 'videos'

// ============================================================
// Sequence data (localStorage)
// ============================================================
export function getRecordedSigns() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveRecordedSign(signId, data) {
  const all = getRecordedSigns()
  all[signId] = {
    sequence: data.sequence,
    landmarks: data.landmarks,
    poseLandmarks: data.poseLandmarks,
    refHandPosition: data.refHandPosition,
    savedAt: new Date().toISOString(),
    totalFrames: data.totalFrames,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function getRecordedSign(signId) {
  const all = getRecordedSigns()
  return all[signId] || null
}

export function deleteRecordedSign(signId) {
  const all = getRecordedSigns()
  delete all[signId]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function getRecordedCount() {
  return Object.keys(getRecordedSigns()).length
}

// ============================================================
// Video files (IndexedDB)
// ============================================================
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveSignVideo(signId, videoBlob) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(videoBlob, signId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getSignVideo(signId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(signId)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteSignVideo(signId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(signId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
