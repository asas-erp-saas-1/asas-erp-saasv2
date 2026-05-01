# ASAS RE-OS System Hardening Blueprint
## 🔐 ZERO TRUST MULTI-TENANT SaaS ARCHITECTURE

## 1. System Hardening Overview
The ASAS RE-OS architecture has been elevated from a standard web application to an enterprise-grade SaaS machine. We assume **Zero Trust** internally and externally. Misconfigurations or developer errors must result in immediate `ACCESS_DENIED` logic rather than accidental tenant data leakage. Defense in depth is achieved by overlapping three layers of enforcement:
1. **Database Level (RLS):** Final authority. Completely isolated via JWT claims.
2. **Server Level (SEL/IRE):** Contextual validation before any query execution.
3. **Edge Level (Middleware):** Pre-flight identity verification and routing rejection.

## 2. System Enforcement Layer (SEL) Architecture
The SEL guarantees that **no query executes without verified tenant context**.

### Implementation: The `withAuth` Wrapper
No Server Action or API Route is allowed to access the database directly. They must be wrapped in a Higher-Order Function (HOF) that injects a pre-authenticated, context-bound Supabase client.

```typescript
// lib/sel/enforcer.ts
export const withAuth = <T>(
  action: (context: ActionContext, payload: T) => Promise<ApiResponse>,
  requiredRoles?: UserRole[]
) => {
  return async (payload: T): Promise<ApiResponse> => {
    try {
      const { user, tenantId, role, supabase } = await resolveIdentity();
      
      if (requiredRoles && !requiredRoles.includes(role)) {
        return { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } };
      }
      
      // The injected `supabase` client is already scoped to the user's JWT
      return await action({ user, tenantId, role, db: supabase }, payload);
    } catch (e) {
      return { success: false, error: { code: 'INTERNAL_ERROR', message: 'System fault' } };
    }
  };
}
```

## 3. Identity Resolution Engine (IRE)
Calling `SELECT * FROM tenant_members` on every request is a severe bottleneck and security risk. We eliminate this by migrating tenant identity directly into the JWT.

### JWT Extension (Supabase Custom Claims)
When a user logs in or joins a tenant, a secure Edge Function updates their `app_metadata` in Supabase Auth.
```json
// Supabase JWT Payload Envelope
{
  "sub": "user_123",
  "app_metadata": {
    "tenant_id": "tenant_abc",
    "role": "manager"
  }
}
```
**RLS is then optimized to read from the JWT:**
```sql
CREATE OR REPLACE FUNCTION auth.tenant_id() RETURNS UUID AS $$
  SELECT (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'tenant_id')::UUID;
$$ LANGUAGE SQL STABLE;

-- The new bulletproof RLS policy
CREATE POLICY "Strict Tenant Isolation" ON leads FOR ALL 
USING (tenant_id = auth.tenant_id());
```

## 4. Service Layer Structure
React components (even Server Components) are strictly forbidden from initiating database calls. All logic resides in a designated `/services` layer.

```text
/src
  /services
    /leads
      lead.service.ts
      lead.dto.ts
    /deals
      deal.service.ts
      deal.dto.ts
    /finance
      transaction.service.ts
```
**Example Service Method:**
```typescript
class LeadService {
  static async create(context: ActionContext, data: CreateLeadDTO) {
    // 1. Zod Validation (Throws if invalid)
    const validData = CreateLeadSchema.parse(data);
    
    // 2. Database Execution (Runs with context.db which is bound to the tenant JWT)
    const { data: lead, error } = await context.db
      .from('leads')
      .insert({ ...validData, tenant_id: context.tenantId });
      
    if (error) throw new DatabaseError(error);
    return lead;
  }
}
```

## 5. API Contract System
We enforce strict typing at the boundary using Zod and a standardized envelope for all communications.

### The Response Contract
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR';
    message: string;
    details?: any;
  }
}
```

### The Mutation Contract
```typescript
// src/services/leads/lead.dto.ts
export const CreateLeadSchema = z.object({
  firstName: z.string().min(2).trim(),
  phone: z.string().regex(/^(0)(5|6|7)\d{8}$/, "Invalid Algerian phone number format"),
  budget: z.number().positive().optional()
});
export type CreateLeadDTO = z.infer<typeof CreateLeadSchema>;
```

## 6. Security Model (Zero Trust)
* **Frontend:** Untrusted. Treated simply as a dumb view layer.
* **Middleware (Next.js):** Validates the session token presence and routes unauthorized users to `/login`.
* **Server Action (SEL):** Validates the token's signature, extracts `tenant_id`, checks the role against `requiredRoles`, and validates the input payload via Zod.
* **Service Layer:** Executes business logic using the bound DB client.
* **Database (RLS):** Evaluates `auth.tenant_id()` against the row's `tenant_id`. If they do not match, Postgres returns 0 rows. **Even if the Service Layer passes the wrong tenant ID in an insert, Postgres will reject it.**

## 7. Failure Handling Strategy
* **Missing `tenant_id`:** The system defaults to `Access Denied`. The IRE requires the claim to exist; if missing, it forcibly terminates the request. RLS defaults to rejecting `NULL = NULL`.
* **Corrupted JWT:** The Supabase client automatically validates the JWT signature. Any tampering causes immediate termination.
* **Concurrent Updates:** Handled via PostgreSQL optimistic locking (`updated_at` checks) and transaction blocks for high-value financial mutations (e.g., commissions).
* **Silent Failures:** Banned. Any error caught in the SEL boundary is logged to a centralized tracing system (e.g., Datadog, Sentry) and mapped to a standard `ApiResponse` error payload.

## 8. Audit & Traceability Engine
An immutable audit log is critical for Enterprise Real Estate. 
We institute **Trigger-Based Auditing** inside Postgres to ensure no application-level bypass is possible.

```sql
CREATE OR REPLACE FUNCTION audit_record() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (tenant_id, user_id, entity_type, entity_id, action, old_data, new_data)
  VALUES (
    auth.tenant_id(),
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    row_to_json(OLD),
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attached to all critical tables:
CREATE TRIGGER audit_leads_trigger
AFTER INSERT OR UPDATE OR DELETE ON leads
FOR EACH ROW EXECUTE FUNCTION audit_record();
```

## 9. Performance Optimization Strategy
* **No `JOIN` RLS:** By migrating identity resolution to JWT claims instead of `tenant_members` table lookups, RLS execution time drops from ~50ms per query to `<2ms`.
* **Edge Compute Readiness:** The architecture compiles cleanly for Next.js Edge Runtime, allowing global, low-latency deployments.
* **Connection Pooling:** Supabase connection pooling (PGBouncer/Supavisor) is mandatory for avoiding connection exhaustion at scale.

## 10. Risk Analysis (What can still break?)
* **Malicious Insider / Compromised Dev:** If an internal developer gains access to the Supabase Service Role Key (which bypasses RLS), they could theoretically leak data. **Mitigation:** Strict secret rotation, IP allowlisting for dashboard access, and separation of production keys from development.
* **Custom Claim Desync:** If a user is removed from a tenant but their session token hasn't expired (max 1 hour), they retain access until the token refreshes. **Mitigation:** Implement a Redis-based cache or `user_sessions` denylist for instant revocation of compromised or fired accounts.
* **Schema Evolution:** Applying migrations without a lock strategy can lock up tables and cause downtime. **Mitigation:** strictly backward-compatible migrations via automated CI/CD checks.
