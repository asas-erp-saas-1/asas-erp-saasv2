# ENTERPRISE AI AGENT FABRIC

## 1. Overview
ASAS ERP empowers tenants with Autonomous AI Agents to orchestrate tasks across the CRM, pipeline, and billing limits. These agents are not chatbots; they are autonomous actors executing Kernel Commands.

## 2. Multi-Agent Coordination
- Discrete agents specialize in specific domains (e.g., `SalesAgent`, `SupportAgent`, `BillingAgent`).
- A central `AgentCommandOrchestrator` translates LLM intention arrays into strictly typed Command structures, validating them against the Kernel.

## 3. Human-In-The-Loop (HITL) Governance
- Destructive or high-value actions (e.g., `IssueRefundCommand`, `DeleteDealCommand`) require mandatory supervisor approval.
- The `HumanInTheLoopGovernor` intercepts the Agent's intent, stores it in an approval queue, and physically halts execution until a verified biological `agency_owner` signs off.

## 4. AI Auditability & Context Isolation
- Agents are treated precisely like third-party users. They possess explicit UserIDs (`ai_agent_sales_01`) and operate within standard Event Sourcing traces.
- If an agent makes a mistake, the Replay system allows absolute forensic reconstruction of the exact prompt, memory vectors, and executed commands leading to the error.

## 5. Execution Replay Safety
- Agents NEVER execute arbitrary SQL. Their output is constrained strictly to the `PayloadTranslator` which normalizes LLM JSON into Enterprise DTOs.
