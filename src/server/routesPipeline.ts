import { Application } from 'express';
import bcrypt from 'bcryptjs';
import { dbManager } from '../lib/db';
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from './security';

/** Lead → Project conversion + pipeline helpers */
export function registerPipelineRoutes(app: Application) {
  app.post(
    '/api/messages/:id/convert-project',
    authenticateToken,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const messages = await dbManager.getMessages();
        const msg: any = messages.find((m: any) => m.id === req.params.id);
        if (!msg) return res.status(404).json({ error: 'Lead not found' });

        const clients = (await dbManager.getUsers()).filter((u) => u.role === 'client');
        let client: any = clients.find(
          (c) => c.email?.toLowerCase() === String(msg.email || '').toLowerCase()
        );
        let tempPassword: string | null = null;

        if (!client && msg.email) {
          tempPassword = `vf_${Math.random().toString(36).slice(2, 10)}`;
          const hash = await bcrypt.hash(tempPassword, 10);
          client = await dbManager.createUser({
            id: `client_${Date.now()}`,
            email: String(msg.email).toLowerCase(),
            name: msg.name || 'Client',
            role: 'client',
            company: msg.company || '',
            phone: msg.phone || '',
            createdAt: new Date().toISOString(),
            passwordHash: hash,
          } as any);
        }

        if (!client) {
          return res.status(400).json({ error: 'Could not resolve client for this lead' });
        }

        const project = await dbManager.createProject({
          title: `${msg.projectType || 'Project'} — ${msg.name}`,
          clientId: client.id,
          clientName: client.name || msg.name,
          clientEmail: client.email || msg.email,
          category: msg.projectType || 'Short Form',
          status: 'in_progress',
          description: msg.message || '',
          deliveryDate: msg.deadline || undefined,
          amountINR: 0,
          deliveredFiles: [],
        } as any);

        try {
          await dbManager.updateMessageStatus(msg.id, 'won' as any);
        } catch {
          try {
            await dbManager.updateMessageStatus(msg.id, 'closed' as any);
          } catch {
            /* ignore */
          }
        }

        res.json({
          project,
          client: { id: client.id, email: client.email, name: client.name },
          tempPassword,
        });
      } catch (err: any) {
        console.error('[CONVERT]', err);
        res.status(500).json({ error: err.message || 'Convert failed' });
      }
    }
  );
}
