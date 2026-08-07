import { Application } from 'express';
import { dbManager } from '../lib/db';
import { authenticateToken, type AuthenticatedRequest } from './security';

/**
 * Client portal depth: deliverable approve/reject, activity, notification prefs.
 */
export function registerClientPortalRoutes(app: Application) {
  /** Approve or request changes on a delivered file */
  app.post(
    '/api/portal/deliverables/:projectId/review',
    authenticateToken,
    async (req: AuthenticatedRequest, res) => {
      try {
        const projectId = req.params.projectId;
        const fileId = String(req.body?.fileId || '');
        const action = String(req.body?.action || ''); // approve | changes
        const comment = String(req.body?.comment || '').slice(0, 2000);

        if (!fileId || !['approve', 'changes'].includes(action)) {
          return res.status(400).json({ error: 'fileId and action (approve|changes) required' });
        }

        const project = await dbManager.getProjectById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const isAdmin = req.user?.role === 'admin';
        if (!isAdmin && project.clientId !== req.user?.id && project.clientEmail !== req.user?.email) {
          return res.status(403).json({ error: 'Not your project' });
        }

        const files = Array.isArray(project.deliveredFiles) ? [...project.deliveredFiles] : [];
        const idx = files.findIndex((f: any) => f.id === fileId || f.url === fileId);
        if (idx < 0) return res.status(404).json({ error: 'Deliverable not found' });

        const status = action === 'approve' ? 'approved' : 'changes_requested';
        files[idx] = {
          ...files[idx],
          reviewStatus: status,
          reviewComment: comment || files[idx].reviewComment,
          reviewedAt: new Date().toISOString(),
          reviewedBy: req.user?.id,
        };

        await dbManager.updateProject(projectId, { deliveredFiles: files } as any);

        // Activity log on settings
        try {
          const settings = await dbManager.getSettings();
          const log = Array.isArray((settings as any).projectActivity)
            ? (settings as any).projectActivity
            : [];
          log.unshift({
            id: `act_${Date.now()}`,
            projectId,
            type: action === 'approve' ? 'deliverable_approved' : 'changes_requested',
            message:
              action === 'approve'
                ? `Client approved deliverable`
                : `Client requested changes${comment ? `: ${comment.slice(0, 120)}` : ''}`,
            at: new Date().toISOString(),
            by: req.user?.email || req.user?.id,
          });
          await dbManager.updateSettings({ ...settings, projectActivity: log.slice(0, 500) } as any);
        } catch {
          /* non-fatal */
        }

        res.json({ success: true, file: files[idx], files });
      } catch (err: any) {
        res.status(500).json({ error: err.message || 'Review failed' });
      }
    }
  );

  app.get('/api/portal/activity/:projectId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const project = await dbManager.getProjectById(req.params.projectId);
      if (!project) return res.status(404).json({ error: 'Not found' });
      const isAdmin = req.user?.role === 'admin';
      if (!isAdmin && project.clientId !== req.user?.id && project.clientEmail !== req.user?.email) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const settings = await dbManager.getSettings();
      const log = Array.isArray((settings as any).projectActivity)
        ? (settings as any).projectActivity.filter((a: any) => a.projectId === req.params.projectId)
        : [];

      // Also synthesize from files
      const files = Array.isArray(project.deliveredFiles) ? project.deliveredFiles : [];
      const synthetic = files.map((f: any) => ({
        id: `file_${f.id || f.url}`,
        projectId: project.id,
        type: 'deliverable',
        message: `File: ${f.name || f.url}`,
        at: f.uploadedAt || f.reviewedAt || project.updatedAt || project.createdAt,
        by: 'studio',
        meta: { reviewStatus: f.reviewStatus },
      }));

      const merged = [...log, ...synthetic].sort((a, b) =>
        String(b.at || '').localeCompare(String(a.at || ''))
      );

      res.json({ activity: merged.slice(0, 50) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Activity failed' });
    }
  });

  app.get('/api/portal/notification-prefs', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await dbManager.getSettings();
      const all = (settings as any).notificationPrefs || {};
      const prefs = all[req.user!.id] || {
        newDeliverable: true,
        invoiceDue: true,
        message: true,
        statusChange: true,
      };
      res.json({ prefs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/portal/notification-prefs', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await dbManager.getSettings();
      const all = { ...((settings as any).notificationPrefs || {}) };
      all[req.user!.id] = {
        newDeliverable: Boolean(req.body?.newDeliverable),
        invoiceDue: Boolean(req.body?.invoiceDue),
        message: Boolean(req.body?.message),
        statusChange: Boolean(req.body?.statusChange),
      };
      await dbManager.updateSettings({ ...settings, notificationPrefs: all } as any);
      res.json({ prefs: all[req.user!.id] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Cron / manual: publish scheduled CMS pages */
  app.post('/api/cms/run-scheduled', async (req, res) => {
    const secret = process.env.CRON_SECRET || process.env.JWT_SECRET || '';
    const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (secret && auth !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const settings = await dbManager.getSettings();
      const store = (settings as any).cmsStore;
      if (!store?.pages) return res.json({ published: 0 });

      const now = Date.now();
      let published = 0;
      const pages = store.pages.map((p: any) => {
        if (p.status === 'scheduled' && p.scheduledFor && new Date(p.scheduledFor).getTime() <= now) {
          published++;
          return {
            ...p,
            status: 'published',
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      if (published) {
        await dbManager.updateSettings({
          ...settings,
          cmsStore: { ...store, pages },
        } as any);
      }
      res.json({ published });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
