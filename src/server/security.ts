import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { dbManager } from '../lib/db';
import { User } from '../types';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes.' },
});

const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent, please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests, please slow down.' },
});

const REQUIRED_JWT_SECRET = process.env.JWT_SECRET;

if (!REQUIRED_JWT_SECRET) {
  console.warn(
    'WARNING: JWT_SECRET is not set. Using a temporary fallback. ' +
      'Set JWT_SECRET in Vercel Project Settings → Environment Variables for production security.'
  );
}

const JWT_SECRET = REQUIRED_JWT_SECRET || 'dev-only-insecure-jwt-secret-change-me';

export interface AuthenticatedRequest extends Request {
  user?: User;
  authToken?: string;
}

function toSafeUser(user: User & { passwordHash?: string }): User {
  const { passwordHash: _ph, ...safe } = user as any;
  return {
    id: safe.id,
    email: safe.email,
    name: safe.name,
    role: safe.role,
    company: safe.company || '',
    phone: safe.phone || '',
    createdAt: safe.createdAt || new Date().toISOString(),
  };
}

/**
 * Authenticate via Authorization Bearer (preferred) or httpOnly cookie.
 * Role is always taken from the database user record — never trusted from JWT alone.
 */
async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
  // Prefer Bearer so browser localStorage token wins over a stale cookie
  const token = bearer || req.cookies?.vf_token;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required — sign in again',
      code: 'UNAUTHENTICATED',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; email?: string; role?: string };
    if (!decoded?.id) {
      return res.status(401).json({ error: 'Invalid token payload', code: 'INVALID_TOKEN' });
    }

    let userWithHash = await dbManager.findUserById(decoded.id);
    if (!userWithHash && decoded.email) {
      userWithHash = await dbManager.findUserByEmail(decoded.email);
    }
    if (!userWithHash) {
      return res.status(401).json({
        error: 'User not found — sign out and sign in again',
        code: 'USER_NOT_FOUND',
      });
    }

    const safe = toSafeUser(userWithHash);
    req.user = safe;
    req.authToken = token;
    next();
  } catch (err: any) {
    const expired = err?.name === 'TokenExpiredError';
    return res.status(401).json({
      error: expired
        ? 'Session expired — sign in again'
        : 'Invalid token — sign out and sign in again (check JWT_SECRET is set on Vercel)',
      code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
    });
  }
}

function requireRole(...roles: Array<'admin' | 'client'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
    }
    if (!roles.includes(req.user.role as 'admin' | 'client')) {
      return res.status(403).json({
        error: `Requires role: ${roles.join(' or ')}`,
        code: 'FORBIDDEN_ROLE',
        role: req.user.role,
      });
    }
    next();
  };
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRole('admin')(req, res, next);
}

function assertClientOwns(req: AuthenticatedRequest, clientId?: string): boolean {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  return Boolean(clientId && clientId === req.user.id);
}

const messageSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  company: z.string().optional(),
  projectType: z.string().min(1),
  budgetRange: z.string().min(1),
  deadline: z.string().optional(),
  message: z.string().min(10),
});

const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  company: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  amountINR: z.number().positive(),
  description: z.string().min(1),
  dueDate: z.string().min(1),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']).optional(),
});

const invoiceUpdateSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue']).optional(),
  amountINR: z.number().positive().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

const portfolioSchema = z.object({
  title: z.string().min(1),
  clientName: z.string().optional(),
  category: z.string().min(1),
  thumbnailUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  teaser: z.string().optional(),
  fullDescription: z.string().optional(),
  resultsImpact: z.string().optional(),
  toolsUsed: z.array(z.string()).optional(),
  order: z.number().optional(),
  featured: z.boolean().optional(),
  dateCreated: z.string().optional(),
});

const portfolioUpdateSchema = portfolioSchema.partial();

async function sendInquiryEmail(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  projectType?: string;
  budgetRange?: string;
  message?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const to = process.env.NOTIFICATION_EMAIL || 'visionfoldcreative@gmail.com';
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `New inquiry: ${data.name} — ${data.projectType || 'Project'}`,
        text: [
          `Name: ${data.name}`,
          `Email: ${data.email}`,
          `Phone: ${data.phone || '—'}`,
          `Company: ${data.company || '—'}`,
          `Type: ${data.projectType || '—'}`,
          `Budget: ${data.budgetRange || '—'}`,
          '',
          data.message || '',
        ].join('\n'),
      }),
    });
  } catch (err) {
    console.error('[EMAIL]', err);
  }
}

export {
  JWT_SECRET,
  authLimiter,
  messageLimiter,
  aiLimiter,
  authenticateToken,
  requireRole,
  requireAdmin,
  assertClientOwns,
  toSafeUser,
  messageSchema,
  clientSchema,
  invoiceSchema,
  invoiceUpdateSchema,
  portfolioSchema,
  portfolioUpdateSchema,
  sendInquiryEmail,
};
