import React, { useEffect, useRef, useState } from 'react';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { VisionFoldLogo } from '../VisionFoldLogo';
import { Input, PrimaryButton } from './ui';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('visionfoldcreative@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await login(email.trim().toLowerCase(), password);
      if (!result.success) {
        setError(result.error || 'Invalid email or password');
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.12),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.04),transparent_40%)]" />
      <form
        onSubmit={handleLogin}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0E0E12]/90 p-8 shadow-2xl backdrop-blur-xl"
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
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />
            <p className="text-xs font-medium text-red-300">{error}</p>
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#888891]">Email</label>
            <Input
              ref={firstInputRef}
              type="email"
              placeholder="visionfoldcreative@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#888891]">Password</label>
            <Input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <PrimaryButton
          type="submit"
          disabled={isLoading || !email || !password}
          className="mt-6 w-full justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Authenticating...
            </>
          ) : (
            'Sign in to studio'
          )}
        </PrimaryButton>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-[#666]">
          Default: visionfoldcreative@gmail.com
        </p>

        <a
          href="/"
          className="mt-4 block text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891] transition-colors hover:text-[#EDEDED]"
        >
          ← Back to site
        </a>
      </form>
    </div>
  );
};
