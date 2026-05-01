# ASAS RE-OS Core Execution Kernel Blueprint

## 🧠 Core Mission
The system has been refactored to use a **Kernel-Only Execution Model**. All direct database access, raw Supabase client usage, and loose identity resolutions are strictly forbidden. The Kernel acts as the singular, impenetrable boundary between the application space (Services) and the Data Layer.

---

## 1. Kernel Architecture Design
The Kernel is designed as an internal operating system for data fetching, identity, and mutation.

### Core Modules
- **Identity Engine:** Resolves and cryptographically verifies the current actor.
- **Query Firewall:** Intercepts, sanitizes, and enforces tenant isolation on all requests.
- **Transaction Engine:** Ensures ACID properties for multi-step mutations (e.g., finance, commissions).
- **Audit Injector:** Wraps mutations with synchronous logging.

```text
Request (Server Action / API)
  ↓
Service Layer (e.g., LeadService)
  ↓
kernel.identity() -> Extracts & Locks KernelIdentity
  ↓
kernel.query() / kernel.mutate()
  ↓
Query Firewall -> Validates Role, Injects tenant_id, Blocks forbidden tables
  ↓
Data Execution (via hardened Supabase/PostgreSQL client)
  ↓
Service Layer -> Response
```

---

## 2. Kernel API Specification

The exposed kernel interface (`/src/kernel/core.ts`):

```typescript
type KernelIdentity = {
  userId: string;
  tenantId: string;
  role: 'owner' | 'manager' | 'agent' | 'accountant';
  sessionId: string;
  deviceId: string;
};

type QueryOptions = {
  select?: string;
  filters?: Record<string, any>;
  limit?: number;
  orderBy?: { column: string; ascending?: boolean };
};

export const kernel = {
  /**
   * Resolves and locks the identity for the current request context.
   * Throws immediately if unauthenticated or missing tenant mapping.
   */
  identity: async (): Promise<KernelIdentity> => { /* ... */ },

  /**
   * Securely queries a whitelisted table.
   */
  query: async <T>(tableName: string, options?: QueryOptions): Promise<T[]> => { /* ... */ },

  /**
   * Mutates data with automatic audit logging and tenant injection.
   */
  mutate: async <T>(
    tableName: string, 
    action: 'INSERT' | 'UPDATE' | 'DELETE', 
    data: any, 
    match?: Record<string, any>
  ): Promise<T> => { /* ... */ },

  /**
   * Executes a block of mutations atomically.
   */
  transaction: async <T>(
    callback: (txKernel: Omit<typeof kernel, 'transaction'>) => Promise<T>
  ): Promise<T> => { /* ... */ }
};
```

---

## 3. Query Firewall Design

The Firewall acts as an Anti-Bypass System. It sits inside `kernel.query` and `kernel.mutate`.

### Enforcement Rules:
1. **Schema Whitelist:** Only specific tables can be queried based on the role.
   - *Example:* An `agent` calling `kernel.query('transactions')` forcibly throws `SecurityError: Unauthorized table access`.
2. **Automatic Tenant Injection:** Every query's `filters` object is automatically appended with `{ tenant_id: identity.tenantId }`. It is impossible to query without it.
3. **Implicit Ownership:** For tables like `leads`, if the role is `agent`, the firewall automatically injects `{ assigned_to: identity.userId }` unless explicitly overridden by a manager role.

```typescript
// Inside kernel.query implementation:
const identity = await kernel.identity();
if (!FIREWALL_RULES[identity.role].canRead(tableName)) {
  throw new Error("Kernel Firewall: Access Denied");
}

const safeFilters = {
  ...options.filters,
  tenant_id: identity.tenantId // Hard-injected, cannot be overridden
};
```

---

## 4. Identity Engine (Hard Bound System)

We move away from manually decoding JWTs in services.

```typescript
import { cache } from 'react';
import { cookies, headers } from 'next/headers';

// React cache ensures this is only computed once per request
export const getIdentity = cache(async (): Promise<KernelIdentity> => {
  const token = cookies().get('sb-access-token')?.value;
  if (!token) throw new SecurityError("Missing Authentication");

  // Verify and extract tightly controlled KernelIdentity
  const payload = await verifyAndDecode(token);
  
  if (!payload.tenantId || !payload.role) {
    throw new SecurityError("Corrupt Identity Context");
  }

  return {
    userId: payload.sub,
    tenantId: payload.tenantId,
    role: payload.role,
    sessionId: payload.session_id,
    deviceId: headers().get('x-device-id') || 'unknown'
  };
});
```

---

## 5. Transaction System Design (Atomicity)

Since standard Supabase REST APIs lack multi-statement transactions, the Kernel employs a secure PostgreSQL RPC mechanism or direct Postgres Client (e.g., `postgres.js` or `pg`) specifically for the Kernel.

When `kernel.transaction()` is called:
1. A single database connection is leased.
2. `BEGIN` is issued.
3. Identity context is set: `SET LOCAL request.jwt.claims = '{"sub": "...", "app_metadata": { "tenant_id": "..." }}';`
4. The callback executes multiple `txKernel.mutate()` operations.
5. If any operation throws, `ROLLBACK` is issued.
6. Otherwise, `COMMIT`.

---

## 6. Migration Plan

*   **Phase 1: Implementation & Isolation**
    *   Build the `/src/kernel` module strictly.
    *   Configure ESLint `no-restricted-imports` to globally ban `import { createClient } from '@supabase/supabase-js'` and `@supabase/ssr` anywhere outside `/src/kernel`.
*   **Phase 2: Service Layer Refactor**
    *   Rewrite `LeadService`, `DealService` to use `kernel.query`/`kernel.mutate`.
*   **Phase 3: Deletion of Legacy Paths**
    *   Remove all `withAuth` wrappers from the Next.js API/Server Actions, as the Kernel now implicitly handles identity at the execution step.

---

## 7. Risk Analysis (What can still bypass system)

1. **Rogue RPC Functions:** If a developer creates a Postgres function (`CREATE FUNCTION bypass_logic()`) that has `SECURITY DEFINER` and doesn't check `current_tenant_id()`.
   * *Mitigation:* Routine SQL migration reviews. No `SECURITY DEFINER` functions allowed without architect approval.
2. **Server Action Leakage:** If a Server Action passes entire Kernel objects to the client.
   * *Mitigation:* Next.js `server-only` pattern enforced. Data mapping (DTOs) strictly return sanitized data.
3. **Third-Party Integration:** Using a library that queries the database directly outside the Kernel.
   * *Mitigation:* Deny direct DB credentials (`DATABASE_URL`) from the environment except for the Kernel.

---

## 8. Performance Strategy for Kernel Overhead

Adding a Kernel layer introduces logical overhead. To optimize:
*   **Identity Memoization:** `kernel.identity()` uses React's `cache()` so it evaluates only once per lifecycle, costing 0ms on subsequent calls.
*   **AST Compilation:** The Query Firewall translates `options.filters` to Supabase chain-calls in `O(1)` time without deep evaluation.
*   **Connection Pooling:** The Kernel utilizes Supavisor for Postgres to handle up to 10,000 concurrent edge executions globally.
*   **Edge-Ready:** The Kernel has zero Node.js native dependencies, making it 100% compatible with Next.js Edge Runtime and Cloudflare Workers.
