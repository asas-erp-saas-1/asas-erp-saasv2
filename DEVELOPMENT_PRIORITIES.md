# Development Priorities - Quick Reference Guide

## 🔴 Critical Issues (This Week)

### 1. Add Testing Framework
**Status:** Not Started  
**Effort:** 8 hours  
**Impact:** HIGH

```bash
# Install dependencies
npm install -D jest @testing-library/react @testing-library/jest-dom ts-jest

# Create jest.config.js
# Create test files for core services
# Target: 5-10 test files covering critical paths
```

**Files to Create:**
- `jest.config.js` - Test configuration
- `src/__tests__/services/dealService.test.ts` - Deal logic tests
- `src/__tests__/services/leadService.test.ts` - Lead logic tests
- `src/__tests__/api/deals.test.ts` - API endpoint tests

---

### 2. Setup Error Tracking (Sentry)
**Status:** Not Started  
**Effort:** 4 hours  
**Impact:** CRITICAL

```bash
# Install Sentry
npm install @sentry/nextjs

# Create .env.local
NEXT_PUBLIC_SENTRY_DSN=your_key_here
```

**Implementation Checklist:**
- [ ] Add Sentry to `layout.tsx`
- [ ] Wrap API routes with Sentry middleware
- [ ] Setup Sentry project in dashboard
- [ ] Configure alerts for critical errors
- [ ] Test error capture in development

---

### 3. Remove Debug Logging
**Status:** Not Started  
**Effort:** 2 hours  
**Impact:** MEDIUM

**Affected Files:**
```typescript
// src/app/layout.tsx - Line 11
console.log('[ASAS] Booting application in', env.NODE_ENV);

// src/context/AuthContext.tsx - Multiple locations
console.error('[ASAS] Profile fetch failed...', err);

// Recommended: Create logger utility
// src/lib/logger.ts
```

**Create:** `src/lib/logger.ts`
```typescript
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (msg: string, data?: any) => isDev && console.log(`[INFO] ${msg}`, data),
  error: (msg: string, err?: any) => isDev && console.error(`[ERROR] ${msg}`, err),
  warn: (msg: string, data?: any) => isDev && console.warn(`[WARN] ${msg}`, data),
};
```

---

### 4. Create Database Migration Scripts
**Status:** Not Started  
**Effort:** 6 hours  
**Impact:** CRITICAL

**Create `/scripts` folder with:**
```sql
-- scripts/1_initial_schema.sql
-- (Export from Supabase, document structure)

-- scripts/2_create_indexes.sql
CREATE INDEX idx_leads_agency_status ON leads(agency_id, status);
CREATE INDEX idx_deals_agency_status ON deals(agency_id, status);
CREATE INDEX idx_profiles_agency ON profiles(agency_id);
CREATE INDEX idx_properties_project ON properties(project_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);

-- scripts/3_create_audit_tables.sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  changes JSONB,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- scripts/4_setup_rls.sql
-- Verify and document all RLS policies
```

---

## 🟠 High Priority (Next 2 Weeks)

### 5. Implement API Rate Limiting
**Status:** Not Started  
**Effort:** 6 hours  
**Impact:** HIGH (Security)

**Approach:** Use Upstash Redis

```typescript
// src/lib/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
});

export async function checkRateLimit(key: string) {
  const { success } = await ratelimit.limit(key);
  return success;
}
```

**Apply to:** All POST/PUT/DELETE endpoints

---

### 6. Consolidate UI Component Libraries
**Status:** In Progress  
**Effort:** 12 hours  
**Impact:** MEDIUM (Maintenance)

**Current:** Radix UI + MUI + shadcn/ui  
**Target:** Standard shadcn/ui

**Action Items:**
- [ ] Audit MUI usage (currently extensive)
- [ ] Create component migration plan
- [ ] Convert MUI components to shadcn/ui equivalents
- [ ] Remove unused Material-UI CSS
- [ ] Update `components.json` reference

**MUI to shadcn Mapping:**
```
MUI DataGrid        → TanStack Table
MUI TextField       → shadcn/ui Input
MUI Button          → shadcn/ui Button
MUI Card            → shadcn/ui Card
MUI Dialog          → shadcn/ui Dialog
```

---

### 7. Setup GitHub Actions CI/CD
**Status:** Not Started  
**Effort:** 8 hours  
**Impact:** HIGH

**Create:** `.github/workflows/ci.yml`
```yaml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level=moderate
      - uses: snyk/snyk-actions/node@master
```

---

### 8. Optimize Font Loading
**Status:** Not Started  
**Effort:** 3 hours  
**Impact:** MEDIUM (Performance)

