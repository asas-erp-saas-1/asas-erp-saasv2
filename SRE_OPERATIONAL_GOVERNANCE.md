# SRE OPERATIONAL GOVERNANCE

The Human/Operational rules engine that governs maintaining the ASAS ERP.

## 1. Production Incident Flow
- **P0 Triage:** The API Gateway trips > 10% 5XX errors.
- **Action:** SRE evaluates `DegradedModeRouter`. If an upstream dependency (Stripe/Redis) is causing thread starvation, SRE explicitly invokes the kill switch `DegradedModeRouter.markServiceDegraded('stripe', true)` via the Platform Console. The system gracefully fails-over to async-only logging.

## 2. Infrastructure Rollback Drills
- If a migration corrupts a projection schema, SREs NEVER execute raw SQL patches.
- **Drill:** `ReplayManagementConsole.triggerTenantRebuild()` is executed targeting a shadow tenant. Projections are rebuilt from the Outbox stream into the v-new schema. Once verified, the operation is blasted to all tenants.

## 3. Deployment Freeze Protocol
- **Condition:** Database schema expand/contract phase migrations.
- **Action:** Any operation that drops columns or changes core table types activates a Production Freeze. Merges are haltingly blocked until off-peak hours, verified by the `IntelligentRollbackOrchestrator` shadow metrics.

## 4. Human-In-The-Loop Escalation
- Autonomous AI operations hit the `HumanInTheLoopGovernor`. If an agency owner does not respond to a critical `DELETE_DEAL` within 48 hours, the execution request natively expires into `DEAD_LETTER`. SREs never bypass HITL authorization keys.

## 5. Alert Fatigue Protections
- CPU spikes and 401 Brute Force loops are auto-blacklisted by the WAF. PagerDuty only triggers if the **Error Budget Recovery** formula breaches SLAs, or if Outbox Queue processing lag exceeds 3 minutes.
