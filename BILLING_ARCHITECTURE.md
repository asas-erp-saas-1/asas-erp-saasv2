# BILLING ARCHITECTURE

## Overview
A production-grade, multi-tenant billing architecture combining Subscription lifecycles, precise Usage Tracking, and a transactional Payment State Machine, all safely encapsulated within the Execution Enforcement Layer (EEL) and Kernel.

## 1. Core Modules

### 1.1 Subscription Management (`BillingService`)
*   **Plans:** Basic (`4900 DZD`), Pro (`9900 DZD`), Elite (`29900 DZD`).
*   **Invoice Lifecycle:** `draft` -> `open` -> `paid` / `uncollectible`.
*   Operates purely via Kernel queries, ensuring `tenant_id` isolation during generation and query.

### 1.2 Usage Tracking Engine (`UsageService`)
*   **Metered Billing:** Tracks atomic increments of usage (e.g. `leads_created`, `api_calls`).
*   **Enforcement:** Queries historical usage during active billing periods. If `limit_value` is defined and breached, it intercepts the mutation, logs gracefully to `ErrorTracker` (Observability), and throws `PLAN_LIMIT_EXCEEDED` to block the database write synchronously.
*   **Concurrency Safe:** Mutates inside a Kernel transaction context to avoid race conditions.

### 1.3 Transactional Payment State Machine (`PaymentStateMachine`)
*   **Transitions:** `pending` -> `processing` -> `succeeded` / `failed` (strictly enforced via `UPDATE ... WHERE status = 'expected_previous_state'`).
*   **Side Effects:** Upon `succeeded`, the Payment State Machine coordinates a Kernel transaction to simultaneously mark the linked `invoice_id` as `paid`, generating 0 sync anomalies.

## 2. Integration with Observability & Kernel
*   Every invoice creation, payment initiation, or failure is logged via `Logger.info()` or `Logger.warn()`.
*   Plan limit rejections feed directly into `ErrorTracker.captureRejection()`, providing the product team with real-time insight into potential upsell cohorts.

## 3. Database Schema
Includes 4 isolated entities, all constrained by Row Level Security (RLS) policies targeting `tenant_id`:
1.  `subscriptions`: Maintains recurring interval state.
2.  `tenant_usage`: Tracks aggregated metrics over periods.
3.  `invoices`: Final source of truth for charges (immutable once `paid`).
4.  `payments`: Attempt ledgers for invoices.
