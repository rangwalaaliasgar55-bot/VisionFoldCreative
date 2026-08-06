# VisionFold Creative Studio

Premium video production studio platform — public marketing site + password-protected admin dashboard.

## Features

- Minimalist dark-mode public site (WebGL particles, Three.js, motion)
- Admin studio: clients, projects, portfolio CMS, invoices, expenses, leads
- OpenRouter AI tools (content, chat, inquiry assist, growth insights)
- JWT auth, Zod validation, rate limiting, Helmet security headers

## Stack

React 19 · TypeScript · Tailwind · Express · Vite · Zod · Three.js · Supabase (optional)

## Setup

```bash
npm install
cp .env.example .env   # set JWT_SECRET, OPENROUTER_API_KEY, etc.
npm run dev
```

- App: http://localhost:3000
- Admin: http://localhost:3000/admin

**Required in production:** `JWT_SECRET` (server will refuse to start without it).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (tsx + Vite) |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | TypeScript check |
| `npm run test:run` | Vitest once |

## Docs

- `ARCHITECTURE.md` — system design
- `API_ROUTES.md` — API reference
- `SECURITY.md` — security policy
- `.env.example` — environment variables
