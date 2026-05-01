# PRODUCTION DEPLOYMENT ARCHITECTURE

## Overview
This architecture guarantees safe multi-tenant deployment across separated environments, using Edge-native routing, strict secret boundaries, and pre-deployment validation hooks.

## 1. Environments & Deployment Pipeline Structure
We use a standard 3-tier isolated strategy:

*   **Development (`dev`):** Local or preview environments pulling from `dev` branches.
*   **Staging (`staging`):** Exact mirrored configuration to production with sanitized anonymous data.
*   **Production (`prod`):** Locked environment. Deployments happen ONLY from `main` via automated GitHub Actions with validation hooks.

### CI/CD Pipeline Flow (GitHub Actions)
1.  **Trigger:** Push or PR to `main`.
2.  **Validation Phase:**
    *   Dependency Install (`npm ci`)
    *   Linter & Type Checking (`tsc --noEmit`)
    *   NPM Security Audit
3.  **Custom Build Guard (`scripts/validate-build.js`):**
    *   Scans entire `src/` AST for hardcoded secrets (`sk_test...`).
    *   Asserts that `SUPABASE_SERVICE_ROLE_KEY` is completely isolated in the Kernel context and not leaked to services or UI.
4.  **Test Phase:**
    *   Kernel Unit Tests & EEL Boundary Assertions
5.  **Build Phase:**
    *   `next build` with Vercel Edge target compatibility.
6.  **Deploy Phase:**
    *   Edge deployment via Vercel CLI (or AWS Amplify).

---

## 2. Global Edge Routing Architecture (Multi-Region / Multi-Tenant)
Implemented via `src/middleware.ts`:

*   **Edge Native:** Middleware runs instantly at the CDN edge before hitting any Node.js compute.
*   **Dynamic Subdomain Routing:** Infers the `tenantId` from the Host header (e.g., `tenantA.asas-os.com`).
*   **Context Passing:** Injects parsed `x-resolved-tenant` and `x-client-region` (from `x-vercel-ip-country`) into the request headers for the generic API handlers.
*   **Security Header Gateway:** Enforces strict HSTS, X-Frame-Options, and Referrer policies globally.

---

## 3. Secrets & Configuration Engine (`src/lib/config/secrets.ts`)
*   Centralized abstraction mapping raw `process.env` entries.
*   **Production Hard-Fail:** If `ConfigProvider.getSecrets()` encounters missing keys under `NODE_ENV=production`, it intentionally crashes the instance on boot via `ErrorTracker`, preventing a compromised state.
*   The raw Database URLs and Service Role Keys are NEVER exposed to the frontend build scope.

---

## 4. Production Readiness Checklist

### Database (Supabase)
- [ ] Point in Time Recovery (PITR) is enabled.
- [ ] RLS is enabled on **every** table and extensively validated to use `current_tenant_id()`.
- [ ] Connection Pooling (Supavisor) configured for port `6543`.
- [ ] Read Replicas provisioned if targeting cross-regional multi-region readiness.

### Observability
- [ ] Logs streamed to Datadog/Sentry from `ErrorTracker`.
- [ ] Next.js Telemetry is disabled explicitly.

### Application Container/Edge
- [ ] Vercel Serverless Functions target maximum execution limit (typically 15s to 60s max depending on plan).
- [ ] All compute-heavy asynchronous operations (invoice generation, PDF creation) are delegated to `QStashWorker` patterns and do not hold up HTTP responses.

### Secrets Vault
- [ ] No `NEXT_PUBLIC_` variables contain sensitive keys.
- [ ] GitHub Environment Secrets injected securely. Only production environments contain real STRIPE, SUPABASE, or QSTASH keys.

## Final Note
Because the entire backend data access logic is securely encapsulated within the EEL (Execution Enforcement Layer) and Kernel (`/src/lib/enforcement` & `/src/lib/kernel`), this production setup guarantees isolated tenant deployments globally without requiring code mutations per region or instance.
