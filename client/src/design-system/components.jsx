// SignLingo Design System — Shared Components
// Import: import { Button3D, Card3D, ProgressRing, ... } from '@/design-system/components'

import { COLORS } from "./colors";
import { Star, Check, Lock, ChevronRight } from "lucide-react";

// ============================================================
// BUTTON — 3D raised button (Duolingo signature)
// ============================================================
export const Button3D = ({
  children,
  color = COLORS.green,
  darkColor = COLORS.greenDark,
  textColor = "white",
  onClick,
  size = "md",
  fullWidth = false,
  disabled = false,
  icon = null,
  className = "",
}) => {
  const sizes = {
    xs: "px-3 py-1 text-xs",
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3.5 text-lg",
    xl: "px-10 py-4 text-xl",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? COLORS.gray300 : color,
        borderBottom: `4px solid ${disabled ? COLORS.gray400 : darkColor}`,
        color: textColor,
        width: fullWidth ? "100%" : "auto",
      }}
      className={`${sizes[size]} font-bold rounded-2xl transition-all duration-100
        ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer active:translate-y-[2px] active:border-b-[2px] hover:brightness-110"}
        flex items-center justify-center gap-2 ${className}`}
    >
      {icon}{children}
    </button>
  );
};

// Secondary button variant (outline)
export const ButtonOutline = ({
  children, color = COLORS.green, onClick, size = "md", fullWidth = false, icon = null, className = "",
}) => {
  const sizes = { sm: "px-4 py-1.5 text-sm", md: "px-6 py-2.5 text-base", lg: "px-8 py-3.5 text-lg" };
  return (
    <button onClick={onClick}
      style={{ border: `2px solid ${color}`, color, width: fullWidth ? "100%" : "auto" }}
      className={`${sizes[size]} font-bold rounded-2xl transition-all duration-150 bg-transparent
        hover:bg-opacity-10 cursor-pointer flex items-center justify-center gap-2 ${className}`}
    >
      {icon}{children}
    </button>
  );
};

// ============================================================
// CARD — 3D card with thick bottom border
// ============================================================
export const Card3D = ({
  children, color = COLORS.gray200, className = "", padding = "p-4", onClick = null,
}) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl ${padding} ${onClick ? "cursor-pointer hover:scale-[1.02] transition-transform" : ""} ${className}`}
    style={{ border: `2px solid ${color}`, borderBottom: `4px solid ${color}` }}
  >
    {children}
  </div>
);

// Colored accent card (for entry points like "AI Conversation", "Quick Challenge")
export const AccentCard = ({
  children, color = COLORS.green, darkColor = COLORS.greenDark, onClick, className = "",
}) => (
  <div
    onClick={onClick}
    className={`rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition-all ${className}`}
    style={{ background: `linear-gradient(135deg, ${color}, ${darkColor})`, borderBottom: `4px solid ${darkColor}` }}
  >
    {children}
  </div>
);

// ============================================================
// PROGRESS INDICATORS
// ============================================================
export const ProgressRing = ({ progress, size = 56, strokeWidth = 5, color = COLORS.green, showText = false }) => {
  const r = (size - strokeWidth) / 2;
  const c = r * 2 * Math.PI;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke={COLORS.gray200} strokeWidth={strokeWidth} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={c} strokeDashoffset={c - (progress/100)*c} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}/>
      </svg>
      {showText && (
        <span className="absolute text-xs font-black" style={{ color }}>{Math.round(progress)}%</span>
      )}
    </div>
  );
};

export const ProgressBar = ({ progress, color = COLORS.green, height = "h-2", className = "" }) => (
  <div className={`w-full ${height} rounded-full ${className}`} style={{ background: COLORS.gray200 }}>
    <div className={`${height} rounded-full transition-all duration-700`}
      style={{ width: `${Math.min(progress, 100)}%`, background: color }}/>
  </div>
);

// ============================================================
// STAR RATING
// ============================================================
export const StarRating = ({ count, total = 3, size = 14 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: total }, (_, i) => (
      <Star key={i} size={size} fill={i < count ? COLORS.yellow : COLORS.gray200}
        stroke={i < count ? COLORS.yellowDark : COLORS.gray300} strokeWidth={1.5}/>
    ))}
  </div>
);

// ============================================================
// BADGE / TAG
// ============================================================
export const Badge = ({ children, color = COLORS.green, bg = null, className = "" }) => (
  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${className}`}
    style={{ background: bg || color + "18", color }}>
    {children}
  </span>
);

