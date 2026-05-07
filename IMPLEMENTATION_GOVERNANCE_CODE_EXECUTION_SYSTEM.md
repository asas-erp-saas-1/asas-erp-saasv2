# IMPLEMENTATION GOVERNANCE & CODE EXECUTION SYSTEM

## SECTION 1 — IMPLEMENTATION PHILOSOPHY

### Architecture Governance Philosophy
Enterprise systems do not collapse from single catastrophic failures; they collapse incrementally from entropy, uncontrolled engineering, and the erosion of bounded contexts. Velocity without governance breeds systemic corruption. The ERP must be protected from its own evolution. 

Implementation must be mechanically constrained because human discipline does not scale. Without structural enforcement, architecture drift is inevitable: abstractions leak, modules couple, and domain boundaries vanish. Runtime correctness and data integrity are infinitely more critical than feature delivery speed. 

### Core Tenets
- **Governed Engineering**: Engineering is a privileged act bound by immutable mechanical laws, not a creative exercise in writing code.
- **Execution Integrity**: An operation must either succeed entirely or fail safely. Data corruption is structurally impossible.
- **Codebase Sovereignty**: The core kernel and infrastructure domains belong to the platform. Product developers are guests executing within defined parameters.
- **Deterministic Release Safety**: A release must yield identical, predictable outcomes. Unpredictability is an engineering failure.
- **Infrastructure-Enforced Architecture**: Architectural rules are not documentation; they are CI/CD blocking gates, AST validators, and ESLint compiler errors.

### The ERP as a Controlled Engineering Ecosystem
No engineer, regardless of seniority, is trusted by default. All mutations (code, DB, configuration) require automated enforcement. The system must structurally survive bad engineers, aggressive deadlines, and scaling chaos. 

---

## SECTION 2 — CODEBASE GOVERNANCE ARCHITECTURE

### Monorepo Governance Structure
The ASAS ERP operates as a unified monorepo governed by strict physical boundaries. 
- **Protected Modules**: `kernel/`, `infrastructure/`, `orchestration/`, and `events/`. Only Platform Engineers may merge changes here.
- **Critical Kernel Isolation**: The `kernel/` is independent. It cannot import anything from `modules/` or UI directories.
- **Internal Package Registry Strategy**: Shared logic is versions and isolated into internal workspace packages (e.g., `@asas/domain`, `@asas/dto`) with explicit owners.

### Strict Dependency Laws
- **Modules cannot bypass kernel**: Domain modules cannot import PostgreSQL, Supabase, or Redis SDKs directly. 
- **UI cannot mutate DB directly**: Frontend code solely dispatches commands to the API. 
- **Workers cannot access frontend runtime**: Worker functions execute in isolated Node.js contexts without access to Next.js UI libraries.
- **State machines cannot import infrastructure**: State machines must remain pure functions.
- **Modules cannot directly communicate**: The `crm` module cannot import the `finance` module. All cross-domain interaction relies on Domain Events or Kernel Orchestration.
- **Shared utilities cannot become "god packages"**: Utilities must be explicitly typed and domain-agnostic. Business logic in `shared/` is strictly forbidden.

### Import Graph Enforcement
- **Circular Dependency Prevention**: Madge/Dependency-Cruiser runs on every commit. Any circular dependency fails the build automatically.
- **ESLint Architectural Rules**: Enforced via `eslint-plugin-boundaries`. Imports violating separation of concerns yield compiler errors.
- **AST Enforcement**: Scripts parse Abstract Syntax Trees to ensure all DB operations are wrapped in `Kernel.execute()`.

---

## SECTION 3 — DEVELOPMENT EXECUTION MODEL

### Branch Strategy & PR Governance
- **Trunk-Based Development**: Short-lived feature branches cut from `main`.
- **Merge Protections**: Code CANNOT merge without passing the complete CI pipeline, 100% resolution of threads, and 2 Code Owner approvals (1 Platform, 1 Domain).
- **Mandatory Test Coverage**: Absolute minimum 85% coverage on new lines. 100% coverage on Kernel and State Machines.
- **Release Trains**: Deployments are continuous and automated, gated by health checks. Friday deployments are permitted only via robust feature-flag toggling.

### Development Lifecycle
Coding is the *last* step of engineering. All work follows a rigid lifecycle:
1. **RFC (Request for Comments)**: High-level solution proposal.
2. **Architecture Review**: Approval of the RFC.
3. **DTO Definition**: Contracts merged first.
4. **State Machine Definition**: Rules mapped out.
5. **Command Contract**: Mutation intent mapped.
6. **Repository Contract**: Data access mapped.
7. **Tests**: TDD approach for Kernel/State validation.
8. **Observability Hooks**: Logs and metrics defined.
9. **Security Review**: RBAC/Tenant validation verification.
10. **Release Approval**: Code submitted.

