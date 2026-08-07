import React, { useEffect, useState } from 'react';
import { Upload, Phone, Mail, Users } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, CardHeader, PrimaryButton, EmptyState } from '../ui';
import { Skeleton } from '../../ui/Skeleton';

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  notes: string;
  status: string;
  createdAt: string;
};

/** RFC-ish CSV parse: handles quoted fields with commas */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
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
  };

  const headers = parseLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map((line) => {
    const cols = parseLine(line).map((c) => c.replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] || '';
    });
    return row;
  });
}

function normalizeRow(r: Record<string, string>): {
  name: string;
  phone: string;
  email: string;
  company: string;
  notes: string;
} {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const found = Object.keys(r).find((h) => h.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (found && r[found]?.trim()) return r[found].trim();
    }
    for (const k of keys) {
      const found = Object.keys(r).find((h) => h.toLowerCase().includes(k.toLowerCase()));
      if (found && r[found]?.trim()) return r[found].trim();
    }
    return '';
  };

  let phone = get('phone', 'mobile', 'tel', 'telephone', 'phonenumber');
  phone = phone.replace(/^[·•.\s]+/, '').trim();
  if (/closed|opens|temporarily/i.test(phone) && !/\d{7,}/.test(phone)) phone = '';

  const name = get('name', 'businessname', 'business', 'fullname', 'contact', 'agent');
  const company = get('company', 'businessname', 'business', 'organization', 'agency') || name;
  const email = get('email', 'mail', 'e-mail').toLowerCase();
  const notes = [get('notes', 'note', 'category', 'address', 'rating', 'reviews')]
    .filter(Boolean)
    .join(' | ');

  return { name, phone, email, company, notes };
}

export const Outreach: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await adminApi.get<{ leads: Lead[] }>('/api/outreach/leads');
      setLeads(data.leads || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load outreach leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onFile = async (file: File) => {
    setError('');
    setMsg('');
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      setError(
        'Excel (.xlsx) is not accepted in the browser. Use the prepared CSV (outreach_part_1.csv) or export your sheet as CSV, then upload that.'
      );
      return;
    }
    if (!lower.endsWith('.csv') && file.type && !file.type.includes('csv') && !file.type.includes('text')) {
      setError('Upload a .csv file only (UTF-8).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('File too large (max ~25MB CSV). Split into smaller files.');
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const rawRows = parseCsv(text);
      if (!rawRows.length) {
        throw new Error('No data rows found. Need a header row + data (name, phone, …).');
      }
      const rows = rawRows
        .map(normalizeRow)
        .filter((r) => r.name || r.phone || r.email);
      if (!rows.length) {
        throw new Error(
          'No usable rows. CSV needs columns like name / Business Name and phone / Phone.'
        );
      }
      let imported = 0;
      let total = 0;
      for (let i = 0; i < rows.length; i += 4500) {
        const chunk = rows.slice(i, i + 4500);
        const result = await adminApi.post<{ imported: number; total: number }>('/api/outreach/import', {
          rows: chunk,
        });
        imported += result.imported;
        total = result.total;
      }
      setMsg(`Imported ${imported} rows · ${total} total in list (cap 10,000)`);
      await load();
    } catch (e: any) {
      setError(e.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Outreach</p>
        <h2 className="text-xl font-black text-white">CSV lead import</h2>
        <p className="mt-1 text-sm text-[#8A857C]">
          Upload CSV only (not Excel). Columns: name, phone, email, company, notes — or Business Name + Phone.
        </p>
      </div>

      <Card className="p-6">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-black/30 px-6 py-10 hover:border-[#D4AF37]/40">
          <Upload className="h-8 w-8 text-[#D4AF37]" />
          <span className="text-sm font-bold text-white">
            {importing ? 'Importing…' : 'Choose CSV file'}
          </span>
          <span className="text-xs text-[#888]">Max 5,000 rows per batch · total store 10,000</span>
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            disabled={importing}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = '';
            }}
          />
        </label>
        {msg ? <p className="mt-3 text-sm text-emerald-300">{msg}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <Users className="h-5 w-5 text-[#D4AF37]" />
          <p className="mt-2 text-2xl font-black text-white">{leads.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-[#888]">Leads stored</p>
        </Card>
        <Card className="p-5">
          <Phone className="h-5 w-5 text-[#D4AF37]" />
          <p className="mt-2 text-sm text-[#B8B3AA]">Calling API</p>
          <p className="text-[10px] uppercase tracking-wider text-[#888]">Connect Twilio later</p>
        </Card>
        <Card className="p-5">
          <Mail className="h-5 w-5 text-[#D4AF37]" />
          <p className="mt-2 text-sm text-[#B8B3AA]">Email sequences</p>
          <p className="text-[10px] uppercase tracking-wider text-[#888]">Resend when key is set</p>
        </Card>
      </div>

      <Card padding="none">
        <CardHeader title="Lead list" subtitle="Imported contacts ready for outreach" />
        {loading ? (
          <div className="space-y-2 p-5">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : leads.length === 0 ? (
          <EmptyState message="No outreach leads yet — upload a CSV." />
        ) : (
          <div className="max-h-[480px] overflow-auto divide-y divide-white/5">
            {leads.slice(0, 300).map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div>
                  <p className="font-bold text-white">{l.name || '—'}</p>
                  <p className="text-xs text-[#8A857C]">{l.company}</p>
                </div>
                <div className="text-right text-xs text-[#B8B3AA]">
                  <p>{l.phone || 'no phone'}</p>
                  <p>{l.email || 'no email'}</p>
                </div>
              </div>
            ))}
            {leads.length > 300 ? (
              <p className="px-5 py-3 text-xs text-[#666]">Showing 300 of {leads.length}</p>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Outreach;
