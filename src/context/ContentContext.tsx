import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ContentBlock, PortfolioItem } from '../types';

interface ContentContextValue {
  isAdmin: boolean;
  isAuthenticated: boolean;
  editMode: boolean;
  setEditMode: (enabled: boolean) => void;
  toggleEditMode: () => void;
  getValue: (page: string, sectionKey: string, fallback?: string) => string;
  saveValue: (page: string, sectionKey: string, value: string, type?: ContentBlock['type']) => Promise<void>;
  refreshContent: () => Promise<void>;
  portfolio: PortfolioItem[];
  refreshPortfolio: () => Promise<void>;
  savePortfolioItem: (item: Omit<PortfolioItem, 'id'>) => Promise<void>;
  updatePortfolioItem: (id: string, updates: Partial<PortfolioItem>) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
}

const ContentContext = createContext<ContentContextValue | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditModeState] = useState(false);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (!response.ok) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setEditModeState(false);
        return;
      }
      const payload = await response.json();
      const role = payload?.user?.role;
      setIsAuthenticated(true);
      setIsAdmin(role === 'admin');
      setEditModeState(false);
    } catch {
      setIsAuthenticated(false);
      setIsAdmin(false);
      setEditModeState(false);
    }
  }, []);

  const refreshContent = useCallback(async () => {
    try {
      const response = await fetch('/api/content');
      if (!response.ok) return;
      const payload = await response.json();
      setBlocks(Array.isArray(payload) ? payload : []);
    } catch {
      // Ignore content refresh failures and fall back to defaults.
    }
  }, []);

  const refreshPortfolio = useCallback(async () => {
    try {
      const response = await fetch('/api/portfolio');
      if (!response.ok) return;
      const payload = await response.json();
      setPortfolio(Array.isArray(payload) ? payload : []);
    } catch {
      // Ignore portfolio refresh failures.
    }
  }, []);

  useEffect(() => {
    void refreshAuth();
    void refreshContent();
    void refreshPortfolio();
  }, [refreshAuth, refreshContent, refreshPortfolio]);

  const getValue = useCallback((page: string, sectionKey: string, fallback = '') => {
    const match = blocks.find((block) => block.page === page && block.section_key === sectionKey);
    const value = match?.value;
    if (typeof value === 'string') {
      return value;
    }
    return fallback;
  }, [blocks]);

  const saveValue = useCallback(async (page: string, sectionKey: string, value: string, type: ContentBlock['type'] = 'text') => {
    const existing = blocks.find((block) => block.page === page && block.section_key === sectionKey);
    const body = {
      page,
      section_key: sectionKey,
      type,
      value,
      order: existing?.order ?? 1,
      visible: existing?.visible ?? true,
    };

    const response = existing
      ? await fetch(`/api/content/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...existing, ...body }),
        })
      : await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        });

    if (!response.ok) {
      throw new Error('Failed to save content block');
    }

    const saved = await response.json();
    setBlocks((prev) => {
      if (existing) {
        return prev.map((block) => (block.id === existing.id ? saved : block));
      }
      return [...prev, saved];
    });
  }, [blocks]);

  const savePortfolioItem = useCallback(async (item: Omit<PortfolioItem, 'id'>) => {
    const response = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error('Failed to save portfolio item');
    }
    const saved = await response.json();
    setPortfolio((prev) => [...prev, saved]);
  }, []);

  const updatePortfolioItem = useCallback(async (id: string, updates: Partial<PortfolioItem>) => {
    const response = await fetch(`/api/portfolio/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update portfolio item');
    }
    const saved = await response.json();
    setPortfolio((prev) => prev.map((item) => (item.id === id ? saved : item)));
  }, []);

  const deletePortfolioItem = useCallback(async (id: string) => {
    const response = await fetch(`/api/portfolio/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to delete portfolio item');
    }
    setPortfolio((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const setEditMode = useCallback((enabled: boolean) => {
    if (!isAdmin) return;
    setEditModeState(enabled);
  }, [isAdmin]);

  const toggleEditMode = useCallback(() => {
    if (!isAdmin) return;
    setEditModeState((prev) => !prev);
  }, [isAdmin]);

  const value = useMemo<ContentContextValue>(() => ({
    isAdmin,
    isAuthenticated,
    editMode,
    setEditMode,
    toggleEditMode,
    getValue,
    saveValue,
    refreshContent,
    portfolio,
    refreshPortfolio,
    savePortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem,
  }), [deletePortfolioItem, editMode, getValue, isAdmin, isAuthenticated, portfolio, refreshContent, refreshPortfolio, savePortfolioItem, saveValue, setEditMode, toggleEditMode, updatePortfolioItem]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};
