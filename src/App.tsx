import React, { useState, useEffect } from 'react';
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

const MainContent: React.FC = () => {
  const { editMode, isAdmin, setEditMode } = useContent();
  const [currentPage, setCurrentPage] = useState<string>('home');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToAdmin = () => {
    window.location.href = '/admin';
  };

  if (currentPage === 'portal') {
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

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.pathname.startsWith('/admin'));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        window.history.pushState({}, '', '/admin');
        setIsAdminRoute(true);
      }
    };
    const handlePopState = () => setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <AdminProvider>
      <ContentProvider>
        <SfxProvider>
          <AuthProvider>
            {isAdminRoute ? <AdminApp /> : <MainContent />}
          </AuthProvider>
        </SfxProvider>
      </ContentProvider>
    </AdminProvider>
  );
}
