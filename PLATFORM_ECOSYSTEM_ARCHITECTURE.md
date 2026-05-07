# ENTERPRISE PLATFORM ECOSYSTEM

## 1. Overview
The ERP is now stable enough to host external developers. The Ecosystem framework opens the Outbox Streams and Command interfaces to third-party integrations safely.

## 2. External App Sandbox
- `PluginIsolationLayer`: Third-party code (e.g., custom agency workflow scripts) runs inside physically isolated WebAssembly (Wasm) or Deno v8 isolates. Memory access is mathematically walled. 

## 3. Public Developer SDK
- Third-party endpoints do NOT hit Legacy CRUD directly. They hit the exact same Command definitions (`core_execute_mutation`) through an API gateway translating their external token into an ABAC-constrained Identity. 

## 4. Webhook Governance Hub
- Exposes immutable outbox events as a fan-out stream for external systems (Salesforce, SAP). Includes automated retry, exponential backoff, and signing-secret hmac validation to ensure high fidelity guarantees to external partners.
