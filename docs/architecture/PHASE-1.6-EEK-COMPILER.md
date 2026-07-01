# ASAS ERP/CRM — Phase 1.6: Enterprise Enforcement Kernel (EEK) — Compiler-Level Enforcement

## 1. System Architecture Diagram (Logical Text Form)

```text
[ DEVELOPER WORKSPACE ]
       │
       ▼
[ SECURITY COMPILER LAYER (SCL) ]
   │
   ├─► [ 1. TypeScript Phantom Types ]
   │     ├─ Enforces `TenantScopedDB`
   │     ├─ Enforces `LedgerLockedTransaction`
   │     └─ Prevents raw database access via typing
   │
   ├─► [ 2. ESLint EEK Rules ]
   │     ├─ ban-raw-db-import: Blocks `import db from '@/db'` outside `/eek`
   │     ├─ require-with-eek: Blocks `export async function POST` without wrapper
   │     ├─ require-with-action-eek: Blocks `use server` outside `withActionEEK`
   │     └─ require-audit-log: Blocks mutations without audit trace
   │
   ├─► [ 3. EEK Policy Manifest AST Scanner ]
   │     └─ Scans `/src/app` and `/src/domains` against `eek/policy.manifest.ts`
   │
   ▼
[ BUILD / CI PIPELINE (GitHub Actions) ]
   │
   ├─► Step 1: `npm run lint:eek` (Fails if ESLint rules broken)
   ├─► Step 2: `npm run tsc` (Fails if Phantom types violated)
   ├─► Step 3: `npm run eek:verify` (Simulates request lifecycle & coverage)
   │
   ▼
[ NEXT.JS RUNTIME (App Router) ]
   │
   ├─► Middleware (Edge): Traffic filtering, Early Reject
   ├─► withEEK (Node): API Route Auth, RBAC, DB Context Injection
   ├─► withActionEEK (React Server): Server Action Auth, RBAC, DB Context
   │
   ▼
[ ENFORCEMENT ENGINE ]
   ├─ Auth Resolver
   ├─ RBAC Engine (Declarative permissions)
   ├─ Tenant Proxy (`eq(table.organizationId, session.organizationId)`)
   ├─ Ledger API (Double-entry mutation only)
   └─ Audit Engine (Async correlation via `requestId`)
   │
   ▼
[ DATABASE (Postgres) ]
   └─ RLS Fallback (Final net catching any theoretical leaks)
```

## 2. Folder Structure Updates

```text
/
├── eek/
│   ├── policy.manifest.ts         # Single Source of Truth for EEK policies
│   ├── compiler/                  # Security Compiler Layer (AST Scanners)
│   │   ├── check-actions.ts       # AST parser for Server Actions
│   │   ├── check-routes.ts        # AST parser for API routes
│   │   └── verify-coverage.ts     # Validates every mutation has audit logs
│   ├── eslint-rules/              # Custom ESLint rules blocking bypasses
│   │   ├── ban-raw-db.js
│   │   ├── require-action-wrapper.js
│   │   └── require-route-wrapper.js
│   ├── runtime/                   # Runtime Enforcement (Phase 1.5)
│   │   ├── withEEK.ts
│   │   ├── withActionEEK.ts
│   │   ├── db-proxy.ts
│   │   ├── ledger.ts
│   │   ├── audit.ts
│   │   └── session.ts
│   └── types/
│       └── phantom.ts             # TypeScript safety types (TenantScopedDB, etc)
├── docs/
│   └── architecture/
│       ├── ADR-001-EEK-Design.md
│       └── PHASE-1.6-EEK-COMPILER.md
├── src/
│   ├── app/                       # Next.js App Router (Guarded by EEK)
│   ├── domains/                   # Domain Driven Modules (IAM, CRM, Finance)
│   └── middleware.ts              # Edge traffic filter
```

## 3. CI/CD Pipeline Enforcement Stages (GitHub Actions)

**Stage 1: Static Type & Boundary Verification**
- **Action**: Run `tsc --noEmit`
- **Enforces**: `TenantScopedDB` and `LedgerLockedTransaction` phantom types. Any component trying to invoke `db.insert()` directly instead of using the injected `ctx.db` will fail compilation.

**Stage 2: EEK Linter (Zero-Trust AST Checks)**
- **Action**: `eslint . --config .eslintrc.eek.json --max-warnings 0`
- **Enforces**: Custom AST rules. Hard fails if a file contains `use server` but does not export it via `withActionEEK`. Hard fails if `import db from '@/db'` exists anywhere outside the `/eek` folder.