### The Cowboy Coding Ban
Coding starts AFTER architecture approval. "Cowboy coding" or pushing straight to `main` is physically blocked. "Temporary hacks" become permanent disasters and are treated as gross negligence.

---

## SECTION 4 — DATABASE GOVERNANCE SYSTEM

### Migration Execution Laws
- **Expand-Contract Migration Strategy**: Migrations must be non-destructive. To rename a column: Add new column -> Sync both via trigger/code -> Migrate data -> Drop old column in a subsequent release.
- **Roll-Forward Philosophy**: Reverting a migration is fraught with danger. Fixes are applied via new roll-forward migrations.
- **Data Contract Stability & Backward Compatibility**: Old API versions must continue to operate flawlessly against new database schemas.

### Migration Review Pipeline
- **Schema Diff Validation**: Automated tools (e.g., Supabase CLI diff) compare representations.
- **Migration Dry-Runs**: Run against an anonymized, high-volume staging database clone.
- **Production Sequencing**: Migrations execute out-of-band BEFORE the code deployment that requires them.

### Runtime DB Protection
- **Query Cost Guards**: CI/CD executes `EXPLAIN ANALYZE` on heavily used queries; costs exceeding budgets fail the build.
- **Lock Timeout Enforcement**: DB transactions capped at `statement_timeout = 5000ms`.
- **Slow Query Detection**: Automatically routed to high-priority Slack/Datadog alerts.

### Forbidden Patterns
- `SELECT *` inside application code.
- Unbounded bulk deletes.
- Cross-tenant queries without strict aggregation permissions.
- Missing indexes on foreign keys.
- Long-running transactions inside user-facing API paths.
- Runtime schema mutations.

---

## SECTION 5 — CI/CD ENFORCEMENT PIPELINE

Deployments are high-risk operations treated as a SECURITY SYSTEM, not just automation.

### Complete Pipeline Stages:
1. **Static Analysis**: ESLint, Biome, Dependency logic checks.
2. **Type Checking**: Strict TypeScript validation across the monorepo.
3. **Dependency Graph Validation**: Import directionality rules.
4. **DTO Contract Validation**: Schema integrity checks.
5. **State Machine Validation**: Fuzzer-based state transition tests.
6. **Security Scanning**: SAST, Dependency vulnerability checks.
7. **Secret Detection**: Pre-commit and CI scans for exposed keys.
8. **Unit Tests**: Pure domain logic evaluation.
9. **Integration Tests**: Database/Repository integration validation with Testcontainers.
10. **Replay/Idempotency Tests**: Ensuring workers can process identical payloads twice safely.
11. **Concurrency Tests**: Forcing concurrent transactions to validate Optimistic Locking.
12. **E2E Tests**: Playwright scripts mirroring core agent workflows.
13. **Performance Benchmarks**: Verifying critical query speeds.
14. **Build Verification**: Next.js build compilation.
15. **Deployment Simulation**: Ephemeral environment spin-up.
16. **Migration Verification**: Schema application on the ephemeral instance.
17. **Canary Deployment**: Routing 5% of internal traffic.
18. **Runtime Health Validation**: Evaluating error rates for 5 minutes.
19. **Progressive Rollout**: 10% -> 50% -> 100%.
20. **Production Release**: General availability.

### Gating & Quarantines
- **Health Score Gating**: If any 5xx error spikes or latency increases > 20%, deployment halts.
- **Automatic Rollback**: Triggers instantly on failed health gates.
- **Failed Release Quarantine**: Failed artifacts are explicitly tagged `quarantined` and locked from execution.

---

## SECTION 6 — TESTING & VERIFICATION FRAMEWORK

### Multi-Layer Testing Strategy
- **Unit Tests**: Fast, isolated state machine and domain logic execution.
- **Kernel Execution Tests**: Bypassing UI, testing the execution pipeline directly.
- **Transaction Integrity Tests**: Mocking failure mid-transaction to verify ROLLBACK efficacy.
- **Workflow Replay Tests**: Ensuring long-running sagas can resume from DB checkpoints.
- **Worker Duplication Tests**: Injecting identical messages to QStash to verify idempotency blocks.
- **Chaos Engineering**: Intentionally shutting down Redis or a Read Replica during test executions to verify fallback degradation.

### Determinism Requirements
- **Seeded Runtime Testing**: Tests must generate their own isolated, seeded tenant data and flush post-execution.
- **Replayable Environments**: The exact state of a failure must be reproducible locally.

