import { Application } from 'express';
import { dbManager } from '../lib/db';
import {
  generateFromPrompt,
  isAiConfigured,
  getActiveProvider,
  getAiUsageSnapshot,
} from '../lib/aiProvider';
import { aiLimiter, authenticateToken, requireAdmin, type AuthenticatedRequest } from './security';

/** Accepts browser-built profile only — no raw CSV body through Vercel. */
export function registerSpreadsheetProfileRoute(app: Application) {
  app.post(
    '/api/ai/spreadsheet-profile',
    aiLimiter,
    authenticateToken,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const fileName = String(req.body?.fileName || 'upload.csv');
        const profile = req.body?.profile;
        if (!profile || typeof profile !== 'object') {
          return res.status(400).json({
            error: 'Send body.profile from client-side CSV profiler',
            code: 'MISSING_PROFILE',
          });
        }

        const analysis = {
          rowCount: profile.rowCount || 0,
          columnCount: profile.columnCount || 0,
          columns: profile.columns || [],
          numericColumns: profile.numericColumns || [],
          topValues: profile.topValues || [],
          sampleRows: profile.sampleRows || [],
          warnings: profile.warnings || [],
        };

        if (!analysis.rowCount) {
          return res.status(400).json({ error: 'Profile has zero rows' });
        }

        let narrative: string | null = null;
        let source = 'rules';

        if (isAiConfigured()) {
          try {
            narrative = await generateFromPrompt(
              `Analyze this spreadsheet profile for a video studio founder. Give: 1) what the data is 2) top 3 insights 3) one action.\n${JSON.stringify(
                {
                  fileName,
                  rowCount: analysis.rowCount,
                  columns: analysis.columns.slice(0, 20),
                  numericColumns: analysis.numericColumns.slice(0, 8),
                  topValues: analysis.topValues.slice(0, 5),
                  sampleRows: analysis.sampleRows,
                }
              ).slice(0, 6000)}`,
              'Sharp business analyst. Concrete numbers. Short paragraphs.',
              { temperature: 0.4, maxTokens: 700 }
            );
            source = getActiveProvider();
          } catch (err) {
            console.warn('[SPREADSHEET_PROFILE] AI failed', err);
          }
        }

        if (!narrative) {
          const nums = (analysis.numericColumns || [])
            .slice(0, 3)
            .map(
              (c: any) =>
                `${c.name}: sum ${Number(c.sum).toFixed(0)}, avg ${Number(c.avg).toFixed(1)}`
            )
            .join('; ');
          narrative =
            `Rules summary for ${fileName}: ${analysis.rowCount} rows × ${analysis.columnCount} columns.` +
            (nums ? ` Numeric — ${nums}.` : '') +
            ` ${(analysis.warnings || []).join(' ')}`.trim();
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
}
