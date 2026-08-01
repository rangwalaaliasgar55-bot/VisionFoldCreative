export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  phone?: string;
  createdAt: string;
}

export type ContentBlockType = 'text' | 'richtext' | 'image' | 'list' | 'price';

export interface ContentBlock {
  id: string;
  page: 'home' | 'about' | 'services' | 'portfolio' | 'contact' | 'global';
  section_key: string;
  type: ContentBlockType;
  value: string | string[] | Record<string, any>;
  order: number;
  visible: boolean;
  updatedAt: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  clientName?: string;
  hideClientName?: boolean;
  category: 'Short Form' | 'Brand Content' | 'Long Form' | 'Social Media' | 'Documentary';
  thumbnailUrl: string;
  videoUrl?: string;
  teaser: string;
  fullDescription: string;
  dateCreated: string;
  toolsUsed: string[];
  resultsImpact: string;
  order: number;
  featured: boolean;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  projectType: string;
  budgetRange: string;
  deadline?: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  createdAt: string;
}

export type ProjectStatus = 'in_progress' | 'in_review' | 'delivered';

export interface Project {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  category: string;
  status: ProjectStatus;
  description: string;
  deliveredFiles?: { name: string; url: string }[];
  resultsImpact?: string;
  startDate: string;
  deliveryDate?: string;
  amountINR: number;
  createdAt: string;
}

export interface Revision {
  id: string;
  projectId: string;
  clientId: string;
  clientName: string;
  comment: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId?: string;
  clientId: string;
  clientName: string;
  amountINR: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue';
  description: string;
  paidAt?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'Software/Tools' | 'Subcontracting' | 'Equipment' | 'Marketing' | 'Operations';
  amountINR: number;
  date: string;
  description?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
