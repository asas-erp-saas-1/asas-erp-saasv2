# SESSION & TOKEN GOVERNANCE

## Overview
Identity tokens dictate access authority. If a token is stolen, the enterprise must immediately invalidate the breach surface.

## 1. Token Lifecycles & Revocation
- **Access Tokens:** Very short-lived (15 minutes). Stateless verification for speed.
- **Refresh Tokens:** Long-lived (7 days) but stored securely in HTTP-only cookies and mapped to a DB Session entity.
- **Revocation:** Logging out, changing passwords, or a suspicious IP jump flags the Session as `revoked`. Refreshing tokens fails, and the user drops out naturally under 15 minutes.

## 2. Impossible Travel & Concurrent Sessions
- Simultaneous logins from conflicting geographical points (Impossible Travel) automatically invalidate ALL active sessions and force a password reset workflow.
- Maximum `5` concurrent sessions allowed. The oldest session is forcefully ejected if exceeded.

## 3. Token Replay Protection
- Refresh attempts perform token rotation. If an *already used* refresh token is presented, this is a Token Replay Attack. The Gateway immediately revokes all family tokens mapped to that user, triggering a system-wide eviction.

## 4. Forced Logout Orchestration
- Administrators or the `SecurityObservabilitySystem` can flag a `userId`. A Redis PUB/SUB event broadcasts to all edges, rejecting even the 15-minute Access Token from memory caches instantly.