export const XPBadge = ({ xp, size = "sm" }) => (
  <Badge color={COLORS.orange}>+{xp} XP</Badge>
);

// ============================================================
// STAT CARD (streak, XP, etc.)
// ============================================================
export const StatCard = ({ icon, value, label, color = COLORS.orange }) => (
  <div className="p-3 rounded-2xl" style={{ background: color + "12", borderBottom: `3px solid ${color}30` }}>
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xl font-black" style={{ color }}>{value}</span>
    </div>
    <p className="text-[10px] font-bold mt-1" style={{ color: COLORS.gray600 }}>{label}</p>
  </div>
);

// ============================================================
// SIDEBAR ITEM
// ============================================================
export const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick}
    className="w-full flex flex-col items-center gap-1 py-3 px-2 rounded-2xl transition-all hover:scale-105 cursor-pointer relative"
    style={{ background: active ? COLORS.greenLight : "transparent" }}>
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full" style={{ background: COLORS.green }}/>}
    <Icon size={22} strokeWidth={2.5} color={active ? COLORS.green : COLORS.gray400}/>
    <span className="text-[10px] font-extrabold" style={{ color: active ? COLORS.green : COLORS.gray400 }}>{label}</span>
  </button>
);

// ============================================================
// MISSION CARD
// ============================================================
export const MissionCard = ({ icon, title, progress, target, xp }) => {
  const done = progress >= target;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]"
      style={{ background: done ? COLORS.greenLight : COLORS.bg, border: `2px solid ${done ? COLORS.green + "60" : "transparent"}` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: done ? COLORS.green : COLORS.white, color: done ? "white" : COLORS.gray600,
          border: done ? "none" : `2px solid ${COLORS.gray200}` }}>
        {done ? <Check size={18} strokeWidth={3}/> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: COLORS.gray800 }}>{title}</p>
        <ProgressBar progress={(progress/target)*100} color={done ? COLORS.green : COLORS.blue} height="h-2" className="mt-1.5"/>
      </div>
      <XPBadge xp={xp}/>
    </div>
  );
};

