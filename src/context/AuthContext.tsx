import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ErrorHandler, AppError, ErrorCode } from '../lib/errors';
import { setApiToken } from '../lib/api';
import { setStoredToken } from '../lib/adminApi';
import { UserSchema, LoginSchema } from '../lib/validation';
import type { User } from '../lib/validation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: AppError | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function coerceUser(raw: any): User | null {
  if (!raw || typeof raw !== 'object') return null;
  try {
    return UserSchema.parse({
      id: String(raw.id || ''),
      email: String(raw.email || ''),
      name: String(raw.name || raw.email || 'Client'),
      role: raw.role === 'admin' ? 'admin' : 'client',
      company: raw.company ?? '',
      phone: raw.phone ?? '',
      createdAt: raw.createdAt || new Date().toISOString(),
    });
  } catch {
    if (raw.id && raw.email) {
      return {
        id: String(raw.id),
        email: String(raw.email),
        name: String(raw.name || raw.email),
        role: raw.role === 'admin' ? 'admin' : 'client',
        company: raw.company || '',
        phone: raw.phone || '',
        createdAt: raw.createdAt || new Date().toISOString(),
      };
    }
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const setToken = useCallback((newToken: string | null) => {
    setTokenState(newToken);
    setApiToken(newToken);
    setStoredToken(newToken);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const headers: Record<string, string> = {};
      const stored = (() => {
        try {
          return localStorage.getItem('vf_auth_token');
        } catch {
          return null;
        }
      })();
      if (stored) headers.Authorization = `Bearer ${stored}`;

      const response = await fetch('/api/auth/me', { credentials: 'include', headers });
      const responseText = await response.text();
      const data = responseText
        ? (() => {
            try {
              return JSON.parse(responseText);
            } catch {
              return {};
            }
          })()
        : {};

      if (!response.ok) {
        setUser(null);
        setToken(null);
        return;
      }

      const validatedUser = coerceUser(data.user);
      if (!validatedUser) {
        setUser(null);
        setToken(null);
        return;
      }
      setUser(validatedUser);
      setToken(data.token || stored || null);
      setError(null);
    } catch (err) {
      ErrorHandler.log(err, 'checkAuth');
      setUser(null);
      setToken(null);
      if (err instanceof AppError) setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [setToken]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      clearError();
      const validated = LoginSchema.parse({ email, password });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(validated),
      });

      const responseText = await response.text();
      const data = responseText
        ? (() => {
            try {
              return JSON.parse(responseText);
            } catch {
              return { error: responseText };
            }
          })()
        : {};

      if (!response.ok) {
        const errorMessage = data.error || 'Invalid email or password';
        setError(new AppError(errorMessage, ErrorCode.UNAUTHORIZED, 401));
        return { success: false, error: errorMessage };
      }

      const validatedUser = coerceUser(data.user);
      if (!validatedUser) {
        return { success: false, error: 'Login succeeded but profile could not be loaded. Try again.' };
      }

      setUser(validatedUser);
      setToken(data.token || null);
      setError(null);
      return { success: true, user: validatedUser };
    } catch (err: any) {
      let message = 'Network error';
      if (err?.name === 'ZodError' && Array.isArray(err.issues)) {
        message = err.issues.map((i: any) => i.message).join('. ') || 'Invalid login details';
      } else if (err instanceof Error) {
        message = err.message;
      }
      ErrorHandler.log(err, 'login');
      const appError = err instanceof AppError ? err : new AppError(message, ErrorCode.NETWORK_ERROR, 0);
      setError(appError);
      return { success: false, error: appError.message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      ErrorHandler.log(err, 'logout');
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isLoading,
      error,
      login,
      logout,
      checkAuth,
      clearError,
    }),
    [user, token, isLoading, error, login, logout, checkAuth, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
