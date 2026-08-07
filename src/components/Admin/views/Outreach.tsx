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

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] || '';
    });
    return row;
  });
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
    if (file.size > 20 * 1024 * 1024) {
      setError('File too large for browser parse (use under 20MB CSV for now).');
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) throw new Error('No data rows found. Need header + rows (name, phone, email, company).');
      const result = await adminApi.post<{ imported: number; total: number }>('/api/outreach/import', { rows });
      setMsg(`Imported ${result.imported} rows · ${result.total} total in list`);
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
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Growth</p>
        <h2 className="text-xl font-black text-white">Outreach desk</h2>
        <p className="text-sm text-[#8A857C]">
          Upload a CSV of leads (name, phone, email, company). Calling / WhatsApp automation hooks land next once you
          add a provider number.
        </p>
      </div>

      <Card className="p-5">
        <CardHeader title="Import spreadsheet" subtitle="CSV · columns: name, phone, email, company, notes" />
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 px-6 py-10 transition hover:bg-[#D4AF37]/10">
          <Upload className="h-8 w-8 text-[#D4AF37]" />
          <span className="mt-3 text-sm font-bold text-white">{importing ? 'Importing…' : 'Drop CSV or click to upload'}</span>
          <span className="mt-1 text-xs text-[#8A857C]">Max ~20MB in browser · up to 5000 rows per batch</span>
          <input
            type="file"
            accept=".csv,text/csv"
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
          <p className="text-[10px] uppercase tracking-wider text-[#888]">Connect Twilio / similar tomorrow</p>
        </Card>
        <Card className="p-5">
          <Mail className="h-5 w-5 text-[#D4AF37]" />
          <p className="mt-2 text-sm text-[#B8B3AA]">Email sequences</p>
          <p className="text-[10px] uppercase tracking-wider text-[#888]">Uses Resend when key is set</p>
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
            {leads.slice(0, 200).map((l) => (
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
          </div>
        )}
      </Card>
    </div>
  );
};

export default Outreach;
