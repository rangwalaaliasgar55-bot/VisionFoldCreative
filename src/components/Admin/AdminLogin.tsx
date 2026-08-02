import React, { useRef, useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { VisionFoldLogo } from '../VisionFoldLogo';
import { Input, PrimaryButton } from './ui';

export const AdminLogin: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Invalid credentials');
      if (payload.user?.role !== 'admin') throw new Error('This account does not have studio admin access');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B] px-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl border border-[#222226] bg-[#121215] p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 scale-90"><VisionFoldLogo /></div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#222226]">
            <Lock className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <h1 className="mt-4 text-lg font-bold uppercase tracking-[0.2em] text-[#EDEDED]">Studio Dashboard</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#888891]">Admin Sign In</p>
        </div>

        <div className="space-y-3">
          <Input
            ref={firstInputRef}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error ? <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-red-400">{error}</div> : null}

        <PrimaryButton type="submit" disabled={isLoading} className="mt-6 w-full justify-center">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Authenticate'}
        </PrimaryButton>

        <a href="/" className="mt-6 block text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891] transition-colors hover:text-[#EDEDED]">
          ← Back to site
        </a>
      </form>
    </div>
  );
};
