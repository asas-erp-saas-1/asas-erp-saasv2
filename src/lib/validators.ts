import { z } from 'zod';

export const leadSchema = z.object({
  client_id: z.string().uuid('Client identifier is required'),
  project_id: z.string().uuid().optional().nullable(),
  source: z.string().min(2, 'Source is too short').max(50),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['new', 'contacted', 'interested', 'visit_scheduled', 'converted', 'lost']).default('new'),
});

export const clientSchema = z.object({
  full_name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().min(8, 'Invalid phone number').max(20).optional().nullable(),
  type: z.enum(['buyer', 'seller', 'tenant', 'investor']),
  nationality: z.string().optional().nullable(),
});

export const dealSchema = z.object({
  client_id: z.string().uuid(),
  property_id: z.string().uuid(),
  agreed_price: z.number().positive('Price must be positive'),
  closing_date: z.string().optional().nullable(),
  status: z.enum(['active', 'negotiation', 'closed', 'cancelled']).default('active'),
});

export const agencySchema = z.object({
  name: z.string().min(2, 'Agency name is required').max(100),
  slug: z.string().min(3, 'Slug is too short').max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name is required').max(100),
  role: z.enum(['admin', 'manager', 'agent']),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type DealInput = z.infer<typeof dealSchema>;
