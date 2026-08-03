import type { User, PortfolioItem, Message, Project, Revision, Invoice, Expense, ContentBlock } from '../types';

/**
 * Thin fetch wrapper for the Express API in server.ts.
 * Auth is cookie-based (httpOnly JWT set by /api/auth/login), so every request
 * goes out with credentials: 'include' and the server figures out who's asking.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }

  // 204 / empty body responses
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: { email: string; password: string; name: string; company?: string; phone?: string }) =>
    request<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<{ user: User }>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
};

// --- Content blocks (used for the pricing calculator's editable settings) ---
export const contentApi = {
  list: (page?: string) => request<ContentBlock[]>(`/content${page ? `?page=${page}` : ''}`),
  update: (id: string, updates: Partial<ContentBlock>) =>
    request<ContentBlock>(`/content/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  create: (block: Omit<ContentBlock, 'id' | 'updatedAt'>) =>
    request<ContentBlock>('/content', { method: 'POST', body: JSON.stringify(block) }),
};

// --- Portfolio ---
export const portfolioApi = {
  list: () => request<PortfolioItem[]>('/portfolio'),
  get: (id: string) => request<PortfolioItem>(`/portfolio/${id}`),
  create: (item: Omit<PortfolioItem, 'id'>) => request<PortfolioItem>('/portfolio', { method: 'POST', body: JSON.stringify(item) }),
  update: (id: string, updates: Partial<PortfolioItem>) =>
    request<PortfolioItem>(`/portfolio/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  remove: (id: string) => request<{ success: boolean }>(`/portfolio/${id}`, { method: 'DELETE' }),
};

// --- Messages / inquiries ---
export const messagesApi = {
  submit: (data: { name: string; email: string; phone: string; company?: string; projectType?: string; budgetRange?: string; deadline?: string; message: string }) =>
    request<{ success: boolean; message: Message }>('/messages', { method: 'POST', body: JSON.stringify(data) }),
  list: () => request<Message[]>('/messages'),
  updateStatus: (id: string, status: Message['status']) =>
    request<Message>(`/messages/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// --- Clients ---
export const clientsApi = {
  list: () => request<User[]>('/clients'),
  create: (data: { email: string; name: string; company?: string; phone?: string; password?: string }) =>
    request<{ client: User; initialPassword: string }>('/clients', { method: 'POST', body: JSON.stringify(data) }),
};

// --- Projects ---
export const projectsApi = {
  list: () => request<Project[]>('/projects'),
  create: (proj: Omit<Project, 'id' | 'createdAt'>) => request<Project>('/projects', { method: 'POST', body: JSON.stringify(proj) }),
  update: (id: string, updates: Partial<Project>) => request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
};

// --- Revisions ---
export const revisionsApi = {
  list: (projectId?: string) => request<Revision[]>(`/revisions${projectId ? `?projectId=${projectId}` : ''}`),
  create: (data: { projectId: string; comment: string }) =>
    request<Revision>('/revisions', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: Revision['status']) =>
    request<Revision>(`/revisions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// --- Invoices ---
export const invoicesApi = {
  list: () => request<Invoice[]>('/invoices'),
  create: (inv: Omit<Invoice, 'id' | 'createdAt'>) => request<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(inv) }),
  update: (id: string, updates: Partial<Invoice>) => request<Invoice>(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
};

// --- Expenses ---
export const expensesApi = {
  list: () => request<Expense[]>('/expenses'),
  create: (exp: Omit<Expense, 'id' | 'createdAt'>) => request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(exp) }),
  remove: (id: string) => request<{ success: boolean }>(`/expenses/${id}`, { method: 'DELETE' }),
};

// --- Upload (base64 data URL in, hosted URL out) ---
export const uploadApi = {
  upload: (fileName: string, fileData: string, mimeType: string) =>
    request<{ key: string; url: string }>('/upload', { method: 'POST', body: JSON.stringify({ fileName, fileData, mimeType }) }),
};
