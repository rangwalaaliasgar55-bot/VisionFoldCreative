import { Application } from 'express';
import bcrypt from 'bcryptjs';
import { dbManager } from '../lib/db';
import { User } from '../types';
import {
  messageLimiter,
  authenticateToken,
  requireAdmin,
  assertClientOwns,
  messageSchema,
  clientSchema,
  invoiceSchema,
  invoiceUpdateSchema,
  sendInquiryEmail,
  toSafeUser,
  type AuthenticatedRequest,
} from './security';
import { registerAiRoutes } from './routesAI';
import { scoreAndPersistMessage } from './routesGrowth';

export function registerBusinessRoutes(app: Application) {
  app.post('/api/messages', messageLimiter, async (req, res) => {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    const data = parsed.data;
    const newMsg = await dbManager.createMessage(data);
    try {
      await sendInquiryEmail(data);
    } catch (error: any) {
      console.error('[EMAIL ERROR]', error.message);
    }

    // Lead scoring pipeline (Phase H) — non-blocking failure
    let leadScore = null;
    try {
      leadScore = await scoreAndPersistMessage(newMsg as any);
    } catch (err: any) {
      console.warn('[LEAD_SCORE]', err?.message);
    }

    res.json({ success: true, message: newMsg, leadScore });
  });

  app.get('/api/messages', authenticateToken, requireAdmin, async (_req, res) => {
    const messages = await dbManager.getMessages();
    let leadScores: Record<string, any> = {};
    try {
      const settings = await dbManager.getSettings();
      leadScores = (settings as any).leadScores || {};
    } catch {
      /* ignore */
    }
    res.json(
      messages.map((m: any) => ({
        ...m,
        leadScore: leadScores[m.id]?.score ?? m.leadScore ?? null,
        leadTier: leadScores[m.id]?.tier ?? m.leadTier ?? null,
        leadReason: leadScores[m.id]?.reason ?? m.leadReason ?? null,
        leadSource: leadScores[m.id]?.source ?? null,
      }))
    );
  });

  app.patch('/api/messages/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    const updated = await dbManager.updateMessageStatus(req.params.id, req.body.status);
    if (!updated) return res.status(404).json({ error: 'Message not found' });
    res.json(updated);
  });

  app.get('/api/clients', authenticateToken, requireAdmin, async (_req, res) => {
    const users = await dbManager.getUsers();
    res.json(users.filter((u) => u.role === 'client').map((u) => toSafeUser(u)));
  });

  app.post('/api/clients', authenticateToken, requireAdmin, async (req, res) => {
    const parsed = clientSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    const { name, company, phone, password } = parsed.data;
    let email = (parsed.data.email || '').trim().toLowerCase();
    if (!email) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'client';
      email = `${slug}.${Date.now().toString(36)}@clients.visionfold.local`;
    }
    if (await dbManager.findUserByEmail(email)) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    const rawPassword =
      (password && String(password).trim()) || `vf-${Math.random().toString(36).slice(2, 10)}`;
    const passwordHash = bcrypt.hashSync(rawPassword, bcrypt.genSaltSync(10));
    const newClient: User & { passwordHash: string } = {
      id: `user_client_${Date.now()}`,
      email,
      name,
      company: company || '',
      phone: phone || '',
      role: 'client',
      createdAt: new Date().toISOString(),
      passwordHash,
    };
    const created = await dbManager.createUser(newClient);
    res.json({
      client: toSafeUser(created),
      initialPassword: rawPassword,
      loginEmail: email,
    });
  });

  app.put('/api/clients/:id', authenticateToken, requireAdmin, async (req, res) => {
    const id = req.params.id;
    const { name, email, company, phone, password, role } = req.body || {};
    if (role === 'admin') {
      return res.status(403).json({ error: 'Cannot assign admin role via client API', code: 'FORBIDDEN_ROLE' });
    }
    const updates: any = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (email !== undefined) updates.email = String(email).trim().toLowerCase();
    if (company !== undefined) updates.company = String(company);
    if (phone !== undefined) updates.phone = String(phone);
    if (password && String(password).trim()) {
      updates.passwordHash = bcrypt.hashSync(String(password).trim(), bcrypt.genSaltSync(10));
    }
    const updated = await dbManager.updateUser(id, updates);
    if (!updated) return res.status(404).json({ error: 'Client not found' });
    res.json(toSafeUser(updated));
  });

  app.delete('/api/clients/:id', authenticateToken, requireAdmin, async (req, res) => {
    const ok = await dbManager.deleteUser(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true });
  });

  app.post('/api/outreach/import', authenticateToken, requireAdmin, async (req, res) => {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (!rows.length) return res.status(400).json({ error: 'No rows provided' });
    if (rows.length > 5000) return res.status(400).json({ error: 'Max 5000 rows per import' });
    const settings = await dbManager.getSettings();
    const existing = Array.isArray((settings as any).outreachLeads) ? (settings as any).outreachLeads : [];
    const imported = rows.slice(0, 5000).map((r: any, i: number) => ({
      id: `out_${Date.now()}_${i}`,
      name: String(r.name || r.Name || '').trim(),
      phone: String(r.phone || r.Phone || r.mobile || '').trim(),
      email: String(r.email || r.Email || '').trim().toLowerCase(),
      company: String(r.company || r.Company || '').trim(),
      notes: String(r.notes || r.Notes || '').trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
    }));
    const next = { ...settings, outreachLeads: [...imported, ...existing].slice(0, 10000) };
    await dbManager.updateSettings(next as any);
    res.json({ imported: imported.length, total: (next as any).outreachLeads.length });
  });

  app.get('/api/outreach/leads', authenticateToken, requireAdmin, async (_req, res) => {
    const settings = await dbManager.getSettings();
    res.json({ leads: (settings as any).outreachLeads || [] });
  });

  app.get('/api/projects', authenticateToken, async (req: AuthenticatedRequest, res) => {
    if (req.user?.role === 'admin') {
      return res.json(await dbManager.getProjects());
    }
    res.json(await dbManager.getProjects(req.user?.id));
  });

  app.post('/api/projects', authenticateToken, requireAdmin, async (req, res) => {
    res.json(await dbManager.createProject(req.body));
  });

  app.put('/api/projects/:id', authenticateToken, requireAdmin, async (req, res) => {
    const updated = await dbManager.updateProject(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    res.json(updated);
  });

  app.delete('/api/projects/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const projects = await dbManager.getProjects();
      const exists = projects.find((p) => p.id === req.params.id);
      if (!exists) return res.status(404).json({ error: 'Project not found' });
      // Soft-delete via status if no deleteProject helper
      if (typeof (dbManager as any).deleteProject === 'function') {
        await (dbManager as any).deleteProject(req.params.id);
      } else {
        await dbManager.updateProject(req.params.id, { status: 'delivered', description: (exists.description || '') + ' [archived]' } as any);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Delete failed' });
    }
  });

  app.get('/api/revisions', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const projectId = req.query.projectId as string;
    if (req.user?.role === 'admin') {
      return res.json(await dbManager.getRevisions(projectId));
    }
    res.json(await dbManager.getRevisions(projectId, req.user?.id));
  });

  app.post('/api/revisions', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { projectId, comment } = req.body || {};
    if (!projectId || !comment) {
      return res.status(400).json({ error: 'Project ID and comment are required' });
    }
    const proj = await dbManager.getProjectById(projectId);
    if (!proj) return res.status(404).json({ error: 'Project not found' });
    if (!assertClientOwns(req, proj.clientId)) {
      return res.status(403).json({ error: 'Not authorized for this project', code: 'FORBIDDEN_RESOURCE' });
    }
    res.json(
      await dbManager.createRevision({
        projectId,
        clientId: req.user!.id,
        clientName: req.user!.name,
        comment,
      })
    );
  });

  app.patch('/api/revisions/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    const updated = await dbManager.updateRevisionStatus(req.params.id, req.body.status);
    if (!updated) return res.status(404).json({ error: 'Revision not found' });
    res.json(updated);
  });

  app.get('/api/invoices', authenticateToken, async (req: AuthenticatedRequest, res) => {
    if (req.user?.role === 'admin') {
      return res.json(await dbManager.getInvoices());
    }
    res.json(await dbManager.getInvoices(req.user?.id));
  });

  app.post('/api/invoices', authenticateToken, requireAdmin, async (req, res) => {
    const parsed = invoiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    res.json(await dbManager.createInvoice(parsed.data));
  });

  app.patch('/api/invoices/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    const parsed = invoiceUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    const inv = (await dbManager.getInvoices()).find((i) => i.id === req.params.id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    res.json(await dbManager.updateInvoice(req.params.id, parsed.data));
  });

  app.get('/api/expenses', authenticateToken, requireAdmin, async (_req, res) => {
    res.json(await dbManager.getExpenses());
  });

  app.post('/api/expenses', authenticateToken, requireAdmin, async (req, res) => {
    res.json(await dbManager.createExpense(req.body));
  });

  app.delete('/api/expenses/:id', authenticateToken, requireAdmin, async (req, res) => {
    if (!(await dbManager.deleteExpense(req.params.id))) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ success: true });
  });

  registerAiRoutes(app);
}
