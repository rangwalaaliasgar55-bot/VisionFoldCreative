import React, { useEffect, useState } from 'react';
import { Upload, Phone, Mail, Users, FileSpreadsheet } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, CardHeader, EmptyState } from '../ui';
import { Skeleton } from '../../ui/Skeleton';
import { fileToOutreachRows } from '../../../lib/spreadsheetImport';

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

export const Outreach: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

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
    setProgress('');
    const lower = file.name.toLowerCase();
    const ok =
      lower.endsWith('.csv') ||
      lower.endsWith('.xlsx') ||
      lower.endsWith('.xls') ||
      file.type.includes('csv') ||
      file.type.includes('sheet') ||
      file.type.includes('excel');
    if (!ok) {
      setError('Upload .csv or Excel (.xlsx / .xls) only.');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError('File too large (max ~30MB). Split the sheet.');
      return;
    }
    setImporting(true);
    try {
      setProgress('Parsing file…');
      const rows = await fileToOutreachRows(file);
      if (!rows.length) {
        throw new Error('No usable rows. Need Business Name / name and Phone / phone columns.');
      }
      let imported = 0;
      let total = 0;
      for (let i = 0; i < rows.length; i += 4500) {
        const chunk = rows.slice(i, i + 4500);
        setProgress(`Uploading rows ${i + 1}–${i + chunk.length} of ${rows.length}…`);
        const result = await adminApi.post<{ imported: number; total: number }>('/api/outreach/import', {
          rows: chunk,
        });
        imported += result.imported;
        total = result.total;
      }
      setMsg(`Imported ${imported} from ${file.name} · ${total} total stored (cap 10,000)`);
      setProgress('');
      await load();
    } catch (e: any) {
      setError(e.message || 'Import failed');
      setProgress('');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Outreach</p>
        <h2 className="text-xl font-black text-white">Lead import</h2>
        <p className="mt-1 text-sm text-[#8A857C]">
          CSV or Excel (.xlsx). Maps Business Name, Phone, Address, Category automatically.
        </p>
      </div>

      <Card className="p-6">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-black/30 px-6 py-10 transition hover:border-[#D4AF37]/40">
          {importing ? (
            <FileSpreadsheet className="h-8 w-8 animate-pulse text-[#D4AF37]" />
          ) : (
            <Upload className="h-8 w-8 text-[#D4AF37]" />
          )}
          <span className="text-sm font-bold text-white">
            {importing ? progress || 'Importing…' : 'Choose CSV or Excel file'}
          </span>
          <span className="text-xs text-[#888]">.csv · .xlsx · .xls · max ~30MB · 5k/batch · 10k total</span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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
          <p className="mt-2 text-sm text-[#B8B3AA]">Calling</p>
          <p className="text-[10px] uppercase tracking-wider text-[#888]">Twilio later</p>
        </Card>
        <Card className="p-5">
          <Mail className="h-5 w-5 text-[#D4AF37]" />
          <p className="mt-2 text-sm text-[#B8B3AA]">Email sequences</p>
          <p className="text-[10px] uppercase tracking-wider text-[#888]">Resend when keyed</p>
        </Card>
      </div>

      <Card padding="none">
        <CardHeader title="Lead list" subtitle="Imported contacts ready for outreach" />
        {loading ? (
          <div className="space-y-2 p-5">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : leads.length === 0 ? (
          <EmptyState message="No outreach leads yet — upload a CSV or Excel file." />
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
