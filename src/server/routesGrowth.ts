import { Application } from 'express';
import { dbManager } from '../lib/db';
import { scoreLead } from '../lib/leadScore';
import { parseDelimited, analyzeSheet, isLikelyBinaryXlsx } from '../lib/csvAnalyst';
import {
  generateJson,
  generateFromPrompt,
  isAiConfigured,
  getActiveProvider,
  getAiUsageSnapshot,
  AiProviderError,
} from '../lib/aiProvider';
import {
  aiLimiter,
  authenticateToken,
  requireAdmin,
  type AuthenticatedRequest,
} from './security';

/** Vercel serverless body limit is ~4.5MB — keep under that. */
const MAX_CSV_CHARS = 2_000_000; // ~2MB text
const MAX_ROWS = 20000;

async function persistLeadScore(messageId: string, result: Awaited<ReturnType<typeof scoreLead>>) {
  try {
    const settings = await dbManager.getSettings();
    const map = { ...((settings as any).leadScores || {}) };
    map[messageId] = { ...result, updatedAt: new Date().toISOString() };
    await dbManager.updateSettings({ ...settings, leadScores: map } as any);
  } catch (err: any) {
    console.warn('[LEAD_SCORE] persist failed', err?.message);
  }
}

export async function scoreAndPersistMessage(msg: {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  projectType?: string;
  budgetRange?: string;
  deadline?: string;
  message?: string;
}) {
  const result = await scoreLead(msg);
  await persistLeadScore(msg.id, result);
  return result;
}

