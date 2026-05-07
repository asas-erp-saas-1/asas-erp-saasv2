# PRODUCTION EXECUTION READINESS CHECKLIST

## 1. Governance & Boundary Verification
- [ ] AST Enforcement passing locally (`npm run enforce:ast`)
- [ ] Dependency Crucible passing (`npm run enforce:boundaries`)
- [ ] CI/CD pipeline configured to block destructive migrations.
- [ ] GitHub branch protection enabled (No bypasses into `main`).

## 2. Kernel & State Machine Readiness
- [ ] All `legacy` mutations targeted for Phase 10 have duplicate Command equivalents in `@asas/kernel/commands/`.
- [ ] Explicit `.isShadow` short-circuits implemented in the `ExecutionPipeline.ts` at the DB atomic commit boundary.
- [ ] State machines explicitly throw specific `BusinessRuleViolation` strings instead of generic HTTP 500s.
- [ ] `ContextHydrator` extracts exact `tenantId` without failure.

## 3. Transaction & DB Orchestration
- [ ] RPC mutations (e.g., `core_execute_mutation`) deployed securely.
- [ ] Outbox schema explicitly tracks `trace_id` and `expected_version` strings correctly.
- [ ] Optimistic Locking exception mapped physically to a `409 Conflict`.
- [ ] Dead-letter tables deployed.

## 4. Frontend Resilience
- [ ] `useCommandExecute` handles 409 responses by forcefully resetting specific component state.
- [ ] SWR/React Query invalidates gracefully via Realtime Sync.
- [ ] No direct `supabase.update()` calls exist anywhere in `apps/web`.

## 5. Rollout Strategy & Freeze Procedures
### Expand Phase 
- All traffic flows through legacy. Shadow Execute logs traces and generates `#SHADOW DIVERGENCE` logs.
- *Hold Status*: Monitor Datadog for 24-hours to verify 0.00% hash mismatch before migrating.

### Shift Phase
- Activate feature flags scaling 10% → 30% → 100% routing to physical Kernel RPC execution.
- If incident arises: Toggle feature flag to 0%. Since the schema was purely additive (Expand-Contract), Legacy simply resumes without schema corruption.

### Contract Phase
- *ONLY* execute after 14-days 0-error rate on Kernel branch.
- Remove old `services/` API endpoints. 
- Eliminate legacy `.from('xyz').update()` logic.
