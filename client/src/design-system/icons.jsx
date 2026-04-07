// SignLingo Design System — Custom Icons
// These are custom SVG icons not available in Lucide
// Import: import { HandMascot, FlameSVG } from '@/design-system/icons'

import { COLORS } from "./colors";

export const HandMascot = ({ size = 64, mood = "happy", className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" className={className} style={{ display: 'block', margin: '0 auto', ...style }}>
    <defs>
      <radialGradient id="bodyGrad" cx="40%" cy="35%">
        <stop offset="0%" stopColor="#A8E063" />
        <stop offset="100%" stopColor="#56AB2F" />
      </radialGradient>
      <radialGradient id="cheekGrad" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#FF9AAA" stopOpacity="0.9"/>
        <stop offset="100%" stopColor="#FF9AAA" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="eyeShine" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="1"/>
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6"/>
      </linearGradient>
    </defs>

    {/* Body — round chubby shape */}
    <ellipse cx="60" cy="68" rx="38" ry="36" fill="url(#bodyGrad)" stroke="#3D8B1F" strokeWidth="2.5"/>

    {/* Little ears/leaves on top */}
    <ellipse cx="38" cy="35" rx="8" ry="12" fill="url(#bodyGrad)" stroke="#3D8B1F" strokeWidth="2" transform="rotate(-25 38 35)"/>
    <ellipse cx="82" cy="35" rx="8" ry="12" fill="url(#bodyGrad)" stroke="#3D8B1F" strokeWidth="2" transform="rotate(25 82 35)"/>

    {/* Cheeks (drawn behind eyes) */}
    <circle cx="32" cy="72" r="9" fill="url(#cheekGrad)"/>
    <circle cx="88" cy="72" r="9" fill="url(#cheekGrad)"/>

    {/* Big sparkly eyes */}
    <ellipse cx="46" cy="62" rx="7" ry="9" fill="#1a1a1a"/>
    <ellipse cx="74" cy="62" rx="7" ry="9" fill="#1a1a1a"/>

    {/* Eye shine — top */}
    <circle cx="48" cy="58" r="2.8" fill="url(#eyeShine)"/>
    <circle cx="76" cy="58" r="2.8" fill="url(#eyeShine)"/>
    {/* Eye shine — bottom small */}
    <circle cx="44" cy="66" r="1.2" fill="white" opacity="0.9"/>
    <circle cx="72" cy="66" r="1.2" fill="white" opacity="0.9"/>

    {/* Mouth */}
    {mood === "happy" ? (
      <path d="M 50 80 Q 60 88 70 80" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>
    ) : mood === "excited" ? (
      <path d="M 48 78 Q 60 92 72 78 Q 60 84 48 78 Z" fill="#1a1a1a" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round"/>
    ) : (
      <path d="M 52 82 Q 60 84 68 82" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>
    )}
  </svg>
);

export const FlameSVG = ({ size = 24, color = COLORS.orange }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C12 2 4 10 4 15C4 19.4 7.6 22 12 22C16.4 22 20 19.4 20 15C20 10 12 2 12 2Z" fill={color}/>
    <path d="M12 8C12 8 8 13 8 16C8 18.2 9.8 20 12 20C14.2 20 16 18.2 16 16C16 13 12 8 12 8Z" fill={COLORS.yellow}/>
    <path d="M12 13C12 13 10 15.5 10 17C10 18.1 10.9 19 12 19C13.1 19 14 18.1 14 17C14 15.5 12 13 12 13Z" fill="white"/>
  </svg>
);

// Accuracy gauge ring for lesson play
export const AccuracyGauge = ({ score, size = 120 }) => {
  const acc = COLORS;
  const r = (size - 10) / 2;
  const c = r * 2 * Math.PI;
  const color = score >= 80 ? acc.green : score >= 50 ? acc.yellow : acc.red;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke={COLORS.gray200} strokeWidth={10} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={10} fill="none"
          strokeDasharray={c} strokeDashoffset={c - (score/100)*c} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease" }}/>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black" style={{ color }}>{score}%</span>
        <span className="text-xs font-bold" style={{ color: COLORS.gray600 }}>
          {score >= 80 ? "Great!" : score >= 50 ? "Almost!" : "Try again"}
        </span>
      </div>
    </div>
  );
};
