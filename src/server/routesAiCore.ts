import { Application } from 'express';
import { dbManager } from '../lib/db';
import {
  generateFromPrompt,
  generateText,
  isAiConfigured,
  getActiveProvider,
  getDefaultModel,
  getAiUsageSnapshot,
  AiProviderError,
} from '../lib/aiProvider';
import { aiLimiter, authenticateToken, requireAdmin, type AuthenticatedRequest } from './security';

/** Core AI endpoints used by Growth Copilot and diagnostics. */
export function registerAiCoreRoutes(app: Application) {
  app.get('/api/ai/status', authenticateToken, requireAdmin, (_req, res) => {
    const configured = isAiConfigured();
    const provider = getActiveProvider();
    res.json({
      configured,
      provider,
      model: configured ? getDefaultModel() : null,
      usage: configured ? getAiUsageSnapshot() : null,
      hint: configured
        ? `Using ${provider} (${getDefaultModel()})`
        : 'Set NVIDIA_API_KEY on Vercel (Production + Preview), then Redeploy. Key must start with nvapi-.',
      envSeen: {
        NVIDIA_API_KEY: Boolean(process.env.NVIDIA_API_KEY || process.env.NVAPI_KEY),
        GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
      },
    });
  });

  app.post(
    '/api/ai/generate',
    aiLimiter,
    authenticateToken,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        if (!isAiConfigured()) {
          return res.status(503).json({
            error:
              'AI not configured. Add NVIDIA_API_KEY in Vercel → Settings → Environment Variables, then Redeploy.',
            code: 'NOT_CONFIGURED',
          });
        }
        const prompt = String(req.body?.prompt || '').trim();
        if (!prompt) return res.status(400).json({ error: 'prompt is required' });
        const systemPrompt = req.body?.systemPrompt
          ? String(req.body.systemPrompt)
          : 'You are a helpful creative studio assistant for VisionFold Creative.';
        const text = await generateFromPrompt(prompt, systemPrompt, {
          temperature: Number(req.body?.temperature) || 0.7,
          maxTokens: Number(req.body?.maxTokens) || 800,
        });
        res.json({ text, provider: getActiveProvider(), usage: getAiUsageSnapshot() });
      } catch (err: any) {
        if (err instanceof AiProviderError) {
          return res.status(err.status).json({ error: err.message, code: err.code });
        }
        res.status(500).json({ error: err.message || 'Generate failed' });
      }
    }
  );

  app.post(
    '/api/ai/growth-brief',
    aiLimiter,
    authenticateToken,
    requireAdmin,
    async (_req: AuthenticatedRequest, res) => {
      try {
        const [messages, projects, invoices] = await Promise.all([
          dbManager.getMessages().catch(() => []),
          dbManager.getProjects().catch(() => []),
          dbManager.getInvoices().catch(() => []),
        ]);

        const openLeads = (messages as any[]).filter((m) =>
          ['new', 'contacted', 'qualified', 'proposal'].includes(String(m.status || 'new'))
        ).length;
        const activeProjects = (projects as any[]).filter((p) =>
          ['in_progress', 'in_review'].includes(String(p.status))
        ).length;
        const unpaid = (invoices as any[]).filter((i) =>
          ['sent', 'overdue', 'draft'].includes(String(i.status))
        ).length;

        const snapshot = {
          openLeads,
          activeProjects,
          unpaidInvoices: unpaid,
          totalLeads: (messages as any[]).length,
        };

        if (!isAiConfigured()) {
          return res.json({
            summary: `Studio snapshot: ${openLeads} open leads, ${activeProjects} active projects, ${unpaid} unpaid invoices. Connect NVIDIA_API_KEY for AI recommendations.`,
            opportunities: [
              openLeads ? 'Follow up open leads within 24h' : 'Run outreach to fill the pipeline',
              unpaid ? 'Chase unpaid invoices this week' : 'Billing is clean — pitch retainers',
            ],
            followUps: ['Review Leads tab', 'Check project deadlines in portal'],
            appreciation: ['Ship one portfolio case study this week'],
            configured: false,
            source: 'rules',
            snapshot,
          });
        }

        const text = await generateFromPrompt(
          `You are the growth advisor for VisionFold Creative (premium video editing studio in India). Given this snapshot: ${JSON.stringify(snapshot)}. Write JSON with keys: summary (string), opportunities (string[3]), followUps (string[3]), appreciation (string[2]). Be concrete and short.`,
          'Return only valid JSON.',
          { temperature: 0.5, maxTokens: 700, json: true }
        );

        let parsed: any;
        try {
          parsed = JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, ''));
        } catch {
          parsed = {
            summary: text.slice(0, 400),
            opportunities: [],
            followUps: [],
            appreciation: [],
          };
        }

        res.json({
          summary: parsed.summary || '',
          opportunities: parsed.opportunities || [],
          followUps: parsed.followUps || [],
          appreciation: parsed.appreciation || [],
          configured: true,
          source: getActiveProvider(),
          snapshot,
          usage: getAiUsageSnapshot(),
        });
      } catch (err: any) {
        if (err instanceof AiProviderError) {
          return res.status(err.status).json({ error: err.message, code: err.code });
        }
        res.status(500).json({ error: err.message || 'Growth brief failed' });
      }
    }
  );

  /** Smoke test — proves the key works */
  app.post(
    '/api/ai/ping',
    aiLimiter,
    authenticateToken,
    requireAdmin,
    async (_req, res) => {
      try {
        if (!isAiConfigured()) {
          return res.status(503).json({ ok: false, error: 'NOT_CONFIGURED' });
        }
        const text = await generateText(
          [
            { role: 'system', content: 'Reply with exactly: pong' },
            { role: 'user', content: 'ping' },
          ],
          { maxTokens: 20, temperature: 0 }
        );
        res.json({ ok: true, text, provider: getActiveProvider(), model: getDefaultModel() });
      } catch (err: any) {
        res.status(err.status || 500).json({
          ok: false,
          error: err.message || 'ping failed',
          code: err.code,
        });
      }
    }
  );
}
