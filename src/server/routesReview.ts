import { Application } from 'express';
import { createClient } from '@supabase/supabase-js';
import { dbManager } from '../lib/db';
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from './security';

const BUCKET = 'visionfold-uploads';
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

type Annotation = {
  id: string;
  mediaVersionId: string;
  projectId: string;
  timecodeMs: number;
  x?: number | null;
  y?: number | null;
  type: 'comment' | 'drawing';
  pathData?: unknown;
  commentText: string;
  createdBy: string;
  createdByName?: string;
  status: 'open' | 'resolved';
  carriedFromVersionId?: string | null;
  carryStatus?: 'current' | 'needs_recheck';
  createdAt: string;
};

type MediaVersion = {
  id: string;
  projectId: string;
  versionNumber: number;
  storageKey: string;
  url: string;
  durationMs?: number;
  mimeType?: string;
  sizeBytes?: number;
  status: 'processing' | 'ready' | 'failed';
  label?: string;
  createdBy?: string;
  createdAt: string;
};

type ApprovalRecord = {
  mediaVersionId: string;
  projectId: string;
  status: 'pending' | 'changes_requested' | 'approved';
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
  locked?: boolean;
};

type ReviewStore = {
  versions: MediaVersion[];
  annotations: Annotation[];
  approvals: ApprovalRecord[];
};

