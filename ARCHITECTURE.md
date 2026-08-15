# VisionFold Creative — Architecture

One Next.js 16 (App Router) application serving three surfaces: the public
marketing site, the staff Studio CMS (`/admin`), and the client portal
(`/portal`). PostgreSQL + Drizzle for persistence, JWT sessions, Vercel for
hosting + cron.

## Request flow

```
Browser
  │  pages ───────────────► App Router server components (read via drizzle)
  │  POST/PATCH/DELETE ───► Route handlers in src/app/api/**
  └─────────────────────────┤ enforce session + role → query → JSON
                            ▼
        PostgreSQL (Supabase; DATABASE_URL)  ←── schema: supabase/COMPLETE_SCHEMA.sql
```

`src/proxy.ts` (Next 16 “middleware”) guards `/admin/*` and `/portal/*` at the
edge by session-cookie presence; every API route independently re-validates
the session server-side with `requireStaff`/`requireClient`, so the middleware
is UX, not the security boundary.

## Data layer

- `src/db/schema.ts` — the 22 Drizzle tables (single source of truth).
- `src/db/index.ts` — pooled `pg` client. **No `DATABASE_URL` → in-memory
  pg-mem** (dev/demo convenience; data is NOT persistent).
- `src/lib/seed.ts` — idempotent first-boot seed (settings, admin, demo
  content, quotas). Failure clears the latch so the next request retries.
- `src/lib/settings.ts` — cached (20s) key/value store; also hosts the CMS
  page store blob (`cmsStore`) with block normalization and revisions.

## Auth

- Passwords: `crypto.scryptSync` with per-user salt (`salt:hash`).
- Sessions: `jose` HS256 JWT in an HTTP-only cookie (`vf_session`), 7 days,
  `secure` in production, `sameSite=lax`.
- Login, client registration, contact and newsletter are IP-rate-limited.
- RBAC: `admin` (everything), `editor` (content; no finance/team/system/
  settings-writes/client-deletes), `accountant` (finance + messages).
- The portal only ever queries rows owned by the session client id; payments
  can never be marked paid from the browser.

## AI (`src/lib/ai.ts`)

1. **NVIDIA NIM** (`NVIDIA_API_KEY`) — OpenAI-compatible chat completions.
2. **Gemini** (`GEMINI_API_KEY`) — fallback.
3. Rule-based insights — always available offline.

Every call is row-counted in `ai_usage` against `AI_DAILY_TOKEN_BUDGET`.

## Cron

`vercel.json` → daily `0 6 * * *` → `/api/cron/run-scheduled` publishes CMS
pages whose `scheduledFor <= now`. Protected by Bearer `CRON_SECRET`
(Vercel injects it automatically when the env var exists).

## CI

Two workflows only: `ci.yml` (install → typecheck → lint → build) and
`codeql.yml` (GitHub security analysis).
