/**
 * Utility script for recording reference sign data.
 * Run this in the browser via the /record page (to be implemented).
 * This file serves as documentation for the recording data format.
 *
 * Recording process:
 * 1. Initialize MediaPipe hand tracking
 * 2. Capture normalized landmarks for 3 seconds
 * 3. For static signs: save single frame's landmarks
 * 4. For dynamic signs: save landmark sequence over the capture window
 * 5. Export as JSON matching the Sign schema
 */

const SIGN_TEMPLATE = {
  id: '',           // e.g., "hello_001"
  name_ko: '',      // Korean name
  name_en: '',      // English name
  category: '',     // e.g., "greetings", "fingerspelling"
  type: 'static',   // "static" or "dynamic"
  difficulty: 1,    // 1-5
  landmarks: [],    // For static: [[x, y, z], ...] (21 points)
  landmark_sequence: null, // For dynamic: array of landmark frames
  video_url: null,
  description: '',
  tips: '',
}

console.log('Sign recording template:', JSON.stringify(SIGN_TEMPLATE, null, 2))
console.log('Use the /record page in the web app to capture sign data.')
