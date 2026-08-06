import { Application } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbManager } from '../lib/db';
import { User } from '../types';
import {
  JWT_SECRET,
  authLimiter,
  authenticateToken,
  requireAdmin,
  portfolioSchema,
  portfolioUpdateSchema,
  type AuthenticatedRequest,
} from './security';

export function registerAuthAndCmsRoutes(app: Application) {
  app.post('/api/auth/login', authLimiter, async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userWithHash = await dbManager.findUserByEmail(email);
    if (!userWithHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = bcrypt.compareSync(password, userWithHash.passwordHash || '');
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { passwordHash, ...safeUser } = userWithHash as any;
    const token = jwt.sign(
      { id: safeUser.id, email: safeUser.email, role: safeUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('vf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: safeUser, token });
  });

  app.post('/api/auth/register', authLimiter, async (req, res) => {
    const { email, password, name, company, phone } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existing = await dbManager.findUserByEmail(String(email).trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

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

    const safeUser = await dbManager.createUser(newClient);
    const token = jwt.sign(
      { id: safeUser.id, email: safeUser.email, role: safeUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('vf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: safeUser, token });
  });

  app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('vf_token');
    res.json({ success: true });
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
        supabaseConfigured: Boolean(process.env.SUPABASE_URL || process.env.SupaBase_SUPABASE_URL || process.env.VITE_SUPABASE_URL),
        uploadsConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SupaBase_SUPABASE_SERVICE_ROLE_KEY),
        openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      },
    });
  });

  app.put('/api/settings', authenticateToken, requireAdmin, async (req, res) => {
    res.json(await dbManager.updateSettings(req.body || {}));
  });
}
