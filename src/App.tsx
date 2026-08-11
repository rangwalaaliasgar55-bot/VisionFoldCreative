import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { SiteChat } from './components/SiteChat';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SfxProvider } from './context/SfxContext';
import { AdminProvider } from './context/AdminContext';
import { ContentProvider, useContent } from './context/ContentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminApp } from './components/Admin/AdminApp';
import { Portal } from './components/Portal/Portal';
import { SkeletonLoader } from './components/SkeletonLoader';
import { AudioMeshBackground } from './components/AudioMeshBackground';

// Lazy load page components for better initial load performance
const HomePage = lazy(() => import('./components/PublicPages/HomePage').then(m => ({ default: m.HomePage })));
const PortfolioPage = lazy(() => import('./components/PublicPages/PortfolioPage').then(m => ({ default: m.PortfolioPage })));
const ServicesPage = lazy(() => import('./components/PublicPages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const ContactPage = lazy(() => import('./components/PublicPages/ContactPage').then(m => ({ default: m.ContactPage })));
const WorkDetailPage = lazy(() => import('./components/PublicPages/WorkDetailPage').then(m => ({ default: m.WorkDetailPage })));
const CmsPageView = lazy(() => import('./components/PublicPages/CmsPageView').then(m => ({ default: m.CmsPageView })));
const PolicyPage = lazy(() => import('./components/PublicPages/PolicyPage').then(m => ({ default: m.PolicyPage })));
const MaintenancePage = lazy(() => import('./components/PublicPages/MaintenancePage').then(m => ({ default: m.MaintenancePage })));
const NotFound = lazy(() => import('./components/NotFound').then(m => ({ default: m.NotFound })));

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
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40" aria-hidden>
        <AudioMeshBackground />
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.10),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_28%)]"
        aria-hidden
      />
      {/* Interactive shell must explicitly accept pointer events */}
      <div className="relative z-10 flex min-h-screen flex-col pointer-events-auto">
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
    return (
      <div className="pointer-events-auto relative z-20 min-h-screen">
        <AdminApp />
      </div>
    );
  }

  return (
    <MaintenanceGate>
      <Suspense fallback={<SkeletonLoader />}>
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
      </Suspense>
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
