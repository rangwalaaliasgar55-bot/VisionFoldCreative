import React, { useEffect, useRef, useState } from 'react';
import { Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { VisionFoldLogo } from '../VisionFoldLogo';
import { Input, PrimaryButton } from './ui';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('visionfoldcreative@gmail.com');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email.trim() || !password) {
      setError('Enter both email and password.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await login(email.trim().toLowerCase(), password);
      if (!result.success) {
        setError(result.error || 'Invalid email or password. Check JWT_SECRET and admin user on the server.');
        return;
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050507] px-4 py-8">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#D4AF37]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(212,175,55,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <form
        onSubmit={handleLogin}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0E0E12]/95 p-8 shadow-2xl backdrop-blur-xl"
        style={{ transform: 'perspective(1000px) rotateX(2deg)', transformStyle: 'preserve-3d' }}
        noValidate
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 scale-90">
            <VisionFoldLogo />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10">
            <Lock className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <h1 className="mt-4 text-lg font-bold uppercase tracking-[0.2em] text-[#EDEDED]">Studio Dashboard</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#888891]">Admin sign in</p>
        </div>

        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-600/30 bg-red-600/10 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Email</label>
            <Input
              ref={firstInputRef}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="visionfoldcreative@gmail.com"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Password</label>
            <div className="relative">
              <Input
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#D4AF37]"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <PrimaryButton type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              'Enter dashboard'
            )}
          </PrimaryButton>
        </div>
        <p className="mt-6 text-center text-[10px] text-[#555]">
          Ctrl+Shift+A from the site also opens admin
        </p>
      </form>
    </div>
  );
};

export default AdminLogin;
