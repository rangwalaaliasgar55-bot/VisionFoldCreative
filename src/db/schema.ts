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
    healthScore: integer("health_score").notNull().default(80),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: text("deleted_by").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex("clients_email_uq").on(t.email), index("clients_deleted_idx").on(t.deletedAt)]
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
    effortHours: integer("effort_hours").notNull().default(8),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: text("deleted_by").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("projects_client_idx").on(t.clientId), index("projects_status_idx").on(t.status), index("projects_deleted_idx").on(t.deletedAt)]
);
