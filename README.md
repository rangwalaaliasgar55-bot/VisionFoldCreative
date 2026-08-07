# VisionFold Creative

Premium video editing studio site + client portal + admin CMS.

**Stack:** React 19 · TypeScript · Tailwind · Express API · Vercel · optional Supabase

## Features

- Public marketing site (home, work, services, contact, policies)
- Client portal (`/portal`) — projects, progress, messages, ratings, settings
- Admin CMS (`/admin`) — leads, clients, projects, portfolio, media, invoices, expenses, automations, growth tools, settings
- Live page editing (admin → public site → **Edit page content**)
- Maintenance mode with countdown (admin settings)
- Public ratings API fed by client portal ratings

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
| `GEMINI_API_KEY` | Phase D — not wired yet |

**OpenRouter was removed in Phase A.** Do not set `OPENROUTER_API_KEY`.

## Supabase (Phase B)

1. Run migration: `supabase/migrations/20260807_phase_b_rls_baseline.sql` in the SQL Editor
2. Read policy guide: `supabase/RLS.md`
3. Ensure bucket `visionfold-uploads` exists (migration creates it)

**Note:** The Express API uses the **service role** key, which bypasses RLS. Client data isolation is still enforced in API routes until Phase C. RLS protects anon-key access and future user-scoped clients.

Legacy bootstrap seed (optional): `supabase/schema.sql`

## Admin login

1. Set `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` on Vercel
2. Redeploy
3. Open `/admin` and sign in with those credentials

## Scripts

- `npm run dev` — Vite + API
- `npm run build` — production build
- `npm run start` — production server (non-Vercel)
- `npm run lint` — TypeScript check
- `npm run test:run` — Vitest once

## Security

- Helmet CSP, rate-limited auth, httpOnly cookies
- No Google Analytics shipped by default
- Rotate any tokens ever pasted in chat

## License

Private — VisionFold Creative / Aliasgar
