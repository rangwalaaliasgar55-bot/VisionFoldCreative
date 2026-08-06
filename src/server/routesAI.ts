import { Application, Response } from 'express';
import { dbManager } from '../lib/db';
import { generateText, generateFromPrompt } from '../lib/openrouter';
import {
  aiLimiter,
  authenticateToken,
  requireAdmin,
  type AuthenticatedRequest,
} from './security';

export function registerAiRoutes(app: Application) {
  app.post('/api/ai/generate', aiLimiter, authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { prompt, systemPrompt, messages, temperature, maxTokens, model } = req.body || {};
      if (!prompt && !messages) return res.status(400).json({ error: 'Provide prompt or messages' });
      const text = messages
        ? await generateText(messages, { temperature, maxTokens, model })
        : await generateFromPrompt(prompt, systemPrompt, { temperature, maxTokens, model });
      res.json({ text });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'AI generation failed' });
    }
  });

  app.post('/api/ai/chat', aiLimiter, authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { messages, context } = req.body || {};
      if (!messages || !Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'Provide messages array' });
      const conversationMessages = [
        { role: 'system', content: context || 'You are VisionFold Creative studio assistant.' },
        ...messages.slice(-10),
      ];
      const text = await generateText(conversationMessages as any, { temperature: 0.7, maxTokens: 500, model: 'anthropic/claude-3-haiku' });
      res.json({ text });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Chat failed' });
    }
  });

  app.post('/api/ai/inquiry-assist', aiLimiter, async (req, res) => {
    try {
      const message = String(req.body?.message || '').trim();
      if (!message) return res.status(400).json({ error: 'Provide a project message' });
      if (!process.env.OPENROUTER_API_KEY) {
        return res.json({
          questions: [
            'Which platforms and aspect ratios do you need?',
            'Who is the target audience and desired action?',
            'How much raw footage and target runtime?',
            'Deadline, revisions, and brand references?',
          ],
          configured: false,
        });
      }
      const prompt = `Turn this brief into 4 concise clarifying questions as JSON {"questions":["..."]}: ${message}`;
      const responseText = await generateFromPrompt(prompt, 'Return valid JSON only.', { temperature: 0.7, maxTokens: 500 });
      let questions: string[] = [];
      try {
        const parsed = JSON.parse(responseText);
        questions = Array.isArray(parsed.questions) ? parsed.questions.filter(Boolean) : [];
      } catch { questions = []; }
      res.json({ questions: questions.slice(0, 4), configured: true });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Inquiry assist failed' });
    }
  });

  app.post('/api/ai/insights', aiLimiter, authenticateToken, requireAdmin, async (_req: AuthenticatedRequest, res) => {
    try {
      const [messages, invoices, projects] = await Promise.all([
        dbManager.getMessages(),
        dbManager.getInvoices(),
        dbManager.getProjects(),
      ]);
      const revenue = invoices.reduce((sum, item) => sum + (item.status === 'paid' ? item.amountINR : 0), 0);
      const prompt = `Return JSON with keys summary, opportunities, followUps, appreciation for snapshot: ${JSON.stringify({ revenue, leads: messages.slice(0, 5), projects: projects.slice(0, 4) })}`;
      const responseText = await generateFromPrompt(prompt, 'Growth strategist for a premium video studio.', { temperature: 0.8, maxTokens: 900 });
      let payload: any = {};
      try { payload = JSON.parse(responseText); } catch { payload = { summary: responseText }; }
      res.json({
        summary: payload.summary || 'AI insight ready.',
        opportunities: Array.isArray(payload.opportunities) ? payload.opportunities : [],
        followUps: Array.isArray(payload.followUps) ? payload.followUps : [],
        appreciation: Array.isArray(payload.appreciation) ? payload.appreciation : [],
      });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Insights failed' });
    }
  });

  app.post('/api/ai/client-assist', aiLimiter, authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const message = String(req.body?.message || '').trim();
      if (!message) return res.status(400).json({ error: 'message is required' });
      if (!process.env.OPENROUTER_API_KEY) {
        return res.json({
          text: 'AI assistant is not configured yet. Contact the studio team and they will respond shortly.',
          configured: false,
        });
      }
      const isAdmin = req.user?.role === 'admin';
      const system = isAdmin
        ? 'You are VisionFold Creative internal assistant.'
        : `You are VisionFold Creative client assistant for ${req.user?.name || 'the client'}. Help with projects, revisions, and creative questions. Be concise and premium. Never invent invoices or deadlines.`;
      const text = await generateFromPrompt(message.slice(0, 4000), system, { temperature: 0.7, maxTokens: 600 });
      res.json({ text, configured: true });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Assistant failed' });
    }
  });
}
