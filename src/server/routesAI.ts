import { Application, Response } from 'express';
import { dbManager } from '../lib/db';
import {
  generateText,
  generateFromPrompt,
  generateJson,
  isAiConfigured,
  getAiUsageSnapshot,
  getDefaultModel,
  AiProviderError,
} from '../lib/aiProvider';
import {
  aiLimiter,
  authenticateToken,
  requireAdmin,
  type AuthenticatedRequest,
} from './security';

function aiErrorPayload(err: unknown) {
  if (err instanceof AiProviderError) {
    return {
      status: err.status,
      body: {
        error: err.message,
        code: err.code,
        configured: isAiConfigured(),
        usage: getAiUsageSnapshot(),
      },
    };
  }
  const message = err instanceof Error ? err.message : 'AI request failed';
  return {
    status: 500,
    body: {
      error: message,
      code: 'PROVIDER_ERROR',
      configured: isAiConfigured(),
      usage: getAiUsageSnapshot(),
    },
  };
}

export function registerAiRoutes(app: Application) {
  app.get('/api/ai/status', (_req, res) => {
    const usage = getAiUsageSnapshot();
    res.json({
      configured: isAiConfigured(),
      provider: isAiConfigured() ? 'gemini' : 'none',
      model: getDefaultModel(),
      openRouterRemoved: true,
      phase: 'D',
      usage,
    });
  });

  app.post(
    '/api/ai/generate',
    aiLimiter,
    authenticateToken,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { prompt, systemPrompt, messages, temperature, maxTokens, model } = req.body || {};
        if (!prompt && !messages) {
          return res.status(400).json({ error: 'Provide prompt or messages' });
        }
        if (!isAiConfigured()) {
          return res.status(503).json({
            error: 'AI is not configured. Set GEMINI_API_KEY in Vercel.',
            code: 'NOT_CONFIGURED',
            configured: false,
            usage: getAiUsageSnapshot(),
          });
        }
        const text = messages
          ? await generateText(messages, { temperature, maxTokens, model })
          : await generateFromPrompt(prompt, systemPrompt, { temperature, maxTokens, model });
        res.json({ text, configured: true, source: 'gemini', usage: getAiUsageSnapshot() });
      } catch (err: unknown) {
        const { status, body } = aiErrorPayload(err);
        res.status(status).json(body);
      }
    }
  );

  app.post(
    '/api/ai/chat',
    aiLimiter,
    authenticateToken,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { messages, context } = req.body || {};
        if (!messages || !Array.isArray(messages) || !messages.length) {
          return res.status(400).json({ error: 'Provide messages array' });
        }
        if (!isAiConfigured()) {
          return res.status(503).json({
            error: 'AI chat needs GEMINI_API_KEY.',
            code: 'NOT_CONFIGURED',
            configured: false,
          });
        }
        const conversationMessages = [
          {
            role: 'system' as const,
            content:
              context ||
              'You are VisionFold Creative studio assistant — premium short-form and long-form video editing. Be concise and practical.',
          },
          ...messages.slice(-10),
        ];
        const text = await generateText(conversationMessages, { temperature: 0.7, maxTokens: 600 });
        res.json({ text, configured: true, source: 'gemini', usage: getAiUsageSnapshot() });
      } catch (err: unknown) {
        const { status, body } = aiErrorPayload(err);
        res.status(status).json(body);
      }
    }
  );

  app.post('/api/ai/inquiry-assist', aiLimiter, async (req, res) => {
    try {
      const message = String(req.body?.message || '').trim();
      if (!message) return res.status(400).json({ error: 'Provide a project message' });

      if (!isAiConfigured()) {
        return res.json({
          questions: [
            'Which platforms and aspect ratios do you need?',
            'Who is the target audience and desired action?',
            'How much raw footage and target runtime?',
            'Deadline, revisions, and brand references?',
          ],
          configured: false,
          source: 'template',
        });
      }

      const data = await generateJson<{ questions?: string[] }>(
        `Turn this brief into 4 concise clarifying questions for a video editor: ${message.slice(0, 3000)}`,
        'You help a premium video studio qualify leads. Return JSON: {"questions":["..."]}',
        { temperature: 0.6, maxTokens: 400 }
      );
      const questions = Array.isArray(data.questions)
        ? data.questions.filter((q) => typeof q === 'string' && q.trim()).slice(0, 4)
        : [];
      res.json({
        questions:
          questions.length > 0
            ? questions
            : [
                'Which platforms and aspect ratios do you need?',
                'Who is the target audience and desired action?',
                'How much raw footage and target runtime?',
                'Deadline, revisions, and brand references?',
              ],
        configured: true,
        source: questions.length ? 'gemini' : 'template',
        usage: getAiUsageSnapshot(),
      });
    } catch (err: unknown) {
      // Soft-fail to template so the contact form never dies
      if (err instanceof AiProviderError && err.code === 'NOT_CONFIGURED') {
        return res.json({
          questions: [
            'Which platforms and aspect ratios do you need?',
            'Who is the target audience and desired action?',
            'How much raw footage and target runtime?',
            'Deadline, revisions, and brand references?',
          ],
          configured: false,
          source: 'template',
        });
      }
      const { status, body } = aiErrorPayload(err);
      res.status(status).json(body);
    }
  });

  app.post(
    '/api/ai/insights',
    aiLimiter,
    authenticateToken,
    requireAdmin,
    async (_req: AuthenticatedRequest, res) => {
      try {
        const [messages, invoices, projects] = await Promise.all([
          dbManager.getMessages(),
          dbManager.getInvoices(),
          dbManager.getProjects(),
        ]);
        const revenue = invoices.reduce(
          (sum, item) => sum + (item.status === 'paid' ? item.amountINR || 0 : 0),
          0
        );
        const openLeads = messages.filter((m: any) => m.status === 'new' || !m.status).length;

        if (!isAiConfigured()) {
          return res.json({
            summary: `Studio snapshot (rules-based, AI offline): ${projects.length} projects, ₹${revenue.toLocaleString('en-IN')} paid revenue, ${openLeads} open leads. Set GEMINI_API_KEY for AI narrative insights.`,
            opportunities: openLeads
              ? [`Follow up ${openLeads} open lead(s) from the contact form.`]
              : ['No open leads — push WhatsApp CTA on the homepage.'],
            followUps: projects
              .filter((p: any) => p.status === 'in_progress' || p.status === 'in_review')
              .slice(0, 5)
              .map((p: any) => `${p.title} (${p.status}) — ${p.clientName || 'client'}`),
            appreciation: [],
            configured: false,
            source: 'rules',
            usage: getAiUsageSnapshot(),
          });
        }

        const snapshot = {
          revenueINR: revenue,
          openLeads,
          projectCount: projects.length,
          leads: messages.slice(0, 8).map((m: any) => ({
            name: m.name,
            status: m.status,
            projectType: m.projectType,
          })),
          projects: projects.slice(0, 8).map((p: any) => ({
            title: p.title,
            status: p.status,
            clientName: p.clientName,
            amountINR: p.amountINR,
          })),
        };

        const payload = await generateJson<{
          summary?: string;
          opportunities?: string[];
          followUps?: string[];
          appreciation?: string[];
        }>(
          `Studio data snapshot: ${JSON.stringify(snapshot)}`,
          'You are growth strategist for VisionFold Creative (premium video editing studio in India). Return JSON with keys: summary (string), opportunities (string[]), followUps (string[]), appreciation (string[]). Be specific and actionable. Currency INR.',
          { temperature: 0.7, maxTokens: 900 }
        );

        res.json({
          summary: payload.summary || 'AI insight ready.',
          opportunities: Array.isArray(payload.opportunities) ? payload.opportunities : [],
          followUps: Array.isArray(payload.followUps) ? payload.followUps : [],
          appreciation: Array.isArray(payload.appreciation) ? payload.appreciation : [],
          configured: true,
          source: 'gemini',
          usage: getAiUsageSnapshot(),
        });
      } catch (err: unknown) {
        const { status, body } = aiErrorPayload(err);
        res.status(status).json(body);
      }
    }
  );

  app.post(
    '/api/ai/client-assist',
    aiLimiter,
    authenticateToken,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const message = String(req.body?.message || '').trim();
        if (!message) return res.status(400).json({ error: 'message is required' });

        if (!isAiConfigured()) {
          return res.json({
            text: 'The AI assistant is offline. Use Messages in your portal or WhatsApp the studio — they will reply shortly.',
            configured: false,
            source: 'fallback',
          });
        }

        const isAdmin = req.user?.role === 'admin';
        const system = isAdmin
          ? 'You are VisionFold Creative internal assistant for the studio founder. Be direct and operational.'
          : `You are VisionFold Creative client assistant for ${req.user?.name || 'the client'}. Help with projects, revisions, and creative questions. Be concise. Never invent invoices, prices, or deadlines that were not provided.`;

        const text = await generateFromPrompt(message.slice(0, 4000), system, {
          temperature: 0.7,
          maxTokens: 600,
        });
        res.json({ text, configured: true, source: 'gemini', usage: getAiUsageSnapshot() });
      } catch (err: unknown) {
        const { status, body } = aiErrorPayload(err);
        res.status(status).json(body);
      }
    }
  );
}
