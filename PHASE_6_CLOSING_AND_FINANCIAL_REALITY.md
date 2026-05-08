# PHASE 6: DEAL CLOSING, FINANCES, AND NOTARY REALITY

## 1. The Notary (Notaire) Workflow Bridge
* **Operational Reasoning:** In the Algerian and North African real estate lifecycle, getting an agreement between buyer and seller is only 50% of the battle. The remaining 50% is navigating the Notary (Notaire) process and document collection (Livret Foncier, Acte de Propriété, Certificat de Négativité).
* **Friction Analysis:** Deals frequently collapse during the Notary phase because agents lose track of missing documents or fail to follow up with the administration.
* **Implementation:** 
  - Introduce a specialized "Notary Pending" stage in the deal lifecycle.
  - Instead of generic notes, this stage displays a simple, localized **Document Checklist** on the mobile UI. 
  - One-tap buttons to ping the Buyer or Seller via WhatsApp: "Please send a photo of your ID to proceed with the Notary."
* **UX & Mobile Implications:** Transforms a nebulous administrative waiting period into clear, binary mobile checkboxes.
* **Support Implications:** None.
* **Business & Revenue Impact:** Reduces deal collapse rate. Accelerates the time from "Handshake" to "Cash in Bank."
* **Implementation Priority:** P1
* **Expected ROI:** Higher percentage of agreed deals successfully crossing the finish line.

## 2. Multi-Agent Commission Transparency
* **Operational Reasoning:** Real estate agencies suffer from toxic internal disputes regarding who gets what percentage of a commission (e.g., Agent A listed the property, Agent B brought the buyer, the Agency takes a cut).
* **Friction Analysis:** Left to verbal agreements or post-closing math, commission disputes destroy agency morale and cause top performers to leave.
* **Implementation:** 
  - **Automated Split Engine:** When a deal enters the "Offer Accepted" stage, the system forces the assignment of the "Listing Agent" and "Closing Agent."
  - The system projects the exact DZD (Dinar) amount owed to each party directly onto their mobile Action Feed ("Pending Commission: 150,000 DZD").
  - Mathematical finality: Once the Manager hits "Mark as Closed," these numbers are locked immutably.
* **UX & Mobile Implications:** Highly visible, motivating financial numbers pinned to the top of the agent's screen.
* **Business & Revenue Impact:** Drives agent motivation and retention through extreme financial transparency and trust.
* **Implementation Priority:** P1
* **Expected ROI:** Lower agent turnover, higher overall sales drive.

## 3. Offline Cash & Deposit (Avance) Tracking
* **Operational Reasoning:** The Algerian real estate market operates heavily on cash and cash deposits ("Avance" or "Arrhes") to secure a property before closing.
* **Friction Analysis:** Financial ledgers in standard CRMs assume credit cards or bank transfers via Stripe/Plaid. This is structurally incompatible with North African operational reality.
* **Implementation:** 
  - Introduce an "Avance Logged" action.
  - The agent taps "Log Deposit" -> enters the cash amount -> snaps a photo of the physical receipt or handwritten note.
  - The Manager receives an immediate urgent push notification to physically verify the cash is in the office safe ("Acknowledge Receipt").
* **UX & Mobile Implications:** Replaces complex accounting software with a simple "Take a Photo of the Cash/Receipt" workflow.
* **Support Implications:** Prevents "lost money" disputes that traditionally require support audits.
* **Business & Revenue Impact:** Protects agency revenue from mismanagement and fraud. Secures buyer commitment faster.
* **Implementation Priority:** P0 (Highest Security Priority)
* **Expected ROI:** Zero lost deposits; ironclad financial audit trails.

## 4. Finalizing the "Dead Deal" (Lost Reason Capture)
* **Operational Reasoning:** Understanding why deals die is the only way an agency owner can fix their business. 
* **Friction Analysis:** If you force agents to type a 50-word essay on why a deal failed, they will just mark it "Lost" and leave it blank. You will never know if your prices are too high or if the properties are bad.
* **Implementation:** 
  - When dragging/marking a deal as "Lost", require a one-tap categorical selection: `[Price Too High]` `[Lost to Competitor]` `[Financing Failed]` `[Seller Backed Out]`.
  - No typing allowed. Just one tap.
* **UX & Mobile Implications:** 1-second friction addition to closing a failed deal, yielding massive analytical value.
* **Implementation Priority:** P2
* **Expected ROI:** Deep strategic insights for agency owners to adjust stock acquisition strategies.

## 5. Architectural Alignment Check
This phase relies entirely on the existing enterprise foundations:
- **CQRS & Event Sourcing:** `DepositLoggedEvent`, `DealClosedEvent`, `CommissionLockedEvent`. Because every financial milestone is an immutable event, the agency has a perfect, tamper-proof financial audit trail.
- **Tenant Isolation:** Cash logs are strictly bound by RLS `agency_id`, ensuring absolute financial privacy.
- **Zero-Trust Security:** An agent logging a deposit (`DepositLoggedEvent`) cannot dispatch a `DepositVerifiedEvent`. Only the Agency Owner role can dispatch the verification command, enforced deeply by the Kernel's Role-Based Access Control logic. We use enterprise security to solve physical cash handling reality.
