import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './components/PublicPages/HomePage';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { SfxProvider } from './context/SfxContext';
import { AdminProvider } from './context/AdminContext';
import { ContentProvider, useContent } from './context/ContentContext';
import { AuthProvider } from './context/AuthContext';
import { AdminApp } from './components/Admin/AdminApp';
import { Portal } from './components/Portal/Portal';
import { NotFound } from './components/NotFound';
import { PortfolioPage } from './components/PublicPages/PortfolioPage';
import { ServicesPage } from './components/PublicPages/ServicesPage';
import { ContactPage } from './components/PublicPages/ContactPage';
import { WorkDetailPage } from './components/PublicPages/WorkDetailPage';
import { ErrorBoundary } from './components/ErrorBoundary';

const MainContent: React.FC = () => {
  const { editMode, isAdmin, setEditMode } = useContent();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const location = useLocation();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToAdmin = () => {
    window.location.href = '/admin';
  };

  // Handle portal page
  if (location.pathname === '/portal') {
    return <Portal onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#EDEDED] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-[#0A0A0B]">
      {isAdmin && editMode ? (
        <button
          type="button"
          onClick={() => setEditMode(false)}
          className="fixed right-4 top-4 z-[110] rounded-full border border-[#D4AF37]/40 bg-[#121215]/90 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#EDEDED] shadow-lg backdrop-blur"
        >
          Save & Exit Edit Mode
        </button>
      ) : null}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1">
        <HomePage onNavigate={handleNavigate} />
      </main>
      <FloatingWhatsApp />
      <Footer onAdminClick={goToAdmin} />
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        navigate('/admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  // Show admin for /admin routes
  if (location.pathname.startsWith('/admin')) {
    return <AdminApp />;
  }

  // Use client-side routing for other pages
  return (
    <Routes>
      <Route path="/" element={<MainContent />} />
      <Route path="/work" element={<PortfolioPage />} />
      <Route path="/work/:slug" element={<WorkDetailPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/portal" element={<Portal onNavigate={(p) => window.location.href = p === 'home' ? '/' : `/${p}`} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AdminProvider>
          <ContentProvider>
            <SfxProvider>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </SfxProvider>
          </ContentProvider>
        </AdminProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
