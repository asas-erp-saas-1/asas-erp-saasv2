// src/lib/kernel/bootstrap.ts

/**
 * Kernel Bootstrap Loader.
 * Imports all domains so they register their EventHandlers to the EventBus.
 */

import './core';
import './inbox';
import './approvals';

// Load Domains (Triggers EventHandler Registrations)
import '@/domains/crm/module';
import '@/domains/finance/module';
import '@/domains/construction/module';
import '@/domains/legal/module';

console.log("[KERNEL] ASAS Kernel ERP Engine Initialized");
console.log("[KERNEL] EventBus loaded and Domain Handlers registered");

export const initializeKernel = () => {
    // Perform any DB-sync or chron-job setups here
    return true;
};
