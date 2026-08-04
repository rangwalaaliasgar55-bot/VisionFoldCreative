import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ErrorHandler, AppError } from '../lib/errors';
import { setApiToken } from '../lib/api';
import { UserSchema, LoginSchema } from '../lib/validation';
import type { User } from '../lib/validation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: AppError | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const setToken = useCallback((newToken: string | null) => {
    setTokenState(newToken);
    setApiToken(newToken);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!response.ok) {
        setUser(null);
        setToken(null);
        return;
      }

      const data = await response.json();

      // Validate response structure
      const validatedUser = UserSchema.parse(data.user);
      setUser(validatedUser);
      setToken(data.token || null);
      setError(null);
    } catch (err) {
      ErrorHandler.log(err, 'checkAuth');
      setUser(null);
      setToken(null);
      if (err instanceof AppError) {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setToken]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      clearError();

      // Validate input
      const validated = LoginSchema.parse({ email, password });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(validated),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Login failed';
        setError(new AppError(errorMessage, 'UNAUTHORIZED', 401));
        return { success: false, error: errorMessage };
      }

      const validatedUser = UserSchema.parse(data.user);
      setUser(validatedUser);
      setToken(data.token || null);
      setError(null);

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      ErrorHandler.log(err, 'login');
      const appError = err instanceof AppError ? err : new AppError(message, 'NETWORK_ERROR', 0);
      setError(appError);
      return { success: false, error: appError.message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
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
