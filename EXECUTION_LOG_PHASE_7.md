# PHASE 7: B2B REAL ESTATE DEVELOPER (PROMOTEUR) REALITY - PROJECTS & PAYMENT SCHEDULES

## 1. Developer Project Management (Programmes)
* **Operational Reasoning:** A real estate developer (promoteur) structures off-plan property sales around macro "Programs" or "Projects" (e.g. Résidence Les Jasmins). Individual properties (lots) must be governed together to ensure synchronized construction steps.
* **Friction Analysis:** Without program-level aggregation, managing 100 VEFA deals requires manual, chaotic follow-ups, resulting in delayed fund calls.
* **Implementation:** 
  - Wired the `projects` API layer (GET, POST).
  - Wrote a new `ProjectCreateModal` natively into the Projects Dashboard so agency managers can rapidly provision new programs without relying on backend admins.

## 2. The Commercial Mix Layout (Overview Reality)
* **Operational Reasoning:** In a daily routine, the Developer's sales director needs to visualize exactly what is sold vs available across buildings or property types at a glance.
* **Implementation:** 
  - Constructed `[id]/page.tsx` that clusters related properties and renders a "Commercialization Grid" translating real-time `status` flags (`sold`, `reserved`, `available`) into visual badges.
  - Deployed Financial aggregates mapping 'CA Sécurisé' (Secured Revenue vs Estimated Volume).

## 3. VEFA Payment Schedules (Appels de Fonds)
* **Operational Reasoning:** Off-plan purchasing legally requires payments spread out based on exact construction completion milestones (Foundation, Gros Oeuvre, Hors d'eau). 
* **Implementation:** 
  - Developed the "Échéancier Global des Appels de Fonds (VEFA)" section in the project detail view.
  - Serves as the Command Dispatch Center for triggering mass payment requests directly across all attached deals simultaneously when a physical milestone is validated by the construction crew.

## Architectural Enforcement Check:
- **No Database Modification Required:** Used existing CQRS schemas (`projects`, `properties`) perfectly without migrating or introducing unsafe foreign keys.
- **Isolating Mutators:** The API properly filters based on project `id` returning deeply nested relations (`properties(*)` array) avoiding N+1 read cascades on the frontend.
