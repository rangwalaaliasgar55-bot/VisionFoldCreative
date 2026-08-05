import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';
import { dbManager } from './src/lib/db';
import { storageProvider } from './src/lib/storage';
import { User, UserRole } from './src/types';
import { generateText, generateFromPrompt } from './src/lib/openrouter';

const PORT = Number(process.env.PORT || 3000);

// Security: Rate limiting for auth routes (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes.' },
});

// Security: Rate limiting for public contact form (spam protection)
const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent, please try again later.' },
});

// Security: Rate limiting for AI endpoints (prevent abuse)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests, please slow down.' },
});

const REQUIRED_JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET = REQUIRED_JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'vision_fold_creative_jwt_secret_key_2026');

if (process.env.NODE_ENV === 'production' && !REQUIRED_JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production.');
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

const messageSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  company: z.string().trim().optional().default(''),
  projectType: z.string().trim().optional().default('Short Form'),
  budgetRange: z.string().trim().optional().default('₹10,000 - ₹25,000'),
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

async function sendInquiryEmail(payload: { name: string; email: string; message: string; phone: string; company?: string; projectType?: string; budgetRange?: string; deadline?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[EMAIL] RESEND_API_KEY not configured; skipping notification for ${payload.email}`);
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const to = process.env.NOTIFICATION_EMAIL || 'visionfoldcreative@gmail.com';
  const html = `
    <h2>New inquiry from VisionFold Creative</h2>
    <p><strong>Name:</strong> ${payload.name}</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    <p><strong>Phone:</strong> ${payload.phone}</p>
    <p><strong>Company:</strong> ${payload.company || '—'}</p>
    <p><strong>Project Type:</strong> ${payload.projectType || '—'}</p>
    <p><strong>Budget Range:</strong> ${payload.budgetRange || '—'}</p>
    <p><strong>Deadline:</strong> ${payload.deadline || '—'}</p>
    <p><strong>Message:</strong><br/>${payload.message.replace(/\n/g, '<br/>')}</p>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject: `New inquiry from ${payload.name}`, html }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend request failed (${response.status}): ${body}`);
  }
}

// Helper middleware for JWT Auth
async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token =
    req.cookies?.vf_token ||
    (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await dbManager.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export async function createApp() {
  const app = express();

  // Security: Helmet for HTTP security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        mediaSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://openrouter.ai'],
        fontSrc: ["'self'", 'data:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(cookieParser());

  // Serve local uploads folder static files
  const publicUploads = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(publicUploads)) {
    fs.mkdirSync(publicUploads, { recursive: true });
  }
  app.use('/uploads', express.static(publicUploads));

  // --- AUTH ROUTES ---
  app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
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

    const { passwordHash, ...safeUser } = userWithHash;
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
    const { email, password, name, company, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existing = await dbManager.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

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

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('vf_token');
    res.json({ success: true });
  });

  // --- CONTENT BLOCKS ROUTES ---
  app.get('/api/content', async (req, res) => {
    const { page } = req.query;
    const blocks = await dbManager.getContentBlocks(page as string);
    res.json(blocks);
  });

  app.put('/api/content/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const updated = await dbManager.updateContentBlock(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Content block not found' });
    }
    res.json(updated);
  });

  app.post('/api/content', authenticateToken, requireAdmin, async (req, res) => {
    const newBlock = await dbManager.createContentBlock(req.body);
    res.json(newBlock);
  });

  // --- PORTFOLIO ROUTES ---
  app.get('/api/portfolio', async (req, res) => {
    const items = await dbManager.getPortfolio();
    res.json(items);
  });

  app.get('/api/portfolio/:id', async (req, res) => {
    const item = await dbManager.getPortfolioById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }
    res.json(item);
  });

  app.post('/api/portfolio', authenticateToken, requireAdmin, async (req, res) => {
    const parsed = portfolioSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const item = await dbManager.createPortfolioItem(parsed.data);
    res.json(item);
  });

  app.put('/api/portfolio/:id', authenticateToken, requireAdmin, async (req, res) => {
    const parsed = portfolioUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const updated = await dbManager.updatePortfolioItem(req.params.id, parsed.data);
    if (!updated) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }
    res.json(updated);
  });

  app.delete('/api/portfolio/:id', authenticateToken, requireAdmin, async (req, res) => {
    const deleted = await dbManager.deletePortfolioItem(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }
    res.json({ success: true });
  });


  app.get('/api/settings', async (_req, res) => {
    res.json({
      siteIdentity: {
        siteTitle: 'VisionFold Creative',
        tagline: 'Premium Video Production Studio',
        logoUrl: '/logo.svg',
        faviconUrl: '/favicon.svg',
      },
      integrations: {
        supabaseConfigured: Boolean(process.env.SUPABASE_URL || process.env.SupaBase_SUPABASE_URL || process.env.VITE_SUPABASE_URL),
        uploadsConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SupaBase_SUPABASE_SERVICE_ROLE_KEY),
      },
    });
  });

  // --- MESSAGES / INQUIRIES ROUTE ---
  // Public contact form - rate limited to prevent spam
  app.post('/api/messages', messageLimiter, async (req, res) => {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const { name, email, phone, company, projectType, budgetRange, deadline, message } = parsed.data;
    const newMsg = await dbManager.createMessage({
      name,
      email,
      phone,
      company,
      projectType,
      budgetRange,
      deadline,
      message,
    });

    try {
      await sendInquiryEmail({ name, email, message, phone, company, projectType, budgetRange, deadline });
    } catch (error: any) {
      console.error('[EMAIL ERROR]', error.message);
    }

    res.json({ success: true, message: newMsg });
  });

  app.get('/api/messages', authenticateToken, requireAdmin, async (req, res) => {
    res.json(await dbManager.getMessages());
  });

  app.patch('/api/messages/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    const { status } = req.body;
    const updated = await dbManager.updateMessageStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(updated);
  });

  // --- CLIENTS ROUTE (ADMIN) ---
  app.get('/api/clients', authenticateToken, requireAdmin, async (req, res) => {
    const users = await dbManager.getUsers();
    const clients = users.filter((u) => u.role === 'client');
    res.json(clients);
  });

  app.post('/api/clients', authenticateToken, requireAdmin, async (req, res) => {
    const parsed = clientSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const { email, name, company, phone, password } = parsed.data;
    const existing = await dbManager.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const rawPassword = password || 'client123';
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(rawPassword, salt);

    const newClient: User & { passwordHash: string } = {
      id: `user_client_${Date.now()}`,
      email,
      name,
      company,
      phone,
      role: 'client',
      createdAt: new Date().toISOString(),
      passwordHash,
    };

    const safeUser = await dbManager.createUser(newClient);
    res.json({ client: safeUser, initialPassword: rawPassword });
  });

  // --- PROJECTS ROUTE ---
  app.get('/api/projects', authenticateToken, async (req: AuthenticatedRequest, res) => {
    if (req.user?.role === 'admin') {
      res.json(await dbManager.getProjects());
    } else {
      res.json(await dbManager.getProjects(req.user?.id));
    }
  });

  app.post('/api/projects', authenticateToken, requireAdmin, async (req, res) => {
    const newProj = await dbManager.createProject(req.body);
    res.json(newProj);
  });

  app.put('/api/projects/:id', authenticateToken, requireAdmin, async (req, res) => {
    const updated = await dbManager.updateProject(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(updated);
  });

  // --- REVISIONS ROUTE ---
  app.get('/api/revisions', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.query;
    if (req.user?.role === 'admin') {
      res.json(await dbManager.getRevisions(projectId as string));
    } else {
      res.json(await dbManager.getRevisions(projectId as string, req.user?.id));
    }
  });

  app.post('/api/revisions', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { projectId, comment } = req.body;
    if (!projectId || !comment) {
      return res.status(400).json({ error: 'Project ID and comment are required' });
    }

    const proj = await dbManager.getProjectById(projectId);
    if (!proj) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user?.role !== 'admin' && proj.clientId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized for this project' });
    }

    const newRev = await dbManager.createRevision({
      projectId,
      clientId: req.user!.id,
      clientName: req.user!.name,
      comment,
    });

    res.json(newRev);
  });

  app.patch('/api/revisions/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    const { status } = req.body;
    const updated = await dbManager.updateRevisionStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Revision not found' });
    }
    res.json(updated);
  });

  // --- INVOICES ROUTE ---
  app.get('/api/invoices', authenticateToken, async (req: AuthenticatedRequest, res) => {
    if (req.user?.role === 'admin') {
      res.json(await dbManager.getInvoices());
    } else {
      res.json(await dbManager.getInvoices(req.user?.id));
    }
  });

  app.post('/api/invoices', authenticateToken, requireAdmin, async (req, res) => {
    const parsed = invoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const newInv = await dbManager.createInvoice(parsed.data);
    res.json(newInv);
  });

  app.patch('/api/invoices/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const parsed = invoiceUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const inv = (await dbManager.getInvoices()).find((i) => i.id === req.params.id);
    if (!inv) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (req.user?.role !== 'admin' && inv.clientId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized for this invoice' });
    }

    const updated = await dbManager.updateInvoice(req.params.id, parsed.data);
    res.json(updated);
  });

  // --- EXPENSES ROUTE (ADMIN) ---
  app.get('/api/expenses', authenticateToken, requireAdmin, async (req, res) => {
    res.json(await dbManager.getExpenses());
  });

  app.post('/api/expenses', authenticateToken, requireAdmin, async (req, res) => {
    const newExp = await dbManager.createExpense(req.body);
    res.json(newExp);
  });

  app.delete('/api/expenses/:id', authenticateToken, requireAdmin, async (req, res) => {
    const deleted = await dbManager.deleteExpense(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ success: true });
  });

  // --- UPLOAD ROUTE ---
  // --- FILE UPLOAD (admin only to prevent abuse) ---
  app.post('/api/upload', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { fileName, fileData, mimeType } = req.body;
      if (!fileData || !fileName) {
        return res.status(400).json({ error: 'fileData (base64) and fileName are required' });
      }

      // Validate file size (max 15MB)
      const buffer = Buffer.from(fileData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
      if (buffer.length > MAX_FILE_SIZE) {
        return res.status(400).json({ error: 'File too large. Maximum size is 15MB.' });
      }

      // Validate MIME type (allowlist)
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
      const detectedMimeType = mimeType || 'image/png';
      if (!allowedMimeTypes.includes(detectedMimeType)) {
        return res.status(400).json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, MP4' });
      }

      const key = await storageProvider.upload(buffer, fileName, detectedMimeType);
      const url = storageProvider.getUrl(key);

      res.json({ key, url });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to upload file' });
    }
  });

  // --- AI ROUTES (OpenRouter) ---
  // Admin-only endpoints to prevent OpenRouter budget abuse
  app.post('/api/ai/generate', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { prompt, systemPrompt, messages, temperature, maxTokens, model } = req.body;
 
      if (!prompt && !messages) {
        return res.status(400).json({ error: 'Provide either "prompt" or "messages"' });
      }
 
      const text = messages
        ? await generateText(messages, { temperature, maxTokens, model })
        : await generateFromPrompt(prompt, systemPrompt, { temperature, maxTokens, model });
 
      res.json({ text });
    } catch (err: any) {
      console.error('[AI ERROR]', err.message);
      res.status(err.status || 500).json({ error: err.message || 'AI generation failed' });
    }
  });

  // Chat endpoint for AI Assistant (admin-only)
  app.post('/api/ai/chat', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { messages, context } = req.body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Provide messages array' });
      }

      // Build conversation with system context
      const systemMessage = context || 'You are a helpful AI assistant.';
      const conversationMessages = [
        { role: 'system', content: systemMessage },
        ...messages.slice(-10), // Limit to last 10 messages for context
      ];

      const text = await generateText(conversationMessages, { 
        temperature: 0.7, 
        maxTokens: 500,
        model: 'anthropic/claude-3-haiku'
      });

      res.json({ text });
    } catch (err: any) {
      console.error('[AI ERROR]', err.message);
      res.status(err.status || 500).json({ error: err.message || 'Chat failed' });
    }
  });

  app.post('/api/ai/inquiry-assist', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Please provide a rough project message' });
      }

      const prompt = `You are VisionFold Creative's inquiry assistant. Turn this rough client brief into 4 concise, premium clarifying questions that help quote the work faster. Return valid JSON with a single key named questions as an array of strings. Brief: ${message}`;
      const responseText = await generateFromPrompt(prompt, 'You are an expert video-production sales assistant. Be practical, premium, and concise.', { temperature: 0.7, maxTokens: 500 });
      let questions: string[] = [];
      try {
        const parsed = JSON.parse(responseText);
        questions = Array.isArray(parsed.questions) ? parsed.questions.filter(Boolean) : [];
      } catch {
        const fallback = responseText.match(/\[[\s\S]*\]/)?.[0] || '[]';
        const parsed = JSON.parse(fallback);
        questions = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      }
      res.json({ questions: questions.slice(0, 4) });
    } catch (err: any) {
      console.error('[AI ERROR]', err.message);
      res.status(err.status || 500).json({ error: err.message || 'Inquiry assistance failed' });
    }
  });

  // Admin-only: growth insights from business data
  app.post('/api/ai/insights', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const [messages, portfolio, invoices, users, projects] = await Promise.all([
        dbManager.getMessages(),
        dbManager.getPortfolio(),
        dbManager.getInvoices(),
        dbManager.getUsers(),
        dbManager.getProjects(),
      ]);

      const revenue = invoices.reduce((sum, item) => sum + (item.status === 'paid' ? item.amountINR : 0), 0);
      const pending = invoices.filter((item) => item.status !== 'paid').length;
      const newLeads = messages.filter((item) => item.status === 'new').length;

      const prompt = `You are VisionFold Creative's growth copilot. Analyze the following business snapshot and return valid JSON with keys summary, opportunities, followUps, appreciation. Keep it concise, actionable, and premium. Snapshot: ${JSON.stringify({ messages: messages.slice(0, 5), portfolio: portfolio.slice(0, 4), invoices: invoices.slice(0, 5), users: users.slice(0, 5), projects: projects.slice(0, 4), totals: { revenue, pending, newLeads } })}`;
      const responseText = await generateFromPrompt(prompt, 'You are an expert growth strategist for a premium video production studio. Suggest high-impact actions that can increase conversion, retention, and client delight.', { temperature: 0.8, maxTokens: 900 });
      let payload: any = {};
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = { summary: responseText, opportunities: [], followUps: [], appreciation: [] };
      }

      res.json({
        summary: payload.summary || 'AI insight ready.',
        opportunities: Array.isArray(payload.opportunities) ? payload.opportunities : [],
        followUps: Array.isArray(payload.followUps) ? payload.followUps : [],
        appreciation: Array.isArray(payload.appreciation) ? payload.appreciation : [],
      });
    } catch (err: any) {
      console.error('[AI ERROR]', err.message);
      res.status(err.status || 500).json({ error: err.message || 'Growth insights failed' });
    }
  });
 
  // --- VITE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

// Only bind a persistent port when NOT running as a Vercel serverless
// function. On Vercel, api/index.ts imports createApp() and exports the
// Express app directly as the request handler instead.
if (!process.env.VERCEL) {
  createApp().then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Vision Fold Creative Server running on port ${PORT}`);
    });
  });
}
