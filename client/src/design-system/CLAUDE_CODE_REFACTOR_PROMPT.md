# SignLingo — Claude Code 디자인 리팩토링 프롬프트

## 사용법
1. `design-system/` 폴더를 `client/src/` 안에 넣어
2. 아래 메인 프롬프트를 Claude Code에 붙여넣어 전체 리팩토링 시작
3. 페이지별 프롬프트는 메인 리팩토링 후 하나씩 진행

---

## 0단계: 사전 설치

```
Install the Nunito font and lucide-react if not already installed:
npm install lucide-react

Add this to index.html <head>:
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">

In tailwind.config.js, add Nunito as the default font:
fontFamily: { sans: ['Nunito', 'sans-serif'] }
```

---

## 1단계: 메인 리팩토링 프롬프트

```
Read the design system files in src/design-system/:
- colors.js (color tokens — ALWAYS use COLORS.xxx, NEVER hardcode hex values)
- components.jsx (shared UI components)
- icons.jsx (custom SVG icons — HandMascot, FlameSVG, AccuracyGauge)

This is the SignLingo design system inspired by Duolingo. Apply it across ALL pages.

CRITICAL DESIGN RULES — follow these exactly:

1. COLORS: Always import from '@/design-system/colors'. Never hardcode hex values. Use COLORS.green, COLORS.blue, etc.

2. BUTTONS: Never use plain <button> or generic styled buttons. Always use <Button3D> from the design system. It has the signature thick bottom-border 3D raised effect. Buttons press down on click (active:translate-y-[2px]).

3. CARDS: Use <Card3D> for all card containers. They have 2px border + 4px bottom border for depth. Never use plain div with shadow-md/shadow-lg.

4. ICONS: Use lucide-react for ALL icons. Never use emoji (🏠, 📚, etc.) — emoji look like Windows defaults and scream "AI generated". Import specific icons: { Home, BookOpen, MessageCircle, Trophy, BarChart3, Settings, Target, Clock, Zap, Gift, Lock, Check, Star, Heart, Hash, Users, Smile, HandMetal, Volume2, Play, Award, ChevronRight, ArrowLeft, X } from "lucide-react".

5. FONT: All text uses Nunito. Headings: font-black (900 weight). Subheadings: font-extrabold (800). Body: font-bold (700). Small text: font-semibold (600). Never use font-normal for visible text — everything should feel chunky and friendly.

6. BORDER RADIUS: Always rounded-2xl (16px) for cards and buttons. rounded-xl (12px) for smaller elements. rounded-full for avatars and circular elements. Never use rounded-md or rounded-lg.

7. SPACING: Generous whitespace. Use gap-3 to gap-5 between elements. Padding p-4 to p-6 inside cards. Never feel cramped.

8. FEEDBACK STATES:
   - Success: COLORS.green background tint + green border
   - Error: COLORS.red background tint + red border  
   - Warning/Hint: COLORS.yellow background tint + yellow border
   - Use <FeedbackCard type="success|hint|error"> component

9. PROGRESS: Use <ProgressRing> for circular progress, <ProgressBar> for linear. Always animate transitions with transition-all duration-700.

10. ANIMATIONS: 
    - Page load: opacity-0 → opacity-100 with translate-y-6 → translate-y-0 (duration-700)
    - Current/active items: animate-bounce or animate-ping (subtle)
    - Hover: hover:scale-[1.02] for cards, hover:scale-110 for icons
    - Never use no animation — the app should feel alive

11. LAYOUT: Use the 3-column structure:
    - Left: narrow sidebar (76px) with icon nav
    - Center: main content (flex-1, max-w-xl)
    - Right: info panel (300px) with stats/missions
    - Some pages (LessonPlay) use full-width center instead

12. MASCOT: Use <HandMascot> from icons.jsx in greeting banners, empty states, and success screens. It has mood props: "happy", "excited", "neutral".

13. GAMIFICATION always visible: Streak flame + XP counter should appear in top nav or sidebar on every page. Use <FlameSVG> and orange color for streak, <Star> for XP.

Now refactor all existing pages to follow these rules. Start with the layout wrapper and navigation, then refactor each page one by one.
```

---

## 2단계: 페이지별 프롬프트

### Home Dashboard
```
Refactor the Home page using the design system.

Structure:
- Left sidebar: SidebarItem components with Lucide icons (Home, BookOpen, MessageCircle, Trophy, BarChart3, Settings)
- Center: GreetingBanner at top with HandMascot, then Unit header with ProgressRing, then learning path using PathNode components in zigzag layout (marginLeft alternating -48/48px)
- Right panel: Profile mini card, StatCards (streak + XP), MissionCards, Button3D for AI Conversation (purple) and Quick Challenge (blue), LeaderboardRows

Reference the working example in SignLingo_Home_v2.jsx for exact layout and component usage.
```

### Lesson Play
```
Refactor the Lesson Play page — this is the most important screen.

Layout: Full-width (no sidebar), clean focus mode.

Top bar:
- ArrowLeft icon + lesson title (left)
- ProgressBar showing "Sign 2 of 5" (center)  
- X icon to close (right)

Main: Two equal panels side by side.

LEFT PANEL "Reference":
- Video player area (rounded-2xl, border using Card3D)
- Sign name in large font-black text (Korean + English)
- Description text
- Button3D "Replay Demo" (blue, with Play icon)
- 3 keyframe thumbnails at bottom

RIGHT PANEL "Your Practice":
- Webcam feed area (rounded-2xl, lime green dashed border)
- AccuracyGauge component below (from icons.jsx) — large circular gauge
- FeedbackCard below gauge (type based on score: success/hint/error)
- Button3D "Next Sign →" (green, when passed) or ButtonOutline "Try Again" (when failed)

Bottom: horizontal dots showing all signs in lesson
- Completed: green circle with Check icon
- Current: blue circle, animate-ping
- Upcoming: gray circle

Use ACCURACY_COLOR helper from colors.js for dynamic coloring.
```

