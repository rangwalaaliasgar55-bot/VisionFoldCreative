import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSfx } from '../../context/SfxContext';
import { LogOut, KeyRound } from 'lucide-react';
import { ChangePasswordPanel } from './ChangePasswordPanel';

interface Tab {
  id: string;
  label: string;
}

interface PortalLayoutProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ tabs, activeTab, onTabChange, onNavigate, children }) => {
  const { user, logout } = useAuth();
  const { playClick, playHover } = useSfx();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLogout = async () => {
    playClick();
    await logout();
    onNavigate('home');
  };

  return (
    <div className="min-h-[80vh] bg-[#0A0A0B] px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-1">
              {user?.role === 'admin' ? 'Studio Admin' : 'Client Portal'}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-[#EDEDED]">
              Welcome back, {user?.name?.split(' ')[0] || 'there'}
            </h1>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setShowChangePassword(true)}
              onMouseEnter={playHover}
              className="flex items-center gap-2 border border-[#222226] rounded-full px-4 py-2 hover:border-[#D4AF37] hover:text-[#D4AF37] text-[#888891] transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Password</span>
            </button>
            <button
              onClick={handleLogout}
              onMouseEnter={playHover}
              className="flex items-center gap-2 border border-[#222226] rounded-full px-4 py-2 hover:border-red-500/50 hover:text-red-400 text-[#888891] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Sign Out</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 border-b border-[#222226] no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`shrink-0 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-t-md transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-[#D4AF37] border-[#D4AF37]'
                  : 'text-[#888891] border-transparent hover:text-[#EDEDED]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>{children}</div>
      </div>

      {showChangePassword && <ChangePasswordPanel onClose={() => setShowChangePassword(false)} />}
    </div>
  );
};
