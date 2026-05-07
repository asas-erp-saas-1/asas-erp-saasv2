# ECONOMIC REALITY & FINOPS REPORT

Theoretical multi-region active/active event-sourcing with AI orchestration burns massive capital. We must map the financial reality.

## 1. Infrastructure Burn (Vercel vs Cloud Run)
- **Reality:** Running outbox polling, event processing, and slow saga orchestrations on Vercel Edge functions is financially suicidal. Serverless functions charge per ms. Waiting for third-party APIs (Stripe, Twilio) racks up idle execution costs.
- **Action:** Move ALL asynchronous workers, background processors, and Replay engines to Google Cloud Run or AWS ECS Fargate, where compute can be provisioned continuously with predictable pricing, utilizing concurrency mapping (1 container processing 80 requests simultaneously).

## 2. Storage Growth Vectors
- **Reality:** The `outbox_events` table will grow exponentially. 1 million events at 2KB average = 2GB. In 3 years, this scales to terabytes, blowing out Supabase SSD storage costs.
- **Action:** The `ImmutableStreamArchiver` is critical. Events > 90 days old MUST be migrated to AWS S3/GCS. Storage costs drop by ~90%.

## 3. Active-Active Economics
- **Reality:** Running two synchronized Postgres clusters globally with cross-region logical replication doubles the DB cost + incurs massive cross-region egress data transfer fees.
- **Action:** Downgrade to **Active-Passive (Multi-AZ in single region)**. RTO < 15 mins is perfectly acceptable for ERPs. Pure Active/Active is prestige architecture that destroys margins without matching business value.

## 4. AI Inference Costs
- **Reality:** Agents running autonomously against the event stream will burn Gemini API tokens iteratively.
- **Action:** Enforce hard `Context Limits`. Truncate Outbox history provided to AI. Use cheaper models (`gemini-8b-flash`) for routing, saving `gemini-1.5-pro` exclusively for complex synthesis.
