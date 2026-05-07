# ZERO-TRUST EXECUTION MODEL

## 1. Core Principles
The ASAS ERP assumes zero trust at every boundary. Identity is continuously verified, geographic constraints are strictly enforced, and every payload signature is cryptographically validated.

## 2. Request Trust Validation
Every incoming request passes through the `RequestTrustValidator` at the API Gateway.
*   **Device Fingerprinting:** Validates device signatures via `DeviceFingerprintEngine`. Drastic finger-print changes trigger an immediate MFA challenge.
*   **Session Risk Evaluation:** `SessionRiskEvaluator` applies a dynamic risk score to each session. A score > 80 (e.g. impossible travel detected) forces a session invalidation and re-auth.
*   **Geo-Anomaly Detection:** The `GeoAnomalyDetector` blocks out-of-boundary access based on agency operational rules.
*   **Impossible Travel:** Compares current IP Geo IP to previous valid session IP, calculating traversal speed. If physically impossible, the request is rejected.

## 3. Cryptographic Payload & Request Integrity
*   **Internal mTLS:** All service-to-service communication executes over mTLS.
*   **Replay Attack Protection:** Every mutation request requires a cryptographic nonce (`X-Nonce`) and timestamp. Requests older than `N` seconds are rejected.
*   **Clock Skew Protections:** NTP synchronization enforced. Requests drifting over 5 seconds from server time are rejected to prevent replay windows.

## 4. Bounded Context Segregation
Even after Gateway authentication, the Kernel Execution Pipeline treats the incoming Payload as untrusted until RBAC + ABAC + Tenant bounds mathematically overlap successfully.