export function registerGrowthRoutes(app: Application) {
  app.post(
    '/api/ai/score-lead',
    aiLimiter,
    authenticateToken,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const messageId = String(req.body?.messageId || '');
        const messages = await dbManager.getMessages();
        const msg = messages.find((m: any) => m.id === messageId);
        if (!msg && !req.body?.lead) {
          return res.status(404).json({ error: 'Lead not found' });
        }
        const input = msg || req.body.lead;
        const result = await scoreLead(input);
        if (msg) await persistLeadScore(msg.id, result);
        res.json({ ...result, messageId: msg?.id, usage: getAiUsageSnapshot() });
      } catch (err: any) {
        res.status(500).json({ error: err.message || 'Score failed' });
      }
    }
  );

  app.post(
    '/api/ai/spreadsheet-analyst',
    aiLimiter,
    authenticateToken,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const text = String(req.body?.text || req.body?.csv || '');
        const fileName = String(req.body?.fileName || 'upload.csv');
        if (!text.trim()) {
          return res.status(400).json({ error: 'Provide CSV/TSV text in body.text' });
        }
        if (text.length > MAX_CSV_CHARS) {
          return res.status(400).json({
            error: `File too large for serverless upload (max ~2MB / ${MAX_CSV_CHARS.toLocaleString()} characters). Split the CSV or upload a sample. 500MB files cannot run on Vercel functions.`,
            code: 'FILE_TOO_LARGE',
            maxChars: MAX_CSV_CHARS,
          });
        }
        if (isLikelyBinaryXlsx(text) || /\.xlsx$/i.test(fileName)) {
          return res.status(400).json({
            error:
              'Binary .xlsx is not supported. In Excel/Sheets: File → Download → Comma-separated values (.csv), then upload.',
            code: 'XLSX_NOT_SUPPORTED',
          });
        }

        const { headers, rows } = parseDelimited(text);
        if (!headers.length || !rows.length) {
          return res.status(400).json({ error: 'No rows found — check the file is CSV with a header row' });
        }

        const limitedRows = rows.slice(0, MAX_ROWS);
        const analysis = analyzeSheet(headers, limitedRows);
        if (rows.length > MAX_ROWS) {
          analysis.warnings.push(`Analyzed first ${MAX_ROWS.toLocaleString()} of ${rows.length.toLocaleString()} rows`);
        }

        let narrative: string | null = null;
        let source: string = 'rules';

        if (isAiConfigured()) {
          try {
            narrative = await generateFromPrompt(
              `Analyze this spreadsheet for a video studio founder. Give: 1) what the data is 2) top 3 insights 3) one action.\n${JSON.stringify({
                fileName,
                rowCount: analysis.rowCount,
                columns: analysis.columns.slice(0, 20),
                numericColumns: analysis.numericColumns.slice(0, 8),
                topValues: analysis.topValues.slice(0, 5),
                sampleRows: analysis.sampleRows,
              }).slice(0, 6000)}`,
              'Sharp business analyst. Concrete numbers. Short paragraphs.',
              { temperature: 0.4, maxTokens: 700 }
            );
            source = getActiveProvider();
          } catch (err) {
            console.warn('[SPREADSHEET] AI narrative failed', err);
          }
        }

        if (!narrative) {
          const nums = analysis.numericColumns
            .slice(0, 3)
            .map((c) => `${c.name}: sum ${c.sum.toFixed(0)}, avg ${c.avg.toFixed(1)}`)
            .join('; ');
          narrative = `Rules summary for ${fileName}: ${analysis.rowCount} rows × ${analysis.columnCount} columns.${nums ? ' Numeric — ' + nums + '.' : ''} ${analysis.warnings.join(' ')}`.trim();
        }

        try {
          const settings = await dbManager.getSettings();
          const reports = Array.isArray((settings as any).spreadsheetReports)
            ? (settings as any).spreadsheetReports
            : [];
          reports.unshift({
            id: `sheet_${Date.now()}`,
            fileName,
            createdAt: new Date().toISOString(),
            analysis: {
              rowCount: analysis.rowCount,
              columnCount: analysis.columnCount,
              columns: analysis.columns,
              numericColumns: analysis.numericColumns,
            },
            narrative,
            source,
          });
          await dbManager.updateSettings({
            ...settings,
            spreadsheetReports: reports.slice(0, 20),
          } as any);
        } catch {
          /* non-fatal */
        }

        res.json({
          fileName,
          analysis,
          narrative,
          source,
          configured: isAiConfigured(),
          usage: getAiUsageSnapshot(),
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message || 'Analysis failed' });
      }
    }
  );

  app.post(
    '/api/ai/proposal',
    aiLimiter,
    authenticateToken,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { messageId, projectId, brief, clientName, projectType, budget } = req.body || {};
        let context: Record<string, unknown> = {
          clientName,
          projectType,
          budget,
          brief,
        };

        if (messageId) {
          const messages = await dbManager.getMessages();
          const m = messages.find((x: any) => x.id === messageId);
          if (m) {
            context = {
              clientName: m.name,
              company: m.company,
              projectType: m.projectType,
              budget: m.budgetRange,
              deadline: m.deadline,
              brief: m.message,
              email: m.email,
            };
          }
        }
        if (projectId) {
          const p = await dbManager.getProjectById(projectId);
          if (p) {
            context = {
              ...context,
              clientName: p.clientName,
              projectType: p.category,
              budget: p.amountINR,
              brief: p.description,
              title: p.title,
            };
          }
        }

        const rates = (await dbManager.getSettings())?.rates || { baselineRate: 700 };

        let proposal: {
          title: string;
          executiveSummary: string;
          scope: string[];
          timeline: string[];
          investment: string;
          nextSteps: string[];
        };

        if (isAiConfigured()) {
          proposal = await generateJson(
            `Write a short client proposal for VisionFold Creative. Studio baseline ~₹${(rates as any).baselineRate || 700}/min short-form. Context: ${JSON.stringify(context).slice(0, 3000)}`,
            'Return JSON: title, executiveSummary, scope (string[]), timeline (string[]), investment (string INR), nextSteps (string[]).',
            { temperature: 0.5, maxTokens: 900 }
          );
        } else {
          proposal = {
            title: `Proposal — ${context.clientName || 'Client'} / ${context.projectType || 'Video edit'}`,
            executiveSummary:
              'VisionFold Creative will deliver retention-first edits aligned to your brief, with clear revision rounds and on-time delivery.',
            scope: [
              'Creative review of source footage',
              'Edit, pacing, captions, and sound pass',
              '2 revision rounds',
              'Export in required aspect ratios',
            ],
            timeline: ['Kickoff within 24–48h', 'First cut in 3–5 working days', 'Final within 7–10 days'],
            investment: `Custom quote — baseline from ₹${(rates as any).baselineRate || 700}/min short-form. ${context.budget || ''}`.trim(),
            nextSteps: ['Confirm scope and deadline', 'Share footage + refs', 'Invoice / kickoff'],
          };
        }

        const record = {
          id: `prop_${Date.now()}`,
          createdAt: new Date().toISOString(),
          context,
          proposal,
          source: isAiConfigured() ? getActiveProvider() : 'template',
        };

        try {
          const settings = await dbManager.getSettings();
          const list = Array.isArray((settings as any).proposals) ? (settings as any).proposals : [];
          list.unshift(record);
          await dbManager.updateSettings({ ...settings, proposals: list.slice(0, 50) } as any);
        } catch {
          /* non-fatal */
        }

        res.json({ ...record, usage: getAiUsageSnapshot() });
      } catch (err: any) {
        if (err instanceof AiProviderError) {
          return res.status(err.status).json({ error: err.message, code: err.code });
        }
        res.status(500).json({ error: err.message || 'Proposal failed' });
      }
    }
  );

  app.get('/api/ai/proposals', authenticateToken, requireAdmin, async (_req, res) => {
    const settings = await dbManager.getSettings();
    res.json({ proposals: (settings as any).proposals || [] });
  });
}
