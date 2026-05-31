-- ASAS REAL ESTATE ERP v2.0 - KERNEL INITIAL SCHEMA
-- EVENT-DRIVEN, INBOX-CENTRIC, DDD ALIGNED
-- SUPABASE COMPATIBLE 

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
-- 2. FOUNDATION / ORGANIZATION DOMAIN
-------------------------------------------------------------------------------
CREATE TABLE public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    tax_id VARCHAR(100),
    commercial_register VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    city VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(100) NOT NULL DEFAULT 'AGENT', -- CEO, SALES_MANAGER, SALES_AGENT, FINANCE_MANAGER, ACCOUNTANT, PROJECT_MANAGER, SITE_ENGINEER, PROCUREMENT_OFFICER, LEGAL_OFFICER, HR_MANAGER
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'AGENT',
    token VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_in_team VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(team_id, profile_id)
);

-------------------------------------------------------------------------------
-- 3. PRODUCTIVITY SYSTEM
-------------------------------------------------------------------------------
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'medium',
    task_status VARCHAR(50) DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    associated_entity_type VARCHAR(100),
    associated_entity_id UUID,
    sla_escalation_marker_hours INTEGER DEFAULT 48,
    escalation_count INTEGER DEFAULT 0,
    escalated_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL, -- e.g. email, whatsapp, linkedin
    direction VARCHAR(50) NOT NULL, -- inbound, outbound
    participant_id UUID, -- Contact/Lead ID
    content TEXT,
    sentiment_score REAL,
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'dispatched',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    storage_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    lifecycle_state VARCHAR(50) DEFAULT 'uploaded',
    associated_entity_type VARCHAR(100),
    associated_entity_id UUID,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    hash_signature TEXT,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.sys_audit_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id VARCHAR(100),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    operation_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    request_ip VARCHAR(50),
    device_signature TEXT,
    is_anomaly BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-------------------------------------------------------------------------------
-- 4. ACCESS CONTROL AND RBAC
-------------------------------------------------------------------------------
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    scope_level VARCHAR(50) DEFAULT 'self',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(role_id, permission_id)
);

