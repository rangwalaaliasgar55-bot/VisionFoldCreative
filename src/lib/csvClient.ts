/** Browser-side CSV/TSV profiling — never send the raw file to the API. */

export type ColumnProfile = {
  name: string;
  nonEmpty: number;
  sampleValues: string[];
};

export type NumericProfile = {
  name: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
};

export type SheetProfile = {
  fileName: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  numericColumns: NumericProfile[];
  topValues: Array<{ column: string; values: Array<{ value: string; count: number }> }>;
  sampleRows: Record<string, string>[];
  warnings: string[];
};

function detectDelimiter(line: string): string {
  const commas = (line.match(/,/g) || []).length;
  const tabs = (line.match(/\t/g) || []).length;
  const semis = (line.match(/;/g) || []).length;
  if (tabs >= commas && tabs >= semis) return '\t';
  if (semis > commas) return ';';
  return ',';
}

function parseLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === delim && !inQ) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function isNumeric(s: string): boolean {
  if (!s) return false;
  const n = Number(String(s).replace(/,/g, '').replace(/^₹/, '').replace(/%$/, ''));
  return Number.isFinite(n);
}

function toNum(s: string): number {
  return Number(String(s).replace(/,/g, '').replace(/^₹/, '').replace(/%$/, ''));
}

/** Profile up to maxRows from a text CSV/TSV string in the browser. */
export function profileCsvText(text: string, fileName: string, maxRows = 50000): SheetProfile {
  const warnings: string[] = [];
  const raw = text.replace(/^\uFEFF/, '');
  if (!raw.trim()) {
    return {
      fileName,
      rowCount: 0,
      columnCount: 0,
      columns: [],
      numericColumns: [],
      topValues: [],
      sampleRows: [],
      warnings: ['Empty file'],
    };
  }

  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) {
    return {
      fileName,
      rowCount: 0,
      columnCount: 0,
      columns: [],
      numericColumns: [],
      topValues: [],
      sampleRows: [],
      warnings: ['Need a header row and at least one data row'],
    };
  }

  const delim = detectDelimiter(lines[0]);
  const headers = parseLine(lines[0], delim).map((h, i) => h || `col_${i + 1}`);
  const dataLines = lines.slice(1);
  if (dataLines.length > maxRows) {
    warnings.push(`Profiled first ${maxRows.toLocaleString()} of ${dataLines.length.toLocaleString()} rows`);
  }
  const limited = dataLines.slice(0, maxRows);

  const rows: Record<string, string>[] = limited.map((line) => {
    const cells = parseLine(line, delim);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? '';
    });
    return row;
  });

  const columns: ColumnProfile[] = headers.map((name) => {
    const vals = rows.map((r) => r[name]).filter((v) => v !== '');
    return {
      name,
      nonEmpty: vals.length,
      sampleValues: vals.slice(0, 5),
    };
  });

  const numericColumns: NumericProfile[] = [];
  for (const h of headers) {
    const nums = rows.map((r) => r[h]).filter(isNumeric).map(toNum);
    if (nums.length >= Math.max(3, rows.length * 0.4)) {
      const sum = nums.reduce((a, b) => a + b, 0);
      numericColumns.push({
        name: h,
        count: nums.length,
        sum,
        avg: sum / nums.length,
        min: Math.min(...nums),
        max: Math.max(...nums),
      });
    }
  }

  const topValues = headers.slice(0, 8).map((h) => {
    const freq = new Map<string, number>();
    for (const r of rows) {
      const v = r[h];
      if (!v) continue;
      freq.set(v, (freq.get(v) || 0) + 1);
    }
    const values = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));
    return { column: h, values };
  });

  return {
    fileName,
    rowCount: rows.length,
    columnCount: headers.length,
    columns,
    numericColumns,
    topValues,
    sampleRows: rows.slice(0, 5),
    warnings,
  };
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file);
  });
}
