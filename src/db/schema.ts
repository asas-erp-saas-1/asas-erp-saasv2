import { pgTable, serial, text, varchar, timestamp, integer, boolean, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).default('user'),
  department: varchar("department", { length: 100 }),
  status: varchar("status", { length: 50 }).default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  timeIn: timestamp("time_in"),
  timeOut: timestamp("time_out"),
  status: varchar("status", { length: 50 }).notNull().default('present'), // present, absent, late, remote
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const performanceReviews = pgTable("performance_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reviewerId: integer("reviewer_id").references(() => users.id).notNull(),
  period: varchar("period", { length: 50 }).notNull(), // Q1 2026, Q2 2026
  score: numeric("score", { precision: 3, scale: 2 }), // 1.00 to 5.00
  status: varchar("status", { length: 50 }).notNull().default('pending'), // pending, completed
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  budget: numeric("budget", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 50 }).notNull().default('planning'), // planning, active, delayed, completed
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  managerId: integer("manager_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectTasks = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default('todo'), // todo, in_progress, done, blocked
  priority: varchar("priority", { length: 50 }).default('medium'),
  assigneeId: integer("assignee_id").references(() => users.id),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectRisks = pgTable("project_risks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  type: varchar("type", { length: 100 }), // Supply Chain, Weather, Compliance, Financial
  description: text("description").notNull(),
  severity: varchar("severity", { length: 50 }).notNull().default('medium'), // low, medium, high, critical
  status: varchar("status", { length: 50 }).notNull().default('monitoring'), // monitoring, active, mitigated
  delayImpact: varchar("delay_impact", { length: 100 }), // e.g. +14 jours
  reportedById: integer("reported_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 50 }),
  type: varchar("type", { length: 50 }).notNull().default('individual'), // individual, company
  companyName: varchar("company_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  source: varchar("source", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default('new'), // new, contacted, qualified, lost
  budgetMin: numeric("budget_min", { precision: 12, scale: 2 }),
  budgetMax: numeric("budget_max", { precision: 12, scale: 2 }),
  assignedAgent: integer("assigned_agent").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // apartment, villa, commercial, land
  status: varchar("status", { length: 50 }).notNull().default('available'), // available, reserved, sold
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  area: numeric("area", { precision: 10, scale: 2 }), // in sq meters
  location: varchar("location", { length: 255 }),
  specifications: jsonb("specifications"), // metadata like rooms, floors, etc.
  projectId: integer("project_id").references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 100 }).unique().notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  agentId: integer("agent_id").references(() => users.id),
  status: varchar("status", { length: 50 }).notNull().default('negotiation'), // negotiation, contract_sent, signed, completed, cancelled
  agreedPrice: numeric("agreed_price", { precision: 12, scale: 2 }).notNull(),
  dealType: varchar("deal_type", { length: 50 }).notNull().default('sale'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default('contractor'), // contractor, supplier, service
  rating: numeric("rating", { precision: 3, scale: 2 }), // 1.00 to 5.00
  status: varchar("status", { length: 50 }).notNull().default('active'), // active, inactive, blacklisted
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  specialty: varchar("specialty", { length: 100 }), // e.g. plumbing, electrical, concrete
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  department: varchar("department", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default('open'), // open, closed
  location: varchar("location", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobCandidates = pgTable("job_candidates", {
  id: serial("id").primaryKey(),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull().default('Nouveau'), // Nouveau, En entretien, Offre envoyée, Refusé
  score: numeric("score", { precision: 3, scale: 2 }), // 1.00 to 100.00
  resumeUrl: varchar("resume_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").references(() => deals.id).notNull(),
  reference: varchar("reference", { length: 100 }).unique().notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default('pending'), // pending, paid, overdue, cancelled
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  properties: many(properties),
  tasks: many(projectTasks),
  risks: many(projectRisks),
}));

export const propertiesRelations = relations(properties, ({ one }) => ({
  project: one(projects, {
    fields: [properties.projectId],
    references: [projects.id],
  }),
}));

export const projectRisksRelations = relations(projectRisks, ({ one }) => ({
  project: one(projects, {
    fields: [projectRisks.projectId],
    references: [projects.id],
  }),
}));
