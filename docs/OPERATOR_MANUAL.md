# ASAS RE-OS - Operational Manual (Playbook)

Welcome to the **ASAS Real Estate Operating System**. This document outlines the operational patterns, architecture rules, and day-to-day workflow logic designed for your agency.

## 1. Zero-Trust Access & Identity (RBAC)

The system automatically categorizes users into three rigid roles (`owner`, `manager`, `agent`).
- **Owner / CEO:** Full visibility. Access to the global overview, financial performance metrics, agent leaderboard (`/dashboard/agents`), and the system settings panel.
- **Agent:** Shielded view. Their dashboard defaults directly to their Action Feed. They cannot see other agents' leads, the company’s global balance, or aggregate developer fees. Their bottom navigation is optimized for field-execution: **Tâches**, **Leads**, **Deals**, **Biens**.

## 2. PWA (Mobile-First Workflow)

The CRM is fully optimized as a Progressive Web App (PWA).
- **Home Screen Installation:** Ask agents to open the CRM in Safari (iOS) or Chrome (Android) and tap **"Add to Home Screen"**. This creates an app icon natively on their phone.
- **Offline Mutability:** In areas with poor 3G/4G coverage (visiting a concrete site), any notes logged or leads added will be cached by the `sw.js` Service Worker and pushed to the base automatically when the connection is restored. Let them type freely.
- **WhatsApp Integration:** Instead of complex in-app messaging, any communication with clients defaults to instant `wa.me` links via the lead or deal details.

## 3. The CRM Lifecycle

1. **Leads (`/dashboard/leads`)**: Any incoming request (Facebook, phone, walk-in) must instantly be logged here. Keep it fast. Unqualified requests sit here until categorized.
2. **Clients (`/dashboard/clients`)**: Once a lead expresses a solid intent or if a walk-in is a direct buyer, they become a formalized entity tied to your `agency_id`.
3. **Properties (`/dashboard/properties`)**: Inventory is cleanly separated. You can browse them through the catalog.
4. **Deals (`/dashboard/deals`)**: When a Client reserves a Property, a Deal is instantiated. Deals track the lifecycle (Reservation, First Deposit, Notary Signature).
5. **Commissions & Finance (`/dashboard/finance`)**: Closed deals emit immutable Domain Events driving the Ledger and triggering your overall commission dashboards.

## 4. Staging vs Production (Provisioning)

If you are testing the platform in a blank staging environment:
1. Log in as an **Owner** or **Manager**.
2. Navigate to **Paramètres**.
3. Scroll down to **Validation Staging**.
4. Click **Injecter Données de Test**. 
This instantly provisions a fictional Promoteur, un Projet (Résidence), multiple Biens (F3, F4, etc.), Clients, and Leads. *Do not run this on your production Supabase database.*

## 5. Architectural Laws (For Developers)

If developing this CRM further, preserve the following Execution Rules:
- **CQRS Pattern:** Direct UI mutation is barred. Any state change must use the `/api/command-gateway` which wraps Supabase transactions idempotently.
- **RLS & Multi-Tenant Isolation:** `agency_id` is automatically injected at the Kernel level. Code your components transparently; the Edge handles the tenant scope.
- **Tailwind Only:** No abstract UI libraries allowed. Visuals must be strictly maintained via `Tailwind CSS` to keep the operational speed minimal and lightweight under poor networks.

---
**ASAS Architecture Governance Board**
