# MONOREPO RECONSTRUCTION PLAN

## 1. Physical Topology Migration
We are moving from a standard Next.js directory into an Enterprise Monorepo setup using npm workspaces to physically enforce boundaries.

```text
/
 ├── packages/
 │    ├── @asas/kernel/         # Context, Runtime Execution, Transaction Coordinators
 │    ├── @asas/domain/         # DDD Aggregates, State Machines, Events, DTO Interfaces
 │    ├── @asas/infrastructure/ # Supabase RPC Repositories, QStash Adapters
 │    ├── @asas/events/         # Event Schemas (Zod), Payload Validators
 │    └── @asas/observability/  # Metrics, Logging, Tracing
 ├── apps/
 │    ├── web/                  # Next.js Application (Current /src structure ported)
 │    └── workers/              # Background Task Processor (Next.js serverless)
 ├── tooling/
 │    └── ast-enforcer/         # Custom AST tools and ESLint enforcement plugins
 └── package.json              # Upgraded with "workspaces" array
```

## 2. Package Ownership & Import Boundaries
**@asas/domain**:
- MUST be purely functional TypeScript.
- PERMITTED IMPORTS: `zod`, `@asas/events`.
- BLOCKED IMPORTS: `@supabase`, `@asas/infrastructure`, `react`, `next`.

**@asas/kernel**:
- MUST manage transactions and authorization execution.
- PERMITTED IMPORTS: `@asas/domain`, `@asas/observability`.
- BLOCKED IMPORTS: `react`, `next`. 

**@asas/infrastructure**:
- MUST implement the Repository interfaces defined in `domain/`.
- PERMITTED IMPORTS: `@asas/domain`, `@supabase/*`, `upstash`.
- BLOCKED IMPORTS: Route handlers, UI.

**apps/web**:
- MUST handle presentation and UI state.
- PERMITTED IMPORTS: `@asas/kernel`, `@asas/domain`.
- BLOCKED IMPORTS: `@asas/infrastructure`, `@supabase/*` (except auth helpers).

## 3. Migration Steps
1. **Initialize NPM Workspaces**: Update root `package.json` with `"workspaces": ["packages/*", "apps/*", "tooling/*"]`.
2. **Skeleton Directories**: Create the `/packages/` and `/tooling/` physical folders.
3. **Move `/src`**: Migrate existing Next.js logic into `/apps/web/src`. Verify build commands.
4. **Wire TSConfig References**: Use `references: [{ path: "../../packages/XYZ" }]` in `apps/web/tsconfig.json` for strict typings and discrete compile boundaries.
5. **Phase-in Dependency Cruiser**: Inject `.dependency-cruiser.js` into root `package.json` lifecycle scripts to mechanically kill overlapping dependencies.
