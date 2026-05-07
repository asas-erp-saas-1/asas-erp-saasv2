# OBSERVABILITY REALITY MATRIX

To survive production, we must explicitly map how SREs answer the 5 most critical incidents using the implemented infrastructure.

## 1. What dropped this API request?
- **Lookup:** Check Gateway logs filtering by `IP` or `TraceId`.
- **Reality:** If the `Signature` failed, `PayloadAnomalyDetector` drops it. If rate-limited, `RateLimiter` drops it. Tracing natively maps straight to Datadog.

## 2. Why is Deal X missing from the Dashboard?
- **Lookup:** Query `outbox_events` for `aggregate_id`. 
- **Reality:** The event exists in the Outbox (system did process it).
- **Lookup 2:** Query `ProjectionDriftDetector` logs. 
- **Reality:** `ProjectionEngine` skipped it because `event.version <= currentState.version` (out of order), or the Projection Worker Pod crashed/OOM.

## 3. Which Tenant caused the Queue Spike?
- **Lookup:** SQL Query: `SELECT tenant_id, COUNT(*) FROM outbox_events WHERE status = 'PENDING' GROUP BY tenant_id ORDER BY COUNT(*) DESC LIMIT 1`.
- **Reality:** The `NoisyNeighborIsolation` matrix kicks in. Datadog alerts on specific `tenant_id` queue latency.

## 4. Why did the Webhook fire twice?
- **Lookup:** Splunk search for `trace_id` AND `WebhookDispatcher`.
- **Reality:** Worker died after Dispatch but before committing the Outbox `status = 'COMPLETED'` back to Postgres. 
- **Fix:** Webhook handlers MUST be perfectly idempotent on the receiving end. We guarantee At-Least-Once delivery, NOT Exactly-Once.

## 5. Who leaked the data?
- **Lookup:** `SECURITY OBSERVABILITY SYSTEM`
- **Reality:** The `TraceId` inherently tracks the bound `userId` from the JWT. The `PolicyEngine` explicitly captures the ABAC context at execution time, proving which User/Agent escalated privileges.
