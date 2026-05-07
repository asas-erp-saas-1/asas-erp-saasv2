🧠 ROLE OPERATING SYSTEMS

**1. AGENT OS (DEEP EXECUTION)**
*   **Primary Mission**: Close deals and maintain absolute pipeline momentum.
*   **Daily Workflow Loop**: The Agent does NOT open a "list of leads." The Agent opens the **Command Center**. The screen automatically feeds the next most critical action based on SLA and financial impact.
*   **Operational KPIs**: Time-to-first-contact, Visit-to-Offer conversion, Scheduled tasks completion rate.
*   **Allowed Transitions**: Qualify lead, Log visit, Request reservation, Submit contract.
*   **Forbidden Actions**: Delete lead, Modify agreed price post-reservation, Cancel deal (without manager).
*   **Agent Workflow Lifecycle**:
    *   *Lead Assigned* → SLA Timer: *2 Hours*. Action: **Call/WhatsApp**.
    *   *First Contact* → Validation: Must log structured outcome (Interested, Not Interested, Later).
    *   *Qualification* → Required fields: `budget_min`, `budget_max`, `timeline`.
    *   *Visit* → Automation: Trigger geo-location prompt or post-visit note prompt 1hr after scheduled time.
    *   *Negotiation* → Blocked condition: Cannot drop price below base without `Manager Approval`.
    *   *Reservation* → Required fields: ID scan, Proof of transfer.
    *   *Contract* → Validation: Admin must verify ID before generation.
    *   *Collection & Closing* → UI Action: Handoff to Finance.

**2. MANAGER OS (CONTROL & UNBLOCK)**
*   **Primary Mission**: Unblock bottlenecks, prevent pipeline leakage, and enforce commercial margins.
*   **Main Dashboard**: "Control Tower" – highlighting anomalies, not standard data. (e.g., "3 Deals expiring today", "Agent X has 5 overdue calls").
*   **Daily Workflow Loop**: Process Approvals → Reassign stalled leads → Review at-risk deals.
*   **Operational KPIs**: Pipeline velocity, Discount impact on margin, Team win rate. 
*   **Escalation Flows**: If an Agent misses an SLA by 24h, ownership temporarily flags to the Manager for reassignment.

**3. ACCOUNTANT OS (FINANCIAL INTEGRITY)**
*   **Primary Mission**: Ensure financial reconciliation and strictly enforce the ledger.
*   **Main Dashboard**: "Financial Console" – Pending verifications, overdue installments, unreleased commissions.
*   **Daily Workflow Loop**: Match bank transfers to `Pending Payments` → Generate receipts → Unlock `Closed` status for Deals.
*   **Locking Rules**: Accountants cannot edit Deal parameters. They only mutate Ledger status.

**4. ADMIN/OWNER OS (GOVERNANCE & GROWTH)**
*   **Primary Mission**: Agency macro-management, risk mitigation, and configuration.
*   **Operational KPIs**: Cashflow forecasting, Overall EBIT, Agent ROI.

**5. CLIENT PORTAL OS (TRUST ENGINE)**
*   **Primary Mission**: Total transparency and low-friction payments.
*   **Main Dashboard**: "My Investment" – 0-100% Progress bar of their acquisition.
*   **Interactions**: `Pay Installment` (Stripe integration/Bank coordinates), `Schedule Visit`, `Download Contract`, `Open Support Ticket`.

---

⚙️ COMMAND ENGINE

The ERP is driven by the `Command Orchestrator`, which dynamically generates the "Next Best Action" for every user.

**Command Priority Levels:**
*   🔴 **Critical (Score 90-100)**: Deal at risk of cancellation, Unsigned contract expiring in 12h, Payment overdue by 48h. *Must be completed before other actions are unlocked.*
*   🟠 **High (Score 70-89)**: New uncontacted lead (SLA ticking), Scheduled visit in 2h.
*   🟡 **Medium (Score 40-69)**: Follow-up on sent proposal, Upload missing KYC document.
*   ⚪ **Low (Score 10-39)**: Wish client Happy Birthday, General pipeline cleanup.

**Command Routing:**
*   *Engine* computes: `base_priority_weight + (hours_elapsed * decay_multiplier)`.
*   *Routing*: Directed specifically to `assigned_to` ID. If `time_in_queue > 24h`, duplicate command routes to Manager's queue.

---

🔁 OPERATIONAL STATE MACHINES

**1. Lead Lifecycle**
*   **States**: `unassigned` → `new` → `contacted` → `qualified` → `converted` || `lost`
*   **Guards**: Cannot move to `qualified` without `budget`.
*   **Side Effects**: Moving to `converted` mechanically spawns a `Deal` and moves client to `CRM`.

**2. Deal Lifecycle**
*   **States**: `draft` → `negotiating` → `pending_reservation` → `reserved` → `contract_pending` → `live` → `closing` → `closed`.
*   **Guards**: `pending_reservation` to `reserved` REQUIRES Financial verification of reservation fee.
*   **Side Effects**: Reaching `closed` spawns `Commission` record.

**3. Visit Lifecycle**
*   **States**: `requested` → `scheduled` → `completed` || `no_show` || `cancelled`.
*   **Rollback Logic**: If cancelled, the Engine auto-generates a task to "Reschedule Visit" 24h later.

**4. Contract Lifecycle**
*   **States**: `draft` → `awaiting_signatures` → `fully_signed` → `verified`.
*   **Compensations**: If terms change while `awaiting_signatures`, document is auto-voided, reverting to `draft`.

