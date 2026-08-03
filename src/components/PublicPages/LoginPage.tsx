import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSfx } from '../../context/SfxContext';
import { Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { VisionFoldLogo } from '../VisionFoldLogo';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, error, clearError } = useAuth();
  const { playClick, playHover } = useSfx();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);
    if (success) {
      playClick();
      onNavigate('portal');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 bg-[#0A0A0B]">
      <div className="w-full max-w-md">
        <button
          onClick={() => onNavigate('home')}
          onMouseEnter={playHover}
          className="flex items-center gap-2 text-[#888891] hover:text-[#D4AF37] transition-colors text-xs font-bold uppercase tracking-widest mb-10"
        >
          <ArrowLeft className="w-4 h-4" /> Back to site
        </button>

        <div className="flex flex-col items-center mb-10">
          <VisionFoldLogo size="md" variant="icon-only" color="white" className="mb-4" />
          <div className="w-12 h-12 rounded-full bg-[#121215] border border-[#222226] flex items-center justify-center mb-4">
            <Lock className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-[#EDEDED] mb-1">Client & Studio Portal</h1>
          <p className="text-xs text-[#888891] uppercase tracking-widest text-center">Sign in to view projects, revisions & invoices</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#121215] border border-[#222226] rounded-xl p-8 flex flex-col gap-4">
          <div>
            <label htmlFor="login-email" className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#222226] text-[#EDEDED] px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors rounded"
              placeholder="you@studio.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#222226] text-[#EDEDED] px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors rounded"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div role="alert" className="text-red-400 text-xs font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            onMouseEnter={playHover}
            className="mt-2 w-full bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest py-3.5 rounded hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[10px] text-[#888891] uppercase tracking-widest mt-6">
          Don't have portal access yet? Reach out via WhatsApp and we'll set up your client account.
        </p>
      </div>
    </div>
  );
};
