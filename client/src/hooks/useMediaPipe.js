import { useEffect, useRef, useState, useCallback } from 'react'
import { initializeHandTracking, stopHandTracking } from '../services/handTracking'
import { normalizeLandmarks } from '../utils/normalizeLandmarks'

export default function useMediaPipe(videoRef) {
  const [landmarks, setLandmarks] = useState(null)
  const [normalizedLandmarks, setNormalizedLandmarks] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const resultsRef = useRef(null)

  const handleResults = useCallback((results) => {
    resultsRef.current = results
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const raw = results.multiHandLandmarks[0]
      const landmarkArray = raw.map((p) => ({ x: p.x, y: p.y, z: p.z }))
      setLandmarks(landmarkArray)
      setNormalizedLandmarks(normalizeLandmarks(landmarkArray))
    } else {
      setLandmarks(null)
      setNormalizedLandmarks(null)
    }
  }, [])

  useEffect(() => {
    if (!videoRef.current) return

    let cancelled = false

    initializeHandTracking(videoRef.current, handleResults).then(() => {
      if (!cancelled) setIsReady(true)
    })

    return () => {
      cancelled = true
      stopHandTracking()
      setIsReady(false)
    }
  }, [videoRef, handleResults])

  return { landmarks, normalizedLandmarks, isReady, results: resultsRef }
}