CREATE TABLE public.staff_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.emergency_override_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission_required VARCHAR(100) NOT NULL,
    justification TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category VARCHAR(100), -- MAINTENANCE, COMPLAINT, INQUIRY
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- SOCIAL_MEDIA, EMAIL, SMS, EVENTS, BILLBOARD
    budget NUMERIC(15, 2) DEFAULT 0,
    spent NUMERIC(15, 2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-------------------------------------------------------------------------------
-- 4. KERNEL: EVENT SOURCING
-------------------------------------------------------------------------------
CREATE TABLE public.system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    event_type VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_module VARCHAR(100) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_system_events_agency ON public.system_events(agency_id);
CREATE INDEX idx_system_events_aggregate ON public.system_events(aggregate_type, aggregate_id);
CREATE INDEX idx_system_events_type ON public.system_events(event_type);

-------------------------------------------------------------------------------
-- 4. KERNEL: EXECUTION INBOX
-------------------------------------------------------------------------------
CREATE TABLE public.execution_inbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    task_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ESCALATED')),
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role_target VARCHAR(100), 
    domain VARCHAR(100) NOT NULL,
    reference_aggregate_type VARCHAR(100) NOT NULL,
    reference_aggregate_id UUID NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    sla_breach_at TIMESTAMP WITH TIME ZONE,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_execution_inbox_assignee ON public.execution_inbox(assignee_id) WHERE status = 'PENDING';
CREATE INDEX idx_execution_inbox_role ON public.execution_inbox(role_target) WHERE status = 'PENDING';

-------------------------------------------------------------------------------
-- 5. KERNEL: APPROVAL ENGINE
-------------------------------------------------------------------------------
CREATE TABLE public.approval_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    target_type VARCHAR(100) NOT NULL,
    target_id UUID NOT NULL,
    domain VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED')),
    requested_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id UUID NOT NULL REFERENCES public.approval_chains(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    required_role VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED')),
    acted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    acted_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    UNIQUE(chain_id, step_order)
);

-------------------------------------------------------------------------------
-- 6. ASSET DOMAIN (PROMOTION IMMOBILIERE)
-------------------------------------------------------------------------------
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PLANNING' CHECK (status IN ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED')),
    budget NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.project_tranches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PLANNING' CHECK (status IN ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    tranche_id UUID REFERENCES public.project_tranches(id) ON DELETE SET NULL,
    unit_number VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('APARTMENT', 'VILLA', 'COMMERCIAL', 'OFFICE', 'PARKING')),
    surface_area NUMERIC(10, 2),
    floor_level INTEGER,
    base_price NUMERIC(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-------------------------------------------------------------------------------
-- 7. CRM DOMAIN
-------------------------------------------------------------------------------
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    identity_document_type VARCHAR(50),  -- e.g. CNI, PASSPORT
    identity_document_number VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED')),
    interest_type VARCHAR(50), -- VSP, VFA, AGENCY
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id),
    unit_id UUID REFERENCES public.units(id),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deal_type VARCHAR(50) NOT NULL CHECK (deal_type IN ('VSP', 'VFA', 'AGENCY_SALE', 'RENTAL')),
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CONTRACT_PENDING', 'CLOSED_WON', 'CANCELLED')),
    amount NUMERIC(15, 2) NOT NULL,
    discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
    agreed_price NUMERIC(15, 2) NOT NULL,
    payment_model VARCHAR(50) DEFAULT 'CASH' CHECK (payment_model IN ('CASH', 'INSTALLMENT', 'BANK_CREDIT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-------------------------------------------------------------------------------
-- 8. FINANCE DOMAIN
-------------------------------------------------------------------------------
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    tax_amount NUMERIC(15, 2) DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED')),
    issue_date DATE NOT NULL,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    reference VARCHAR(255),
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'DZD',
    payment_method VARCHAR(50) CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'CHECK')),
    status VARCHAR(50) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'PENDING_VERIFICATION', 'CLEARED', 'REJECTED', 'OVERDUE')),
    due_date TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PAID', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.treasury_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    amount NUMERIC(15, 2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    reference_id UUID, -- payment_id, po_id, etc.
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-------------------------------------------------------------------------------
-- 9. CONSTRUCTION & CHANTIER DOMAIN
-------------------------------------------------------------------------------
CREATE TABLE public.construction_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
    percentage_completion NUMERIC(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.site_daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.construction_milestones(id) ON DELETE SET NULL,
    log_date DATE NOT NULL,
    weather_conditions VARCHAR(100),
    workers_count INTEGER DEFAULT 0,
    progress_notes TEXT,
    issues_reported TEXT,
    logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-------------------------------------------------------------------------------
-- 10. PROCUREMENT & INVENTORY DOMAIN
-------------------------------------------------------------------------------
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    tax_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLACKLISTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, -- Can be tied to a project or general agency
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    estimated_amount NUMERIC(15, 2),
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ORDERED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_request_id UUID REFERENCES public.purchase_requests(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    total_amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'PARTIAL_DELIVERY', 'DELIVERED', 'CANCELLED')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, -- Items can be stocked on a specific site
    sku VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity_on_hand NUMERIC(15, 2) DEFAULT 0,
    unit_of_measure VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-------------------------------------------------------------------------------
-- 11. LEGAL DOMAIN
-------------------------------------------------------------------------------
CREATE TABLE public.legal_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    contract_type VARCHAR(100) NOT NULL, -- e.g., RESERVATION, VSP, ACTE_NOTARIE
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_NOTARY', 'SIGNED', 'CANCELED')),
    notary_name VARCHAR(255),
    notary_appointment_date TIMESTAMP WITH TIME ZONE,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-------------------------------------------------------------------------------
-- 12. HR DOMAIN
-------------------------------------------------------------------------------
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    nss VARCHAR(100), -- Numéro de Sécurité Sociale
    base_salary NUMERIC(15, 2),
    hire_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'TERMINATED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.employee_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.employee_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'OTHER')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    base_amount NUMERIC(15, 2) NOT NULL,
    bonuses NUMERIC(15, 2) DEFAULT 0,
    deductions NUMERIC(15, 2) DEFAULT 0,
    net_payable NUMERIC(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'PAID')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


-------------------------------------------------------------------------------
-- AUTOMATED TRIGGERS & RPCs
-------------------------------------------------------------------------------
-- Automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (NEW.id, split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1), split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2), 'CEO');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Secure RPC for Onboarding
CREATE OR REPLACE FUNCTION public.create_agency_and_link_owner(
  _agency_name TEXT,
  _agency_phone TEXT,
  _user_id UUID
) RETURNS UUID AS $$
DECLARE
  new_agency_id UUID;
