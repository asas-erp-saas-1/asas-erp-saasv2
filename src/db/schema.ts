import { pgTable, serial, text, varchar, timestamp, integer, boolean, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  plan: varchar("plan", { length: 50 }).default('enterprise'),
  status: varchar("status", { length: 50 }).default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: varchar("name", { length: 100 }).notNull(),
  permissions: jsonb("permissions").notNull().default([]), // e.g. ["deals:read", "deals:write"]
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  roleId: integer("role_id").references(() => roles.id),
  role: varchar("role", { length: 50 }).default('user'), // legacy
  department: varchar("department", { length: 100 }),
  status: varchar("status", { length: 50 }).default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
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
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
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
  organizationId: integer("organization_id").references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  budget: numeric("budget", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 50 }).notNull().default('planning'), // planning, active, delayed, completed
  progress: numeric("progress", { precision: 5, scale: 2 }).default('0'), // Overall completion %
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  managerId: integer("manager_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectPhases = pgTable("project_phases", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g. "Fondations", "Gros Œuvres"
  billingPercentage: numeric("billing_percentage", { precision: 5, scale: 2 }).notNull(), // e.g. 20 for 20% of sale price
  constructionPercentage: numeric("construction_percentage", { precision: 5, scale: 2 }).notNull().default('0'),
  status: varchar("status", { length: 50 }).notNull().default('pending'), // pending, active, completed
  startDate: timestamp("start_date"),
  completionDate: timestamp("completion_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectTasks = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  phaseId: integer("phase_id").references(() => projectPhases.id),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default('todo'), // todo, in_progress, done, blocked
  priority: varchar("priority", { length: 50 }).default('medium'),
  assigneeId: integer("assignee_id").references(() => users.id),
  vendorId: integer("vendor_id").references(() => vendors.id), // For subcontractors
  cost: numeric("cost", { precision: 12, scale: 2 }),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectRisks = pgTable("project_risks", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
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
  organizationId: integer("organization_id").references(() => organizations.id),
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
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
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
  organizationId: integer("organization_id").references(() => organizations.id),
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
  organizationId: integer("organization_id").references(() => organizations.id),
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
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
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
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
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
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
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
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
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
  phases: many(projectPhases),
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

export const projectPhasesRelations = relations(projectPhases, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectPhases.projectId],
    references: [projects.id],
  }),
  tasks: many(projectTasks),
}));

export const projectTasksRelations = relations(projectTasks, ({ one }) => ({
  project: one(projects, {
    fields: [projectTasks.projectId],
    references: [projects.id],
  }),
  phase: one(projectPhases, {
    fields: [projectTasks.phaseId],
    references: [projectPhases.id],
  }),
  vendor: one(vendors, {
    fields: [projectTasks.vendorId],
    references: [vendors.id],
  }),
}));

// --- ENTERPRISE KERNEL TABLES ---

export const systemEvents = pgTable("system_events", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  aggregateId: varchar("aggregate_id", { length: 100 }).notNull(),
  aggregateType: varchar("aggregate_type", { length: 100 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payload: jsonb("payload").notNull(),
  version: integer("version").notNull(),
  actorId: integer("actor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const executionInbox = pgTable("execution_inbox", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sourceEventId: integer("source_event_id").references(() => systemEvents.id),
  taskType: varchar("task_type", { length: 100 }).notNull(), // e.g., 'approve_deal', 'contact_lead'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default('pending'), // pending, completed, cancelled
  dueDate: timestamp("due_date"),
  contextData: jsonb("context_data"), // e.g. { dealId: 123 }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  completedBy: integer("completed_by").references(() => users.id),
});

export const approvalRequests = pgTable("approval_requests", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // e.g., 'deal_discount', 'payment_validation'
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default('pending'), // pending, approved, rejected
  reason: text("reason"),
  approverId: integer("approver_id").references(() => users.id),
  decisionNotes: text("decision_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const ledgerAccounts = pgTable("ledger_accounts", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  code: varchar("code", { length: 50 }).notNull(), // e.g., '1010' for Cash
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // asset, liability, equity, revenue, expense
  status: varchar("status", { length: 50 }).notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  ledgerAccountId: integer("ledger_account_id").references(() => ledgerAccounts.id).notNull(),
  transactionId: varchar("transaction_id", { length: 100 }).notNull(), // to group debit and credit parts together
  dealId: integer("deal_id").references(() => deals.id), // optional physical link
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  entryType: varchar("entry_type", { length: 10 }).notNull(), // debit or credit
  description: text("description"),
  actorId: integer("actor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- ENTERPRISE DOCUMENT ENGINE ---

export const documentTemplates = pgTable("document_templates", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'contract', 'invoice', 'receipt'
  body: text("body").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  templateId: integer("template_id").references(() => documentTemplates.id),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // e.g. 'deal', 'client', 'project'
  entityId: integer("entity_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).default('Autre'),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 100 }),
  fileSize: integer("file_size"),
  version: integer("version").default(1),
  status: varchar("status", { length: 50 }).default('active'),
  uploadedBy: varchar("uploaded_by", { length: 50 }).default('Agent'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const signatures = pgTable("signatures", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  contactId: integer("contact_id").references(() => clients.id).notNull(),
  status: varchar("status", { length: 50 }).default('pending'), // pending, signed, declined
  signedAt: timestamp("signed_at"),
  ipAddress: varchar("ip_address", { length: 45 }),
  signatureData: jsonb("signature_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

