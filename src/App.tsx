import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './components/PublicPages/HomePage';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { SiteChat } from './components/SiteChat';
import { PolicyPage } from './components/PublicPages/PolicyPage';
import { SfxProvider } from './context/SfxContext';
import { AdminProvider } from './context/AdminContext';
import { ContentProvider, useContent } from './context/ContentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminApp } from './components/Admin/AdminApp';
import { Portal } from './components/Portal/Portal';
import { NotFound } from './components/NotFound';
import { PortfolioPage } from './components/PublicPages/PortfolioPage';
import { ServicesPage } from './components/PublicPages/ServicesPage';
import { ContactPage } from './components/PublicPages/ContactPage';
import { WorkDetailPage } from './components/PublicPages/WorkDetailPage';
import { CmsPageView } from './components/PublicPages/CmsPageView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MaintenancePage } from './components/PublicPages/MaintenancePage';
import { AudioMeshBackground } from './components/AudioMeshBackground';

const MainContent: React.FC = () => {
  const { editMode, isAdmin, setEditMode } = useContent();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const location = useLocation();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (location.pathname === '/portal') {
    return <Portal onNavigate={handleNavigate} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0B] text-[#EDEDED] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-[#0A0A0B]">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40">
        <AudioMeshBackground />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.10),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_28%)]" />
      <div className="relative z-10 flex min-h-screen flex-col">
        {isAdmin ? (
          <div className="fixed right-4 top-20 z-50 flex gap-2">
            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
              className="rounded-full border border-[#D4AF37]/40 bg-black/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]"
            >
              {editMode ? 'Exit edit' : 'Edit site'}
            </button>
            <a
              href="/admin"
              className="rounded-full border border-white/15 bg-black/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B8B3AA]"
            >
              Admin
            </a>
          </div>
        ) : null}
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
        <main className="flex-1">
          <HomePage onNavigate={handleNavigate} />
        </main>
        <Footer />
        <FloatingWhatsApp />
        <SiteChat />
      </div>
    </div>
  );
};

const MaintenanceGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [maintenance, setMaintenance] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => setMaintenance(Boolean(s?.maintenanceMode)))
      .catch(() => undefined);
  }, []);

  if (maintenance && user?.role !== 'admin') {
    return <MaintenancePage />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) {
    return <AdminApp />;
  }

  return (
    <MaintenanceGate>
      <Routes>
        <Route path="/" element={<MainContent />} />
        <Route path="/work" element={<PortfolioPage />} />
        <Route path="/work/:slug" element={<WorkDetailPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/p/:slug" element={<CmsPageView />} />
        <Route path="/terms" element={<PolicyPage kind="terms" />} />
        <Route path="/privacy" element={<PolicyPage kind="privacy" />} />
        <Route path="/refund" element={<PolicyPage kind="refund" />} />
        <Route path="/portal" element={<Portal onNavigate={(p) => (window.location.href = p === 'home' ? '/' : `/${p}`)} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MaintenanceGate>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SfxProvider>
          <AuthProvider>
            <AdminProvider>
              <ContentProvider>
                <AppRoutes />
              </ContentProvider>
            </AdminProvider>
          </AuthProvider>
        </SfxProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
