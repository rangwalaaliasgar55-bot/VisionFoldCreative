import { z } from 'zod';

const FlexibleDateSchema = z.union([z.string(), z.date()]).transform((v) =>
  typeof v === 'string' ? v : v.toISOString()
);

export const UserRoleSchema = z.enum(['admin', 'client']);

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: UserRoleSchema,
  company: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  createdAt: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ContentBlockSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  value: z.string(),
  type: z.enum(['text', 'html', 'image', 'json']).optional(),
  updatedAt: z.string().optional(),
});

export const PortfolioItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  clientName: z.string().optional(),
  category: z.enum(['Short Form', 'Brand Content', 'Long Form', 'Social Media', 'Documentary']).or(z.string()),
  thumbnailUrl: z.string().optional().default(''),
  videoUrl: z.string().optional().default(''),
  teaser: z.string().optional().default(''),
  fullDescription: z.string().optional().default(''),
  resultsImpact: z.string().optional().default(''),
  toolsUsed: z.array(z.string()).optional().default([]),
  order: z.number().optional().default(0),
  featured: z.boolean().optional().default(false),
  dateCreated: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  ratingNote: z.string().optional(),
});

export const CreatePortfolioItemSchema = PortfolioItemSchema.omit({ id: true, dateCreated: true });
export const UpdatePortfolioItemSchema = CreatePortfolioItemSchema.partial();

/** Lead pipeline: new → contacted → qualified → proposal → won | lost | closed */
export const LeadStatusSchema = z.enum([
  'new',
  'contacted',
  'qualified',
  'proposal',
  'won',
  'lost',
  'closed',
]);

export const MessageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  company: z.string().optional(),
  projectType: z.string().min(1),
  budgetRange: z.string().min(1),
  deadline: FlexibleDateSchema.optional(),
  message: z.string().min(10),
  status: LeadStatusSchema,
  createdAt: z.string().optional(),
});

export const CreateMessageSchema = MessageSchema.omit({ id: true, status: true, createdAt: true }).extend({
  status: LeadStatusSchema.optional(),
});

export const UpdateMessageStatusSchema = z.object({
  status: LeadStatusSchema,
});

export const ProjectStatusSchema = z.enum(['in_progress', 'in_review', 'delivered']);

export const ProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  clientEmail: z.string().optional(),
  category: z.string().min(1),
  status: ProjectStatusSchema,
  description: z.string().optional(),
  deliveredFiles: z
    .array(
      z.object({
        name: z.string().min(1),
        url: z.string().url().or(z.literal('')),
      })
    )
    .optional(),
  resultsImpact: z.string().optional(),
  startDate: FlexibleDateSchema.optional(),
  deliveryDate: FlexibleDateSchema.optional(),
  amountINR: z.number().nonnegative().optional(),
  createdAt: z.string().optional(),
});

export const CreateProjectSchema = ProjectSchema.omit({ id: true, createdAt: true });
export const UpdateProjectSchema = CreateProjectSchema.partial();

export const RevisionSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  clientId: z.string().optional(),
  comment: z.string().min(1),
  status: z.enum(['pending', 'in_progress', 'resolved']),
  createdAt: z.string().optional(),
});

export const CreateRevisionSchema = RevisionSchema.omit({ id: true, createdAt: true }).extend({
  status: z.enum(['pending', 'in_progress', 'resolved']).optional(),
});

export const InvoiceSchema = z.object({
  id: z.string().min(1),
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  invoiceNumber: z.string().optional(),
  amountINR: z.number().nonnegative(),
  description: z.string().min(1),
  dueDate: FlexibleDateSchema,
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'unpaid']),
  createdAt: z.string().optional(),
});

export const ExpenseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  amountINR: z.number().nonnegative(),
  category: z.string().optional(),
  date: FlexibleDateSchema.optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
});

export const AuthStateSchema = z.object({
  user: UserSchema.nullable(),
  token: z.string().nullable(),
  isAuthenticated: z.boolean(),
});

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
