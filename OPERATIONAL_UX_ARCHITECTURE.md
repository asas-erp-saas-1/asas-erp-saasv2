# OPERATIONAL UX & INTERFACE ARCHITECTURE

## 1. The "Anti-Enterprise" UX Doctrine
The UI must be stripped of vanity "SaaS" aesthetics. We are replacing passive data consumption with active, friction-free execution. 
- **No Tables on Mobile:** Grids and tables fail in the field. Data is represented as actionable cards.
- **No Horizontal Scrolling:** Everything flows vertically.
- **No "Save" Buttons:** State updates instantly via CQRS commands upon selection.
- **Zero-Type Defaults:** Notes, updates, and deal movements must be achievable via predefined chips, toggles, or voice-to-text.

## 2. The Sales Agent Mobile Loop (The "Action Feed")
Agents will no longer navigate deep into menus to find their work. The home screen is a prioritized, TikTok-style vertical feed of *Next Best Actions*.

### Interface Anatomy: The Urgent Action Card
- **Visual hierarchy:** Highlights *why* this lead is on screen ("New Web Lead - 5 mins ago", "No Contact in 48h").
- **Primary CTAs (Massive Touch Targets):**
  - **[ WhatsApp ]** - Deep links to `wa.me/phone?text=...` with pre-filled, property-specific context in Arabic/French.
  - **[ Call ]** - Native `tel:` link.
- **Post-Action State (The "Swipe-to-Log"):** 
  - Once returning to the app from WhatsApp/Call, the card flips to ask for outcome: `[No Answer]` `[Sent Info]` `[Meeting Booked]` `[Lost]`. One tap completes the execution trace and clears the card.

## 3. The Property Portfolio "On-The-Go"
Field agents need to send assets while standing outside a property or stuck in Algiers traffic.
- **Search-First:** Global sticky search bar supporting typos and localized neighborhood names.
- **Media Optimization:** Direct integration with mobile camera. Image uploads are aggressively down-sampled on the client to save bandwidth before hitting the outbox.
- **Instant Sharing:** A prominent "Share to WhatsApp" button on every property. Instead of generating heavy PDFs, it generates an OpenGraph-optimized public lightweight URL that renders a beautiful summary card directly in the client's WhatsApp chat.

## 4. Manager "Exception" Dashboard (Desktop/Tablet)
Agency owners lack time to interpret complex pivot tables. The dashboard only displays what is broken and what is closing.
- **The Red Zone (Urgent Failures):**
  - "12 Leads Untouched (> 24h)"
  - "3 High-Value Deals without Next Steps"
- **The Green Zone (Revenue Engine):**
  - "Expected Commission This Week"
  - "Offers Pending Signature"
- **One-Click Override:** Managers can click an agent's neglected lead and reassign it instantly with a single button.

## 5. UI Component Purge List
To achieve sub-second operational speed on low-end devices, the following "Enterprise UI" elements are slated for removal from the mobile DOM:
- **Kanban Boards on Mobile:** Drag-and-drop on 6-inch screens is miserable. Mobile gets the Action Feed. Kanban is restricted to Desktop/Tablet.
- **Rich Text Editors (WYSIWYG):** Removed entirely for agent notes. Replaced with raw text areas or native OS voice-dictation hooks.
- **Multi-Step Modals:** Flattened into bottom-sheet overlays that don't block the underlying context.
- **Complex Filters:** Dropdowns with 20 options are replaced by 4 predefined smart-filters: "My Leads", "Hot", "Overdue", "Unassigned".

## 6. Real-Time Sync & Offline Degradation
If an agent marks a lead as "Called" while driving through an internet dead zone, the UI must immediately reflect success (Optimistic UI update). The CQRS command is queued in `localStorage` and flushed to the `/outbox` endpoint the second a 3G/4G connection is restored. The agent's workflow is never interrupted by a loading spinner.