### Forbidden Testing Anti-Patterns
- **Shared Mutable Fixtures**: State leaking between test suites.
- **Real External API Dependency**: Calling real Twilio/Stripe. All external calls MUST use wiremock/adapters.
- **Time-Dependent Flaky Tests**: Tests relying on `setTimeout` instead of simulated clock manipulation.
- **Snapshot Abuse**: Blindly approving UI DOM snapshots instead of asserting behavior.

---

## SECTION 7 — RUNTIME OBSERVABILITY GOVERNANCE

### Mandatory Observability Architecture
- **Distributed Tracing Enforcement**: EVERY API call, worker job, and DB transaction must propagate `trace_id`.
- **Structured Logs Only**: String concatenation is banned. Logs must be JSON containing `tenant_id`, `actor_id`, and `command_id`.
- **Runtime Anomaly Detection**: Unsupervised ML models flag unusual query volumes or authorization failure spikes.

### SLI/SLO & Error Budgets
- **Error Budget Policies**: If a module depletes its 30-day error budget, ALL feature development is frozen until reliability is restored.
- **Queue Lag Thresholds**: Outbox lag exceeding 120 seconds triggers P1 escalation.
- **DB Saturation Thresholds**: DB CPU hitting >75% auto-sheds read traffic.

### Incident Escalation
- **Alert Routing Hierarchy**: Warnings -> Chat. Critical -> PagerDuty (On-call Engineer). Infrastructure -> Platform Lead.
- **Production Freeze Triggers**: Massive error spikes or data integrity alarms automatically freeze CI/CD pipelines.

---

## SECTION 8 — SECURITY EXECUTION GOVERNANCE

### Security-By-Default Execution
- **Least Privilege Enforcement**: AWS Roles and DB Users are granted the minimum requisite permissions. Application roles CANNOT modify schemas.
- **Environment Isolation**: Production data NEVER leaves the production VPC. Developers connect to sanitized staging sets.
- **Secret Rotation Governance**: Secrets automatically rotated via Vault/AWS Secrets Manager every 30 days.

### Auditability Laws
- All destructive actions (updates, soft-deletes) MUST log to the `audit_logs` append-only table.

### Runtime Security Scanning
- **Webhook Verification**: All inbound webhooks (Stripe, Twilio) MUST computationally verify cryptographic signatures in the Gateway layer before routing.

### The Production Data Ban
- **Why production DB access is forbidden**: Engineers cannot `psql` into production. Manual database mutations easily circumvent audit logs, trigger rules, and event outboxes, inherently corrupting the system's eventual consistency. Data fixes occur exclusively via automated, reviewed scripts routed through the Kernel.

---

## SECTION 9 — RELEASE ENGINEERING SYSTEM

### Release Orchestration
- **Feature Flag Governance**: Every new feature MUST be wrapped in a LaunchDarkly/custom flag. Features are merged dark and toggled progressively.
- **Emergency Rollback Systems**: Code rollbacks actuate via a single CLI command/button, redirecting traffic to the previous Vercel deployment instantly, unconstrained by DB migrations (due to expand-contract capability).

### Safety & Compatibility
- **Safe Deployment Sequencing**: Database Schema -> Backend Deployment -> Workers -> Frontend.
- **Version Compatibility Laws**: No API endpoint can be altered in a breaking manner. V2 endpoints are created while V1 is supported until client migration completes.
- **Event Schema Compatibility**: Events are immutable facts. To alter payload structure, `schema_version` increments, and consumers must maintain backward-compatibility branches for legacy schema handling.

---

## SECTION 10 — ENGINEERING OPERATIONS SYSTEM

### Incident Response Lifecycle
- **Reliability Ownership**: Teams own the modules they build. "You build it, you run it."
- **Root Cause Analysis (RCA)**: Required for every high-severity incident. Focus is strictly blameless; failure is always a systemic deficiency, not a human error.
- **Postmortem Governance**: RCA output MUST include actionable Jira tickets to patch the systemic hole.

### Operational KPIs
- Dashboards track: Deployment frequency, Lead Time for Changes, Mean Time To Recovery (MTTR), and Change Failure Rate (DORA metrics).

### Technical Debt Governance
- **Refactor Approval Process**: Refactors altering execution paths require RFCs identical to new features.
- **Legacy Isolation Policy**: Obsolete code is isolated, deprecated, and slated for chronological execution deletion via the CI pipeline.

---

## SECTION 11 — PERFORMANCE GOVERNANCE

### Performance Budgets
- **Query Latency Budgets**: OLTP commands must execute in < 150ms.
- **Worker Execution Budgets**: 30 seconds max. Overruns trigger termination and DLQ.
- **Frontend Hydration Budgets**: TTI (Time to Interactive) < 2s for Agent Dashboards.
- **Websocket Throughput**: Payload limits capped at < 1KB per broadcast.

