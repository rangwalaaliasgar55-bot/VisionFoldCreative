<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/vf-logo-dark.png" />
  <img src=".github/assets/vf-logo-light.png" alt="VisionFold Creative — Edit · Create · Inspire" width="560" />
</picture>

<br/>

# VisionFold Creative

**A cinematic studio platform for a premium video-editing agency — marketing site, client portal, and a full Studio CMS in one Next.js app.**

[![Stack](https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)](https://.react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Database](https://img.shields.io/badge/PostgreSQL_+_Drizzle-4169E1?logo=postgresql&logoColor=white)](https://orm.drizzle.team)
[![Deploy](https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel)](https://vercel.com)

`Work · Services · Process · Blog · Contact` — `Client Portal` — `Studio CMS`

</div>

---

## ✨ What's inside

<table>
<tr><td width="50%">

### 🎬 Public marketing site
Cinematic dark-first design (ink · violet · amber), Three.js hero with an interactive client globe (drag to rotate), scroll-triggered reveal animations + reading-progress bar, editorial blog, services & portfolio pages, CMS-driven custom pages at `/p/[slug]`, contact → lead pipeline, newsletter, and a WordPress-compatible API surface (`/api/wp/v2/*`) for SEO tooling. A floating WhatsApp chat button (real studio number) and a brand-themed easter egg — **VisionFold Runner** (a dino-style mini game) — keep visitors engaged.

</td><td width="50%">

### 🔐 Client portal
Clients register or are invited, see projects with live progress bars, timeline updates, deliverable downloads, per-project invoices with hosted-checkout links, per-frame revision feedback, ratings, and direct messaging with the studio.

</td></tr>
<tr><td>

### 🛠 Studio CMS (`/admin`)
Dashboard with revenue/expense/funnel charts, CRM for leads → one-click convert to client, projects, invoicing, expenses, portfolio manager, blog editor, media library, automations, webhooks, quotas, **visual page builder** (blocks, revisions, rollback, **scheduled publishing**), navigation editor, site settings, and team roles (`admin` / `editor` / `accountant`).

</td><td>

### 🤖 AI copilot
Operations insights and content assistant (lead replies, update copy, subject lines, SEO keywords, captions, content ideas) — powered by **NVIDIA NIM (free tier)**, with Gemini as fallback, a per-day token budget tracked in the database, and rule-based insights when AI is offline.

</td></tr>
</table>

---

## 🚀 Quick start

```bash
npm ci
cp .env.example .env.local   # fill in values (see below)
npm run dev                  # http://localhost:3000
```

Production build & check suite:

```bash
npm run build && npm run typecheck && npm run lint
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | ✅ | Signs staff/client session cookies. Use a long random string. |
| `DATABASE_URL` | ✅ prod | Postgres connection (Supabase Transaction pooler, port `6543`). **Without it the app runs on in-memory storage and data is lost on restart.** |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | ✅ prod | Bootstrap owner account created by the DB seed. |
| `CRON_SECRET` | ✅ prod | Protects `GET/POST /api/cron/run-scheduled` (Vercel sends it automatically). |
| `NVIDIA_API_KEY` | ➖ | Preferred AI provider (NIM free tier). `NVIDIA_MODEL` optional. |
| `GEMINI_API_KEY` | ➖ | AI fallback. `GEMINI_MODEL` optional. |
| `AI_DAILY_TOKEN_BUDGET` | ➖ | Hard daily token cap (default `250000`). |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | ➖ | Storage bucket `visionfold-uploads` for media uploads. |
| `PAYMENT_CHECKOUT_URL` | ➖ | Hosted checkout base URL for portal invoices. **Invoices are never marked paid from the browser.** |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NOTIFICATION_EMAIL` | ➖ | Outbound inquiry emails. |
| `CLIENT_DEMO_PASSWORD` | ➖ | Password for seeded demo clients (default `demo1234` — dev only). |
| `SEED_DEMO` | ➖ | Set `"true"` to seed sample people (clients/leads/messages/reviews). Production stays clean by default. |
| `GOOGLE_PLACES_API_KEY` | ➖ | Powers `/admin/prospects` — search businesses on Google Maps to pitch. |
| `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` | ➖ | WhatsApp Cloud API (send messages + webhook inbox). |
| `WHATSAPP_BUSINESS_NUMBER` | ➖ | Your number in E.164 (`+917725004639`). |
| `WHATSAPP_VERIFY_TOKEN` | ➖ | Webhook verification secret (any value you pick). |
| `WHATSAPP_AUTO_REPLY` | ➖ | `"true"` to let the AI auto-answer inbound WhatsApp messages. |
| `APP_URL` | ➖ | Canonical URL used in metadata/emails. |

> **Default admin (first seed):** `visionfoldcreative@gmail.com` / `aliasgar134` — set `ADMIN_EMAIL` + `ADMIN_PASSWORD` to override, and rotate it after first login.
> **Demo portal (requires `SEED_DEMO=true`):** `client@visionfold.com` / `demo1234`.

### Database setup (Supabase)

1. Create a Supabase project → **SQL Editor** → paste **[`supabase/COMPLETE_SCHEMA.sql`](supabase/COMPLETE_SCHEMA.sql)** → Run.
2. The script creates all **22 tables** (with FKs + indexes), the storage bucket, and a locked-down RLS baseline. It is **idempotent** and automatically moves colliding legacy tables to `legacy_*` (nothing is dropped).
3. Set `DATABASE_URL` in Vercel to the pooler connection string shown in the SQL file's footer comment.

The app self-seeds settings, demo clients/projects/blog posts and quotas on first request. `Admin → Site → Danger zone → Reset demo data` re-seeds cleanly.

---

## 🧱 Architecture

```
src/
├─ app/                         Next.js App Router
│  ├─ (public)/                 marketing site (home, work, services, blog…)
│  ├─ admin/                    Studio CMS pages (session-gated)
│  ├─ portal/                   client portal (session-gated)
│  └─ api/
│     ├─ auth/[action]/         login · logout · client registration (rate-limited)
│     ├─ admin/[...slug]/       every admin resource (RBAC enforced)
│     ├─ admin/cms/[[...path]]/ page builder: pages · blocks · revisions · schedule
│     ├─ portal/[action]/       client-scoped reads/writes (ownership-checked)
│     ├─ public/[action]/       contact → leads · newsletter
│     ├─ ai/[action]/           insights · content assist (NVIDIA NIM → Gemini)
│     ├─ wp/v2/[[...path]]/     WordPress-compatible read API
│     ├─ cron/run-scheduled/   publishes scheduled CMS pages (Bearer CRON_SECRET)
│     └─ health/                liveness + DB + AI status probe
├─ components/                  SiteChrome, Admin shell+ui kit, CMS block renderer…
├─ db/                          Drizzle schema (22 tables) + pooled pg client
└─ lib/                         auth (scrypt+JWT), settings cache, seed, ai, cms types
```

**Security model** — sessions are HTTP-only JWT cookies (7 days, `lax`, `secure` in prod); passwords are salted `scrypt`; every admin query re-validates the session **and** the role against the database; all portal queries are scoped to the authenticated client; login/registration/contact are IP-throttled; `/admin/*` and `/portal/*` redirect via edge middleware; CMS stores pages/revisions in a bounded `settings` blob (`cmsStore`) with prototype-key filtering on writes.

**Cron** — `vercel.json` registers a daily job calling `/api/cron/run-scheduled`, which flips `scheduled → published` for CMS pages whose time has come. Trigger manually with:

```bash
curl -X POST https://<app>/api/cron/run-scheduled \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 🎨 Design tokens

| Token | Value |
|---|---|
| Ink (background) | `#0B1020` |
| Violet (primary) | `#7357FF` |
| Amber (accent) | `#F4A62A` |
| Warm white (text) | `#F6F3EC` |
| Fonts | Space Grotesk (display) · Inter (body) |

---

## 🤖 Automation that actually helps

This repo previously shipped **93 template bot-workflows** (format rewriters, coverage-badge churners, Docker/vulnerability scanners with no Dockerfiles, Slack notifiers with no webhooks…) — they only produced red ❌ noise on every push.

To keep just the two that are real and green:

```bash
bash scripts/prune-workflows.sh          # removes 91, rewrites ci.yml
git add -A && git commit -m "chore: prune noise-bot workflows" && git push
```

| Workflow | What it does |
|---|---|
| `ci.yml` | `npm ci` → typecheck → ESLint → production build on every PR/push to `main` |
| `codeql.yml` | GitHub's security analysis for JS/TS + Actions |

---

## 📜 Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm run typecheck` | `tsc --noEmit` |

---

<div align="center">

**visionfoldcreative.vercel.app** · Crafted by VisionFold · We fold stories into motion. 🎞️

</div>
