# AI PLATFORM SERVICES

## 1. Overview
Integrating Google Gemini natively into the operational data layer, providing ERP users with non-hallucinated, fully deterministic business insights based entirely on their own immutable Event Streams.

## 2. AI Capabilities
- `AIAssistedDealInsights`: Analyzes cadence delays between Outbox Events mapping to client communications, identifying stagnant deals that mathematically require intervention.
- `AI-assisted Operational Alerts`: Subscribes to the `SecurityObservabilitySystem`. Translates high-volume WAF/DDoS alerts into plain language incident summaries for non-technical CIOs.
- `AI-assisted Projection Drift Analysis`: Provides root-cause textual explanations when `DriftDetector` finds an anomaly, isolating the exact `Event Envelope` that broke the Read Model representation mapping.

## 3. Constraint Guarantees
AI Models NEVER execute state mutations directly. They are hard-capped to `READ` permissions on analytical read-models, adhering to strict Tenant RLS separation matrices.
