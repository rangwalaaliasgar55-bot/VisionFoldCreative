import React, { useEffect, useState } from 'react';
import { AdminLayout, AdminView } from './AdminLayout';
import { AdminLogin } from './AdminLogin';
import { Overview } from './views/Overview';
import { Leads } from './views/Leads';
import { Clients } from './views/Clients';
import { Projects } from './views/Projects';
import { Portfolio } from './views/Portfolio';
import { Invoices } from './views/Invoices';
import { Expenses } from './views/Expenses';
import { GrowthCopilot } from './views/GrowthCopilot';
import { Settings } from './views/Settings';
import { LoadingState } from './ui';

const VIEW_META: Record<AdminView, { title: string; subtitle?: string }> = {
  overview: { title: 'Studio Overview', subtitle: 'Revenue, leads, and project health at a glance' },
  leads: { title: 'Leads & Inquiries', subtitle: 'Every inbound inquiry from your site and WhatsApp funnel' },
  clients: { title: 'Clients', subtitle: 'Everyone you have onboarded' },
  projects: { title: 'Projects', subtitle: 'Active and delivered work' },
  portfolio: { title: 'Portfolio', subtitle: 'Manage what prospects see on your site' },
  invoices: { title: 'Invoices', subtitle: 'Billing and payment status' },
  expenses: { title: 'Expenses', subtitle: 'Track studio costs' },
  growth: { title: 'AI Growth Copilot', subtitle: 'AI-generated action items for the business' },
  settings: { title: 'Pricing & Settings', subtitle: 'Rates and homepage metrics' },
};

export const AdminApp: React.FC = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<AdminView>('overview');

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const payload = await response.json();
          setIsAuthenticated(payload?.user?.role === 'admin');
        }
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setIsAuthenticated(false);
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B]">
        <LoadingState />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  const meta = VIEW_META[view];

  return (
    <AdminLayout activeView={view} onNavigate={setView} onLogout={() => void handleLogout()} title={meta.title} subtitle={meta.subtitle}>
      {view === 'overview' && <Overview />}
      {view === 'leads' && <Leads />}
      {view === 'clients' && <Clients />}
      {view === 'projects' && <Projects />}
      {view === 'portfolio' && <Portfolio />}
      {view === 'invoices' && <Invoices />}
      {view === 'expenses' && <Expenses />}
      {view === 'growth' && <GrowthCopilot />}
      {view === 'settings' && <Settings />}
    </AdminLayout>
  );
};
