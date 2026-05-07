# PLATFORM SDK & PUBLIC API GOVERNANCE

## 1. Overview
Enterprise ERP systems must be scriptable via external integrators. Providing raw internal API keys securely to external partners necessitates strict edge governance.

## 2. API Version Negotiation
- The `ApiVersionNegotiator` intercepts public calls. It allows developers to pin their integration to `2026-05-01`. Internal domains can evolve rapidly, but compatibility bridges translate incoming payloads backward/forward for stable public consumption.

## 3. Webhook Governance
- Changes occurring in the Kernel (e.g., Lead Won) yield events. `WebhookDispatcher` listens to the Outbox, maps the tenant integrations, signs the payload with HMAC-SHA256, and dispatches to the customer's remote servers with exponential backoff on failure.

## 4. Third-Party Authentication
- External SDKs utilize OAuth 2.0 or dedicated Service Account Personal Access Tokens (PATs). These tokens bear drastically reduced scopes compared to active browser sessions and are rigorously evaluated by the `PolicyEngine`.
