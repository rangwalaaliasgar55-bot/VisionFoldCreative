# VisionFold 3.0 on main

Full redesign stack is being committed to `main` under `client/` and `server/`.

## Pushed so far
- package.json (root monorepo scripts)
- client package, vite, tailwind, tsconfig, index.html, App routes, main
- Admin pages: Settings, AI, Invoices, Clients + stubs
- useApi, useStore, server package config

## Still uploading (same session)
- UI components (Hero, Nav, Work, 3D FilmReel, etc.)
- Public + portal pages
- Full Express server (index, db, routes, middleware)
- AdminLayout, AdminDashboard, AdminProjects

Run after complete:
```bash
npm install && cd client && npm install && cd ../server && npm install && cd ..
npm run dev
```