### Runtime Profiling
- **Memory Leak Detection**: Worker nodes subjected to periodic deliberate restarts to flush ephemeral bloat.
- **Cache Efficiency Monitoring**: Cache Hit/Miss ratios monitored continuously. Ratios < 80% indicate invalidation thrashing and warrant review.

### Scaling & Degradation
- **Automatic Scaling Laws**: Vercel/Serverless handles HTTP elasticity. PgBouncer handles connection elasticity.
- **Load Shedding Policies**: If request queues saturate, 429 Too Many Requests are returned immediately instead of holding connections open and dying.
- **Graceful Degradation Rules**: An outage of external services (e.g., WhatsApp API) disables the UI elements rather than failing entire deal conversions.

---

## SECTION 12 — ANTI-PATTERNS & ENGINEERING CRIMES

### ABSOLUTELY FORBIDDEN PRACTICES (ENGINEERING CRIMES):

1. **Direct DB Writes (Bypassing Kernel)**
   - *Why*: Circumvents the Outbox, event emissions, and RBAC. Corrupts global consistency.
   - *Alternative*: Invoke `Kernel.execute(command)`.
2. **Hidden Retries**
   - *Why*: Retrying without idempotency keys creates duplicate charges, duplicate emails, and corrupted ledger states.
   - *Alternative*: Require client-generated idempotency tokens and DB-level deduplication logs.
3. **Shared Mutable State**
   - *Why*: Memory leaks and cross-tenant data spillage in Serverless environments.
   - *Alternative*: Pure functions and immutable request-scoped KernelContexts.
4. **Untyped Payloads (`any` / `unknown`)**
   - *Why*: Bypasses DTO validation, inviting injection attacks and undefined behavior.
   - *Alternative*: Strict Zod validation returning strongly-typed interfaces.
5. **Runtime Side Effects in State Machine Validation**
   - *Why*: Partial failures leave the state machine hanging. Tests become impossible.
   - *Alternative*: Pure function validations returning arrays of Events pushed to the Outbox.
6. **Cross-Domain Imports**
   - *Why*: Destroys modularity, leading to monolithic compilation and deployment roadblocks.
   - *Alternative*: Decouple via the Event Bus. 
7. **Long-Running Synchronous Requests**
   - *Why*: Kills gateway limits, ties up PgBouncer connections, crashes on timeouts.
   - *Alternative*: Return 202 Accepted immediately, delegate heavy work to QStash Workers, update UI via WebSockets.
8. **Silent Catch Blocks (`catch (e) {}`)**
   - *Why*: Suppresses critical failures from the observability stack. Leads to "ghost" bugs.
   - *Alternative*: `ErrorTracker.capture(e)` -> throw `BusinessRuleError`.
9. **Dynamic Schema Mutations**
   - *Why*: Executing `ALTER TABLE` via application code locks the database unexpectedly and wrecks execution planes.
   - *Alternative*: Managed via formal PR/CI Migration paths.
10. **Direct Hotfixes Without Audit Trail**
    - *Why*: Breakage usually ensues. Inconsistent environments result in deployment divergence.
    - *Alternative*: Hotfix branches through CI, skipping non-essential pipelines if P1, but NEVER bypassing codebase governance tests.

---

## SECTION 13 — FINAL IMPLEMENTATION GOVERNANCE AUDIT

### THE FINAL EXECUTION GOVERNANCE CHECKLIST

**THE ERP IS NOT PRODUCTION READY UNLESS:**
- [ ] Architecture boundaries are mechanically enforced via CI/CD linting and strict AST rules.
- [ ] CI/CD strictly blocks invalid execution paths and circular dependencies.
- [ ] All releases are demonstrably replay-safe and idempotent.
- [ ] Runtime observability captures continuous trace IDs across all horizontal and vertical hops.
- [ ] Rollbacks are deterministic and function within seconds via Vercel network rerouting.
- [ ] Schema evolution operates exclusively via Expand-Contract backward-compatible strategies.
- [ ] All multi-stage sagas (workflows) maintain DB checkpoints and are 100% resumable upon worker crash.
- [ ] All infrastructure failures (Redis, 3rd-party APIs) gracefully degrade without killing the primary OLTP.
- [ ] All outbox side effects process through deduplication enforcement layers protecting end-users from duplicate actions.
- [ ] All business modules remain structurally isolated, enforcing DDD boundaries mechanically.
- [ ] All commands emit to the immutable `audit_logs` securely.
- [ ] All engineering actions are traceable to a Jira ticket and RFC approval.
- [ ] NO developer can arbitrarily bypass the Kernel's transactional and security boundaries.
- [ ] NO release can bypass the health-checks and governance gates dictated by the pipeline.
