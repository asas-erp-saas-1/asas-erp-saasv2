# CRYPTOGRAPHIC GOVERNANCE

## Overview
Keys, secrets, and PII are managed cryptographically to ensure tenant separation and secure webhook validation. Hardcoding is mathematically impossible by environment logic bounds.

## 1. Envelope Encryption
PII (e.g. lead social security numbers, banking credentials) is strictly encrypted at rest via Field-level Envelope Encryption.
- The Master Key Encryption Key (KEK) is held in AWS KMS / GCP KMS.
- Each Tenant receives a derived Data Encryption Key (DEK). This mathematically isolates encryption per-tenant.

## 2. Secret Vault Abstraction
The `SecretVault` is the sole entrypoint for obtaining secrets. It prevents devs from hardcoding `process.env.STRIPE_KEY` deep in worker functions.

## 3. Webhook Signature Verification
Incoming hooks from Stripe, Twilio, or GoHighLevel trigger `HMAC-SHA256` hash verification. This uses the `SecretVault` key mapped per tenant/integration to guarantee that external triggers are authenticated natively.

## 4. Key Rotation
Encryption keys and JWT signing secrets are subject to 90-day automatic rotation. The system supports a `(current, previous)` parsing state to seamlessly read old tokens/data while writing purely with the new key version.