### Lesson Select
```
Refactor the Lesson Select page.

Layout: 3-column (sidebar + center + right panel).

Center content:
- Breadcrumb: "Home > Lessons" with ChevronRight
- Title: "Learn Korean Sign Language" font-black
- Learning path: vertical zigzag PathNode layout grouped by Unit
- Unit headers: "UNIT 1: Greetings", "UNIT 2: Numbers", etc.
- Each unit has 5-7 PathNode components connected by vertical lines
- Completed nodes: green + Check + StarRating
- Current node: blue + animate-bounce
- Locked nodes: gray + Lock icon

Right panel: same as Home (stats + missions + leaderboard)
```

### AI Conversation Mode
```
Refactor the AI Conversation page.

Layout: Full-width focus mode (no sidebar), purple (#CE82FF) theme accent.

Top bar: ArrowLeft + "AI Conversation — At a Cafe" + X close button. Use purple accent.

3-column layout:
LEFT (narrow): Scenario card with Card3D. Conversation script as step list — completed steps green Check, current step purple highlight, upcoming gray.

CENTER (wide): Split vertically:
- Top: AI partner video area with "AI Partner" Badge in purple
- Bottom: User webcam with "You" Badge in blue
- AccuracyGauge between them

RIGHT (narrow): Expected sign reference, hint Button3D (yellow), FeedbackCard

Bottom: ProgressBar showing conversation progress in purple.

All buttons in this mode use purple color scheme instead of green.
```

### Mission / Game Mode
```
Refactor the Mission page.

Layout: 3-column.

Center content:
- "Today's Missions" section with MissionCard components
- "Quick Challenge" section: 3 AccentCards in a row
  - Speed Round: green AccentCard
  - Accuracy Challenge: blue AccentCard  
  - Sign Quiz: purple AccentCard
- "Achievements" section: horizontal scroll of achievement badges
  - Earned: colored circular badge with icon
  - Locked: gray with Lock overlay

Right panel: stats + leaderboard
```

### Profile & Statistics
```
Refactor the Profile page.

Layout: 3-column.

Center content:
- Profile card: avatar + name + level + edit ButtonOutline
- 4 StatCards in a grid (XP, Signs Mastered, Streak, Avg Accuracy)
- "Learning Activity" bar chart (use Recharts, bars in COLORS.green)
- "Vocabulary Mastery" grid: Card3D for each sign, color-coded border (green/yellow/red based on accuracy)
- Filter tabs using Button3D (sm size): All, Mastered, Needs Practice

Right panel: leaderboard (full, top 10)
```

### Lesson Complete (Success Screen)
```
Refactor the Lesson Complete overlay screen.

Full-screen overlay with semi-transparent dark background.

Centered Card3D (large, max-w-md):
- HandMascot with mood="excited" at top, large size
- "Lesson Complete!" font-black text-2xl
- Lesson name subtitle
- 3 StatCards in a row (Signs Learned, Avg Accuracy, XP Earned)
- StarRating (large, size=32)
- Button3D "Next Lesson →" (green, lg, fullWidth)
- ButtonOutline "Review This Lesson" below
- "+50 XP" Badge floating animation

Background: CSS confetti animation (green, yellow, orange particles)
```

### Settings
```
Refactor the Settings page.

Layout: 3-column. Left sidebar shows settings categories with SidebarItem-style navigation.

Center: Card3D sections for each setting group:
- Daily Goal: 3 selectable Card3D options with green border when selected
- Feedback Language: styled dropdown with rounded-2xl
- Accuracy Threshold: styled range slider, green track
- Hand Preference: toggle buttons using Button3D (sm)
- Sound Effects: custom toggle switches (green when ON)

Bottom: Button3D "Save Changes" (green, lg)
```

### Onboarding
```
Refactor the Onboarding flow.

Full-screen, no sidebar. Centered max-w-lg.

Top: 3 dots progress indicator (green filled for completed, blue for current, gray for upcoming)

HandMascot at top of each step with different moods.

Step cards: Card3D with selectable options. Selected option has green border + greenLight background + Check icon.

Navigation: Button3D "Next" (green) at bottom right. "Back" text link at bottom left.

Final step: large Button3D "Start Learning!" (green, xl, fullWidth) with HandMascot mood="excited" above.
```

### Landing Page
```
Refactor the Landing page for non-logged-in users.

Full-width, no sidebar.

Top nav: SignLingo logo (HandMascot small + text) left, "Log In" ButtonOutline + "Get Started" Button3D (green) right.

Hero section:
- Left: Large font-black headline, subtitle in font-semibold gray600, Button3D "Start Learning Free" (green, lg), ButtonOutline "Watch Demo" (gray)
- Right: Mockup image/illustration area with Card3D showing lesson play preview

Features: 3 Card3D in a row with Lucide icons (not emoji), each with colored top accent border (blue, purple, orange)

"How It Works": 4 steps connected by dotted line, each step is a numbered circle (green) with icon and label below

Footer: minimal, gray600 text, links separated by dots
```
