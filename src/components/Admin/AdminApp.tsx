import React, { useMemo, useState, useEffect } from 'react';
import { AdminLayout, AdminView } from './AdminLayout';
import { AdminLogin } from './AdminLogin';
import { Overview } from './views/Overview';
import { Leads } from './views/Leads';
import { Clients } from './views/Clients';
import { Automations } from './views/Automations';
import { Projects } from './views/Projects';
import { Portfolio } from './views/Portfolio';
import { Invoices } from './views/Invoices';
import { Expenses } from './views/Expenses';
import { GrowthCopilot } from './views/GrowthCopilot';
import { Settings } from './views/Settings';
import { RatesPanel } from './views/SettingsRatesSnippet';
import { Media } from './views/Media';
import { Outreach } from './views/Outreach';
import { PageBuilder } from './views/PageBuilder';
import { LoadingState } from './ui';
import { useAuth } from '../../context/AuthContext';
import { ErrorHandler } from '../../lib/errors';
import { CommandPalette } from './CommandPalette';

const VIEW_META: Record<AdminView, { title: string; subtitle?: string }> = {
  overview: { title: 'Studio Overview', subtitle: 'Revenue, leads, and project health at a glance' },
  leads: { title: 'Leads & Inquiries', subtitle: 'Every inbound inquiry from your site and WhatsApp funnel' },
  clients: { title: 'Clients', subtitle: 'Everyone you have onboarded' },
  automations: { title: 'Automations', subtitle: 'WhatsApp, email, maps, and X social desk' },
  projects: { title: 'Projects', subtitle: 'Active and delivered work' },
  portfolio: { title: 'Portfolio', subtitle: 'Manage what prospects see on your site' },
  invoices: { title: 'Invoices', subtitle: 'Billing and payment status' },
  expenses: { title: 'Expenses', subtitle: 'Track studio costs' },
  growth: { title: 'AI Growth Copilot', subtitle: 'Action items for the business' },
  media: { title: 'Media & CMS', subtitle: 'Library and live page editing' },
  pages: { title: 'Page Builder', subtitle: 'Blocks, drafts, publish, revisions' },
  outreach: { title: 'Outreach', subtitle: 'CSV import for calls and follow-ups' },
  settings: { title: 'Pricing & Settings', subtitle: 'Rates, maintenance, integrations' },
};

export const AdminApp: React.FC = () => {
  const { user, isLoading, logout, error, clearError, checkAuth } = useAuth();
  const [view, setView] = useState<AdminView>('overview');
  const [paletteOpen, setPaletteOpen] = useState(false);

  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);
  const isClientBlocked = useMemo(() => Boolean(user && user.role !== 'admin'), [user]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    const onAuthExpired = () => {
      void checkAuth();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('vf:auth-expired', onAuthExpired);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('vf:auth-expired', onAuthExpired);
    };
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      ErrorHandler.log(err, 'AdminApp logout');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B]">
        <LoadingState />
      </div>
    );
  }

  if (isClientBlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0A0A0B] px-6 text-center text-[#EDEDED]">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D4AF37]">Access denied</p>
        <h1 className="text-2xl font-black">Admin only</h1>
        <p className="max-w-md text-sm text-[#8A857C]">
          Your account is a client portal login. Studio admin tools are not available on this account.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="/portal"
            className="rounded-full bg-[#D4AF37] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black"
          >
            Open client portal
          </a>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#B8B3AA]"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLogin
        onSuccess={() => {
          clearError();
          void checkAuth();
        }}
      />
    );
  }

  const meta = VIEW_META[view];

  return (
    <>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onNavigate={setView} />
      <AdminLayout
        activeView={view}
        onNavigate={setView}
        onLogout={handleLogout}
        title={meta.title}
        subtitle={meta.subtitle}
        error={error}
        onClearError={clearError}
      >
        {view === 'overview' && <Overview onNavigate={(v) => setView(v as AdminView)} />}
        {view === 'leads' && <Leads />}
        {view === 'clients' && <Clients />}
        {view === 'automations' && <Automations />}
        {view === 'projects' && <Projects />}
        {view === 'portfolio' && <Portfolio />}
        {view === 'invoices' && <Invoices />}
        {view === 'expenses' && <Expenses />}
        {view === 'growth' && <GrowthCopilot />}
        {view === 'media' && <Media />}
        {view === 'pages' && <PageBuilder />}
        {view === 'outreach' && <Outreach />}
        {view === 'settings' && (
          <div className="space-y-8">
            <RatesPanel />
            <Settings />
          </div>
        )}
      </AdminLayout>
    </>
  );
};

export default AdminApp;
