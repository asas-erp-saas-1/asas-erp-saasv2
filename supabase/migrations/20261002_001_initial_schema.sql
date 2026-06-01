-- PHASE 4: DATA LAYER SYNCHRONIZATION & EVENT SYSTEM VALIDATION
-- STRICT MULTI-TENANT ISOLATION (RLS)
-- EVENT-SOURCING & TRACEABILITY
-- FINANCIAL PRECISION

BEGIN;

-------------------------------------------------------------------------------
-- 1. EXTENSIONS
-------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-------------------------------------------------------------------------------
-- 2. ENUM TYPES
-------------------------------------------------------------------------------
CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED');
CREATE TYPE deal_stage AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CONTRACT_PENDING', 'CLOSED_WON', 'CANCELLED');
CREATE TYPE unit_status AS ENUM ('AVAILABLE', 'LOCKED', 'RESERVED', 'VSP_SIGNED', 'SOLD');
CREATE TYPE agency_role AS ENUM ('CEO', 'SALES_MANAGER', 'SALES_AGENT', 'FINANCE_MANAGER', 'ACCOUNTANT', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'PROCUREMENT_OFFICER', 'LEGAL_OFFICER', 'HR_MANAGER', 'AGENT');

-------------------------------------------------------------------------------
-- 3. CORE ENTITIES
-------------------------------------------------------------------------------

CREATE TABLE public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(100),
    commercial_register VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.users_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role agency_role NOT NULL DEFAULT 'AGENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    status lead_status NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    unit_number VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    surface_area NUMERIC(10, 2),
    base_price NUMERIC(15, 2) NOT NULL,
    status unit_status NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users_roles(id) ON DELETE SET NULL,
    stage deal_stage NOT NULL DEFAULT 'DRAFT',
    agreed_price NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    contract_type VARCHAR(100) NOT NULL, -- e.g., VSP, ACTE_NOTARIE
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    notary_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-------------------------------------------------------------------------------
-- 4. EVENT BUS & AUDIT LOGS
-------------------------------------------------------------------------------
CREATE TABLE public.event_bus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    event_type VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_event_bus_agency ON public.event_bus(agency_id);
CREATE INDEX idx_event_bus_type ON public.event_bus(event_type);

-------------------------------------------------------------------------------
-- AUTOMATED TRIGGERS
-------------------------------------------------------------------------------
CREATE TRIGGER set_agencies_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_users_roles_updated_at BEFORE UPDATE ON public.users_roles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_installments_updated_at BEFORE UPDATE ON public.installments FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-------------------------------------------------------------------------------
-- 5. RLS (ROW LEVEL SECURITY) POLICIES STRICT MULTI-TENANT
-------------------------------------------------------------------------------
-- Helper function to get current user's agency_id
CREATE OR REPLACE FUNCTION auth.user_agency_id() RETURNS UUID AS $$
  SELECT agency_id FROM public.users_roles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_agencies ON public.agencies FOR ALL USING (id = auth.user_agency_id());

ALTER TABLE public.users_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_users_roles ON public.users_roles FOR ALL USING (agency_id = auth.user_agency_id());

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_clients ON public.clients FOR ALL USING (agency_id = auth.user_agency_id());

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_projects ON public.projects FOR ALL USING (agency_id = auth.user_agency_id());

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_units ON public.units FOR ALL USING (agency_id = auth.user_agency_id());

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_deals ON public.deals FOR ALL USING (agency_id = auth.user_agency_id());

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_contracts ON public.contracts FOR ALL USING (agency_id = auth.user_agency_id());

ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_installments ON public.installments FOR ALL USING (agency_id = auth.user_agency_id());

ALTER TABLE public.event_bus ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_event_bus ON public.event_bus FOR ALL USING (agency_id = auth.user_agency_id());

COMMIT;
