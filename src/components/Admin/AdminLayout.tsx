import React, { useState } from 'react';
import {
  LayoutDashboard, Inbox, Users, FolderKanban, Image as ImageIcon,
  Receipt, Wallet, Sparkles, Settings as SettingsIcon, LogOut, Menu, X, AlertCircle, Zap,
} from 'lucide-react';
import { VisionFoldLogo } from '../VisionFoldLogo';
import { AppError } from '../../lib/errors';

export type AdminView =
  | 'overview' | 'leads' | 'clients' | 'automations' | 'projects' | 'portfolio'
  | 'invoices' | 'expenses' | 'growth' | 'media' | 'settings';

const NAV_ITEMS: { id: AdminView; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads & Inquiries', icon: Inbox },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'automations', label: 'Automations', icon: Zap },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'portfolio', label: 'Portfolio', icon: ImageIcon },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'expenses', label: 'Expenses', icon: Wallet },
  { id: 'growth', label: 'AI Growth Copilot', icon: Sparkles },
  { id: 'media', label: 'Media / CMS', icon: ImageIcon },
  { id: 'settings', label: 'Pricing & Settings', icon: SettingsIcon },
];

export const AdminLayout: React.FC<{
  activeView: AdminView;
  onNavigate: (view: AdminView) => void;
  onLogout: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  error?: AppError | null;
  onClearError?: () => void;
}> = ({ activeView, onNavigate, onLogout, title, subtitle, children, error, onClearError }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavList = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
            className={`flex w-full items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${
              active
                ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                : 'border-transparent text-[#888891] hover:bg-[#1a1a1d] hover:text-[#EDEDED]'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#0A0A0B] text-[#EDEDED]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#222226] bg-[#0C0C10] lg:flex">
        <div className="flex items-center gap-3 border-b border-[#222226] px-4 py-5">
          <div className="scale-75 origin-left"><VisionFoldLogo /></div>
        </div>
        {NavList}
        <div className="border-t border-[#222226] p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#888891] hover:text-red-400"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-[#222226] bg-[#0C0C10]">
            <div className="flex items-center justify-between border-b border-[#222226] px-4 py-4">
              <div className="scale-75 origin-left"><VisionFoldLogo /></div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5 text-[#888891]" /></button>
            </div>
            {NavList}
            <div className="border-t border-[#222226] p-3">
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#888891] hover:text-red-400"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#222226] bg-[#0A0A0B]/95 px-4 py-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button className="text-[#888891] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold uppercase tracking-[0.15em] text-[#EDEDED] sm:text-lg">{title}</h1>
              {subtitle ? <p className="mt-0.5 text-xs text-[#888891]">{subtitle}</p> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-[#222226] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#888891] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-600/30 bg-red-600/10 p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-300">{error.message}</p>
              </div>
              {onClearError && (
                <button onClick={onClearError} className="text-red-400 hover:text-red-300 font-medium text-sm">
                  Dismiss
                </button>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
