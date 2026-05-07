# ENTERPRISE BILLING & SUBSCRIPTION GOVERNANCE

## 1. Overview
Billing logic in a multi-tenant environment must be tied to the immutable event stream tightly. "Stripe Reality" vs "DB Reality" split-brain scenarios are legally catastrophic.

## 2. Revenue Event Sourcing
- Instead of raw Stripe Webhooks mutating user tiers, webhooks emit `SubscriptionUpdatedEvent`.
- State machines process these events, meaning we can mathematically reconstruct the entire 3-year billing lifecycle of a tenant perfectly from the Outbox.

## 3. Usage-Metering & Quota Enforcement
- The `MeteringEngine` aggregates asynchronous consumption (e.g., API calls, AI tokens used).
- `QuotaEnforcer` prevents the system from generating compute for tenants who have hard-capped their usage limits and refused to upgrade, isolating cost bleed.

## 4. Invoice Replay Consistency
- If the system is replayed to reconstruct projections, billing events run in `ReplayRuntimeMode`, preventing the system from re-issuing past invoices or double-charging credit cards on historical rebuilds.