// ============================================================
// LEARNING PATH NODE
// ============================================================
export const PathNode = ({ icon, title, desc, status, stars = 0, index, total, onStart }) => {
  const done = status === "completed";
  const current = status === "current";
  const locked = status === "locked";
  const offset = index % 2 === 0 ? -48 : 48;

  return (
    <div className="flex flex-col items-center relative" style={{ marginLeft: offset }}>
      {/* Connector */}
      {index < total - 1 && (
        <div className="absolute top-full w-1 h-12" style={{
          background: done ? COLORS.green : COLORS.gray200,
          left: "50%", transform: "translateX(-50%)",
        }}/>
      )}
      <div className="relative group cursor-pointer">
        {current && <div className="absolute -inset-2 rounded-full opacity-20 animate-ping" style={{ background: COLORS.green }}/>}
        <div className={`w-[68px] h-[68px] rounded-full flex items-center justify-center relative z-10 transition-transform hover:scale-110
          ${current ? "animate-bounce" : ""}`}
          style={{
            background: done ? COLORS.green : current ? COLORS.blue : COLORS.gray200,
            borderBottom: `4px solid ${done ? COLORS.greenDark : current ? COLORS.blueDark : COLORS.gray300}`,
            color: locked ? COLORS.gray400 : "white",
          }}>
          {done ? <Check size={30} strokeWidth={3}/> : locked ? <Lock size={22}/> : icon}
        </div>
        {done && <div className="flex justify-center mt-1.5"><StarRating count={stars}/></div>}

        {/* Tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 bg-white rounded-2xl shadow-xl p-4
          opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-20 w-48"
          style={{ borderBottom: `4px solid ${done ? COLORS.green : current ? COLORS.blue : COLORS.gray200}` }}>
          <p className="font-extrabold text-sm" style={{ color: COLORS.gray800 }}>{title}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.gray600 }}>{desc}</p>
          {done && <div className="mt-2"><StarRating count={stars} size={16}/></div>}
          {current && <div className="mt-3"><Button3D size="sm" fullWidth onClick={onStart}>Start</Button3D></div>}
          {locked && <p className="text-xs mt-2 font-bold" style={{ color: COLORS.gray400 }}>Complete previous to unlock</p>}
        </div>
      </div>
      <p className="text-xs font-extrabold mt-1" style={{ color: done ? COLORS.green : current ? COLORS.blue : COLORS.gray400 }}>
        {title}
      </p>
    </div>
  );
};

// ============================================================
// LEADERBOARD ROW
// ============================================================
export const LeaderboardRow = ({ rank, name, xp, isMe = false }) => (
  <div className="flex items-center gap-2.5 py-2 px-2.5 rounded-xl mb-1"
    style={{ background: isMe ? COLORS.greenLight : "transparent" }}>
    <span className="text-sm font-black w-5 text-center" style={{
      color: rank === 1 ? COLORS.yellow : rank === 2 ? COLORS.gray400 : rank === 3 ? "#CD7F32" : COLORS.gray400
    }}>{rank}</span>
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
      style={{ background: isMe ? COLORS.green : COLORS.gray100, color: isMe ? "white" : COLORS.gray600 }}>
      {name[0]}
    </div>
    <span className="flex-1 text-sm font-bold" style={{ color: isMe ? COLORS.green : COLORS.gray800 }}>{name}</span>
    <span className="text-xs font-bold" style={{ color: COLORS.gray600 }}>{xp.toLocaleString()}</span>
  </div>
);

// ============================================================
// PAGE LAYOUT WRAPPER
// ============================================================
export const PageLayout = ({ children, sidebar = null, rightPanel = null }) => (
  <div className="min-h-screen flex" style={{ background: COLORS.bg, fontFamily: "'Nunito', sans-serif" }}>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
    {sidebar}
    <main className="flex-1 flex">
      {children}
    </main>
    {rightPanel}
    <style>{`
      * { box-sizing: border-box; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-thumb { background: ${COLORS.gray300}; border-radius: 4px; }
      @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    `}</style>
  </div>
);

// ============================================================
// GREETING BANNER
// ============================================================
export const GreetingBanner = ({ message, subtitle, streak, mascotMood = "happy" }) => {
  // Import HandMascot and FlameSVG from icons.jsx where this is used
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: `linear-gradient(135deg, ${COLORS.green}, #4DB800)`, borderBottom: `5px solid ${COLORS.greenDark}` }}>
      <div className="flex-shrink-0" style={{ animation: "bounce 2s infinite" }}>
        {/* Place <HandMascot> here */}
      </div>
      <div className="text-white flex-1">
        <h2 className="text-xl font-black leading-tight">{message}</h2>
        <p className="text-sm opacity-90 mt-1 font-semibold">{subtitle}</p>
      </div>
      {streak && (
        <div className="flex items-center gap-1 bg-white/20 rounded-xl px-3 py-2">
          {/* Place <FlameSVG> here */}
          <span className="text-white font-black text-lg">{streak}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================
// FEEDBACK CARD (for lesson play)
// ============================================================
export const FeedbackCard = ({ type = "hint", message }) => {
  const config = {
    success: { bg: COLORS.greenBg, border: COLORS.green, color: COLORS.greenDark, icon: "✓" },
    hint: { bg: COLORS.yellowBg, border: COLORS.yellow, color: COLORS.orangeDark, icon: "💡" },
    error: { bg: COLORS.redBg, border: COLORS.red, color: COLORS.redDark, icon: "✗" },
  };
  const c = config[type];
  return (
    <div className="rounded-xl p-3 flex items-start gap-2"
      style={{ background: c.bg, border: `2px solid ${c.border}40` }}>
      <span className="text-lg leading-none">{c.icon}</span>
      <p className="text-sm font-bold" style={{ color: c.color }}>{message}</p>
    </div>
  );
};
