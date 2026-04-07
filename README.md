# SignLingo

An interactive web application for learning Korean Sign Language (KSL) through real-time webcam-based practice. Users follow structured lessons, replicate sign demonstrations in front of their webcam, and receive instant corrective feedback powered by MediaPipe hand tracking and custom similarity scoring.

## Tech Stack

- **Frontend**: React 18 + Vite, Tailwind CSS, Zustand, Recharts, React Router
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Hand Tracking**: MediaPipe Hands (browser-based, 21 landmarks per hand)
- **Sign Comparison**: Cosine similarity (static signs), Dynamic Time Warping (dynamic signs)

## Setup

### Prerequisites

- Node.js 18+
- Supabase project ([supabase.com](https://supabase.com))

### Installation

```bash
git clone <repo-url>
cd SignLingo/client
npm install
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Enable Google OAuth in Authentication → Providers → Google
4. Copy your project URL and anon key

### Environment Variables

```bash
cp client/.env.example client/.env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Running

```bash
cd client
npm run dev
```

Open http://localhost:5173

## Project Structure

```
SignLingo/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/   # UI components by feature
│       ├── hooks/        # Custom React hooks (MediaPipe, webcam, auth)
│       ├── services/     # Supabase client, hand tracking, sign recognition
│       ├── utils/        # Landmark normalization, comparison, DTW, feedback
│       ├── data/signs/   # Reference sign landmark JSON files
│       ├── pages/        # Route pages
│       └── stores/       # Zustand state management
├── supabase/
│   └── schema.sql   # Database schema, RLS policies, seed data
└── scripts/         # Utility scripts
```
