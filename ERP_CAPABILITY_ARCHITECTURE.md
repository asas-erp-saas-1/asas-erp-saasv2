🧠 MISSING DOMAINS

1. Identity & Access Domain
- Business Purpose: Manage authenticated identities, tenant isolation boundaries, and fine-grained access control (RBAC).
- Entities: `User`, `Tenant` (Agency), `Role`, `Permission`, `Session`.
- Workflows: User Provisioning, Login/MFA, Tenant Provisioning, Role Assignment, Access Revocation.
- Invariants: A user must belong to exactly one tenant context per session. The `owner` role cannot be revoked if it is the last owner of a tenant.
- Ownership Boundaries: Sole owner of Authentication and Authorization definitions. Never owns business logic. Provides context (`KernelIdentity`) to all other domains.

2. Communication Domain
- Business Purpose: Orchestrate omni-channel interactions (Email, WhatsApp, SMS) bridging agents and clients.
- Entities: `Message`, `ConversationThread`, `Template`, `Notification`.
- Workflows: Message Dispatch, Inbound Routing, Template Rendering, Delivery Tracking.
- Invariants: All outbound communications must link to a recognized `client_id` or `lead_id`. Messages logged are immutable once executed.
- Ownership Boundaries: Owns external gateway integrations (Twilio, SendGrid, Meta). Consults Deal/Lead domains but does not mutate them.

3. Documents & Contracts Domain
- Business Purpose: Handle generation, signature, versioning, and secure storage of legal/commercial documents.
- Entities: `Document`, `Template`, `SignatureRequest`, `Attachment`.
- Workflows: Contract Generation, E-Signature Orchestration, Verification, Expiration Tracking.
- Invariants: A signed document is cryptographically locked and immutable. Any amendment creates a new version.
- Ownership Boundaries: Owns Blob Storage links and document state. Validated by Pricing/Deal domains before generation.

4. Calendar & Scheduling Domain
- Business Purpose: Orchestrate time-bound events, agent availability, and physical property visits.
- Entities: `Event`, `Visit`, `Reminder`, `AvailabilityRecord`.
- Workflows: Visit Scheduling, Conflict Resolution, Attendance Marking, Follow-up Triggering.
- Invariants: Double-booking the same property at the same time is forbidden. An agent cannot be scheduled concurrently across distinct physical locations.
- Ownership Boundaries: Strictly owns time allocation. Emits events to Deals and Leads domains (e.g., `VisitCompleted`).

5. Pricing & Commercial Rules Domain
- Business Purpose: Enforce financial validation, generate installment plans, and govern discount approvals.
- Entities: `PriceBook`, `DiscountRule`, `InstallmentSchedule`, `Promotion`.
- Workflows: Quote Generation, Discount Approval, Payment Plan Structuring.
- Invariants: Final agreed price cannot fall below the minimum threshold without explicit Manager approval. Total installments must equal the outstanding deal balance.
- Ownership Boundaries: The sole arbiter of financial math. Injected into the Deal Domain during quote configuration. Never owns actual payments.

6. Reporting & BI Domain
- Business Purpose: Provide materialized operational intelligence, historical trend analysis, and executive forecasting.
- Entities: `MetricSnapshot`, `DashboardConfig`, `FunnelProjection`.
- Workflows: Nightly Aggregation, Real-time Metric Counting, Report Export.
- Invariants: Read-only views of the platform. Never mutates operational data.
- Ownership Boundaries: Owns Data Warehouse / Read Replicas and analytical queries. Isolated entirely from OLTP processing.

---

⚙️ MASTER WORKFLOW ENGINE

Workflow Ownership & Responsibilities
- The `Orchestration Engine` acts as a Saga Coordinator. It is a central, resilient state machine for distributed, long-running business processes.
- Cross-Domain Coordination: Listens to initiating events (e.g., `ReservationRequested`) and synchronously or asynchronously coordinates validations across Pricing, Document, and Deal domains.
- Workflow Persistence: Every saga execution is stored in `active_workflows` with its current state (`step_index`, `payload`, `status`).

Retry Handling & Compensation Logic
- Orchestrator relies on temporal queues. If step 2 (Call External Checking) fails via 5xx error, it schedules a retry with exponential backoff.
- Compensation (Sagas): If Step 3 (Generate Contract) fails permanently, the Engine executes Compensating Transactions for Steps 2 and 1 (e.g., releasing block on Property, refunding Reservation Fee).

Examples:
- Reservation Approval: Lead clicks "Reserve" -> Engine locks Property (Inventory Domain) -> Bills Reservation Fee (Billing Domain) -> Triggers Manager Approval Queue (Identity/Task Domain).
- Deal Closing Sequence: Check Financial Balance -> Trigger Final Contract Signing -> Convert Property Status to 'Sold' -> Dispatch Commission Calculation.

---

📡 COMMUNICATION ARCHITECTURE

WhatsApp & Email Workflows
- Managed by `Communication Orchestrator`. Uses a normalized `Message` schema mapping to specific providers.
- Conversation Timelines: Inbound webhooks from WhatsApp match `phone_number` to `client_id`, injecting messages directly into the centralized CRM Feed.

Delivery Guarantees & Retry Logic
- System uses "At-Least-Once" delivery from the outbox to external gateways. 
- Retry Logic: Provider timeouts hit dead-letter queues after attempting 5 standard intervals (1m, 5m, 15m, 1h, 12h).

Ownership
- Solely owns tracking of read-receipts, bounces, and deliverability. Exposes `MessageSent` events to update CRM Activity feeds.

---

📄 DOCUMENT ENGINE

