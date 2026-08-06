# VisionFold Creative

Premium video editing studio site + client portal + admin CMS.

**Stack:** React 19 · TypeScript · Tailwind · Express API · Vercel · optional Supabase

## Features

- Public marketing site (home, work, services, contact, policies)
- Client portal (`/portal`) — projects, progress, messages, ratings, settings
- Admin CMS (`/admin`) — leads, clients, projects, portfolio, media, invoices, expenses, automations, growth copilot, settings
- Live page editing (admin → public site → **Edit page content**)
- Maintenance mode with countdown (admin settings)
- Public ratings API fed by client portal ratings

## Local development

```bash
npm install
npm run dev
```

## Vercel environment variables (required)

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Strong random string for auth tokens |
| `ADMIN_EMAIL` | Default `visionfoldcreative@gmail.com` |
| `ADMIN_PASSWORD` | Default bootstrap password (set your own) |
| `SUPABASE_URL` | Optional Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional server key |
| `SUPABASE_ANON_KEY` | Optional anon key |
| `OPENROUTER_API_KEY` | Optional AI features |

Also map any `SupaBase_*` keys you already created to the standard names above if your code expects them.

## Admin login

1. Set `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` on Vercel
2. Redeploy
3. Open `/admin` and sign in with those credentials

Bootstrap will accept the admin email + password even when Supabase user rows lack `password_hash`, and will create the admin user if missing.

## Scripts

- `npm run dev` — Vite + API
- `npm run build` — production build
- `npm run start` — production server (non-Vercel)

## Security

- Helmet CSP, rate-limited auth, httpOnly cookies
- No Google Analytics shipped by default
- Rotate any tokens ever pasted in chat

## License

Private — VisionFold Creative / Aliasgar
