# AUDIT: RUNTIME VIOLATIONS

## 1. Direct Supabase Client Usage (Bypassing Kernel)
### Files:
- `src/app/api/cron/leads/stale/route.ts` - Uses raw supabase service role and operates outside Kernel supervision.
- `src/app/dashboard/settings/SecurityPanel.tsx` - Uses `@supabase/ssr` directly for MFA workflows.
- `src/app/login/page.tsx` - Uses client-side `@supabase/ssr` creation and executes auth directly.
- `src/app/auth/signout/route.ts` - Instantiates server client directly.
- `src/lib/realtime/realtime.ts` - Directly imports `@supabase/supabase-js` and uses the service role key, breaking multi-tenant enforcement.

**Severity**: CRITICAL. Direct Supabase initialization fragments connections, leaks connection tracking, breaks observability, and circumvents the global ContextHydrator & RBAC enforcement.

## 2. Controller/Service Business Logic (Mutation Leaks)
### Files:
- `src/services/deals/deal.service.ts` 
  - `changeDealStatus`: Takes `status` and applies a blind `UPDATE` through the kernel without evaluating State Machine pure invariants or emitting an Outbox event.
  - CRUD-oriented mutation (`INSERT`, `UPDATE`), violating CQRS/DDD principles.
  - `registerPayment`: Performs sequential inserts via a `kernel.transaction` but lacks idempotency locks and does not ensure absolute version alignment.
- `src/services/leads/lead.service.ts`
  - Same issues as Deal Service; standard CRUD `UPDATE` instead of Command execution.

**Severity**: CRITICAL. State is updated iteratively in application servers. Pure domain state machines do not exist.

## 3. Optimistic Locking Failures
### Files:
- `src/services/deals/deal.service.ts`
  - Passes `version: currentVersion + 1` into the update payload but does NOT execute a conditional `where version = currentVersion`. Does NOT lock rows (`FOR UPDATE`). 

**Severity**: HIGH. Concurrency modifications can silent-fail and overwrite each other (lost updates).

## 4. Missing Tenant Isolation (Global Scope Leakage)
### Files:
- `src/app/api/cron/leads/stale/route.ts` bypasses tenant constraints altogether.
- `kernel.mutate` implementations automatically shove `agency_id: identity.tenantId` for create operations, but update operations use bare `kernel.mutate('deals', 'UPDATE', { status }, { id })` without inherently enforcing `where tenant_id = currentTenant`.

**Severity**: CRITICAL. Any malicious payload targeting another agency's Deal ID could succeed if the update query does not explicitly append the tenant bounding.

## 5. Dangerous Async Operations & Side-Effects
### Files:
- `src/actions/*` files (e.g., `dealActions.ts`) call `DealService` to update the DB and then arbitrarily call `revalidatePath()`. Side-effects are coupled to the synchronous HTTP lifecycle.
- There is no central Outbox generation appended atomically alongside mutations. Events are either non-existent or handled out-of-band.

**Severity**: HIGH. Process crashes immediately post-commit will result in lost events and corrupt UI state.

## 6. Monorepo & Domain Leakage
### Architecture:
- Absolute lack of monorepo separation. Domain models, infrastructure, React UI, and DB queries all live inside `/src/*`.
- UI files import DB-level types (`import { Database } from '@/types/supabase'`).

**Severity**: HIGH. Bounding contexts are completely non-existent in the physical architecture.
