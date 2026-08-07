/** Pure CSV/TSV parser + rules-based spreadsheet analysis (no native xlsx binary). */

export interface SheetAnalysis {
  rowCount: number;
  columnCount: number;
  columns: string[];
  numericColumns: Array<{ name: string; sum: number; avg: number; min: number; max: number }>;
  topValues: Array<{ column: string; values: Array<{ value: string; count: number }> }>;
  sampleRows: Record<string, string>[];
  warnings: string[];
}

function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function detectDelimiter(text: string): string {
  const first = text.split(/\r?\n/).find((l) => l.trim()) || '';
  const commas = (first.match(/,/g) || []).length;
  const tabs = (first.match(/\t/g) || []).length;
  const semis = (first.match(/;/g) || []).length;
  if (tabs >= commas && tabs >= semis) return '\t';
  if (semis > commas) return ';';
  return ',';
}

export function parseDelimited(text: string, delimiter?: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleaned = text.replace(/^\uFEFF/, '').trim();
  if (!cleaned) return { headers: [], rows: [] };
  const delim = delimiter || detectDelimiter(cleaned);
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitLine(lines[0], delim).map((h, i) => h || `col_${i + 1}`);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delim);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? '';
    });
    rows.push(row);
  }
  return { headers, rows };
}

function toNumber(v: string): number | null {
  const n = Number(String(v).replace(/[,₹$\s]/g, ''));
  return Number.isFinite(n) && String(v).trim() !== '' ? n : null;
}

export function analyzeSheet(headers: string[], rows: Record<string, string>[]): SheetAnalysis {
  const warnings: string[] = [];
  if (rows.length > 5000) warnings.push('Analyzed first 5000 data rows only');
  const limited = rows.slice(0, 5000);

  const numericColumns = headers
    .map((name) => {
      const nums = limited.map((r) => toNumber(r[name])).filter((n): n is number => n !== null);
      if (nums.length < Math.max(3, limited.length * 0.3)) return null;
      const sum = nums.reduce((a, b) => a + b, 0);
      return {
        name,
        sum,
        avg: sum / nums.length,
        min: Math.min(...nums),
        max: Math.max(...nums),
      };
    })
    .filter(Boolean) as SheetAnalysis['numericColumns'];

  const topValues = headers.slice(0, 8).map((column) => {
    const counts = new Map<string, number>();
    for (const r of limited) {
      const v = (r[column] || '').trim() || '(empty)';
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    const values = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));
    return { column, values };
  });

  return {
    rowCount: limited.length,
    columnCount: headers.length,
    columns: headers,
    numericColumns,
    topValues,
    sampleRows: limited.slice(0, 5),
    warnings,
  };
}

export function isLikelyBinaryXlsx(text: string): boolean {
  // PK zip header when mis-decoded, or empty garbage
  return text.startsWith('PK') || text.includes('\x00');
}
