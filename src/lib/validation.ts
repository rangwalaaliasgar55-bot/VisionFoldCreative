import { z } from 'zod';

// User Validation
export const UserRoleSchema = z.enum(['admin', 'client']);
export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: UserRoleSchema,
  company: z.string().optional(),
  phone: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: UserRoleSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  company: z.string().optional(),
  phone: z.string().optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8).optional(),
});

// Content Block Validation
export const ContentBlockTypeSchema = z.enum(['text', 'richtext', 'image', 'list', 'price']);
export const ContentBlockSchema = z.object({
  id: z.string().min(1),
  page: z.enum(['home', 'about', 'services', 'portfolio', 'contact', 'global']),
  section_key: z.string().min(1),
  type: ContentBlockTypeSchema,
  value: z.union([z.string(), z.array(z.string()), z.record(z.any())]),
  order: z.number().int().nonnegative(),
  visible: z.boolean(),
  updatedAt: z.string().datetime(),
});

export const CreateContentBlockSchema = ContentBlockSchema.omit({ id: true, updatedAt: true });
export const UpdateContentBlockSchema = CreateContentBlockSchema.partial();

// Portfolio Item Validation
export const PortfolioItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  clientName: z.string().optional(),
  hideClientName: z.boolean().optional(),
  category: z.enum(['Short Form', 'Brand Content', 'Long Form', 'Social Media', 'Documentary']),
  thumbnailUrl: z.string().url(),
  videoUrl: z.string().url().optional(),
  teaser: z.string().min(10),
  fullDescription: z.string().min(20),
  dateCreated: z.string().datetime(),
  toolsUsed: z.array(z.string()).min(1),
  resultsImpact: z.string(),
  order: z.number().int().nonnegative(),
  featured: z.boolean(),
});

export const CreatePortfolioItemSchema = PortfolioItemSchema.omit({ id: true, dateCreated: true });
export const UpdatePortfolioItemSchema = CreatePortfolioItemSchema.partial();

// Message Validation
export const MessageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  company: z.string().optional(),
  projectType: z.string().min(1),
  budgetRange: z.string().min(1),
  deadline: z.string().datetime().optional(),
  message: z.string().min(10),
  status: z.enum(['new', 'contacted', 'closed']),
  createdAt: z.string().datetime(),
});

export const CreateMessageSchema = MessageSchema.omit({ id: true, status: true, createdAt: true }).extend({
  status: z.enum(['new', 'contacted', 'closed']).optional(),
});

export const UpdateMessageStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'closed']),
});

// Project Validation
export const ProjectStatusSchema = z.enum(['in_progress', 'in_review', 'delivered']);
export const ProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  category: z.string().min(1),
  status: ProjectStatusSchema,
  description: z.string().min(1),
  deliveredFiles: z.array(z.object({ name: z.string(), url: z.string().url() })).optional(),
  resultsImpact: z.string().optional(),
  startDate: z.string().datetime(),
  deliveryDate: z.string().datetime().optional(),
  amountINR: z.number().positive(),
  createdAt: z.string().datetime(),
});

export const CreateProjectSchema = ProjectSchema.omit({ id: true, createdAt: true });
export const UpdateProjectSchema = CreateProjectSchema.partial();

// Revision Validation
export const RevisionSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  comment: z.string().min(1),
  status: z.enum(['pending', 'in_progress', 'resolved']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateRevisionSchema = RevisionSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const UpdateRevisionSchema = z.object({
  comment: z.string().min(1).optional(),
  status: z.enum(['pending', 'in_progress', 'resolved']).optional(),
});

// Invoice Validation
export const InvoiceSchema = z.object({
  id: z.string().min(1),
  invoiceNumber: z.string().min(1),
  projectId: z.string().optional(),
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  amountINR: z.number().positive(),
  dueDate: z.string().datetime(),
  status: z.enum(['paid', 'unpaid', 'overdue']),
  description: z.string().min(1),
  paidAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export const CreateInvoiceSchema = InvoiceSchema.omit({ id: true, createdAt: true });
export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

// Expense Validation
export const ExpenseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(['Software/Tools', 'Subcontracting', 'Equipment', 'Marketing', 'Operations']),
  amountINR: z.number().positive(),
  date: z.string().datetime(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const CreateExpenseSchema = ExpenseSchema.omit({ id: true, createdAt: true });
export const UpdateExpenseSchema = CreateExpenseSchema.partial();

// Auth Validation
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const AuthStateSchema = z.object({
  user: UserSchema.nullable(),
  token: z.string().nullable(),
});

// Type Exports
export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type PortfolioItem = z.infer<typeof PortfolioItemSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type Revision = z.infer<typeof RevisionSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;
export type AuthState = z.infer<typeof AuthStateSchema>;
