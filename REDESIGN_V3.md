# VisionFold Creative — Redesign v3

Branch: `redesign-v3`

## What was added

### Admin pages (fully implemented)
- `client/src/pages/admin/AdminSettings.tsx` — Branding, contact, maintenance mode
- `client/src/pages/admin/AdminAI.tsx` — Gemini-powered chat assistant
- `client/src/pages/admin/AdminInvoices.tsx` — Create invoices, mark paid
- `client/src/pages/admin/AdminClients.tsx` — CRUD clients with search

### Stubs
- AdminMedia, AdminMessages, AdminOutreach, AdminAnalytics

### Full stack package (from visionfold-complete.zip)
New monorepo layout under `client/` + `server/`:
- Vite + React 19 + Three.js + Framer Motion frontend
- Express backend with routes for auth, clients, invoices, AI, settings, projects, media, etc.
- Glassmorphism UI, 3D FilmReel scene, portal + admin layouts

## How to run the redesign stack
```bash
# from repo root after checking out redesign-v3
npm install
cd client && npm install
cd ../server && npm install
cd ..
npm run dev
```

API base: `/api` (proxied by Vite).

## Note
The previous main-branch app under `src/` remains intact. This redesign lives alongside it under `client/` and `server/` so you can migrate gradually or replace when ready.
