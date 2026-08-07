# VisionFold Creative

Premium video editing studio site + client portal + admin CMS.

**Stack:** React 19 · TypeScript · Tailwind · Express API · Vercel · optional Supabase · Gemini AI

## Features

- Public marketing site (home, work, services, contact, policies)
- Client portal (`/portal`) — projects, progress, messages, ratings, settings
- Admin CMS (`/admin`) — leads, clients, projects, portfolio, media, invoices, expenses, automations, growth tools, settings
- Live page editing (admin → public site → **Edit page content**)
- Maintenance mode with countdown (admin settings)
- Public ratings API fed by client portal ratings
- AI layer (Phase D): Google Gemini for insights, inquiry assist, client assist — degrades cleanly without a key

## Local development

```bash
npm install
npm run dev
```

## Vercel environment variables

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Strong random string for auth tokens |
| `ADMIN_EMAIL` | Bootstrap admin email |
| `ADMIN_PASSWORD` | Bootstrap admin password |
| `SUPABASE_URL` | Optional Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional server key (bypasses RLS) |
| `SUPABASE_ANON_KEY` | Optional anon key |
| `RESEND_API_KEY` | Optional inquiry emails |
| `GEMINI_API_KEY` | **Phase D** — Google AI Studio key |
| `GEMINI_MODEL` | Optional, default `gemini-2.0-flash` |
| `GEMINI_DAILY_TOKEN_BUDGET` | Optional soft limit (default 250000 tokens / instance day) |

**OpenRouter was removed in Phase A.** Do not set `OPENROUTER_API_KEY`.

## AI status check

```
GET /api/ai/status
```

Returns `{ configured, provider: "gemini"|"none", model, phase: "D", usage }`.

Without `GEMINI_API_KEY`, admin insights and inquiry-assist use **rules/template** responses with `source: "rules"|"template"` — never fake AI text.

## Supabase (Phase B)

1. Run migration: `supabase/migrations/20260807_phase_b_rls_baseline.sql` in the SQL Editor
2. Read policy guide: `supabase/RLS.md`
3. Ensure bucket `visionfold-uploads` exists (migration creates it)

**Note:** The Express API uses the **service role** key, which bypasses RLS. Client data isolation is enforced in API routes (Phase C).

## Admin login

1. Set `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` on Vercel
2. Optionally set `GEMINI_API_KEY` for live AI
3. Redeploy
4. Open `/admin` and sign in

## Scripts

- `npm run dev` — Vite + API
- `npm run build` — production build
- `npm run start` — production server (non-Vercel)
- `npm run lint` — TypeScript check
- `npm run test:run` — Vitest once

## Security

- Helmet CSP, rate-limited auth + AI routes, httpOnly cookies
- Role from database (JWT claim not trusted for privileges)
- Rotate any tokens ever pasted in chat

## License

Private — VisionFold Creative / Aliasgar
