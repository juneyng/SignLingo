# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# SignLingo – Interactive Korean Sign Language Learning Web App

## Project Overview
SignLingo is a web-based interactive application that helps users learn Korean Sign Language (KSL) through real-time webcam-based practice and AI-driven feedback. Users follow structured lessons, replicate sign demonstrations in front of their webcam, and receive instant corrective feedback powered by MediaPipe hand tracking and custom similarity scoring.

This is a university HCI (Human-Computer Interaction) course team project at Handong Global University (AIE42001). The project runs for 10 weeks with 4 team members.

## Core Concept
- MediaPipe Hands extracts 21 hand landmarks (x, y, z) per hand in the browser
- MediaPipe does NOT recognize sign language — it only tracks hand joints
- Our custom code normalizes landmarks, compares them against reference data, and calculates similarity scores
- Reference sign data is self-recorded by team members and stored as normalized landmark JSON
- Static signs: compared using cosine similarity / Euclidean distance
- Dynamic signs (with motion): compared using Dynamic Time Warping (DTW) on landmark sequences over time

## Tech Stack

### Frontend (React)
- React 18+ with Vite
- MediaPipe Hands loaded via CDN (browser-based hand landmark detection)
- Tailwind CSS (via @tailwindcss/vite plugin)
- React Router for navigation
- Zustand for state management
- Recharts for progress dashboard visualization

### Backend (Supabase)
- Supabase (PostgreSQL) for database
- Supabase Auth (Google OAuth) for user authentication
- Supabase Row Level Security (RLS) for data access control
- No separate Express/Node.js backend — frontend talks to Supabase directly

### Key Libraries
- @supabase/supabase-js for Supabase client
- WebRTC API for webcam access

## Commands

```bash
# Install dependencies
cd client && npm install

# Run development server
cd client && npm run dev

# Build for production
cd client && npm run build

# Set up database (run in Supabase SQL Editor)
# Copy contents of supabase/schema.sql
```

## Project Structure
```
signlingo/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # Shared UI (Layout, etc.)
│   │   │   ├── lesson/        # Guided Lesson Mode components
│   │   │   ├── conversation/  # AI Conversation Mode components
│   │   │   ├── game/          # Mission/Game Mode components
│   │   │   └── dashboard/     # Progress dashboard components
│   │   ├── hooks/
│   │   │   ├── useMediaPipe.js    # MediaPipe hand tracking hook
│   │   │   ├── useWebcam.js       # Webcam access hook
│   │   │   └── useAuth.js         # Supabase auth hook
│   │   ├── services/
│   │   │   ├── supabase.js        # Supabase client initialization
│   │   │   ├── handTracking.js    # MediaPipe CDN loading & landmark extraction
│   │   │   ├── signRecognition.js # Landmark normalization & similarity scoring
│   │   │   ├── api.js             # Supabase DB queries
│   │   │   └── auth.js            # Supabase auth (Google OAuth)
│   │   ├── data/signs/            # Reference sign landmark JSON files
│   │   ├── pages/                 # Route pages
│   │   ├── stores/useStore.js     # Zustand store
│   │   └── utils/
│   │       ├── normalizeLandmarks.js  # Hand landmark normalization
│   │       ├── compareSigns.js        # Cosine similarity / Euclidean distance
│   │       ├── dtw.js                 # Dynamic Time Warping
│   │       └── feedbackGenerator.js   # Corrective feedback messages
│   └── package.json
├── supabase/
│   └── schema.sql             # Database schema + seed data + RLS policies
├── scripts/
│   └── recordSign.js          # Reference sign recording utility
└── CLAUDE.md
```

## Architecture

### Sign Recognition Pipeline (all browser-side)
```
Webcam frame → MediaPipe Hands → 21 landmarks (x, y, z) per hand
→ Normalize (wrist=origin, scale by palm size)
→ Compare (cosine similarity for static / DTW for dynamic)
→ Score 0-100% → Feedback generation
```

### Data Flow
- **MediaPipe**: Loaded via CDN scripts (not npm, since the packages are IIFE bundles). Accessed via `window.Hands` and `window.Camera`.
- **Supabase**: Frontend calls Supabase directly via `@supabase/supabase-js`. RLS policies enforce that users can only read/write their own progress data. Signs and lessons are publicly readable.
- **State**: Zustand for local UI state. Supabase for persistent data.

### Database (Supabase PostgreSQL)
- `profiles` — auto-created from auth.users via trigger
- `signs` — reference sign data with landmarks stored as jsonb
- `lessons` + `lesson_signs` — lesson structure and sign ordering
- `user_progress` — streak, points, achievements
- `completed_signs` — per-user sign completion with best scores
- `daily_missions` — daily challenge tracking

## Core Algorithm

### Normalization (normalizeLandmarks.js)
- Set wrist (landmark 0) as origin (0, 0, 0)
- Scale all points relative to palm size (wrist to middle finger MCP distance)
- Makes comparison invariant to hand size, camera distance, and position

### Comparison (compareSigns.js)
- Static signs: Cosine similarity between flattened landmark vectors → score 0-100
- Dynamic signs: DTW on landmark sequences (dtw.js)
- Pass threshold: ≥ 80%

### Feedback (feedbackGenerator.js)
- Identifies which landmarks differ most from reference
- Maps landmark indices to finger names for human-readable feedback

## Interaction Flows

### Guided Lesson Mode
PRESENT target sign → User PERFORMS → MediaPipe RECOGNIZES → System EVALUATES → Score ≥ 80%? → PASS or FEEDBACK → retry loop

### AI Conversation Mode
SCENARIO prompt → AI partner SIGNS → User RESPONDS → System EVALUATES → Correct? → ADVANCE or HINT → retry loop

## Development Priorities
1. MediaPipe integration + webcam hand tracking (Week 1)
2. Landmark normalization + similarity scoring for static signs (Week 2)
3. Guided Lesson UI + Supabase CRUD (Week 3)
4. Visual feedback overlay system (Week 4)
5. Full lesson flow with progression (Week 5)
6. Mid-term demo (Week 6)
7. Gamification: missions, streaks, badges (Week 7)
8. AI Conversation Mode MVP (Week 8)
9. User testing + bug fixes (Week 9)
10. Polish + final presentation (Week 10)

## Coding Conventions
- Use functional components with hooks (no class components)
- Use async/await for all asynchronous operations
- Component files: PascalCase (e.g., LessonPlay.jsx)
- Utility files: camelCase (e.g., normalizeLandmarks.js)
- CSS: Tailwind utility classes only (no separate CSS files)
- Error handling: try-catch with meaningful error messages
- Comments: only for complex logic, not obvious code

## Important Notes
- All MediaPipe processing runs IN THE BROWSER (no server-side processing)
- MediaPipe is loaded via CDN `<script>` tags, not npm imports (the npm packages are IIFE bundles that don't support ESM named exports)
- Reference sign data: JSON files in client/src/data/signs/ for local dev, Supabase `signs` table for production
- Start with static fingerspelling signs (ㄱ,ㄴ,ㄷ) for MVP, then expand
- Dynamic signs (with motion) are stretch goals — implement after static signs work
- AI Conversation Mode uses Claude/GPT API for scenario generation — implement last