BEGIN
  -- Insert the new agency
  INSERT INTO public.agencies (name, phone)
  VALUES (_agency_name, _agency_phone)
  RETURNING id INTO new_agency_id;

  -- Update the user's profile to link the new agency directly as owner/CEO
  UPDATE public.profiles
  SET agency_id = new_agency_id, role = 'CEO'
  WHERE id = _user_id;

  RETURN new_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.accept_invite(
  _token VARCHAR
) RETURNS UUID AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invite FROM public.invites WHERE token = _token AND status = 'PENDING';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite';
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET agency_id = v_invite.agency_id, role = v_invite.role
  WHERE id = v_user_id;

  -- Consume invite
  UPDATE public.invites
  SET status = 'ACCEPTED'
  WHERE id = v_invite.id;

  RETURN v_invite.agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_agencies_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_invites_updated_at BEFORE UPDATE ON public.invites FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_execution_inbox_updated_at BEFORE UPDATE ON public.execution_inbox FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_commissions_updated_at BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_construction_milestones_updated_at BEFORE UPDATE ON public.construction_milestones FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_purchase_requests_updated_at BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_legal_contracts_updated_at BEFORE UPDATE ON public.legal_contracts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_employee_attendance_updated_at BEFORE UPDATE ON public.employee_attendance FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_employee_leaves_updated_at BEFORE UPDATE ON public.employee_leaves FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_payroll_updated_at BEFORE UPDATE ON public.payroll FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-------------------------------------------------------------------------------
-- 13. RLS (ROW LEVEL SECURITY) POLICIES
-------------------------------------------------------------------------------
-- Helper function to get current user's agency_id
CREATE OR REPLACE FUNCTION auth.user_agency_id() RETURNS UUID AS $$
  SELECT agency_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Agencies
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_agencies ON public.agencies FOR ALL USING (id = auth.user_agency_id());

-- Branches
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_branches ON public.branches FOR ALL USING (agency_id = auth.user_agency_id());

-- Teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_teams ON public.teams FOR ALL USING (agency_id = auth.user_agency_id());

-- Team Members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_team_members ON public.team_members FOR ALL USING (
  team_id IN (SELECT id FROM public.teams WHERE agency_id = auth.user_agency_id())
);

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_profiles ON public.profiles FOR ALL USING (agency_id = auth.user_agency_id());

-- Deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_deals ON public.deals FOR ALL USING (agency_id = auth.user_agency_id());

-- Clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_clients ON public.clients FOR ALL USING (agency_id = auth.user_agency_id());

-- Leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_leads ON public.leads FOR ALL USING (agency_id = auth.user_agency_id());

-- Invites
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_invites ON public.invites FOR ALL USING (agency_id = auth.user_agency_id());

-- Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_projects ON public.projects FOR ALL USING (agency_id = auth.user_agency_id());

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_tasks ON public.tasks FOR ALL USING (agency_id = auth.user_agency_id());

-- Activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_activities ON public.activities FOR ALL USING (agency_id = auth.user_agency_id());

-- Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_documents ON public.documents FOR ALL USING (agency_id = auth.user_agency_id());

-- Sys Audit Vault
ALTER TABLE public.sys_audit_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_sys_audit_vault ON public.sys_audit_vault FOR ALL USING (agency_id = auth.user_agency_id());

-- System Events
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_system_events ON public.system_events FOR ALL USING (agency_id = auth.user_agency_id());

-- Execution Inbox
ALTER TABLE public.execution_inbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_execution_inbox ON public.execution_inbox FOR ALL USING (agency_id = auth.user_agency_id());

-- Approval Chains
ALTER TABLE public.approval_chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_approval_chains ON public.approval_chains FOR ALL USING (agency_id = auth.user_agency_id());

-- Approval Steps
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_approval_steps ON public.approval_steps FOR ALL USING (
  chain_id IN (SELECT id FROM public.approval_chains WHERE agency_id = auth.user_agency_id())
);

COMMIT;
