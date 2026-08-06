import React, { useMemo, useState } from 'react';
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
import { LoadingState } from './ui';
import { useAuth } from '../../context/AuthContext';
import { ErrorHandler } from '../../lib/errors';

const VIEW_META: Record<AdminView, { title: string; subtitle?: string }> = {
  overview: { title: 'Studio Overview', subtitle: 'Revenue, leads, and project health at a glance' },
  leads: { title: 'Leads & Inquiries', subtitle: 'Every inbound inquiry from your site and WhatsApp funnel' },
  clients: { title: 'Clients', subtitle: 'Everyone you have onboarded' },
  automations: { title: 'Automations', subtitle: 'WhatsApp, email, maps, and X social desk' },
  projects: { title: 'Projects', subtitle: 'Active and delivered work' },
  portfolio: { title: 'Portfolio', subtitle: 'Manage what prospects see on your site' },
  invoices: { title: 'Invoices', subtitle: 'Billing and payment status' },
  expenses: { title: 'Expenses', subtitle: 'Track studio costs' },
  growth: { title: 'AI Growth Copilot', subtitle: 'AI-generated action items for the business' },
  settings: { title: 'Pricing & Settings', subtitle: 'Rates and homepage metrics' },
};

export const AdminApp: React.FC = () => {
  const { user, isLoading, logout, error, clearError, checkAuth } = useAuth();
  const [view, setView] = useState<AdminView>('overview');

  const isAuthenticated = useMemo(() => user?.role === 'admin', [user?.role]);

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

  if (!isAuthenticated) {
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
      {view === 'settings' && <Settings />}
    </AdminLayout>
  );
};

export default AdminApp;
