-- PHASE 1: ROW LEVEL SECURITY & INDEXES

-- 1. Enable RLS on core tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 2. Enforce Tenant Isolation Policies
-- Owner, Manager, Agent can only access rows matching their tenant_id
-- We assume auth.jwt() -> current_user_tenant_id() exists in a real setup.
-- Example of RLS Policy enforcing Tenant ID strict bounds:
CREATE POLICY "Strict Tenant Isolation" ON leads
  FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

CREATE POLICY "Strict Tenant Isolation" ON deals
  FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- (Repeat for all tables...)

-- 3. High Performance Indexes Setup
CREATE INDEX idx_leads_tenant_status ON leads (tenant_id, status);
CREATE INDEX idx_deals_tenant_lead ON deals (tenant_id, lead_id);
CREATE INDEX idx_activities_tenant_lead ON activities (tenant_id, lead_id);
CREATE INDEX idx_properties_tenant_status ON properties (tenant_id, status);
CREATE INDEX idx_invoices_tenant_status ON invoices (tenant_id, status);

-- 4. Foreign Key Constraints & Cascade Deltes
ALTER TABLE deals 
  DROP CONSTRAINT IF EXISTS deals_lead_id_fkey,
  ADD CONSTRAINT deals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

ALTER TABLE activities 
  DROP CONSTRAINT IF EXISTS activities_lead_id_fkey,
  ADD CONSTRAINT activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

-- 5. Soft Delete Strategy additions
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_leads_tenant_not_deleted ON leads (tenant_id) WHERE is_deleted = FALSE;
