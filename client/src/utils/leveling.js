/**
 * SignLingo level curve.
 *
 * XP needed to advance from level L → L+1:
 *   xpForNext(L) = floor(100 * 1.5^(L - 1))
 *
 * Examples (from the design doc):
 *   Lv1 → Lv2  : 100 XP
 *   Lv5 → Lv6  : ~506 XP
 *   Lv10 → Lv11: ~3844 XP
 *
 * All numbers are cumulative thresholds — the total XP needed
 * to reach a given level (sum of xpForNext from 1 to L-1).
 */

const BASE = 100
const RATIO = 1.5

export function xpForNext(level) {
  return Math.floor(BASE * Math.pow(RATIO, Math.max(0, level - 1)))
}

/**
 * Given total accumulated XP, return current level and progress within it.
 *
 * @param {number} totalXp
 * @returns {{ level, xpInLevel, xpForNext, progress }}
 *   level     : 1-based current level
 *   xpInLevel : XP gained since reaching `level`
 *   xpForNext : XP required to reach `level + 1`
 *   progress  : 0..1 fraction of xpInLevel / xpForNext
 */
export function levelFromXp(totalXp) {
  let remaining = Math.max(0, totalXp)
  let level = 1
  while (true) {
    const need = xpForNext(level)
    if (remaining < need) {
      return {
        level,
        xpInLevel: remaining,
        xpForNext: need,
        progress: need === 0 ? 0 : remaining / need,
      }
    }
    remaining -= need
    level += 1
    if (level > 200) break // safety
  }
  return { level, xpInLevel: 0, xpForNext: xpForNext(level), progress: 0 }
}
