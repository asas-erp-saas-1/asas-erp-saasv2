# TYPE SYSTEM HARDENING AUDIT

## Overview
This document outlines the mechanical transition from a weakly-typed, optimistic implicit execution model to a strict, statically verified, and deterministic type system. In Phase 9, TypeScript is elevated from an optional linting tool to the primary barrier against runtime production failure.

## Type-Safety Execution Law

1.  **`strict: true`**: (Already active, but explicitly enforced) No ambient `any` or nullable bypasses.
2.  **`noImplicitAny: true`**: Every boundary must declare its exact payload signature.
3.  **`exactOptionalPropertyTypes: true`**: Differentiates between a property missing versus explicitly set to `undefined`. A payload `{ name?: string }` cannot receive `undefined` unless it is typed `{ name?: string | undefined }`. This prevents DB patch corruption.
4.  **`noUncheckedIndexedAccess: true`**: Protects against unexpected missing keys in generic records and JSON arrays, enforcing existence checking before access.
5.  **`noImplicitOverride: true`**: Protects base class overriding anomalies.

## Audit Matrix & Identified Hazards

### 1. `any` Leakage in External Boundaries
*   **Location**: API routes parsing HTTP bodies (`await req.json()`), Webhook handlers.
*   **Risk**: `unknown` JSON cast unconditionally to application DTOs.
*   **Remediation**: 100% of I/O edges must pass through Zod `.parse()` or `.safeParse()`.

### 2. Nullable Hazards in Domain Code
*   **Location**: State Machine checks and Service Layer checks (e.g., `if (user.agency_id == null)`).
*   **Risk**: `null` vs `undefined` mismatches from DB vs memory. Unchecked optional properties causing runtime property access faults (`TypeError: Cannot read properties of undefined`).
*   **Remediation**: Aggressive activation of `noUncheckedIndexedAccess`. Explicit union types `| null`. Ensure `exactOptionalPropertyTypes` catches accidental `{ value: undefined }` payloads sent to `supabase.update()`.

### 3. Record & Indexed Access Anomalies
*   **Location**: Tenant metadata maps, generic JSONB properties.
*   **Risk**: Object key indexing returning `string`, but actually returning `undefined` at runtime.
*   **Remediation**: `record[key]` will now type as `string | undefined`. Every access requires a type guard or fallback.

### 4. DTO Corruption Risks
*   **Location**: Legacy Controller payloads returning directly from Supabase responses.
*   **Risk**: Supabase Types generated from DB schema are not automatically equivalent to Domain Enums/DTOs. Adding a column to the DB dynamically changes the typed output in the app, silently breaking UI assumptions.
*   **Remediation**: Implement structural boundary DTO contracts. DB types map to Domain Models inside the Repository layer before crossing the boundary.

### 5. Supabase Implicit Returns
*   **Location**: Repositories returning `const { data } = await supabase...`
*   **Risk**: `data` can be `null` if the record isn't found, but the legacy type signatures assumed `Deal`.
*   **Remediation**: Repositories must forcefully check `if (!data) throw new EntityNotFoundError()`. Return types must strictly be `Promise<Deal>` or `Promise<Deal | null>`. No raw unverified passthrough.

## Execution Strategy

1.  **Compiler Gates Enabled**: The 5 golden strictness flags are activated in `tsconfig.json`.
2.  **Mechanical Verification**: A full monorepo `pnpm tsc --noEmit` will reveal structural failures.
3.  **Iterative Healing**: The type failures are not bypassed using `//@ts-expect-error` or `as any`. Instead, boundaries are reconstructed mechanically with Zod + Domain Contracts. 
4.  **Enforcement Pipeline**: CI will block any branch reducing strictness coverage.
