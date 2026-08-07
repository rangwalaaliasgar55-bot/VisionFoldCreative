import { Application, Response } from 'express';
import { dbManager } from '../lib/db';
import {
  generateText,
  generateFromPrompt,
  isAiConfigured,
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
      },
    };
  }
  const message = err instanceof Error ? err.message : 'AI request failed';
  return {
    status: 500,
    body: { error: message, code: 'PROVIDER_ERROR', configured: isAiConfigured() },
  };
}

export function registerAiRoutes(app: Application) {
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
            error:
              'AI is not configured yet. Add GEMINI_API_KEY after Phase D. OpenRouter was removed in Phase A.',
            code: 'NOT_CONFIGURED',
            configured: false,
          });
        }
        const text = messages
          ? await generateText(messages, { temperature, maxTokens, model })
          : await generateFromPrompt(prompt, systemPrompt, { temperature, maxTokens, model });
        res.json({ text, configured: true });
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
            error: 'AI chat is unavailable until GEMINI_API_KEY is configured (Phase D).',
            code: 'NOT_CONFIGURED',
            configured: false,
          });
        }
        const conversationMessages = [
          { role: 'system' as const, content: context || 'You are VisionFold Creative studio assistant.' },
          ...messages.slice(-10),
        ];
        const text = await generateText(conversationMessages, { temperature: 0.7, maxTokens: 500 });
        res.json({ text, configured: true });
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

      // Deterministic fallback — never silent, never fake LLM output as AI
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

      const prompt = `Turn this brief into 4 concise clarifying questions as JSON {"questions":["..."]}: ${message}`;
      const responseText = await generateFromPrompt(prompt, 'Return valid JSON only.', {
        temperature: 0.7,
        maxTokens: 500,
      });
      let questions: string[] = [];
      try {
        const parsed = JSON.parse(responseText);
        questions = Array.isArray(parsed.questions) ? parsed.questions.filter(Boolean) : [];
      } catch {
        questions = [];
      }
      res.json({ questions: questions.slice(0, 4), configured: true, source: 'ai' });
    } catch (err: unknown) {
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
          // Structured non-AI summary from real data — not a hallucinated brief
          return res.json({
            summary: `Studio snapshot (rules-based, AI offline): ${projects.length} projects, ₹${revenue.toLocaleString('en-IN')} paid revenue, ${openLeads} open leads. Configure GEMINI_API_KEY in Phase D for AI narrative insights.`,
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
          });
        }

        const prompt = `Return JSON with keys summary, opportunities, followUps, appreciation for snapshot: ${JSON.stringify({
          revenue,
          leads: messages.slice(0, 5),
          projects: projects.slice(0, 4),
        })}`;
        const responseText = await generateFromPrompt(
          prompt,
          'Growth strategist for a premium video studio. JSON only.',
          { temperature: 0.8, maxTokens: 900 }
        );
        let payload: any = {};
        try {
          payload = JSON.parse(responseText);
        } catch {
          payload = { summary: responseText };
        }
        res.json({
          summary: payload.summary || 'AI insight ready.',
          opportunities: Array.isArray(payload.opportunities) ? payload.opportunities : [],
          followUps: Array.isArray(payload.followUps) ? payload.followUps : [],
          appreciation: Array.isArray(payload.appreciation) ? payload.appreciation : [],
          configured: true,
          source: 'ai',
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
            text: 'The AI assistant is not configured yet. Message the studio from Messages in your portal, or WhatsApp the team — they will reply shortly.',
            configured: false,
            source: 'fallback',
          });
        }

        const isAdmin = req.user?.role === 'admin';
        const system = isAdmin
          ? 'You are VisionFold Creative internal assistant.'
          : `You are VisionFold Creative client assistant for ${req.user?.name || 'the client'}. Help with projects, revisions, and creative questions. Be concise. Never invent invoices or deadlines.`;
        const text = await generateFromPrompt(message.slice(0, 4000), system, {
          temperature: 0.7,
          maxTokens: 600,
        });
        res.json({ text, configured: true, source: 'ai' });
      } catch (err: unknown) {
        const { status, body } = aiErrorPayload(err);
        res.status(status).json(body);
      }
    }
  );

  app.get('/api/ai/status', (_req, res) => {
    res.json({
      configured: isAiConfigured(),
      provider: isAiConfigured() ? 'gemini-pending' : 'none',
      openRouterRemoved: true,
      phase: 'A',
    });
  });
}
