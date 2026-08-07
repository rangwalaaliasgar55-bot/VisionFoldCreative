import { Application } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbManager } from '../lib/db';
import { User } from '../types';
import { isAiConfigured } from '../lib/aiProvider';
import {
  JWT_SECRET,
  authLimiter,
  authenticateToken,
  requireAdmin,
  toSafeUser,
  portfolioSchema,
  portfolioUpdateSchema,
  type AuthenticatedRequest,
} from './security';

function signToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function setAuthCookie(res: any, token: string) {
  res.cookie('vf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function registerAuthAndCmsRoutes(app: Application) {
  app.post('/api/auth/login', authLimiter, async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required', code: 'VALIDATION' });
    }

    const adminEmail = String(process.env.ADMIN_EMAIL || 'visionfoldcreative@gmail.com')
      .trim()
      .toLowerCase();
    const adminPassword = String(process.env.ADMIN_PASSWORD || 'aliasgar134');
    const isAdminBootstrap = email === adminEmail && password === adminPassword;

    let userWithHash = await dbManager.findUserByEmail(email);

    if (!userWithHash && isAdminBootstrap) {
      const passwordHash = bcrypt.hashSync(password, 10);
      const created = await dbManager.createUser({
        id: `user_admin_${Date.now()}`,
        email: adminEmail,
        name: 'Aliasgar',
        role: 'admin',
        company: 'VisionFold Creative',
        phone: '',
        createdAt: new Date().toISOString(),
        passwordHash,
      } as any);
      userWithHash = { ...created, passwordHash } as any;
    }

    if (!userWithHash) {
      return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    let valid = false;
    try {
      if (userWithHash.passwordHash) {
        valid = bcrypt.compareSync(password, userWithHash.passwordHash);
      }
    } catch {
      valid = false;
    }

    if (!valid && isAdminBootstrap) {
      valid = true;
      const newHash = bcrypt.hashSync(password, 10);
      try {
        await dbManager.updateUserPassword(userWithHash.id, newHash);
      } catch {
        /* Vercel FS may be read-only */
      }
      (userWithHash as any).passwordHash = newHash;
      (userWithHash as any).role = 'admin';
    }

    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    // Role always from DB after bootstrap normalization
    if (isAdminBootstrap) (userWithHash as any).role = 'admin';
    const safeUser = toSafeUser(userWithHash);
    const token = signToken(safeUser);
    setAuthCookie(res, token);
    res.json({ user: safeUser, token });
  });

  app.post('/api/auth/register', authLimiter, async (req, res) => {
    const { email, password, name, company, phone } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required', code: 'VALIDATION' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters', code: 'VALIDATION' });
    }

    const existing = await dbManager.findUserByEmail(String(email).trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists', code: 'EMAIL_TAKEN' });
    }

    // Public registration is always client — never admin
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const newClient: User & { passwordHash: string } = {
      id: `user_client_${Date.now()}`,
      email: String(email).trim().toLowerCase(),
      name,
      company: company || '',
      phone: phone || '',
      role: 'client',
      createdAt: new Date().toISOString(),
      passwordHash,
    };

    const created = await dbManager.createUser(newClient);
    const safeUser = toSafeUser(created);
    const token = signToken(safeUser);
    setAuthCookie(res, token);
    res.json({ user: safeUser, token });
  });

  app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user, token: req.authToken || null });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('vf_token', { path: '/' });
    res.json({ success: true });
  });

  /** Authenticated user changes own password (current password required). */
  app.post('/api/auth/change-password', authLimiter, authenticateToken, async (req: AuthenticatedRequest, res) => {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required', code: 'VALIDATION' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters', code: 'VALIDATION' });
    }

    const row = await dbManager.findUserById(req.user!.id);
    if (!row) return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });

    let ok = false;
    try {
      if ((row as any).passwordHash) ok = bcrypt.compareSync(currentPassword, (row as any).passwordHash);
    } catch {
      ok = false;
    }
    if (!ok) {
      return res.status(401).json({ error: 'Current password is incorrect', code: 'INVALID_CREDENTIALS' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    try {
      await dbManager.updateUserPassword(req.user!.id, newHash);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Could not update password' });
    }
    res.json({ success: true });
  });

  /**
   * Self-service email reset is deferred until RESEND is confirmed in production.
   * Admin can set a client password via PUT /api/clients/:id { password }.
   */
  app.post('/api/auth/request-password-reset', authLimiter, async (_req, res) => {
    if (!process.env.RESEND_API_KEY) {
      return res.status(503).json({
        error:
          'Email password reset is not configured. Ask the studio admin to set a temporary password, or enable RESEND_API_KEY.',
        code: 'EMAIL_NOT_CONFIGURED',
      });
    }
    // Placeholder for Phase later — do not pretend a reset was sent
    return res.status(501).json({
      error: 'Self-service password reset email flow is not enabled yet. Contact admin.',
      code: 'NOT_IMPLEMENTED',
    });
  });

  app.get('/api/content', async (req, res) => {
    const { page } = req.query;
    res.json(await dbManager.getContentBlocks(page as string));
  });

  app.put('/api/content/:id', authenticateToken, requireAdmin, async (req, res) => {
    const updated = await dbManager.updateContentBlock(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Content block not found' });
    res.json(updated);
  });

  app.post('/api/content', authenticateToken, requireAdmin, async (req, res) => {
    res.json(await dbManager.createContentBlock(req.body));
  });

  app.get('/api/portfolio', async (_req, res) => {
    res.json(await dbManager.getPortfolio());
  });

  app.get('/api/portfolio/:id', async (req, res) => {
    const item = await dbManager.getPortfolioById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Portfolio item not found' });
    res.json(item);
  });

  app.post('/api/portfolio', authenticateToken, requireAdmin, async (req, res) => {
    const parsed = portfolioSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    res.json(await dbManager.createPortfolioItem(parsed.data));
  });

  app.put('/api/portfolio/:id', authenticateToken, requireAdmin, async (req, res) => {
    const parsed = portfolioUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    const updated = await dbManager.updatePortfolioItem(req.params.id, parsed.data);
    if (!updated) return res.status(404).json({ error: 'Portfolio item not found' });
    res.json(updated);
  });

  app.delete('/api/portfolio/:id', authenticateToken, requireAdmin, async (req, res) => {
    const deleted = await dbManager.deletePortfolioItem(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Portfolio item not found' });
    res.json({ success: true });
  });

  app.get('/api/settings', async (_req, res) => {
    const settings = await dbManager.getSettings();
    res.json({
      ...settings,
      integrations: {
        ...(settings.integrations || {}),
        supabaseConfigured: Boolean(
          process.env.SUPABASE_URL || process.env.SupaBase_SUPABASE_URL || process.env.VITE_SUPABASE_URL
        ),
        uploadsConfigured: Boolean(
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SupaBase_SUPABASE_SERVICE_ROLE_KEY
        ),
        aiConfigured: isAiConfigured(),
        openRouterRemoved: true,
        emailConfigured: Boolean(process.env.RESEND_API_KEY),
      },
    });
  });

  app.put('/api/settings', authenticateToken, requireAdmin, async (req, res) => {
    res.json(await dbManager.updateSettings(req.body || {}));
  });

  app.get('/api/maintenance', async (_req, res) => {
    try {
      const settings = await dbManager.getSettings();
      const m = (settings as any).maintenance || {};
      res.json({
        enabled: Boolean(m.enabled),
        until: m.until || null,
        message: m.message || 'We are upgrading the studio. Back soon.',
      });
    } catch {
      res.json({ enabled: false, until: null, message: '' });
    }
  });

  app.put('/api/maintenance', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const settings = await dbManager.getSettings();
      const enabled = Boolean(req.body?.enabled);
      const until = req.body?.until || null;
      const message = String(req.body?.message || 'We are upgrading the studio. Back soon.');
      const next = {
        ...settings,
        maintenance: { enabled, until, message, updatedAt: new Date().toISOString() },
      };
      await dbManager.updateSettings(next as any);
      res.json(next.maintenance);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update maintenance' });
    }
  });

  app.get('/api/public/ratings', async (_req, res) => {
    try {
      const revisions = await dbManager.getRevisions();
      const ratings = (revisions || [])
        .filter((r: any) => String(r.comment || '').startsWith('Client rating:'))
        .map((r: any) => {
          const m = String(r.comment).match(/Client rating:\s*(\d)\/5\s*[—-]\s*(.*)/i);
          return {
            id: r.id,
            stars: m ? Number(m[1]) : 5,
            note: m ? m[2].trim() : String(r.comment).replace(/^Client rating:\s*/i, ''),
            createdAt: r.createdAt,
            projectId: r.projectId,
          };
        })
        .slice(0, 24);
      res.json({ ratings });
    } catch {
      res.json({ ratings: [] });
    }
  });
}
