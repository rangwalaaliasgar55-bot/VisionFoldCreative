import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './components/PublicPages/HomePage';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { SfxProvider } from './context/SfxContext';
import { AdminProvider } from './context/AdminContext';
import { AdminModal } from './components/AdminModal';
import { ContentProvider, useContent } from './context/ContentContext';

const MainContent: React.FC = () => {
  const { editMode, isAdmin, setEditMode } = useContent();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAdminModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      <Footer onAdminClick={() => setAdminModalOpen(true)} />
      <AdminModal isOpen={adminModalOpen} onClose={() => setAdminModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AdminProvider>
      <ContentProvider>
        <SfxProvider>
          <MainContent />
        </SfxProvider>
      </ContentProvider>
    </AdminProvider>
  );
}
