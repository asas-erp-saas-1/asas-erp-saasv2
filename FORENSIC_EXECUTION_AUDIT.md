# FORENSIC EXECUTION AUDIT

## Overview
The ERP is a financial and operational source of truth. Every transaction must be traceable, reproducible, and legally auditable without relying on application logs alone.

## 1. Append-Only Event Streams
The `outbox_events` table operates strictly as an append-only ledger. Modifying or deleting an event is banned by Database trigger restrictions. It is immutable natively.

## 2. Correlation Tracing
Every action holds a `TraceId`.
- API Request -> TraceId
- Kernel Command -> TraceId
- Outbox Event -> TraceId
- Replay / Saga Callback -> TraceId
This guarantees a contiguous timeline of events across microservices and DB bounds in DataDog/Splunk.

## 3. Tamper Detection & Audit Hashing
Events form an immutable Merkle tree execution chain. Event N contains the hash of Event N-1 (Causal Ordering Hashing). Modifying a historical row mathematically breaks the verification chain, firing a `[TAMPER DETECTED]` security alarm.

## 4. Privileged Action Logging
If an `admin` or `system` account modifies a `agency_owner` configuration, this is flagged as a `Privileged Action`. It bypasses standard queues and writes a duplicate alert directly to cold-storage security storage for external compliance auditing.
