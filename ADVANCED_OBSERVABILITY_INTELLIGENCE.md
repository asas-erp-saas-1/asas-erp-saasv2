# ADVANCED OBSERVABILITY INTELLIGENCE

## 1. Overview
We combine business and systemic metrics into unified telemetry that identifies not just what failed, but the impact on Tenant economics and performance.

## 2. Projection Latency Heatmaps
- Datadog integration mapping the exact delta between `Event Generated Time` and `Projection Rebuilt Time` (`ProjectionLatencyHeatmaps`).
- Identifies specific tenants that are causing read-model lag across the system.

## 3. Distributed Trace Correlation
`DistributedTraceCorrelationEngine` ensures that 100% of logs from Edge Proxy -> NextJS -> API -> Sagas -> Internal Workers share the exact identical `TraceId`, `TenantId`, and `RegionId`.

## 4. Security Behavior Correlation
Cross-references abnormal spikes in compute usage against recent role escalation anomalies to identify potential internal compromise or cryptojacking.
