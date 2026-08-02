// Vercel serverless entry point.
//
// Vercel auto-detects any file under /api as a serverless function and,
// for Express apps, will call it directly as a (req, res) handler — so we
// just need to export the configured app, no listen() needed.
//
// The frontend (dist/ from `vite build`) is served separately by Vercel's
// static file handling; see vercel.json for how requests are routed
// between the two.
import { createApp } from '../src/server/app';

const app = createApp();

export default app;
