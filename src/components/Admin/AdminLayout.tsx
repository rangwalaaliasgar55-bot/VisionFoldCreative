import React, { useState } from 'react';
import {
  LayoutDashboard, Inbox, Users, FolderKanban, Image as ImageIcon,
  Receipt, Wallet, Sparkles, Settings as SettingsIcon, LogOut, Menu, X, AlertCircle, Zap, Upload, LayoutTemplate,
  Navigation, Palette,
} from 'lucide-react';
import { VisionFoldLogo } from '../VisionFoldLogo';
import { AppError } from '../../lib/errors';

export type AdminView =
  | 'overview' | 'leads' | 'clients' | 'automations' | 'projects' | 'portfolio'
  | 'invoices' | 'expenses' | 'growth' | 'media' | 'pages' | 'nav' | 'theme'
  | 'outreach' | 'settings';

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
  { id: 'pages', label: 'Page Builder', icon: LayoutTemplate },
  { id: 'nav', label: 'Navigation', icon: Navigation },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'outreach', label: 'Outreach CSV', icon: Upload },
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
          <div className="origin-left scale-75"><VisionFoldLogo /></div>
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
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-[#0C0C10]">
            <div className="flex items-center justify-between border-b border-[#222226] px-4 py-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Menu</span>
              <button type="button" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            {NavList}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#222226] px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-white">{title}</h1>
              {subtitle ? <p className="text-xs text-[#8A857C]">{subtitle}</p> : null}
            </div>
          </div>
          <span className="hidden text-[10px] font-bold uppercase tracking-wider text-[#666] sm:inline">⌘K</span>
        </header>

        {error ? (
          <div className="mx-4 mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 lg:mx-8">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">{error.message}</div>
            {onClearError ? (
              <button type="button" onClick={onClearError} className="text-xs underline">Dismiss</button>
            ) : null}
          </div>
        ) : null}

        <div className="flex-1 overflow-auto p-4 lg:p-8">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
