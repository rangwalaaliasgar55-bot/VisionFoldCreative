import { Application } from 'express';
import { dbManager } from '../lib/db';
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from './security';

export type Annotation = {
  id: string;
  mediaVersionId: string;
  projectId: string;
  timecodeMs: number;
  x?: number | null;
  y?: number | null;
  type: 'pin' | 'draw';
  pathData?: unknown;
  commentText: string;
  createdBy: string;
  createdByName?: string;
  status: 'open' | 'resolved';
  threadId?: string;
  createdAt: string;
};

export type MediaVersion = {
  id: string;
  projectId: string;
  versionNumber: number;
  storageKey: string;
  url: string;
  durationMs?: number;
  label?: string;
  createdBy?: string;
  createdAt: string;
};

export type ApprovalRecord = {
  mediaVersionId: string;
  projectId: string;
  status: 'pending' | 'changes_requested' | 'approved';
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
};

type ReviewStore = {
  versions: MediaVersion[];
  annotations: Annotation[];
  approvals: ApprovalRecord[];
};

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
      annotations: store.annotations.slice(0, 2000),
      approvals: store.approvals.slice(0, 200),
    },
  } as any);
}

function nid(p: string) {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
  /** List / create media versions for a project */
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

      const version: MediaVersion = {
        id: nid('mv'),
        projectId: req.params.projectId,
        versionNumber,
        storageKey: String(req.body?.storageKey || url),
        url,
        durationMs: req.body?.durationMs ? Number(req.body.durationMs) : undefined,
        label: String(req.body?.label || `v${versionNumber}`),
        createdBy: req.user?.id,
        createdAt: new Date().toISOString(),
      };

      store.versions.unshift(version);
      store.approvals.unshift({
        mediaVersionId: version.id,
        projectId: version.projectId,
        status: 'pending',
      });
      await writeReview(store);
      res.json({ version });
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

      const annotations = store.annotations
        .filter((a) => a.mediaVersionId === version.id)
        .sort((a, b) => a.timecodeMs - b.timecodeMs);
      const approval =
        store.approvals.find((a) => a.mediaVersionId === version.id) || {
          mediaVersionId: version.id,
          projectId: version.projectId,
          status: 'pending' as const,
        };

      res.json({ version, annotations, approval });
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

      const timecodeMs = Math.max(0, Math.round(Number(req.body?.timecodeMs) || 0));
      const commentText = String(req.body?.commentText || '').trim().slice(0, 4000);
      if (!commentText) return res.status(400).json({ error: 'commentText required' });

      const ann: Annotation = {
        id: nid('ann'),
        mediaVersionId: version.id,
        projectId: version.projectId,
        timecodeMs,
        x: req.body?.x != null ? Number(req.body.x) : null,
        y: req.body?.y != null ? Number(req.body.y) : null,
        type: req.body?.type === 'draw' ? 'draw' : 'pin',
        pathData: req.body?.pathData,
        commentText,
        createdBy: req.user!.id,
        createdByName: req.user!.name || req.user!.email,
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      store.annotations.unshift(ann);

      // If client comments, bump approval toward changes_requested unless already approved
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

      if (req.body?.status === 'resolved' || req.body?.status === 'open') {
        store.annotations[idx] = { ...ann, status: req.body.status };
      }
      await writeReview(store);
      res.json({ annotation: store.annotations[idx] });
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
        return res.status(400).json({ error: 'status must be pending|changes_requested|approved' });
      }

      // Clients can approve / request changes; only admin can force pending reset
      if (req.user?.role !== 'admin' && status === 'pending') {
        return res.status(403).json({ error: 'Only admin can reset to pending' });
      }

      const record: ApprovalRecord = {
        mediaVersionId: version.id,
        projectId: version.projectId,
        status: status as ApprovalRecord['status'],
        decidedBy: req.user?.id,
        decidedAt: new Date().toISOString(),
        note: String(req.body?.note || '').slice(0, 500),
      };

      const i = store.approvals.findIndex((a) => a.mediaVersionId === version.id);
      if (i >= 0) store.approvals[i] = record;
      else store.approvals.unshift(record);

      // Mirror onto project status when approved
      if (status === 'approved') {
        try {
          await dbManager.updateProject(version.projectId, { status: 'delivered' } as any);
        } catch {
          /* optional */
        }
      } else if (status === 'changes_requested') {
        try {
          await dbManager.updateProject(version.projectId, { status: 'in_review' } as any);
        } catch {
          /* optional */
        }
      }

      await writeReview(store);
      res.json({ approval: record });
    }
  );
}