**Current:** 3 Google Fonts (Inter, JetBrains Mono, Playfair Display)  
**Target:** 1 font (Inter) + system fonts

```typescript
// src/app/layout.tsx - UPDATE

import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  // Remove JetBrains_Mono and Playfair_Display
})

// Use CSS for fallbacks instead of multiple imports
```

---

## 🟡 Medium Priority (Next Month)

### 9. Add Structured Logging
**Status:** Not Started  
**Effort:** 8 hours  
**Impact:** MEDIUM

**Recommend:** Datadog or PostHog integration

```typescript
// src/lib/analytics.ts
export const captureEvent = (event: string, properties?: Record<string, any>) => {
  if (process.env.NEXT_PUBLIC_ANALYTICS_KEY) {
    // Send to analytics provider
  }
};

// Usage in services:
captureEvent('deal_created', { dealId, agencyId, value });
```

---

### 10. Database Query Optimization
**Status:** Not Started  
**Effort:** 10 hours  
**Impact:** HIGH (Performance)

**Review each service:**
- [ ] `dealService.ts` - Check for N+1 queries
- [ ] `leadService.ts` - Batch related queries
- [ ] `agentService.ts` - Optimize KPI calculations
- [ ] `financeService.ts` - Add query caching

**Example Improvement:**
```typescript
// BEFORE
async function getDealsWithClients(agencyId: string) {
  const deals = await db.from('deals').select('*').eq('agency_id', agencyId);
  for (const deal of deals) {
    deal.client = await db.from('clients').select('*').eq('id', deal.client_id).single();
  }
  return deals;
}

// AFTER
async function getDealsWithClients(agencyId: string) {
  return db.from('deals')
    .select('*, clients(*)')
    .eq('agency_id', agencyId);
}
```

---

### 11. API Documentation (OpenAPI)
**Status:** Not Started  
**Effort:** 6 hours  
**Impact:** MEDIUM

**Setup Swagger UI:**
```bash
npm install -D swagger-ui-react swagger-jsdoc
```

**Create:** `src/lib/swagger.ts` with endpoint definitions  
**Generate:** OpenAPI spec automatically

---

### 12. Add Monitoring & Alerting
**Status:** Not Started  
**Effort:** 6 hours  
**Impact:** HIGH

**Services to Setup:**
- [ ] Sentry for errors (Critical)
- [ ] PostHog for analytics (Important)
- [ ] Uptime monitoring (Important)
- [ ] Database slow query logs (Important)

---

## Implementation Checklist

### Week 1
- [ ] Create testing framework
- [ ] Setup Sentry
- [ ] Remove debug logging
- [ ] Create migration scripts
- [ ] Setup GitHub Actions

### Week 2
- [ ] Add rate limiting
- [ ] Optimize fonts
- [ ] Start UI consolidation
- [ ] Database indexes
- [ ] API documentation

### Week 3
- [ ] Add structured logging
- [ ] Database query optimization
- [ ] Setup monitoring
- [ ] Complete UI consolidation
- [ ] Performance benchmarks

### Week 4
- [ ] 30% test coverage
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation update
- [ ] Team training

---

## Metrics to Track

```
Before:
- Test Coverage: 0%
- Bundle Size: ~850KB
- API Response Time: Unknown
- Error Rate: Unknown
- Lighthouse Score: Unknown

After (Target):
- Test Coverage: 80%+
- Bundle Size: <500KB
- API Response Time: <100ms
- Error Rate: <0.1%
- Lighthouse Score: 90+
```

---

## Resource Requirements

| Task | Hours | Developer | Priority |
|------|-------|-----------|----------|
| Testing Framework | 8 | Senior | CRITICAL |
| Sentry Integration | 4 | Junior | CRITICAL |
| Debug Removal | 2 | Junior | CRITICAL |
| Migrations | 6 | Senior | CRITICAL |
| Rate Limiting | 6 | Mid | HIGH |
| UI Consolidation | 12 | Senior | HIGH |
| CI/CD | 8 | Mid | HIGH |
| Font Optimization | 3 | Junior | MEDIUM |
| Database Tuning | 10 | Senior | MEDIUM |
| API Documentation | 6 | Mid | MEDIUM |
| Monitoring | 6 | Mid | MEDIUM |
| **TOTAL** | **71** | | |

---

## Success Criteria

✅ **Week 2:** Testing + Error Tracking operational  
✅ **Week 4:** 30% test coverage, CI/CD working  
✅ **Week 8:** 70% test coverage, performance improved 30%  
✅ **Week 12:** 80% test coverage, enterprise-ready features

---

**Last Updated:** April 28, 2026  
**Review Frequency:** Weekly  
**Owner:** Development Team

