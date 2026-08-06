import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { dbManager } from '../lib/db';
import { User } from '../types';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes.' },
});

const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent, please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests, please slow down.' },
});

const REQUIRED_JWT_SECRET = process.env.JWT_SECRET;

if (!REQUIRED_JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET must be set in production.');
    process.exit(1);
  }
  console.warn('JWT_SECRET is not set; using an insecure dev-only fallback.');
}

const JWT_SECRET = REQUIRED_JWT_SECRET || 'dev-only-insecure-jwt-secret-change-me';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

const messageSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  company: z.string().trim().optional().default(''),
  projectType: z.string().trim().optional().default('Short Form'),
  budgetRange: z.string().trim().optional().default('Flexible / Custom Quote'),
  deadline: z.string().trim().optional().default(''),
  message: z.string().trim().min(1),
});

const portfolioCategorySchema = z.enum(['Short Form', 'Brand Content', 'Long Form', 'Social Media', 'Documentary']);

const portfolioSchema = z.object({
  title: z.string().trim().min(1),
  clientName: z.string().trim().optional().or(z.literal('')),
  hideClientName: z.boolean().optional(),
  category: portfolioCategorySchema,
  thumbnailUrl: z.string().trim().url().optional().or(z.literal('')).default(''),
  videoUrl: z.string().trim().url().optional().or(z.literal('')).default(''),
  teaser: z.string().trim().optional().default(''),
  fullDescription: z.string().trim().optional().default(''),
  dateCreated: z.string().trim().optional().default(''),
  toolsUsed: z.array(z.string()).optional().default([]),
  resultsImpact: z.string().trim().optional().default(''),
  order: z.number().int().optional().default(0),
  featured: z.boolean().optional().default(false),
});

const portfolioUpdateSchema = portfolioSchema.partial();

const clientSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1),
  company: z.string().trim().optional().default(''),
  phone: z.string().trim().optional().default(''),
  password: z.string().trim().min(1).optional(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().trim().min(1),
  clientId: z.string().trim().min(1),
  clientName: z.string().trim().min(1),
  amountINR: z.number().min(0),
  dueDate: z.string().trim().min(1),
  status: z.enum(['paid', 'unpaid', 'overdue']).optional().default('unpaid'),
  description: z.string().trim().min(1),
  projectId: z.string().trim().optional(),
});

const invoiceUpdateSchema = invoiceSchema.partial();

async function sendInquiryEmail(payload: {
  name: string; email: string; message: string; phone: string;
  company?: string; projectType?: string; budgetRange?: string; deadline?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[EMAIL] RESEND_API_KEY not configured; skipping notification for ${payload.email}`);
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const to = process.env.NOTIFICATION_EMAIL || 'visionfoldcreative@gmail.com';
  const html = `<h2>New inquiry from VisionFold Creative</h2>
    <p><strong>Name:</strong> ${payload.name}</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    <p><strong>Phone:</strong> ${payload.phone}</p>
    <p><strong>Company:</strong> ${payload.company || '—'}</p>
    <p><strong>Project Type:</strong> ${payload.projectType || '—'}</p>
    <p><strong>Budget Range:</strong> ${payload.budgetRange || '—'}</p>
    <p><strong>Deadline:</strong> ${payload.deadline || '—'}</p>
    <p><strong>Message:</strong><br/>${payload.message.replace(/\n/g, '<br/>')}</p>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject: `New inquiry from ${payload.name}`, html }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend request failed (${response.status}): ${body}`);
  }
}

async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.vf_token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await dbManager.findUserById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export {
  JWT_SECRET,
  authLimiter,
  messageLimiter,
  aiLimiter,
  authenticateToken,
  requireAdmin,
  messageSchema,
  portfolioSchema,
  portfolioUpdateSchema,
  clientSchema,
  invoiceSchema,
  invoiceUpdateSchema,
  sendInquiryEmail,
};
export type { AuthenticatedRequest };
