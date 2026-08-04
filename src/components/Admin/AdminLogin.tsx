import React, { useRef, useState } from 'react';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { VisionFoldLogo } from '../VisionFoldLogo';
import { Input, PrimaryButton } from './ui';
import { LoginSchema } from '../../lib/validation';
import { ErrorHandler, ValidationError } from '../../lib/errors';

export const AdminLogin: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    try {
      // Validate input
      const validated = LoginSchema.parse({ email, password });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(validated),
      });

      const payload = await response.json();

      if (!response.ok) {
        const errorMessage = payload.error || 'Invalid credentials';
        setError(errorMessage);
        ErrorHandler.log(new Error(errorMessage), 'AdminLogin');
        return;
      }

      if (payload.user?.role !== 'admin') {
        setError('This account does not have studio admin access');
        return;
      }

      onSuccess();
    } catch (err: any) {
      ErrorHandler.log(err, 'AdminLogin');
      if (err instanceof ValidationError) {
        setFieldErrors(err.details || {});
        setError('Please check your input and try again.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-focus email field on mount
  React.useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B] px-4 py-8">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-2xl border border-[#222226] bg-[#121215] p-8 shadow-2xl"
        noValidate
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 scale-90">
            <VisionFoldLogo />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#222226]">
            <Lock className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <h1 className="mt-4 text-lg font-bold uppercase tracking-[0.2em] text-[#EDEDED]">Studio Dashboard</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#888891]">Admin Sign In</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-600/30 bg-red-600/10 p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />
            <p className="text-xs font-medium text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Input
              ref={firstInputRef}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setFieldErrors(prev => ({ ...prev, email: '' }))}
              autoComplete="email"
              required
              disabled={isLoading}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setFieldErrors(prev => ({ ...prev, password: '' }))}
              autoComplete="current-password"
              required
              disabled={isLoading}
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
            )}
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
            'Authenticate'
          )}
        </PrimaryButton>

        <a
          href="/"
          className="mt-6 block text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891] transition-colors hover:text-[#EDEDED]"
        >
          ← Back to site
        </a>
      </form>
    </div>
  );
};
