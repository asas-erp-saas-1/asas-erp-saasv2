# SECURITY OBSERVABILITY SYSTEM

## Overview
The ASAS ERP operates blindly if it cannot see lateral attacks. The Security Observability System shifts from "application logs" to "threat behavior telemetry."

## 1. Auth Failure Clustering & Brute Force
- A single `401 Unauthorized` is noise.
- 50 `401`s from the same IP, or iterating through multiple UserIDs, is Brute Force detection.
- Emits a `[BRUTE_FORCE_HALT]` trace event, blackholing the IP at the WAF level and alerting SOC.

## 2. Suspicious Behavior Scoring
Actions natively emit points to an internal `ThreatScore`.
- Rapid navigation through multiple unfamiliar tenant records (+10 points).
- Attempting to modify a disabled feature flag (+50 points).
- Requesting extraction of >1,000 Pipeline Metrics in 1 minute (+80 points).
Threshold breaches automatically downgrade the session to "read-only" until step-up auth (MFA) is completed.

## 3. Threat Intelligence Hooks & Projections
Security traces are projected independently from business data.
- The `security_events` table natively receives projected threat telemetry.
- Dashboards connect securely to this specific Read Model to provide internal Admins with live visualization of WAF blocks, geo-blocks, and impossible travel drops.
