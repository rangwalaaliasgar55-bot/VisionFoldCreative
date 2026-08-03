import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { ClientDashboard } from './ClientDashboard';

interface PortalProps {
  onNavigate: (page: string) => void;
}

export const Portal: React.FC<PortalProps> = ({ onNavigate }) => {
  const { user, isLoading } = useAuth();

  // If the session check finishes and nobody's logged in, bounce to the login screen.
  useEffect(() => {
    if (!isLoading && !user) {
      onNavigate('login');
    }
  }, [isLoading, user, onNavigate]);

  if (isLoading) {
    return <div className="min-h-[80vh] flex items-center justify-center text-[#888891] text-xs uppercase tracking-widest animate-pulse">Loading portal…</div>;
  }

  if (!user) return null;

  return user.role === 'admin' ? <AdminDashboard onNavigate={onNavigate} /> : <ClientDashboard onNavigate={onNavigate} />;
};
