import { Application } from 'express';
import bcrypt from 'bcryptjs';
import { dbManager } from '../lib/db';
import { User } from '../types';
import { storageProvider } from '../lib/storage';
import {
  messageLimiter,
  authenticateToken,
  requireAdmin,
  messageSchema,
  clientSchema,
  invoiceSchema,
  invoiceUpdateSchema,
  sendInquiryEmail,
  type AuthenticatedRequest,
} from './security';
import { registerAiRoutes } from './routesAI';

export function registerBusinessRoutes(app: Application) {
  app.post('/api/messages', messageLimiter, async (req, res) => {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    const data = parsed.data;
    const newMsg = await dbManager.createMessage(data);
    try { await sendInquiryEmail(data); } catch (error: any) { console.error('[EMAIL ERROR]', error.message); }
    res.json({ success: true, message: newMsg });
  });

  app.get('/api/messages', authenticateToken, requireAdmin, async (_req, res) => {
    res.json(await dbManager.getMessages());
  });

  app.patch('/api/messages/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    const updated = await dbManager.updateMessageStatus(req.params.id, req.body.status);
    if (!updated) return res.status(404).json({ error: 'Message not found' });
    res.json(updated);
  });

  app.get('/api/clients', authenticateToken, requireAdmin, async (_req, res) => {
    res.json((await dbManager.getUsers()).filter((u) => u.role === 'client'));
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
    if (await dbManager.findUserByEmail(email)) return res.status(400).json({ error: 'User with this email already exists' });
    const rawPassword = (password && String(password).trim()) || `vf-${Math.random().toString(36).slice(2, 10)}`;
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
    res.json({ client: await dbManager.createUser(newClient), initialPassword: rawPassword, loginEmail: email });
  });

  app.get('/api/projects', authenticateToken, async (req: AuthenticatedRequest, res) => {
    res.json(req.user?.role === 'admin' ? await dbManager.getProjects() : await dbManager.getProjects(req.user?.id));
  });

  app.post('/api/projects', authenticateToken, requireAdmin, async (req, res) => {
    res.json(await dbManager.createProject(req.body));
  });

  app.put('/api/projects/:id', authenticateToken, requireAdmin, async (req, res) => {
    const updated = await dbManager.updateProject(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    res.json(updated);
  });

  app.get('/api/revisions', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const projectId = req.query.projectId as string;
    res.json(req.user?.role === 'admin' ? await dbManager.getRevisions(projectId) : await dbManager.getRevisions(projectId, req.user?.id));
  });

  app.post('/api/revisions', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { projectId, comment } = req.body || {};
    if (!projectId || !comment) return res.status(400).json({ error: 'Project ID and comment are required' });
    const proj = await dbManager.getProjectById(projectId);
    if (!proj) return res.status(404).json({ error: 'Project not found' });
    if (req.user?.role !== 'admin' && proj.clientId !== req.user?.id) return res.status(403).json({ error: 'Not authorized' });
    res.json(await dbManager.createRevision({ projectId, clientId: req.user!.id, clientName: req.user!.name, comment }));
  });

  app.patch('/api/revisions/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    const updated = await dbManager.updateRevisionStatus(req.params.id, req.body.status);
    if (!updated) return res.status(404).json({ error: 'Revision not found' });
    res.json(updated);
  });

  app.get('/api/invoices', authenticateToken, async (req: AuthenticatedRequest, res) => {
    res.json(req.user?.role === 'admin' ? await dbManager.getInvoices() : await dbManager.getInvoices(req.user?.id));
  });

  app.post('/api/invoices', authenticateToken, requireAdmin, async (req, res) => {
    const parsed = invoiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    res.json(await dbManager.createInvoice(parsed.data));
  });

  app.patch('/api/invoices/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const parsed = invoiceUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    const inv = (await dbManager.getInvoices()).find((i) => i.id === req.params.id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    if (req.user?.role !== 'admin' && inv.clientId !== req.user?.id) return res.status(403).json({ error: 'Not authorized' });
    res.json(await dbManager.updateInvoice(req.params.id, parsed.data));
  });

  app.get('/api/expenses', authenticateToken, requireAdmin, async (_req, res) => {
    res.json(await dbManager.getExpenses());
  });

  app.post('/api/expenses', authenticateToken, requireAdmin, async (req, res) => {
    res.json(await dbManager.createExpense(req.body));
  });

  app.delete('/api/expenses/:id', authenticateToken, requireAdmin, async (req, res) => {
    if (!(await dbManager.deleteExpense(req.params.id))) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true });
  });

  app.post('/api/upload', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { fileName, fileData, mimeType } = req.body || {};
      if (!fileData || !fileName) return res.status(400).json({ error: 'fileData and fileName are required' });
      const buffer = Buffer.from(String(fileData).replace(/^data:image\/\w+;base64,/, ''), 'base64');
      if (buffer.length > 15 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 15MB)' });
      const detected = mimeType || 'image/png';
      if (!['image/jpeg', 'image/png', 'image/webp', 'video/mp4'].includes(detected)) return res.status(400).json({ error: 'Invalid file type' });
      const key = await storageProvider.upload(buffer, fileName, detected);
      res.json({ key, url: storageProvider.getUrl(key) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Upload failed' });
    }
  });

  registerAiRoutes(app);
}
