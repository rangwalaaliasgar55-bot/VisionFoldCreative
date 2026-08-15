import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull().default("Admin"),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("admin"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)]
);

export const clients = pgTable(
  "clients",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    company: text("company").notNull().default(""),
    passwordHash: text("password_hash").notNull(),
    status: text("status").notNull().default("active"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex("clients_email_uq").on(t.email)]
);

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    service: text("service").notNull().default("Video Editing"),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("in_progress"),
    progress: integer("progress").notNull().default(0),
    dueDate: date("due_date"),
    budget: numeric("budget", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("projects_client_idx").on(t.clientId), index("projects_status_idx").on(t.status)]
);

export const updates = pgTable(
  "updates",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("updates_project_idx").on(t.projectId)]
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    sender: text("sender").notNull(),
    body: text("body").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("messages_client_idx").on(t.clientId)]
);

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    service: text("service").notNull().default("Video Editing"),
    budget: text("budget").notNull().default(""),
    message: text("message").notNull().default(""),
    notes: text("notes").notNull().default(""),
    status: text("status").notNull().default("new"),
    source: text("source").notNull().default("website"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("leads_status_idx").on(t.status)]
);

export const portfolio = pgTable("portfolio", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("Brand Film"),
  description: text("description").notNull().default(""),
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  year: text("year").notNull().default(""),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    number: text("number").notNull().default(""),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    status: text("status").notNull().default("sent"),
    dueDate: date("due_date"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("invoices_client_idx").on(t.clientId)]
);

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: text("category").notNull().default("Software"),
  description: text("description").notNull().default(""),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const ratings = pgTable(
  "ratings",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    stars: integer("stars").notNull().default(5),
    comment: text("comment").notNull().default(""),
    visible: boolean("visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("ratings_client_idx").on(t.clientId)]
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (t) => [uniqueIndex("categories_slug_uq").on(t.slug)]
);

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    content: text("content").notNull().default(""),
    status: text("status").notNull().default("draft"),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    tags: text("tags").notNull().default(""),
    featuredImage: text("featured_image").notNull().default(""),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    views: integer("views").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex("posts_slug_uq").on(t.slug), index("posts_status_idx").on(t.status)]
);

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull().default("image"),
  size: integer("size").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const automations = pgTable("automations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(),
  description: text("description").notNull().default(""),
  enabled: boolean("enabled").notNull().default(true),
  config: jsonb("config").$type<unknown>().notNull().default({}),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
});

export const activity = pgTable(
  "activity",
  {
    id: serial("id").primaryKey(),
    actor: text("actor").notNull().default("system"),
    action: text("action").notNull(),
    details: text("details").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("activity_created_idx").on(t.createdAt)]
);

export const aiUsage = pgTable("ai_usage", {
  id: serial("id").primaryKey(),
  day: date("day").notNull(),
  tokens: integer("tokens").notNull().default(0),
});

export const newsletter = pgTable(
  "newsletter",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex("newsletter_email_uq").on(t.email)]
);

export const quotas = pgTable("quotas", {
  id: serial("id").primaryKey(),
  storageUsedBytes: numeric("storage_used_bytes").notNull().default("45800000000"),
  storageLimitBytes: numeric("storage_limit_bytes").notNull().default("107374182400"), // 100 GB
  aiTokensUsed: integer("ai_tokens_used").notNull().default(18500),
  aiTokensLimit: integer("ai_tokens_limit").notNull().default(250000),
  renderHoursUsed: numeric("render_hours_used").notNull().default("18.5"),
  renderHoursLimit: numeric("render_hours_limit").notNull().default("50.0"),
  activeProjectsLimit: integer("active_projects_limit").notNull().default(20),
  alertThresholdPercent: integer("alert_threshold_percent").notNull().default(80),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const frameAnnotations = pgTable(
  "frame_annotations",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    clientId: integer("client_id").references(() => clients.id, { onDelete: "cascade" }),
    timestamp: text("timestamp").notNull().default("00:00"),
    comment: text("comment").notNull(),
    author: text("author").notNull().default("Client"),
    resolved: boolean("resolved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("annotations_project_idx").on(t.projectId)]
);

export const deliverables = pgTable(
  "deliverables",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    format: text("format").notNull().default("ProRes 422 HQ"),
    resolution: text("resolution").notNull().default("4K UHD (3840x2160)"),
    sizeBytes: numeric("size_bytes").notNull().default("12400000000"),
    downloadUrl: text("download_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("deliverables_project_idx").on(t.projectId)]
);

export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  events: text("events").notNull().default("project.completed,invoice.paid,lead.created"),
  secret: text("secret").notNull().default(""),
  active: boolean("active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Update = typeof updates.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type PortfolioItem = typeof portfolio.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type MediaItem = typeof media.$inferSelect;
export type Automation = typeof automations.$inferSelect;
export type ActivityLog = typeof activity.$inferSelect;
export type Quota = typeof quotas.$inferSelect;
export type FrameAnnotation = typeof frameAnnotations.$inferSelect;
export type Deliverable = typeof deliverables.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
