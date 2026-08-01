import {
  User,
  ContentBlock,
  PortfolioItem,
  Message,
  Project,
  Revision,
  Invoice,
  Expense,
} from '../types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; name: string; company?: string; phone?: string }) =>
    request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  // Content
  getContent: (page?: string) =>
    request<ContentBlock[]>(`/api/content${page ? `?page=${page}` : ''}`),

  updateContentBlock: (id: string, updates: Partial<ContentBlock>) =>
    request<ContentBlock>(`/api/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  createContentBlock: (block: Omit<ContentBlock, 'id' | 'updatedAt'>) =>
    request<ContentBlock>('/api/content', {
      method: 'POST',
      body: JSON.stringify(block),
    }),

  // Portfolio
  getPortfolio: () => request<PortfolioItem[]>('/api/portfolio'),

  getPortfolioItem: (id: string) => request<PortfolioItem>(`/api/portfolio/${id}`),

  createPortfolioItem: (item: Omit<PortfolioItem, 'id'>) =>
    request<PortfolioItem>('/api/portfolio', {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  updatePortfolioItem: (id: string, updates: Partial<PortfolioItem>) =>
    request<PortfolioItem>(`/api/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deletePortfolioItem: (id: string) =>
    request<{ success: boolean }>(`/api/portfolio/${id}`, { method: 'DELETE' }),

  // Messages / Contact
  sendMessage: (data: Omit<Message, 'id' | 'status' | 'createdAt'>) =>
    request<{ success: boolean; message: Message }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMessages: () => request<Message[]>('/api/messages'),

  updateMessageStatus: (id: string, status: Message['status']) =>
    request<Message>(`/api/messages/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Clients
  getClients: () => request<User[]>('/api/clients'),

  createClient: (data: { email: string; name: string; company?: string; phone?: string; password?: string }) =>
    request<{ client: User; initialPassword?: string }>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Projects
  getProjects: () => request<Project[]>('/api/projects'),

  createProject: (data: Omit<Project, 'id' | 'createdAt'>) =>
    request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProject: (id: string, updates: Partial<Project>) =>
    request<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Revisions
  getRevisions: (projectId?: string) =>
    request<Revision[]>(`/api/revisions${projectId ? `?projectId=${projectId}` : ''}`),

  createRevision: (projectId: string, comment: string) =>
    request<Revision>('/api/revisions', {
      method: 'POST',
      body: JSON.stringify({ projectId, comment }),
    }),

  updateRevisionStatus: (id: string, status: Revision['status']) =>
    request<Revision>(`/api/revisions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Invoices
  getInvoices: () => request<Invoice[]>('/api/invoices'),

  createInvoice: (data: Omit<Invoice, 'id' | 'createdAt'>) =>
    request<Invoice>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateInvoice: (id: string, updates: Partial<Invoice>) =>
    request<Invoice>(`/api/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // Expenses
  getExpenses: () => request<Expense[]>('/api/expenses'),

  createExpense: (data: Omit<Expense, 'id' | 'createdAt'>) =>
    request<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteExpense: (id: string) =>
    request<{ success: boolean }>(`/api/expenses/${id}`, { method: 'DELETE' }),

  // Upload
  uploadFile: (fileName: string, fileData: string, mimeType?: string) =>
    request<{ key: string; url: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileData, mimeType }),
    }),
};