**5. Payment Lifecycle**
*   **States**: `scheduled` → `pending_verification` → `succeeded` || `defaulted`.
*   **Audit**: State transitions on payments instantly write to `ledger_audit`.

**6. Commission Lifecycle**
*   **States**: `unearned` → `pending_release` → `approved` → `paid`.

**7. Reservation Lifecycle**
*   **States**: `blocked` (24h) → `secured` → `expired`.
*   **Compensations**: If `expired`, trigger Property Inventory unblocking.

**8. Support Ticket Lifecycle**
*   **States**: `open` → `agent_reply` → `client_reply` → `resolved`.

---

📋 TASK ORCHESTRATION

*   **DB Structure**: 
    `tasks (id, command_type, entity_ref, status, due_at, urgency_score, locked_by)`
*   **State Model**: `pending` → `active` (locked by user session so two agents don't call the same lead) → `completed` || `escalated`.
*   **Auto-Generation**: 90% of tasks are System-Generated via Event Subscriptions, 10% are User-Created.
*   **Escalation**: SLA Tracking engine runs a CRON every 5 mins. If `due_at < NOW() - 24h`, status flips to `escalated` and routes to Manager dashboard.

---

🔔 NOTIFICATION ARCHITECTURE

*   **Event Routing**: `OrderPaid` Event → `NotificationRouter` → Maps to Preferences (e.g., WhatsApp + In-App).
*   **Templates**: Strongly typed payloads `{{client_name}} ton paiement de {{amount}} est validé.`
*   **Deduplication**: Redis key `notif_hash:${tenant}:${event}:${entity}` with a 15-minute TTL blocks duplicate webhooks from spamming the client.
*   **Throttling**: Marketing/Promo messages capped at 1 per week per client. Transactional messages mapped to 1:1 user actions bypass throttling.

---

📊 MANAGER CONTROL SYSTEM

*   **Intervention Workflows**: 1-click "Override Assignee" on stalled leads.
*   **Approval Engine**: 
    *   *Trigger*: Agent configures quote with 8% discount (Max allowed is 5%). Deal locks in `pending_commercial_approval`. 
    *   *Approval Chain*: Sub-Manager → Tenant Owner. 
    *   *Timeout*: Auto-expires back to agent as "Rejected (Timeout)" after 48h.
    *   *Audit*: Manager's signature is permanently hashed to the deal's `discount_authorization` field.

---

💰 FINANCIAL OPERATIONS ENGINE

*   **Accounting State Machine**: Strictly append-only. 
*   **Reconciliation Logic**: A payment is NOT considered revenue until Accountant clicks `Reconcile` matching a mapped bank transaction ID.
*   **Locking Rules**: Once an installment is reconciled, the `Deal.agreed_amount` is structurally locked. Attempts to change it will throw a `LockedLedgerException`.

---

👤 CLIENT PORTAL SYSTEM

*   **Payment Visibility**: A visual tree of installments (Paid, Next Due, Future). 
*   **Contract Center**: Read-only vault of counter-signed PDFs.
*   **Milestone Updates**: Real-time push notifications ("Construction phase 2 started!").

---

🧩 UX FAILURE ANALYSIS

*   **Dead Screens**: The traditional "List of Leads table" is a cognitive failure. Agents stare at lists not knowing who to call.
*   **Actionless UI**: Viewing a deal without an explicit "Next Step" button leads to abandonment. 
*   **Redesign Execution**: 
    *   **NO MORE TABLES as the primary view**. 
    *   **The Command Feed**: Left rail is a vertical feed of Action Cards (e.g., "[CALL] John Doe - SLA 1h remaining").
    *   **Clicking a card** opens the Execution Context (Dialer, Script, Log Notes) overlaying the Deal data. Action → Decision → Execution.

---

🗄️ DATABASE IMPACT

*   **Tables Added**: `erp_commands`, `approvals`, `task_escalations`, `client_portal_sessions`.
*   **Indexes**: Real-time compound indices on `(status, due_at, assigned_to)` for sub-millisecond Command Feed querying.
*   **Queues**: `command_dispatch_queue` (Postgres/Redis) for generating scheduled tasks.
*   **Event Stores**: `lifecycle_events_log` for tracking exactly when entities changed states.

---

🔌 API & REALTIME IMPACT

*   **Commands (Mutations)**: `POST /api/execute-command` (Standardized entry point passing `command_id` and `payload`). Checks RBAC, processes State Machine, commits transaction.
*   **Queries**: `GET /api/command-center/feed` (Returns prioritized, scored array of tasks).
*   **Realtime**: Supabase WebSocket broadcasts changes to the `erp_commands` table so the Agent's feed updates without a refresh when a new hot lead arrives.

---

🚨 EXECUTION RISKS

1.  **Command Overload (The "Red Dashboard" Problem)**: If the Engine generates too many tasks, the Agent will experience alarm fatigue. *Mitigation: Implement hard caps on feed visibility (Top 5 actions only) and aggressive auto-archiving of low-priority tasks.*
2.  **State Machine Deadlocks**: If a Deal enters `contract_pending` but the client never signs, and there is no timeout mechanism, the property remains permanently blocked from the market. *Mitigation: Strict TTL (Time-To-Live) on blocking states.*
3.  **Action Paralysis**: If an Agent encounters a broken state (e.g., missing required data to log a visit), they cannot clear the Command. *Mitigation: Every command must feature a "Block/Flag to Manager" emergency escape hatch.*
