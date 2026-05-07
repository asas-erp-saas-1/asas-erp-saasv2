# API GATEWAY HARDENING

## Overview
The API Gateway acts as the frontline shield. It drops malformed, abusive, or high-volume traffic mathematically before it ever reaches the Kernel execution loop or Database.

## 1. Rate Limiting & Burst Protection
- We enforce Distributed Rate Limiting via Redis.
- `burst = 10 req/s`, `sustained = 100 req/min` per User.
- Tenant-level limits prevent a single noisy agency from starving adjacent tenant processing times (Queue Overflows).

## 2. Request Integrity & Signature Verification
- Incoming requests MUST carry a payload hash signature (`X-ASAS-Signature`).
- Modifying payload content mid-flight (e.g., Man-in-the-Middle) breaks the signature and results in a `400 Bad Request`.

## 3. Bot & Abuse Heuristics
- The WAF middleware filters common payload anomaly attacks.
- High velocity of 401s / 403s from a single IP automatically penalizes the IP (IP Reputation analysis) and blacklists it for 15 minutes.
- Suspicious user-agents or structural GraphQL recursion complexities are flagged and rejected immediately.

## 4. Size Governance & Timeouts
- Payload limit strictly enforced at `2MB`.
- If a downstream service hangs for more than `4500ms`, a Gateway Circuit Breaker activates, preventing thread starvation, and returning `503 Service Unavailable` automatically.
