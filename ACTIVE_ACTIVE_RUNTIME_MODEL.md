# ACTIVE/ACTIVE MULTI-REGION RUNTIME

## 1. Overview
The ASAS ERP operates simultaneously across multiple regions (e.g., `us-east`, `eu-west`). Multi-region execution eliminates a single geographical point of failure and drastically reduces RTT for global tenants. 

## 2. Global Traffic Allocation
- The API Gateway integrates with Route53/Cloudflare to resolve user IP to the closest operational region.
- `RegionRouter` acts as the definitive traffic cop. It maps `tenant_id` to its authoritative "home" region. If a user is travelling, they may hit `eu-west`, but if their tenant homing is `us-east`, mutations are transparently proxied over the backbone.

## 3. Split-Brain Prevention
- **VectorClocks**: Every aggregate mutation includes a RegionId and Vector Version (e.g., `us-east: 42`).
- The `RegionPriorityElection` service dictates which region owns authoritative rights to resolve conflicts using deterministic merge policies.

## 4. Cross-Region Replication
- Instead of raw Postgres logical replication across the WAN, `EventReplicationCoordinator` replicates the **immutable event streams** natively over high-speed bridges (Kafka/QStash cross-region topics).
- If the entire `us-east` region is leveled, `eu-west` already has the event log and can instantaneously rebuild `us-east` projections.

## 5. Regional Failover
- In the event of total regional blackout, `RegionalFailoverCoordinator` instantly flips the DNS and demotes the failed region. Traffic is rerouted, and the surviving region promotes the replicated read models to authoritative status.
