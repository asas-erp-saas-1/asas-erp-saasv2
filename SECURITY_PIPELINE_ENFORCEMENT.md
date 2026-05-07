# SECURITY PIPELINE ENFORCEMENT

## Overview
Security cannot be a manual afterthought. The CI/CD pipeline natively blocks non-compliant code from ever reaching the production `main` branch.

## 1. Security Linting & AST Bounds
- `eslint-plugin-security` is enforced. Regex Denial of Service (ReDoS) patterns are rejected automatically.
- AST Enforcer guarantees no hardcoded secrets or environment variables exist outside of `SecretVault`.

## 2. Dependency CVE Scanning
- `npm audit` runs strictly. Any `High` or `Critical` CVE in transient libraries breaks the deployment build immediately. (Expanding to Snyk/Dependabot natively).

## 3. JWT & Secret Scanning
- Commits are scanned for `sk_live_...` or JWT shapes before push via `husky` pre-commit hooks. Any detected secret is rejected.

## 4. Chaotic Integrity Testing
- The integration pipeline actively spins up the test suite and runs `chaos-mesh.ts --reorder-events`. 
- The build MUST successfully survive out-of-order execution before passing to staging.

## 5. RLS & Migration Validation
- Supabase migrations are parsed to assert that an RLS policy exists for every created table. Missing `ENABLE ROW LEVEL SECURITY` breaks the migration pipeline.
