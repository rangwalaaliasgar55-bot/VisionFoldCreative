import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';

import { HomePage } from './components/PublicPages/HomePage';
import { AboutPage } from './components/PublicPages/AboutPage';
import { ServicesPage } from './components/PublicPages/ServicesPage';
import { PortfolioPage } from './components/PublicPages/PortfolioPage';
import { ContactPage } from './components/PublicPages/ContactPage';

import { ClientPortal } from './components/Portal/ClientPortal';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { VisionFoldLogo } from './components/VisionFoldLogo';
import { Lock, AlertCircle, ShieldCheck } from 'lucide-react';

const AdminLoginScreen: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@visionfold.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email, password);
      if (u.role === 'admin') {
        onSuccess();
      } else {
        setError('Unauthorized account role. Admin privilege required.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090d] flex flex-col justify-center items-center px-4 py-12 text-slate-100">
      <div className="w-full max-w-md bg-[#0e1017] border border-[#1e2333] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="text-center space-y-3">
          <VisionFoldLogo size="md" variant="full" className="mx-auto mb-2" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-mono text-[11px] font-bold uppercase border border-amber-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Studio Portal</span>
          </div>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">Studio Operations</h1>
          <p className="text-xs text-slate-400 font-mono">Protected management access for Aliasgar.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 tracking-widest">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#121520] border border-[#222736] rounded-2xl text-slate-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 tracking-widest">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#121520] border border-[#222736] rounded-2xl text-slate-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20"
          >
            {loading ? 'Authenticating...' : 'Enter Studio Dashboard'}
          </button>
        </form>

        <div className="text-center pt-2">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = '';
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="text-xs text-slate-400 hover:text-amber-400 font-mono underline"
          >
            &larr; Return to Public Studio Website
          </a>
        </div>
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();

  // Handle URL detection for /admin or #admin
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (path === '/admin' || hash === '#admin') {
        setCurrentPage('admin');
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);

    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  const handleNavigate = (page: string) => {
    if (page === 'admin') {
      window.history.pushState({}, '', '/admin');
      setCurrentPage('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (window.location.pathname === '/admin') {
      window.history.pushState({}, '', '/');
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;
      case 'services':
        return <ServicesPage onNavigate={handleNavigate} />;
      case 'portfolio':
        return <PortfolioPage />;
      case 'contact':
        return <ContactPage />;
      case 'portal':
        return user ? <ClientPortal /> : <HomePage onNavigate={handleNavigate} />;
      case 'admin':
        return user?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <AdminLoginScreen onSuccess={() => setCurrentPage('admin')} />
        );
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  const isAdminView = currentPage === 'admin';

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {!isAdminView && <Navbar currentPage={currentPage} onNavigate={handleNavigate} />}

      <main className="flex-1">{renderPage()}</main>

      {!isAdminView && <Footer onNavigate={handleNavigate} />}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(role) => {
          if (role === 'admin') {
            handleNavigate('admin');
          } else {
            setCurrentPage('portal');
          }
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
