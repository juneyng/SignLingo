import { useState } from 'react'
import { Check, Gift } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { ProgressBar, Badge } from '@/design-system/components'
import useProgress from '@/hooks/useProgress'

/**
 * Single daily-mission row used in both the right rail and MissionMode.
 *
 * Visual states:
 *   - In progress:   progress bar, reward badges (XP/★)
 *   - Completed:     green pill + "Claim" button
 *   - Claimed:       gray pill + check icon (no action)
 */
export default function DailyMissionCard({
  icon,
  title,
  missionKey,        // 'signs' | 'quiz' | 'challenge'
  progress,          // current count
  target,            // target count (use 1 for boolean missions)
  xp,
  stars,
  isCompleted,
  isClaimed,
  compact = false,
}) {
  const { claimMission } = useProgress()
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState(null) // { xp, stars }

  const handleClaim = async () => {
    if (busy || isClaimed || !isCompleted) return
    setBusy(true)
    try {
      const result = await claimMission(missionKey)
      if (result?.claimed) {
        setFlash({ xp: result.xpGranted, stars: result.starsGranted })
        setTimeout(() => setFlash(null), 2400)
      }
    } finally {
      setBusy(false)
    }
  }

  const pct = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0
  const borderColor = isClaimed ? COLORS.gray300 : isCompleted ? COLORS.green : COLORS.gray200

  return (
    <div
      className="rounded-2xl p-3 bg-white relative transition-all"
      style={{
        border: `2px solid ${borderColor}`,
        borderBottom: `3px solid ${borderColor}`,
        opacity: isClaimed ? 0.6 : 1,
      }}
    >
      {flash && (
        <div
          className="absolute inset-0 rounded-2xl flex items-center justify-center font-black text-sm pointer-events-none"
          style={{
            background: `${COLORS.green}E0`,
            color: 'white',
            animation: 'flashIn 400ms ease-out',
          }}
        >
          +{flash.xp} XP {flash.stars > 0 ? `· +${flash.stars} ★` : ''}
        </div>
      )}

      <div className="flex items-start gap-2">
        <div className="shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`font-extrabold ${compact ? 'text-xs' : 'text-sm'} truncate`}
              style={{ color: isClaimed ? COLORS.gray400 : COLORS.gray800 }}>
              {title}
            </p>
            <span className="text-[11px] font-black shrink-0"
              style={{ color: isCompleted ? COLORS.green : COLORS.gray400 }}>
              {Math.min(progress, target)}/{target}
            </span>
          </div>

          <div className="mt-1.5">
            <ProgressBar progress={pct} color={isCompleted ? COLORS.green : COLORS.blue} height="h-1.5" />
          </div>

          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-1.5">
              <Badge color={COLORS.yellow}>+{xp} XP</Badge>
              {stars > 0 && <Badge color={COLORS.yellow}>+{stars} ★</Badge>}
            </div>

            {isClaimed ? (
              <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg"
                style={{ background: COLORS.gray100, color: COLORS.gray500 }}>
                <Check size={12} strokeWidth={3} />
                {'CLAIMED'}
              </span>
            ) : isCompleted ? (
              <button
                onClick={handleClaim}
                disabled={busy}
                className="text-[11px] font-black px-2.5 py-1 rounded-lg cursor-pointer transition-transform active:translate-y-[1px] flex items-center gap-1"
                style={{
                  background: COLORS.green,
                  color: 'white',
                  borderBottom: `2px solid ${COLORS.greenDark}`,
                  opacity: busy ? 0.7 : 1,
                }}
              >
                <Gift size={12} strokeWidth={3} />
                {busy ? '...' : 'CLAIM'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes flashIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
