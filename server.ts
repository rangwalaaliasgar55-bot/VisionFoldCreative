import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { dbManager } from './src/lib/db';
import { storageProvider } from './src/lib/storage';
import { User, UserRole } from './src/types';
import { generateText, generateFromPrompt } from './src/lib/openrouter';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'vision_fold_creative_jwt_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Helper middleware for JWT Auth
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token =
    req.cookies?.vf_token ||
    (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = dbManager.findUserById(decoded.id);
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

async function startServer() {
  const app = express();

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
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userWithHash = dbManager.findUserByEmail(email);
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
      secure: false, // development / cloud run proxy compatible
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: safeUser, token });
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, password, name, company, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existing = dbManager.findUserByEmail(email);
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

    const safeUser = dbManager.createUser(newClient);
    const token = jwt.sign(
      { id: safeUser.id, email: safeUser.email, role: safeUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('vf_token', token, {
      httpOnly: true,
      secure: false,
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
  app.get('/api/content', (req, res) => {
    const { page } = req.query;
    const blocks = dbManager.getContentBlocks(page as string);
    res.json(blocks);
  });

  app.put('/api/content/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const updated = dbManager.updateContentBlock(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Content block not found' });
    }
    res.json(updated);
  });

  app.post('/api/content', authenticateToken, requireAdmin, (req, res) => {
    const newBlock = dbManager.createContentBlock(req.body);
    res.json(newBlock);
  });

  // --- PORTFOLIO ROUTES ---
  app.get('/api/portfolio', (req, res) => {
    const items = dbManager.getPortfolio();
    res.json(items);
  });

  app.get('/api/portfolio/:id', (req, res) => {
    const item = dbManager.getPortfolioById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }
    res.json(item);
  });

  app.post('/api/portfolio', authenticateToken, requireAdmin, (req, res) => {
    const item = dbManager.createPortfolioItem(req.body);
    res.json(item);
  });

  app.put('/api/portfolio/:id', authenticateToken, requireAdmin, (req, res) => {
    const updated = dbManager.updatePortfolioItem(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }
    res.json(updated);
  });

  app.delete('/api/portfolio/:id', authenticateToken, requireAdmin, (req, res) => {
    const deleted = dbManager.deletePortfolioItem(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }
    res.json({ success: true });
  });

  // --- MESSAGES / INQUIRIES ROUTE ---
  app.post('/api/messages', (req, res) => {
    const { name, email, phone, company, projectType, budgetRange, deadline, message } = req.body;
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ error: 'Name, email, phone, and message are required' });
    }

    const newMsg = dbManager.createMessage({
      name,
      email,
      phone,
      company: company || '',
      projectType: projectType || 'Short Form',
      budgetRange: budgetRange || '₹10,000 - ₹25,000',
      deadline: deadline || '',
      message,
    });

    // Notification Email Trigger Logic
    // TODO: To send actual emails via Resend/Nodemailer:
    // 1. npm install resend (or nodemailer)
    // 2. Set RESEND_API_KEY in environment variables
    // 3. await resend.emails.send({ from: 'noreply@visionfoldcreative.com', to: 'visionfoldcreative@gmail.com', subject: 'New Inquiry from ' + name, html: ... })
    console.log(`[NOTIFICATION TODO] New inquiry received from ${name} (${email}): "${message}"`);

    res.json({ success: true, message: newMsg });
  });

  app.get('/api/messages', authenticateToken, requireAdmin, (req, res) => {
    res.json(dbManager.getMessages());
  });

  app.patch('/api/messages/:id/status', authenticateToken, requireAdmin, (req, res) => {
    const { status } = req.body;
    const updated = dbManager.updateMessageStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(updated);
  });

  // --- CLIENTS ROUTE (ADMIN) ---
  app.get('/api/clients', authenticateToken, requireAdmin, (req, res) => {
    const users = dbManager.getUsers();
    const clients = users.filter((u) => u.role === 'client');
    res.json(clients);
  });

  app.post('/api/clients', authenticateToken, requireAdmin, (req, res) => {
    const { email, name, company, phone, password } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    const existing = dbManager.findUserByEmail(email);
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
      company: company || '',
      phone: phone || '',
      role: 'client',
      createdAt: new Date().toISOString(),
      passwordHash,
    };

    const safeUser = dbManager.createUser(newClient);
    res.json({ client: safeUser, initialPassword: rawPassword });
  });

  // --- PROJECTS ROUTE ---
  app.get('/api/projects', authenticateToken, (req: AuthenticatedRequest, res) => {
    if (req.user?.role === 'admin') {
      res.json(dbManager.getProjects());
    } else {
      res.json(dbManager.getProjects(req.user?.id));
    }
  });

  app.post('/api/projects', authenticateToken, requireAdmin, (req, res) => {
    const newProj = dbManager.createProject(req.body);
    res.json(newProj);
  });

  app.put('/api/projects/:id', authenticateToken, requireAdmin, (req, res) => {
    const updated = dbManager.updateProject(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(updated);
  });

  // --- REVISIONS ROUTE ---
  app.get('/api/revisions', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { projectId } = req.query;
    if (req.user?.role === 'admin') {
      res.json(dbManager.getRevisions(projectId as string));
    } else {
      res.json(dbManager.getRevisions(projectId as string, req.user?.id));
    }
  });

  app.post('/api/revisions', authenticateToken, (req: AuthenticatedRequest, res) => {
    const { projectId, comment } = req.body;
    if (!projectId || !comment) {
      return res.status(400).json({ error: 'Project ID and comment are required' });
    }

    const proj = dbManager.getProjectById(projectId);
    if (!proj) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user?.role !== 'admin' && proj.clientId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized for this project' });
    }

    const newRev = dbManager.createRevision({
      projectId,
      clientId: req.user!.id,
      clientName: req.user!.name,
      comment,
    });

    res.json(newRev);
  });

  app.patch('/api/revisions/:id/status', authenticateToken, requireAdmin, (req, res) => {
    const { status } = req.body;
    const updated = dbManager.updateRevisionStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Revision not found' });
    }
    res.json(updated);
  });

  // --- INVOICES ROUTE ---
  app.get('/api/invoices', authenticateToken, (req: AuthenticatedRequest, res) => {
    if (req.user?.role === 'admin') {
      res.json(dbManager.getInvoices());
    } else {
      res.json(dbManager.getInvoices(req.user?.id));
    }
  });

  app.post('/api/invoices', authenticateToken, requireAdmin, (req, res) => {
    const newInv = dbManager.createInvoice(req.body);
    res.json(newInv);
  });

  app.patch('/api/invoices/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
    const inv = dbManager.getInvoices().find((i) => i.id === req.params.id);
    if (!inv) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (req.user?.role !== 'admin' && inv.clientId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized for this invoice' });
    }

    const updated = dbManager.updateInvoice(req.params.id, req.body);
    res.json(updated);
  });

  // --- EXPENSES ROUTE (ADMIN) ---
  app.get('/api/expenses', authenticateToken, requireAdmin, (req, res) => {
    res.json(dbManager.getExpenses());
  });

  app.post('/api/expenses', authenticateToken, requireAdmin, (req, res) => {
    const newExp = dbManager.createExpense(req.body);
    res.json(newExp);
  });

  app.delete('/api/expenses/:id', authenticateToken, requireAdmin, (req, res) => {
    const deleted = dbManager.deleteExpense(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ success: true });
  });

  // --- UPLOAD ROUTE ---
  app.post('/api/upload', authenticateToken, async (req, res) => {
    try {
      const { fileName, fileData, mimeType } = req.body;
      if (!fileData || !fileName) {
        return res.status(400).json({ error: 'fileData (base64) and fileName are required' });
      }

      const buffer = Buffer.from(fileData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const key = await storageProvider.upload(buffer, fileName, mimeType || 'image/png');
      const url = storageProvider.getUrl(key);

      res.json({ key, url });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to upload file' });
    }
  });

  // --- AI ROUTE (OpenRouter) ---
  app.post('/api/ai/generate', authenticateToken, async (req: AuthenticatedRequest, res) => {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vision Fold Creative Server running on port ${PORT}`);
  });
}

startServer();
