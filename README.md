# Workout Tracker

Web app personal untuk tracking strength training, berat badan, dan rekomendasi AI.

## Stack
- Frontend: HTML + CSS + Vanilla JS
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- AI: Groq API (via Supabase Edge Function)
- Deploy: Vercel

---

## Setup

### 1. Supabase
1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** → jalankan isi file `sql/setup.sql`
3. Buat user: **Authentication → Users → Add User** (isi email + password)
4. Nonaktifkan sign up: **Authentication → Settings → disable sign ups**
5. Ambil credentials: **Settings → API** → copy Project URL dan anon key

### 2. Konfigurasi
Edit `js/supabase.js`:
```js
const SUPABASE_URL = 'https://xxxx.supabase.co'   // ganti
const SUPABASE_KEY = 'eyJhbGci...'                 // ganti
```

Edit `vercel.json` — ganti URL destination dengan URL Supabase project kamu:
```json
{ "source": "/api/analyze", "destination": "https://xxxx.supabase.co/functions/v1/analyze" }
```

### 3. Supabase Edge Function (AI middleware)
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref xxxx

# Set API keys (ambil dari console.groq.com)
supabase secrets set GROQ_API_KEY=gsk_xxx
supabase secrets set GEMINI_API_KEY=AIzaSy_xxx      # opsional
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx   # opsional

# Deploy function
supabase functions deploy analyze
```

### 4. Deploy ke Vercel
1. Push repo ke GitHub
2. Buka [vercel.com](https://vercel.com) → New Project → Import repo
3. Framework Preset: **Other**
4. Deploy

---

## Ganti AI Provider
Edit `js/ai.js` baris pertama:
```js
const AI_PROVIDER = 'groq'  // ganti ke: 'gemini' | 'anthropic'
```

## Struktur File
```
workout-tracker/
├── index.html          → Dashboard
├── log.html            → Input sesi workout
├── history.html        → Riwayat latihan
├── body.html           → Tracking berat badan
├── exercises.html      → Exercise library
├── login.html          → Login page
├── css/style.css       → Design system
├── js/
│   ├── supabase.js     → Supabase client (isi credentials di sini)
│   ├── auth.js         → Auth guard
│   ├── navbar.js       → Shared navbar
│   ├── toast.js        → Notifikasi
│   ├── prompt.js       → System prompt AI
│   └── ai.js           → Provider switcher
├── sql/setup.sql       → SQL untuk Supabase
├── supabase/functions/ → Edge Function (AI middleware)
└── vercel.json         → Routing config
```
