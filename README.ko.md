# SignLingo

웹캠 기반 실시간 연습을 통해 한국 수어(KSL)를 배울 수 있는 인터랙티브 웹 애플리케이션입니다. 구조화된 레슨을 따라 수어 시범을 웹캠 앞에서 따라하면, MediaPipe 손 추적과 유사도 분석을 통해 즉각적인 교정 피드백을 받을 수 있습니다.

## 기술 스택

- **프론트엔드**: React 18 + Vite, Tailwind CSS, Zustand, Recharts, React Router
- **백엔드**: Supabase (PostgreSQL + Auth + RLS)
- **손 추적**: MediaPipe Hands (브라우저 기반, 손당 21개 랜드마크)
- **수어 비교**: 코사인 유사도 (정적 수어), Dynamic Time Warping (동적 수어)

## 설치 및 실행

### 사전 요구사항

- Node.js 18+
- Supabase 프로젝트 ([supabase.com](https://supabase.com))

### 설치

```bash
git clone <repo-url>
cd SignLingo/client
npm install
```

### Supabase 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 내용 실행
3. Authentication → Providers → Google에서 Google OAuth 활성화
4. 프로젝트 URL과 anon key 복사

### 환경 변수

```bash
cp client/.env.example client/.env
```

`VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 입력하세요.

### 실행

```bash
cd client
npm run dev
```

http://localhost:5173 에서 확인

## 프로젝트 구조

```
SignLingo/
├── client/          # React 프론트엔드 (Vite)
│   └── src/
│       ├── components/   # 기능별 UI 컴포넌트
│       ├── hooks/        # 커스텀 React 훅 (MediaPipe, 웹캠, 인증)
│       ├── services/     # Supabase 클라이언트, 손 추적, 수어 인식
│       ├── utils/        # 랜드마크 정규화, 비교, DTW, 피드백
│       ├── data/signs/   # 참조 수어 랜드마크 JSON 파일
│       ├── pages/        # 라우트 페이지
│       └── stores/       # Zustand 상태 관리
├── supabase/
│   └── schema.sql   # DB 스키마, RLS 정책, 시드 데이터
└── scripts/         # 유틸리티 스크립트
```
