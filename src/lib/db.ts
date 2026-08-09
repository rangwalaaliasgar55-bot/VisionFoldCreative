import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
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
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

// Vercel serverless FS is read-only under /var/task — use /tmp there.
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isVercel
  ? path.join('/tmp', 'visionfold-data')
  : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface Schema {
  users: User[];
  content_blocks: ContentBlock[];
  portfolio: PortfolioItem[];
  messages: Message[];
  projects: Project[];
  revisions: Revision[];
  invoices: Invoice[];
  expenses: Expense[];
  settings?: Record<string, any>;
}

export class SupabaseDBManager {
  private db: Schema;
  private readonly supabaseClient = getSupabaseClient();
  private readonly useSupabase: boolean;

  constructor() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[DB] Could not create DATA_DIR (read-only FS?). Using in-memory defaults.', err);
    }
    this.db = this.loadLocalDB();
    this.useSupabase = isSupabaseConfigured() && Boolean(this.supabaseClient);
    if (process.env.NODE_ENV === 'production' && !this.useSupabase) {
      console.warn('[DB] Supabase is not configured in production — using bundled local fallback data.');
    }
  }

  private loadLocalDB(): Schema {
    try {
      if (fs.existsSync(DB_FILE)) {
        try {
          return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        } catch (err) {
          console.error('Error reading db.json:', err);
        }
      }
    } catch (err) {
      console.warn('[DB] existsSync/read failed; using defaults.', err);
    }
    const defaultDB = getDefaultDB();
    this.saveLocalDB(defaultDB);
    return defaultDB;
  }

  private saveLocalDB(db: Schema = this.db) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[DB] Failed to persist local DB (non-fatal):', err);
    }
  }

  async getSettings(): Promise<Record<string, any>> {
    return this.db.settings || {};
  }
  async updateSettings(updates: Record<string, any>): Promise<Record<string, any>> {
    const merged = { ...(this.db.settings || {}), ...updates };
    this.db.settings = merged;
    this.saveLocalDB(this.db);
    return merged;
  }
  async getUsers(): Promise<User[]> {
    return this.db.users.map((u: any) => {
      const { passwordHash, ...safe } = u;
      return safe;
    });
  }
  async findUserByEmail(email: string) {
    return this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  async findUserById(id: string) {
    const u = this.db.users.find((x) => x.id === id);
    if (!u) return undefined;
    const { passwordHash, ...safe } = u as any;
    return safe;
  }
  async createUser(user: User & { passwordHash: string }) {
    this.db.users.push(user as any);
    this.saveLocalDB(this.db);
    const { passwordHash, ...safe } = user;
    return safe;
  }
  async updateUserPassword(id: string, newHash: string) {
    const u = this.db.users.find((x) => x.id === id);
    if (u) { (u as any).passwordHash = newHash; this.saveLocalDB(this.db); }
  }
  async updateUser(id: string, updates: Partial<User> & { passwordHash?: string }) {
    const current = this.db.users.find((u) => u.id === id);
    if (!current) return null;
    const merged = { ...current, ...updates } as any;
    this.db.users = this.db.users.map((u) => (u.id === id ? merged : u));
    this.saveLocalDB(this.db);
    const { passwordHash, ...safe } = merged;
    return safe;
  }
  async deleteUser(id: string) {
    const before = this.db.users.length;
    this.db.users = this.db.users.filter((u) => u.id !== id);
    this.saveLocalDB(this.db);
    return this.db.users.length < before;
  }
  async getContentBlocks(page?: string) {
    const list = page ? this.db.content_blocks.filter((i) => i.page === page) : this.db.content_blocks;
    return list.sort((a, b) => a.order - b.order);
  }
  async updateContentBlock(id: string, updates: Partial<ContentBlock>) {
    const current = this.db.content_blocks.find((i) => i.id === id);
    if (!current) return null;
    const merged = { ...current, ...updates, updatedAt: new Date().toISOString() } as ContentBlock;
    this.db.content_blocks = this.db.content_blocks.map((i) => (i.id === id ? merged : i));
    this.saveLocalDB(this.db);
    return merged;
  }
  async createContentBlock(block: Omit<ContentBlock, 'id' | 'updatedAt'>) {
    const newBlock = { ...block, id: `cb_${Date.now()}`, updatedAt: new Date().toISOString() } as ContentBlock;
    this.db.content_blocks.push(newBlock);
    this.saveLocalDB(this.db);
    return newBlock;
  }
  async getPortfolio() {
    return this.db.portfolio.sort((a, b) => a.order - b.order);
  }
  async getPortfolioById(id: string) {
    return this.db.portfolio.find((i) => i.id === id);
  }
  async createPortfolioItem(item: Omit<PortfolioItem, 'id'>) {
    const newItem = { ...item, id: `port_${Date.now()}` };
    this.db.portfolio.push(newItem);
    this.saveLocalDB(this.db);
    return newItem;
  }
  async updatePortfolioItem(id: string, updates: Partial<PortfolioItem>) {
    const current = this.db.portfolio.find((i) => i.id === id);
    if (!current) return null;
    const merged = { ...current, ...updates };
    this.db.portfolio = this.db.portfolio.map((i) => (i.id === id ? merged : i));
    this.saveLocalDB(this.db);
    return merged;
  }
  async deletePortfolioItem(id: string) {
    const before = this.db.portfolio.length;
    this.db.portfolio = this.db.portfolio.filter((i) => i.id !== id);
    this.saveLocalDB(this.db);
    return this.db.portfolio.length < before;
  }
  async getMessages() {
    return this.db.messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async createMessage(msg: Omit<Message, 'id' | 'status' | 'createdAt'>) {
    const newMsg = { ...msg, id: `msg_${Date.now()}`, status: 'new' as const, createdAt: new Date().toISOString() };
    this.db.messages.push(newMsg);
    this.saveLocalDB(this.db);
    return newMsg;
  }
  async updateMessageStatus(id: string, status: Message['status']) {
    const current = this.db.messages.find((i) => i.id === id);
    if (!current) return null;
    const merged = { ...current, status };
    this.db.messages = this.db.messages.map((i) => (i.id === id ? merged : i));
    this.saveLocalDB(this.db);
    return merged;
  }
  async getProjects(clientId?: string) {
    const list = clientId ? this.db.projects.filter((i) => i.clientId === clientId) : this.db.projects;
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async getProjectById(id: string) {
    return this.db.projects.find((i) => i.id === id);
  }
  async createProject(proj: Omit<Project, 'id' | 'createdAt'>) {
    const newProj = { ...proj, id: `proj_${Date.now()}`, createdAt: new Date().toISOString() };
    this.db.projects.push(newProj);
    this.saveLocalDB(this.db);
    return newProj;
  }
  async updateProject(id: string, updates: Partial<Project>) {
    const current = this.db.projects.find((i) => i.id === id);
    if (!current) return null;
    const merged = { ...current, ...updates };
    this.db.projects = this.db.projects.map((i) => (i.id === id ? merged : i));
    this.saveLocalDB(this.db);
    return merged;
  }
  async getRevisions(projectId?: string, clientId?: string) {
    let list = this.db.revisions;
    if (projectId) list = list.filter((i) => i.projectId === projectId);
    if (clientId) list = list.filter((i) => i.clientId === clientId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async createRevision(rev: Omit<Revision, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
    const newRev = { ...rev, id: `rev_${Date.now()}`, status: 'pending' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.db.revisions.push(newRev);
    this.saveLocalDB(this.db);
    return newRev;
  }
  async updateRevisionStatus(id: string, status: Revision['status']) {
    const current = this.db.revisions.find((i) => i.id === id);
    if (!current) return null;
    const merged = { ...current, status, updatedAt: new Date().toISOString() };
    this.db.revisions = this.db.revisions.map((i) => (i.id === id ? merged : i));
    this.saveLocalDB(this.db);
    return merged;
  }
  async getInvoices(clientId?: string) {
    const list = clientId ? this.db.invoices.filter((i) => i.clientId === clientId) : this.db.invoices;
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async createInvoice(inv: Omit<Invoice, 'id' | 'createdAt'>) {
    const newInv = { ...inv, id: `inv_${Date.now()}`, createdAt: new Date().toISOString() };
    this.db.invoices.push(newInv);
    this.saveLocalDB(this.db);
    return newInv;
  }
  async updateInvoice(id: string, updates: Partial<Invoice>) {
    const current = this.db.invoices.find((i) => i.id === id);
    if (!current) return null;
    const merged = { ...current, ...updates };
    this.db.invoices = this.db.invoices.map((i) => (i.id === id ? merged : i));
    this.saveLocalDB(this.db);
    return merged;
  }
  async getExpenses() {
    return this.db.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  async createExpense(exp: Omit<Expense, 'id' | 'createdAt'>) {
    const newExp = { ...exp, id: `exp_${Date.now()}`, createdAt: new Date().toISOString() };
    this.db.expenses.push(newExp);
    this.saveLocalDB(this.db);
    return newExp;
  }
  async deleteExpense(id: string) {
    const before = this.db.expenses.length;
    this.db.expenses = this.db.expenses.filter((i) => i.id !== id);
    this.saveLocalDB(this.db);
    return this.db.expenses.length < before;
  }
}

function getDefaultDB(): Schema {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('aliasgar134', salt);
  const clientHashedPassword = bcrypt.hashSync('client123password', salt);
  const adminUser: User = {
    id: 'user_admin_01',
    email: 'visionfoldcreative@gmail.com',
    name: 'Aliasgar',
    role: 'admin',
    company: 'Vision Fold Creative',
    phone: '+91 7725004639',
    createdAt: new Date().toISOString(),
  };
  const sampleClientUser: User = {
    id: 'user_client_01',
    email: 'client@aurastudios.com',
    name: 'Rohan Sharma',
    role: 'client',
    company: 'Aura Apparel',
    phone: '+91 9876543210',
    createdAt: new Date().toISOString(),
  };
  return {
    users: [
      { ...adminUser, passwordHash: hashedPassword } as any,
      { ...sampleClientUser, passwordHash: clientHashedPassword } as any,
    ],
    content_blocks: [],
    portfolio: [],
    messages: [],
    projects: [],
    revisions: [],
    invoices: [],
    expenses: [],
    settings: {
      siteIdentity: { siteTitle: 'VisionFold Creative', tagline: 'Premium Video Production Studio' },
      rates: { baselineRate: 700 },
      metrics: {},
    },
  };
}

export const dbManager = new SupabaseDBManager();