Contract Templates & Generation
- Documents are initialized via dynamic templates mapped to payload variables provided by `Pricing` and `Deal` domains (Variables: `client_name`, `agreed_price`, `installment_terms`).
- Generated PDFs are stored in private Cloud buckets, generating short-lived signed URLs for retrieval.

Signature Workflows & Verification
- State Machine: `draft` -> `sent_for_signature` -> `signed_client` -> `countersigned_agency` -> `verified`.
- Immutable Storage: Once countersigned, the hash of the document is locked to the deal record. Updates are strictly forbidden.

Versioning
- Any change in deal terms invalidates current `sent_for_signature` documents, incrementing `version_id` to generate V2.

---

📅 SCHEDULING ENGINE

Property Visits & Scheduling Logic
- Synchronization Rules: Agents connect Google/Outlook calendars; the engine syncs bi-directionally to block times.
- Availability Logic: Buffer times (e.g., 30 mins) strictly enforced between distinct geographic visits.

Reminders & No-Show Detection
- 24 hours prior: Auto-dispatches WhatsApp/Email confirmation to Client.
- 1 hour post-visit: Dispatches internal task for Agent: "Log Visit Result". If unlogged for 48h, triggers "Potential No-Show / Neglect" escalation to Manager.

---

💰 PRICING ENGINE

Dynamic Pricing & Installment Plans
- Logic: Takes `base_price` from Inventory. Applies promotional vectors. Configures temporal milestones (e.g., 20% on reservation, 30% on foundation, 50% on handover).
- Approval Workflows: Any deviation > 5% base discount pauses the workflow, placing quote in `pending_commercial_approval` state, pinging Manager via `Task Domain`.

Rule Ownership & Validation
- Ensures total fractional breakdowns exactly equal `100.00%`. Guards against "penny-drop" rounding errors during contract generation.

---

📊 BI & REPORTING

Analytics Pipelines & Materialized Projections
- Operational Intelligence: Streams Outbox events into a ClickHouse/Redshift equivalent, avoiding queries on the master Postgres instance.
- Materialized Views: Nightly crons construct `vw_agent_performance_daily` and `vw_revenue_pipeline_monthly`.

Read Models & Executive Dashboards
- Dashboards connect exclusively to Read Replicas/Materialized Views. Ensure ZERO impact on transaction speed.

---

🏢 ERP CAPABILITY MAP

1. Lead Management
- Owner Domain: CRM / Leads
- Participating Domains: Communication, Scheduling.
- Core Workflows: Capture, Scoring, Assignment, Nurturing.
- Generated Metrics: Conversion Rate, Time-to-Contact, Lead Volume by Source.

2. Sales Execution
- Owner Domain: Deals & Sales Pipeline
- Participating Domains: Documents, Pricing, Communication.
- Core Workflows: Negotiation, Quoting, Contract Signing, Closing.
- Generated Metrics: Deal Velocity, Average Deal Value, Win/Loss Ratio.

3. Financial Operations
- Owner Domain: Financials & Payments
- Participating Domains: Pricing, Deals.
- Core Workflows: Payment Collection, Ledger Reconciliation, Default Management.
- Generated Metrics: Cash Collected vs Pledged, Overdue Balances, Revenue Realization.

4. Inventory Governance
- Owner Domain: Properties & Inventory
- Participating Domains: Calendar, Sales Execution.
- Core Workflows: Listing, Reserving, Price Adjustment, Handover.
- Generated Metrics: Average Days on Market, Occupancy/Sell-Out Rate.

5. Commission Operations
- Owner Domain: Commissions
- Participating Domains: Financials, Identity.
- Core Workflows: Calculation, Verification, Payout Release.
- Generated Metrics: Total Commissions Paid, Agent Earnings Distribution.

6. Client Retention
- Owner Domain: Clients
- Participating Domains: Communication, Reporting.
- Core Workflows: Post-Sale Surveys, Cross-Selling, Issue Resolution.
- Generated Metrics: NPS, Repeat Buyer Rate, Support Ticket Count.

7. Executive Reporting
- Owner Domain: Reporting & BI
- Participating Domains: ALL
- Core Workflows: Board Pack Generation, Goal Tracking, KPI Broadcasting.
- Generated Metrics: Platform Health, Organizational EBIT, Global Conversion Funnel.

---

🚨 ARCHITECTURAL RISKS

1. Saga Orchestrator Complexity (Master Workflow Engine)
- Risk: The Orchestrator can become a monolithic bottleneck and single point of failure. If the Saga Engine goes down, all multi-step business operations halt.
- Mitigation: Engine must be highly available, persistent, and decoupled (e.g., Temporal.io / AWS Step Functions patterns) rather than baked into a raw Node.js API process.

2. Document Desynchronization
- Risk: A contract is generated, but immediately after, a Manager approves a new discount in the Pricing Engine. The printed PDF no longer matches the database payload.
- Mitigation: Strong Optimistic Locking across domains. Generating a document locks the Deal configuration (`pricing_locked = true`). Changing pricing requires voiding the active document first.

3. "Two Generals" Communication Problem
- Risk: We charge a credit card for a Reservation successfully, but the connection drops before we update our DB, or before we notify the client, causing "Ghost charges".
- Mitigation: Strict adherence to Idempotency Keys provided to gateways (Stripe/Bank APIs) and using the database outbox exclusively as the transaction boundary.

4. Real-time Dashboard Load
- Risk: Computing live pipelines heavily taxes the DB, bringing transactional inserts to a crawl.
- Mitigation: Dashboards must query pre-computed aggregates (`vw_pipeline`) updated asynchronously, NOT `SELECT SUM(prices)` directly on hot tables on every page load.
