# INTERNAL PLATFORM ENGINEERING

## 1. Overview
Platform Engineering supplies Internal Developer Portals (IDP) enabling SREs and Tier 3 Support to operate the system securely without touching production DB credentials.

## 2. Deployment Control Center
Provides visual traffic shifting matrices (10% -> 50% -> 100%), canary abort toggles, and feature flag management.

## 3. Projection & Replay Console
`ReplayManagementConsole` allows SREs to individually truncate and rebuild a specific tenant's Read Models with a single click in extreme corruption scenarios, tracking the real-time event processing speed.

## 4. Tenant Ops Dashboard
Exposes specific tenant FinOps metrics, Queue isolation alerts, and automated degradation overrides (`RuntimeFeatureControlPanel`).
