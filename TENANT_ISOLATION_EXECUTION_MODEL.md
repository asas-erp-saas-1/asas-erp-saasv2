# TENANT ISOLATION MODEL

## Overview
Tenant isolation is non-negotiable. ASAS ERP employs a defense-in-depth layout where boundary overlaps are mathematically impossible across 3 distinct zones of architecture.

## 1. Database Level (Deepest Guard)
Physical Row-Level Security (RLS) is applied natively at the PostgreSQL level.
If an attacker manages to execute SQL bypassing the Kernel, the `auth.jwt() -> 'app_metadata' ->> 'agency_id'` boundary blocks the read or write at the storage disk layer.

## 2. API / Kernel Level (Repository Guards)
The `TenantBoundaryEnforcer.ts` forces `.eq('agency_id', ctx.identity.tenantId)` on every repository query natively before DB execution.
This acts as a software guard, guaranteeing that RPC requests or complex Joins do not accidentally request data outside the domain.

## 3. Projection Workers & Event Bus Level
`outbox_events` physically tracks the `tenant_id` on every envelope.
When a worker rebuilds a Projection, it chunks by `tenant_id`. Projection updates are mapped sequentially based exclusively on the partitioned event stream belonging to that single tenant.

## Detection & Forensics
Any request failing RBAC or tenant isolation triggers a `[CRITICAL SECURITY EVENT]`. 
This immediately flags in Datadog Security Signals and logs the Trace ID and the user's explicit IP. If a single user trips more than 3 tenant-boundary alerts in a minute, the account is immediately deactivated and sessions dropped.
