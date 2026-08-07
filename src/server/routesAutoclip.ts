import { Application } from 'express';
import { authenticateToken, requireAdmin } from './security';

/**
 * AutoClip integration (admin only).
 *
 * AutoClip is a separate Python/FastAPI + ffmpeg service (Whisper, reframe, captions).
 * It cannot run inside Vercel Node. VisionFold proxies health + deep-links the UI
 * when AUTOCLIP_BASE_URL is set (e.g. http://127.0.0.1:8787 or a GPU VPS).
 */
export function registerAutoclipRoutes(app: Application) {
  app.get('/api/autoclip/status', authenticateToken, requireAdmin, async (_req, res) => {
    const base = (process.env.AUTOCLIP_BASE_URL || '').replace(/\/$/, '');
    if (!base) {
      return res.json({
        configured: false,
        baseUrl: null,
        online: false,
        hint:
          'Set AUTOCLIP_BASE_URL to your AutoClip server (local or VPS). AutoClip needs Python 3.11/3.12 + ffmpeg — it cannot run on Vercel.',
        docs: 'https://github.com/artbyjazi/autoclip',
      });
    }

    let online = false;
    let detail: unknown = null;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 4000);
      const r = await fetch(`${base}/api/jobs?limit=1`, { signal: controller.signal });
      clearTimeout(t);
      online = r.ok || r.status === 200 || r.status === 401 || r.status === 404;
      detail = { status: r.status };
    } catch (err: any) {
      detail = { error: err?.message || 'unreachable' };
    }

    res.json({
      configured: true,
      baseUrl: base,
      online,
      detail,
      uiUrl: base,
      hint: online
        ? 'AutoClip is reachable. Open the studio UI to ingest YouTube / upload and export 9:16 clips.'
        : 'AUTOCLIP_BASE_URL is set but the service did not respond. Start AutoClip with: autoclip serve',
    });
  });

  /** Proxy job list (read-only) so admin dashboard can show recent AutoClip jobs */
  app.get('/api/autoclip/jobs', authenticateToken, requireAdmin, async (_req, res) => {
    const base = (process.env.AUTOCLIP_BASE_URL || '').replace(/\/$/, '');
    if (!base) {
      return res.status(503).json({
        error: 'AUTOCLIP_BASE_URL not set',
        code: 'NOT_CONFIGURED',
      });
    }
    try {
      const r = await fetch(`${base}/api/jobs?limit=25`);
      const text = await r.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch {
        /* keep text */
      }
      if (!r.ok) {
        return res.status(r.status).json({ error: 'AutoClip upstream error', body });
      }
      res.json({ jobs: body, baseUrl: base });
    } catch (err: any) {
      res.status(502).json({ error: err.message || 'AutoClip unreachable' });
    }
  });
}
