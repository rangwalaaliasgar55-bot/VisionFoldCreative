# VisionFold Creative

Premium video editing studio platform — **Next.js cinematic redesign on `main`**.

## Design system
- Ink `#0B1020` · Violet `#7357FF` · Amber `#F4A62A` · Warm white `#F6F3EC`
- Nav: Work · Services · Process · Blog · Contact + **Client Portal** + **Book a Call**

## Stack (target)
Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Three.js · PostgreSQL + Drizzle · JWT (jose)

## Status
Cinematic design tokens, SiteChrome (Client Portal + Book a Call), layouts, auth helpers, and core pages are on `main`.

**Note:** This repo previously used Vite + Express. `package.json` now targets Next.js. Remove or ignore legacy Vite paths (`client/`, `server.ts`, `vite.config.ts`) when deploying the Next app.

## Quick start (Next.js)
```bash
npm install
# set DATABASE_URL and JWT_SECRET
npx drizzle-kit push
npm run dev
```

Demo portal: `client@visionfold.com` / `demo1234`  
Admin: `visionfoldcreative@gmail.com` / `aliasgar134` (or env)
