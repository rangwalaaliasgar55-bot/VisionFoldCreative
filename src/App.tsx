import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './components/PublicPages/HomePage';
import { LoginPage } from './components/PublicPages/LoginPage';
import { Portal } from './components/Portal/Portal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { SfxProvider } from './context/SfxContext';
import { AdminProvider } from './context/AdminContext';
import { AuthProvider } from './context/AuthContext';

const MainContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('home');

  useEffect(() => {
    // Ctrl+Shift+P shortcut to open portal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setCurrentPage('portal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1">
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} />}
        {currentPage === 'portal' && <Portal onNavigate={handleNavigate} />}
      </main>
      <FloatingWhatsApp />
      <Footer onAdminClick={() => { setCurrentPage('portal'); }} />
    </div>
  );
};

export default function App() {
  return (
    <AdminProvider>
      <SfxProvider>
        <AuthProvider>
          <MainContent />
        </AuthProvider>
      </SfxProvider>
    </AdminProvider>
  );
}
