import { useEffect, useRef, useState } from 'react'
import { Flame } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import useCombo, { comboMultiplier, comboTier } from '@/stores/useCombo'

/**
 * Floating combo counter for LessonPlay.
 * Shows current combo with tier-based glow.
 * Pulses briefly each time the combo increments.
 */
export default function ComboDisplay({ position = 'top-right' }) {
  const combo = useCombo((s) => s.combo)
  const [pulse, setPulse] = useState(false)
  const prevCombo = useRef(combo)

  useEffect(() => {
    if (combo > prevCombo.current && combo >= 2) {
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 320)
      return () => clearTimeout(t)
    }
    prevCombo.current = combo
  }, [combo])

  if (combo < 2) return null

  const tier = comboTier(combo)
  const mult = comboMultiplier(combo)

  const tierStyle = {
    base: { color: COLORS.gray500, glow: COLORS.gray300 },
    warm: { color: COLORS.orange, glow: COLORS.orange },
    hot: { color: COLORS.red, glow: COLORS.red },
    flame: { color: COLORS.purple, glow: COLORS.purple },
    fever: { color: COLORS.yellow, glow: COLORS.yellow },
  }[tier]

  const positionClass = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }[position] || 'top-4 right-4'

  return (
    <div
      className={`absolute ${positionClass} z-20 flex flex-col items-end pointer-events-none select-none`}
      style={{ animation: pulse ? 'comboPulse 320ms ease-out' : undefined }}
    >
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl"
        style={{
          background: `${tierStyle.color}E6`,
          boxShadow: `0 0 24px ${tierStyle.glow}80`,
          border: `2px solid white`,
        }}
      >
        <Flame size={20} strokeWidth={3} color="white" fill="white" />
        <div className="flex items-baseline gap-1 text-white">
          <span className="text-2xl font-black leading-none">{combo}</span>
          <span className="text-xs font-extrabold opacity-80">combo</span>
        </div>
      </div>
      {mult > 1 && (
        <span
          className="text-xs font-black mt-1 px-2 py-0.5 rounded-full"
          style={{
            background: 'white',
            color: tierStyle.color,
            border: `2px solid ${tierStyle.color}`,
          }}
        >
          ×{mult}{tier === 'fever' && ' FEVER'}
        </span>
      )}
      <style>{`
        @keyframes comboPulse {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