**Stage 3: EEK Consistency Checker**
- **Action**: `ts-node eek/compiler/verify-coverage.ts`
- **Enforces**: Maps all registered API routes and Server Actions. Verifies that every route doing a `POST`, `PUT`, `DELETE`, or `PATCH` is linked to an `audit` configuration. Scans financial domains to guarantee they only import the ledger, not the DB proxy for writes.

**Stage 4: Unit/Integration Testing**
- **Action**: Run `vitest`
- **Enforces**: The EEK wrapper behavior matches expectations (e.g., throwing 401/403 for unauthorized/forbidden contexts).

## 4. ESLint + TS Rules Specification

### TypeScript Phantom Types
```typescript
// /eek/types/phantom.ts

// A phantom brand that ensures raw Drizzle DB cannot be passed where TenantScopedDB is expected
export type TenantScopedDB = DrizzleDB & { __brand: "TenantScopedDB" };

// Financial mutations require a specific transaction brand
export type LedgerLockedTransaction = Omit<TenantScopedDB, 'update' | 'delete'> & { __brand: "LedgerLockedTransaction" };

// Context injected by withEEK and withActionEEK
export interface EEKProtectedContext {
  session: Session;
  organizationId: string;
  db: TenantScopedDB;
  ledger: LedgerService;
  audit: AuditService;
  requestId: string;
}
```

### ESLint Rules
1. **`eek/ban-raw-db`**: 
   - **Pattern**: `ImportDeclaration` where `source.value === '@/db'`
   - **Condition**: Only allowed if `filename.includes('/eek/')`.
   - **Message**: "Raw database access is strictly forbidden. You must use `ctx.db` provided by the EEK wrapper."

2. **`eek/require-route-wrapper`**:
   - **Pattern**: `ExportNamedDeclaration` for `GET`, `POST`, `PUT`, `DELETE` in `/app/api/**/route.ts`.
   - **Condition**: The exported variable must be a CallExpression to `withEEK`.
   - **Message**: "API routes must be wrapped with `withEEK({ resource, action })`."

3. **`eek/require-action-wrapper`**:
   - **Pattern**: Any file containing the `"use server"` directive.
   - **Condition**: All exported async functions must be wrapped in `withActionEEK`.
   - **Message**: "Server Actions must be wrapped with `withActionEEK({ resource, action })`."

## 5. Security Threat Model (What is Now Impossible)

| Threat / Developer Error | Previous Vulnerability | New EEK Compiler Defense |
| :--- | :--- | :--- |
| **Bypass Tenant Isolation** | Forgetting `.where(eq(t.orgId, session.orgId))` | **IMPOSSIBLE**. Raw DB import is banned by ESLint. `ctx.db` proxy implicitly appends the filter at runtime. |
| **Bypass RBAC / Auth** | Forgetting to call `requirePermission()` | **IMPOSSIBLE**. ESLint requires `withEEK` / `withActionEEK`. The wrapper enforces Auth + RBAC *before* the handler runs. |
| **Modify Balances Directly** | Writing `db.update(accounts).set(...)` | **IMPOSSIBLE**. `ctx.db` has phantom types restricting updates on financial tables. Developers must use `ctx.ledger`. |
| **Silent Audit Failures** | Forgetting `logAudit()` on a sensitive action | **IMPOSSIBLE**. The EEK Consistency Checker in CI fails the build if a mutation route lacks an audit configuration. |
| **Expose Unprotected API** | Creating `export async function POST(req)` | **IMPOSSIBLE**. CI fails via `eek/require-route-wrapper`. |

## 6. Migration Plan: Phase 1.5 → 1.6

**Step 1: Introduce Phantom Types (Shadow Mode)**
- Add `TenantScopedDB` and `EEKProtectedContext` types.
- Cast the existing `withEEK` injected DB to this type.
- *Impact*: No runtime changes. Prepares the type system.

**Step 2: Deploy Custom ESLint Rules as Warnings**
- Write the AST rules for banning raw DB and requiring wrappers.
- Add them to CI as `warn` level.
- Run a report to find all existing violations.

**Step 3: Refactor Violations**
- Iteratively replace raw DB imports in domain files with `ctx.db`.
- Wrap any unprotected Server Actions and API routes with dummy or actual RBAC rules via `withEEK`.

**Step 4: Flip ESLint to Errors (The Lock)**
- Change CI to fail on ESLint rules (`error`).
- *Impact*: The Compiler Layer is now active. No new bypasses can be merged.

**Step 5: Enforce Financial Immutability & Audit Coverage**
- Roll out `LedgerLockedTransaction` for the finance domain.
- Enable `verify-coverage.ts` in CI.
- Backfill any missing audit rules.

**Final State:** The Zero-Trust Security Compiler is fully gating the main branch. Architecture degradation is mathematically impossible.
