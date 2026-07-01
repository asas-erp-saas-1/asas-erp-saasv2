/**
 * ASAS ERP/CRM - Enterprise Enforcement Kernel (EEK)
 * Policy Manifest (Single Source of Truth)
 * 
 * This file defines the global security invariants for the entire platform.
 * It is consumed by both the Runtime Enforcers and the Compiler-Level Checkers (CI).
 */

export const EEK_POLICY = {
  version: "1.0.0",
  
  // Tenancy rules
  tenancy: {
    enforcementMode: "proxy-implicit", // All db access implicitly scoped
    targetColumn: "organization_id",
    bypassAllowedIn: ["/eek", "/src/scripts"] // Only core system can bypass
  },
  
  // Authentication & RBAC rules
  security: {
    requireWrapperOnRoutes: true,
    requireWrapperOnActions: true,
    defaultActionAuth: "strict", // All server actions require auth by default
  },

  // Financial constraints
  finance: {
    immutableTables: ["journal_entries", "accounts", "ledgers"],
    allowedMutations: ["insert"], // NO update/delete on financial tables
    ledgerGateway: "/eek/runtime/ledger.ts"
  },

  // Audit rules
  audit: {
    requireOnMutations: true, // Any POST/PUT/DELETE/PATCH must trigger audit
    asyncDelivery: true
  }
};