function supabaseAdmin() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.SupaBase_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SupaBase_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    '';
  if (!url || !key) return null;
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function nid(p: string) {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function readReview(): Promise<ReviewStore> {
  const settings = await dbManager.getSettings();
  const r = (settings as any).reviewStore || {};
  return {
    versions: Array.isArray(r.versions) ? r.versions : [],
    annotations: Array.isArray(r.annotations) ? r.annotations : [],
    approvals: Array.isArray(r.approvals) ? r.approvals : [],
  };
}

async function writeReview(store: ReviewStore) {
  const settings = await dbManager.getSettings();
  await dbManager.updateSettings({
    ...settings,
    reviewStore: {
      versions: store.versions.slice(0, 200),
      annotations: store.annotations.slice(0, 5000),
      approvals: store.approvals.slice(0, 200),
    },
  } as any);

  // Best-effort mirror into SQL tables when available (R1 schema)
  const sb = supabaseAdmin();
  if (!sb) return;
  try {
    for (const v of store.versions.slice(0, 50)) {
      await sb.from('media_versions').upsert({
        id: v.id,
        project_id: v.projectId,
        version_number: v.versionNumber,
        storage_key: v.storageKey,
        playback_url: v.url,
        duration_ms: v.durationMs ?? null,
        mime_type: v.mimeType || 'video/mp4',
        size_bytes: v.sizeBytes ?? null,
        status: v.status,
        label: v.label || '',
        created_by: v.createdBy || null,
        created_at: v.createdAt,
      });
    }
  } catch (err: any) {
    console.warn('[REVIEW] SQL mirror versions', err?.message);
  }
}

async function assertProjectAccess(req: AuthenticatedRequest, projectId: string) {
  const project = await dbManager.getProjectById(projectId);
  if (!project) return { ok: false as const, status: 404, error: 'Project not found' };
  const isAdmin = req.user?.role === 'admin';
  if (
    !isAdmin &&
    project.clientId !== req.user?.id &&
    project.clientEmail !== req.user?.email
  ) {
    return { ok: false as const, status: 403, error: 'Not your project' };
  }
  return { ok: true as const, project, isAdmin };
}

export function registerReviewRoutes(app: Application) {
  /** Signed upload for review videos (bypass Vercel body limit) */
  app.post(
    '/api/review/:projectId/signed-upload',
    authenticateToken,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      const access = await assertProjectAccess(req, req.params.projectId);
      if (!access.ok) return res.status(access.status).json({ error: access.error });

      const sb = supabaseAdmin();
      if (!sb) {
        return res.status(503).json({
          error: 'Supabase not configured',
          code: 'STORAGE_NOT_CONFIGURED',
        });
      }

      const fileName = String(req.body?.fileName || 'review.mp4');
      let mime = String(req.body?.mimeType || 'video/mp4').toLowerCase();
      if (!mime.startsWith('video/')) mime = 'video/mp4';
      const size = Number(req.body?.size || 0);
      if (size > MAX_VIDEO_BYTES) {
        return res.status(400).json({ error: `Max ${MAX_VIDEO_BYTES / 1024 / 1024}MB` });
      }

      const clean = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `review/${req.params.projectId}/${Date.now()}_${clean}`;

      try {
        const { data: buckets } = await sb.storage.listBuckets();
        const exists = (buckets || []).some((b) => b.id === BUCKET || b.name === BUCKET);
        if (!exists) {
          await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_VIDEO_BYTES });
        }
      } catch (e: any) {
        console.warn('[REVIEW] bucket', e?.message);
      }

      const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(key);
      if (error || !data?.signedUrl) {
        return res.status(500).json({ error: error?.message || 'Signed URL failed' });
      }

      const {
        data: { publicUrl },
      } = sb.storage.from(BUCKET).getPublicUrl(key);

      res.json({
        key,
        signedUrl: data.signedUrl,
        publicUrl,
        mimeType: mime,
        maxBytes: MAX_VIDEO_BYTES,
      });
    }
  );

  app.get(
    '/api/review/:projectId/versions',
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      const access = await assertProjectAccess(req, req.params.projectId);
      if (!access.ok) return res.status(access.status).json({ error: access.error });
      const store = await readReview();
      const versions = store.versions
        .filter((v) => v.projectId === req.params.projectId)
        .sort((a, b) => b.versionNumber - a.versionNumber);
      res.json({ versions });
    }
  );

  app.post(
    '/api/review/:projectId/versions',
    authenticateToken,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      const access = await assertProjectAccess(req, req.params.projectId);
      if (!access.ok) return res.status(access.status).json({ error: access.error });

      const url = String(req.body?.url || '').trim();
      if (!url) return res.status(400).json({ error: 'url is required' });

      const store = await readReview();
      const existing = store.versions.filter((v) => v.projectId === req.params.projectId);
      const versionNumber = existing.length
        ? Math.max(...existing.map((v) => v.versionNumber)) + 1
        : 1;

      // Carry forward comments from previous latest version (R5)
      const prev = existing.sort((a, b) => b.versionNumber - a.versionNumber)[0];

      const version: MediaVersion = {
        id: nid('mv'),
        projectId: req.params.projectId,
        versionNumber,
        storageKey: String(req.body?.storageKey || url),
        url,
        durationMs: req.body?.durationMs ? Number(req.body.durationMs) : undefined,
        mimeType: String(req.body?.mimeType || 'video/mp4'),
        sizeBytes: req.body?.sizeBytes ? Number(req.body.sizeBytes) : undefined,
        status: 'ready',
        label: String(req.body?.label || `v${versionNumber}`),
        createdBy: req.user?.id,
        createdAt: new Date().toISOString(),
      };

      store.versions.unshift(version);
      store.approvals.unshift({
        mediaVersionId: version.id,
        projectId: version.projectId,
        status: 'pending',
        locked: false,
      });

      if (prev) {
        const prevAnns = store.annotations.filter((a) => a.mediaVersionId === prev.id);
        for (const a of prevAnns) {
          store.annotations.unshift({
            ...a,
            id: nid('ann'),
            mediaVersionId: version.id,
            carriedFromVersionId: prev.id,
            carryStatus: 'needs_recheck',
            status: 'open',
            createdAt: new Date().toISOString(),
          });
        }
      }

      await writeReview(store);
      res.json({
        version,
        carriedCount: prev
          ? store.annotations.filter(
              (a) => a.mediaVersionId === version.id && a.carriedFromVersionId === prev.id
            ).length
          : 0,
      });
    }
  );

  app.get(
    '/api/review/version/:versionId',
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      const store = await readReview();
      const version = store.versions.find((v) => v.id === req.params.versionId);
      if (!version) return res.status(404).json({ error: 'Version not found' });
      const access = await assertProjectAccess(req, version.projectId);
      if (!access.ok) return res.status(access.status).json({ error: access.error });

      const since = req.query.since ? String(req.query.since) : null;
      let annotations = store.annotations
        .filter((a) => a.mediaVersionId === version.id)
        .sort((a, b) => a.timecodeMs - b.timecodeMs);

      if (since) {
        annotations = annotations.filter((a) => a.createdAt > since);
      }

      const approval =
        store.approvals.find((a) => a.mediaVersionId === version.id) || {
          mediaVersionId: version.id,
          projectId: version.projectId,
          status: 'pending' as const,
          locked: false,
        };

      res.json({
        version,
        annotations,
        approval,
        serverTime: new Date().toISOString(),
        // Near-realtime: clients should poll this endpoint every 2s (R6)
        sync: { mode: 'poll', intervalMs: 2000 },
      });
    }
  );

  app.post(
    '/api/review/version/:versionId/annotations',
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      const store = await readReview();
      const version = store.versions.find((v) => v.id === req.params.versionId);
      if (!version) return res.status(404).json({ error: 'Version not found' });
      const access = await assertProjectAccess(req, version.projectId);
      if (!access.ok) return res.status(access.status).json({ error: access.error });

      const approval = store.approvals.find((a) => a.mediaVersionId === version.id);
      if (approval?.status === 'approved' && approval.locked && req.user?.role !== 'admin') {
        return res.status(403).json({
          error: 'This cut is approved and locked. Ask admin to unlock before commenting.',
          code: 'APPROVAL_LOCKED',
        });
      }

      const timecodeMs = Math.max(0, Math.round(Number(req.body?.timecodeMs) || 0));
      const type = req.body?.type === 'drawing' ? 'drawing' : 'comment';
      const commentText = String(req.body?.commentText || '').trim().slice(0, 4000);
      if (type === 'comment' && !commentText) {
        return res.status(400).json({ error: 'commentText required' });
      }

      const ann: Annotation = {
        id: nid('ann'),
        mediaVersionId: version.id,
        projectId: version.projectId,
        timecodeMs,
        x: req.body?.x != null ? Number(req.body.x) : null,
        y: req.body?.y != null ? Number(req.body.y) : null,
        type,
        pathData: req.body?.pathData ?? null,
        commentText: commentText || (type === 'drawing' ? 'Drawing' : ''),
        createdBy: req.user!.id,
        createdByName: req.user!.name || req.user!.email,
        status: 'open',
        carryStatus: 'current',
        createdAt: new Date().toISOString(),
      };

      store.annotations.unshift(ann);

      if (req.user?.role !== 'admin') {
        const idx = store.approvals.findIndex((a) => a.mediaVersionId === version.id);
        if (idx >= 0 && store.approvals[idx].status === 'pending') {
          store.approvals[idx] = {
            ...store.approvals[idx],
            status: 'changes_requested',
            decidedBy: req.user?.id,
            decidedAt: new Date().toISOString(),
            note: 'New review comment',
          };
        }
      }

      await writeReview(store);
      res.json({ annotation: ann });
    }
  );

  app.patch(
    '/api/review/annotations/:id',
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      const store = await readReview();
      const idx = store.annotations.findIndex((a) => a.id === req.params.id);
      if (idx < 0) return res.status(404).json({ error: 'Not found' });
      const ann = store.annotations[idx];
      const access = await assertProjectAccess(req, ann.projectId);
      if (!access.ok) return res.status(access.status).json({ error: access.error });

      const next = { ...ann };
      if (req.body?.status === 'resolved' || req.body?.status === 'open') next.status = req.body.status;
      if (req.body?.carryStatus === 'current' || req.body?.carryStatus === 'needs_recheck') {
        next.carryStatus = req.body.carryStatus;
      }
      store.annotations[idx] = next;
      await writeReview(store);
      res.json({ annotation: next });
    }
  );

  app.post(
    '/api/review/version/:versionId/approve',
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      const store = await readReview();
      const version = store.versions.find((v) => v.id === req.params.versionId);
      if (!version) return res.status(404).json({ error: 'Version not found' });
      const access = await assertProjectAccess(req, version.projectId);
      if (!access.ok) return res.status(access.status).json({ error: access.error });

      const status = String(req.body?.status || '');
      if (!['pending', 'changes_requested', 'approved'].includes(status)) {
        return res.status(400).json({ error: 'invalid status' });
      }

      const existing = store.approvals.find((a) => a.mediaVersionId === version.id);
      if (
        existing?.locked &&
        existing.status === 'approved' &&
        req.user?.role !== 'admin' &&
        status !== 'approved'
      ) {
        return res.status(403).json({ error: 'Approved cut is locked. Admin must unlock.' });
      }

      if (status === 'pending' && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Only admin can reset to pending / unlock' });
      }

      const record: ApprovalRecord = {
        mediaVersionId: version.id,
        projectId: version.projectId,
        status: status as ApprovalRecord['status'],
        decidedBy: req.user?.id,
        decidedAt: new Date().toISOString(),
        note: String(req.body?.note || '').slice(0, 500),
        locked: status === 'approved' ? true : Boolean(req.body?.locked),
      };

      if (req.user?.role === 'admin' && status === 'pending') {
        record.locked = false;
      }

      const i = store.approvals.findIndex((a) => a.mediaVersionId === version.id);
      if (i >= 0) store.approvals[i] = record;
      else store.approvals.unshift(record);

      if (status === 'approved') {
        try {
          await dbManager.updateProject(version.projectId, { status: 'delivered' } as any);
        } catch {
          /* */
        }
      } else if (status === 'changes_requested') {
        try {
          await dbManager.updateProject(version.projectId, { status: 'in_review' } as any);
        } catch {
          /* */
        }
      }

      await writeReview(store);
      res.json({ approval: record });
    }
  );
}
