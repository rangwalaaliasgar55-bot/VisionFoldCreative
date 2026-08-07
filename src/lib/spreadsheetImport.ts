/**
 * Client-side CSV + Excel (.xlsx/.xls) → normalized outreach rows.
 */
export type OutreachRow = {
  name: string;
  phone: string;
  email: string;
  company: string;
  notes: string;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (c === ',' && !inQ) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

export function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line).map((c) => c.replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] || '';
    });
    return row;
  });
}

export async function parseExcelBuffer(buf: ArrayBuffer): Promise<Record<string, string>[]> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
  return json.map((row) => {
    const out: Record<string, string> = {};
    Object.keys(row).forEach((k) => {
      out[String(k).trim()] = row[k] == null ? '' : String(row[k]).trim();
    });
    return out;
  });
}

function pick(r: Record<string, string>, ...keys: string[]): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const k of keys) {
    const found = Object.keys(r).find((h) => norm(h) === norm(k));
    if (found && r[found]?.trim()) return r[found].trim();
  }
  for (const k of keys) {
    const found = Object.keys(r).find((h) => norm(h).includes(norm(k)));
    if (found && r[found]?.trim()) return r[found].trim();
  }
  return '';
}

export function normalizeOutreachRow(r: Record<string, string>): OutreachRow {
  let phone = pick(r, 'phone', 'mobile', 'tel', 'telephone', 'phonenumber', 'Phone');
  phone = phone.replace(/^[·•.\s]+/, '').trim();
  if (/closed|opens|temporarily/i.test(phone) && !/\d{7,}/.test(phone)) phone = '';

  const name = pick(r, 'name', 'businessname', 'business name', 'business', 'fullname', 'contact', 'agent');
  const company =
    pick(r, 'company', 'businessname', 'business name', 'business', 'organization', 'agency') || name;
  const email = pick(r, 'email', 'mail', 'e-mail').toLowerCase();
  const notesParts = [
    pick(r, 'notes', 'note'),
    pick(r, 'category'),
    pick(r, 'address'),
    pick(r, 'rating'),
    pick(r, 'reviews', '# reviews'),
  ].filter(Boolean);

  return {
    name,
    phone,
    email,
    company,
    notes: notesParts.join(' | ').slice(0, 500),
  };
}

export async function fileToOutreachRows(file: File): Promise<OutreachRow[]> {
  const lower = file.name.toLowerCase();
  let raw: Record<string, string>[] = [];

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const buf = await file.arrayBuffer();
    raw = await parseExcelBuffer(buf);
  } else {
    const text = await file.text();
    raw = parseCsvText(text);
  }

  return raw.map(normalizeOutreachRow).filter((r) => r.name || r.phone || r.email);
}
