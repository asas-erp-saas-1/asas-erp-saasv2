# ASAS RE-OS Implementation Blueprint

## 1. Database Schema (PostgreSQL)

```sql
-- ENUMS
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'agent', 'accountant', 'partner');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'visit_scheduled', 'offer_made', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE property_status AS ENUM ('available', 'reserved', 'sold', 'off_market');
CREATE TYPE deal_stage AS ENUM ('lead', 'negotiation', 'contract', 'closed');
CREATE TYPE transaction_type AS ENUM ('payment', 'commission', 'expense');

-- TABLE: tenants (Agencies)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: users (Extends Supabase Auth Auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: tenant_members (Maps users to tenants with roles)
CREATE TABLE tenant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'agent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_members_tenant_id ON tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user_id ON tenant_members(user_id);

-- TABLE: properties
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15, 2) NOT NULL,
    status property_status NOT NULL DEFAULT 'available',
    location VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_properties_tenant_id ON properties(tenant_id);

-- TABLE: leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    status lead_status NOT NULL DEFAULT 'new',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    budget DECIMAL(15, 2),
    source VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);

-- TABLE: deals
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount DECIMAL(15, 2) NOT NULL,
    stage deal_stage NOT NULL DEFAULT 'lead',
    probability INT CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_deals_tenant_id ON deals(tenant_id);

-- TABLE: transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    reference VARCHAR(255),
    logged_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_transactions_tenant_id ON transactions(tenant_id);

-- TABLE: audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(50) NOT NULL, -- e.g., 'lead', 'deal'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,      -- e.g., 'update', 'delete'
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 2. Row Level Security (RLS) Policies

```sql
-- HELPER FUNCTION: Get current user's tenant_id
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

-- HELPER FUNCTION: Get current user's role
CREATE OR REPLACE FUNCTION current_user_role() RETURNS user_role AS $$
  SELECT role FROM tenant_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;


-- ENABLE RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES: tenant_members
-- Users can see members of their own tenant
CREATE POLICY "View tenant members" ON tenant_members FOR SELECT USING (tenant_id = current_tenant_id());
-- Only owners/managers can add or update members
CREATE POLICY "Manage tenant members" ON tenant_members FOR ALL USING (
    tenant_id = current_tenant_id() AND current_user_role() IN ('owner', 'manager')
);

-- POLICIES: leads
-- Everyone in tenant can view leads
CREATE POLICY "View leads" ON leads FOR SELECT USING (tenant_id = current_tenant_id());
-- Agents update their own leads, Managers/Owners update any lead in tenant
CREATE POLICY "Update leads" ON leads FOR UPDATE USING (
    tenant_id = current_tenant_id() AND (
        assigned_to = auth.uid() OR current_user_role() IN ('owner', 'manager')
    )
);
-- Anyone can insert leads into their tenant
CREATE POLICY "Insert leads" ON leads FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
-- Only owners/managers can delete
CREATE POLICY "Delete leads" ON leads FOR DELETE USING (
    tenant_id = current_tenant_id() AND current_user_role() IN ('owner', 'manager')
);

-- POLICIES: properties & transactions follow similar structure...
CREATE POLICY "View properties" ON properties FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "Manage properties" ON properties FOR ALL USING (
    tenant_id = current_tenant_id() AND current_user_role() IN ('owner', 'manager', 'agent')
);
-- Accountants and owners can view/manage transactions
CREATE POLICY "Manage transactions" ON transactions FOR ALL USING (
    tenant_id = current_tenant_id() AND current_user_role() IN ('owner', 'manager', 'accountant')
);
```

## 3. API / Server Actions Design

```typescript
// app/actions/leads.ts
'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Input Validation via Zod
import { z } from 'zod';

const createLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(8), // Important for Algerian market
  source: z.string().optional()
});

export async function createLead(formData: FormData) {
  const supabase = createServerActionClient({ cookies });
  
  // 1. Get Session & Tenant
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  // tenant_id is handled securely by RLS on insert
  // but we can enforce it logically as well
  const { data: member } = await supabase
    .from('tenant_members')
    .select('tenant_id')
    .eq('user_id', session.user.id)
    .single();

  if (!member) throw new Error("No tenant associated");

  // 2. Validate Input
  const parsedData = createLeadSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: formData.get('phone'),
  });

  if (!parsedData.success) throw new Error("Validation Error");

  // 3. Database Operation
  const { error } = await supabase.from('leads').insert({
    tenant_id: member.tenant_id,
    first_name: parsedData.data.firstName,
    last_name: parsedData.data.lastName,
    phone: parsedData.data.phone,
    assigned_to: session.user.id, // Auto-assign to creator
  });

  if (error) {
    // Log detailed error separately, throw generic error
    console.error(error);
    throw new Error('Failed to create lead');
  }

  // 4. Cache Revalidation
  revalidatePath('/dashboard/leads');
}
```

## 4. Frontend Architecture (Next.js)

### Directory Structure
```
/app
  /(auth)
    /login
    /register
  /dashboard
    layout.tsx (Fetches user role & tenant context)
    page.tsx (Redirects to /overview)
    /overview (Analytics & Metrics)
    /leads
      page.tsx
      [id]/page.tsx (Lead Details)
    /deals (Kanban Board)
    /properties
    /finance
    /settings
/components
  /ui (shadcn components)
  /leads
    LeadCard.tsx
    LeadPipeline.tsx
/lib
  supabase.ts
  utils.ts
  validations.ts
```

### State Management & Caching
- **Server Components:** Used for data-heavy pages (e.g., Leads list). Rely on Next.js default caching.
- **Client Components:** Used for highly interactive features (e.g., Kanban boards, forms). Data is mutated via Server Actions (which call `revalidatePath` to update Server Components).

## 5. Business Logic Mapping

- **Lead Lifecycle:** Handled via custom triggers or cron jobs (Go workers). e.g. Automatically moving `new` leads to `stale` if no action within 48hr.
- **Sales Pipeline:** Handled in `/deals`. A Kanban UI built with `hello-pangea/dnd`. Dropping a deal into the `closed_won` column fires a `moveDealStage` Server Action.
- **Commission Logic:** When a deal marks `closed_won`, a Supabase trigger automatically fires to insert a corresponding `commission` row in `transactions` calculated based on the tenant's commission percentage settings.

## 6. Security Model & Edge Cases

- **Missing Tenant ID / Invalid Role:** Any queries executed by a user not in `tenant_members` will return 0 rows naturally because of RLS: `tenant_id = current_tenant_id()`.
- **Concurrent Updates:** Uses optimistic locking or strict `UPDATE` queries. 
- **Privilege Escalation:** Client SDK cannot modify roles. `tenant_members` requires `current_user_role() IN ('owner', 'manager')` to update. A user cannot change their own role unless they are an owner.

## 7. Known Risks & Improvements
- **RLS Performance:** RLS queries calling `current_tenant_id()` on every row can cause performance overhead. **Improvement:** Embed JWT claims for `tenant_id` upon authentication mapping so RLS checks `auth.jwt() ->> 'tenant_id'` instead of executing a `SELECT` on `tenant_members`.
- **Offline Reliability:** Algerian market relies heavily on offline/low-connectivity areas. **Improvement:** Implement PWA strategies and local caching mechanisms (Service Workers) to allow offline reading/updating of leads, attempting sync when back online.
