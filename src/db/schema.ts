import { pgTable, serial, text, varchar, timestamp, integer, boolean, numeric, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).default('user'),
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
