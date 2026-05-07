# GLOBAL CACHE & EDGE GOVERNANCE

## 1. Overview
To ensure sub-50ms response times for reads, projections are pushed to the edge (e.g., Cloudflare Workers KV, Vercel Edge Cache, Redis Global Datastore). 

## 2. Edge Cache Coordination
- `EdgeCacheCoordinator` syncs core projection read models to nearest edge locations.
- `GlobalCacheInvalidationBus` listens to `outbox_events`. Upon a mutation, it immediately emits a targeted purge to the edge cache.

## 3. Cache Drift Detection
- Given cache invalidations can fail in transit, `CacheDriftDetector` randomly samples 1% of edge responses and compares them against the authoritative Region database.
- Drift triggers a localized background reconciliation (`SWRConsistencyEngine`).

## 4. Edge Fallbacks
- If the global edge cache gets partitioned, `RegionalRedisFallbacks` catch the load locally to prevent a stampede on Postgres.
