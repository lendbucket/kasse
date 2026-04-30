# KASSE VERTICAL SPECS
## Business-Type-Aware Feature Configuration

**Version:** 1.0 | **Status:** PLANNING

---

## OVERVIEW

During onboarding, the user selects their business type. Kasse configures itself accordingly — same codebase, different feature flags, different default services, different KPIs, different AI prompts, different booking flow.

The business type is stored as `Organization.businessType` and drives a `VerticalConfig` object that controls the entire product experience.

---

## VERTICAL: HAIR SALON

**Default service categories:** Hair, Color, Treatment, Blowout, Extensions, Texture
**Default services to pre-populate:**
- Haircut — $45 — 45min
- Full Color — $120 — 120min
- Highlights — $150 — 150min
- Blowout — $55 — 60min
- Deep Conditioning — $35 — 30min
- Keratin Treatment — $200 — 180min

**Booking flow:** Stylist-first (client picks who, then when)

**Staff roles:** Owner, Manager, Senior Stylist, Stylist, Colorist, Assistant, Shampoo Tech, Front Desk

**Forms + waivers:**
- Color consent form (allergy/patch test acknowledgment)
- Chemical service waiver (straightening, perms)
- Photo release (before/after portfolio)
- New client intake (hair history, current products, allergies)

**KPIs:**
- Rebook rate % (target 70%+)
- Color service revenue % of total
- Retail attach rate % (% of clients who also buy product)
- Average ticket
- New client acquisition rate

**Formula history:** Enabled — color formulas, developer volume, processing time, result notes

**AI receptionist context:** Trained on hair salon FAQ (how long does color take?, do you do highlights?, what's the difference between balayage and highlights?)

**AI prompts:** Color formula history shown at booking. Stylist can see "Last 3 visits" before client sits down. Treatment recommendations based on history.

**Marketplace listing:** Specialties shown (balayage, color corrections, extensions, natural hair, etc.)

**License tracking:** State cosmetology license (TDLR in Texas), renewal alerts

---

## VERTICAL: BARBERSHOP

**Default service categories:** Haircut, Beard, Shave, Grooming
**Default services:**
- Haircut — $25 — 30min
- Fade — $30 — 30min
- Beard Trim — $15 — 15min
- Hot Lather Shave — $35 — 45min
- Haircut + Beard — $40 — 45min
- Kids Cut — $20 — 20min

**Booking flow:** Walk-in queue focused. Online booking is secondary, not primary.

**Queue management:**
- Walk-in queue is prominent feature (not buried)
- Real-time wait estimate displayed at kiosk
- "Get in line" via text message (text the shop's number → join queue remotely)
- Barber-specific queue (client can choose which barber's line they join)

**Staff roles:** Owner, Master Barber, Barber, Apprentice, Front Desk

**Forms:** Simple — no chemical services. Photo release optional.

**KPIs:**
- Walk-in rate % (what % of business is walk-in)
- Average wait time
- Average ticket
- Repeat client rate (% who come back within 4 weeks)
- Barber utilization (how booked are they?)

**AI receptionist:** Trained on barbershop FAQ (do you take walk-ins?, how long is the wait?, do you do beard lineups?)

**No formula history** — barbershops don't need this.

**License tracking:** Barber license (different from cosmetology in most states)

---

## VERTICAL: NAIL SALON

**Default service categories:** Manicure, Pedicure, Nail Art, Enhancements
**Default services:**
- Classic Manicure — $25 — 30min
- Gel Manicure — $40 — 45min
- Classic Pedicure — $35 — 45min
- Gel Pedicure — $50 — 60min
- Acrylic Full Set — $50 — 60min
- Nail Art (per nail) — $5 — 5min add-on

**Booking flow:** Station-based, not stylist-column based. Nail salons often assign clients to whoever is available, not a specific technician.

**Layout:** Station grid (not calendar columns). Shows which stations are occupied vs available.

**Forms:**
- Allergy waiver (acetone, acrylics, gel — skin sensitivity)
- Nail condition disclosure (fungal nail disclosure)

**KPIs:**
- Nail art upsell rate
- Average add-ons per ticket
- Station utilization rate
- Gel vs regular ratio (gel is higher margin)

**Product tracking:** Nail polish, gel colors — track what's running low

**License tracking:** Nail technician license (separate from cosmetology in some states)

---

## VERTICAL: MED SPA

**Default service categories:** Injectables, Laser, Skin, IV Therapy, Body
**Default services:**
- Botox (per unit) — $14/unit — varies
- Dermal Filler — $650 — 60min
- Hydrafacial — $175 — 60min
- Laser Hair Removal — $150 — 45min
- IV Vitamin Drip — $175 — 60min
- Chemical Peel — $125 — 45min

**Booking flow:** Provider-first (injector credentials must be shown). Consultation booking separate from treatment booking.

**Staff roles:** Medical Director (MD), Nurse Practitioner, Physician Assistant, Registered Nurse, Esthetician, Patient Coordinator, Front Desk

**Credentials shown on booking:** NP, PA, RN — clients care about who is injecting them

**Forms (complex — legally required):**
- HIPAA notice of privacy practices
- Medical history intake (medications, allergies, previous treatments)
- Informed consent per treatment (Botox consent, filler consent, laser consent)
- Photo consent
- COVID screening (optional)

**HIPAA considerations:**
- Treatment notes are PHI — encrypted at rest
- Access logging required (who accessed which patient record)
- BAA (Business Associate Agreement) required with Kasse
- Data retention requirements (7 years medical records in most states)

**KPIs:**
- Treatment plan completion rate
- Patient retention rate
- Revenue per patient per year
- Consultation-to-treatment conversion rate
- Return rate by treatment type

**AI receptionist:** Must disclose it's an AI. Must be able to explain treatment options at high level but direct clinical questions to provider. Cannot provide medical advice.

**Compliance:** Before GA for med spa vertical — full HIPAA review, BAA template, attorney review.

---

## VERTICAL: FITNESS / GYM

**Default service categories:** Personal Training, Group Classes, Assessments
**Default services:**
- Personal Training Session — $75 — 60min
- Group Fitness Class — $20 — 60min
- Initial Assessment — $0 — 60min
- Monthly Membership — $49/month

**Booking flow:** Class-based. One slot = many clients simultaneously (up to class capacity). Different from all other verticals where one slot = one client.

**Class management:**
- Class capacity (max 20 participants)
- Waitlist per class
- Cancel class (notifies all registered)
- Class template (recurring weekly schedule)
- Instructor assignment
- Equipment requirements per class

**Memberships are the primary product** (not services). POS flow starts with "Check membership" not "Select service."

**Membership types:**
- Monthly unlimited
- Punch card (10 sessions, 20 sessions, etc.)
- Drop-in (single session)
- Trial membership (2 weeks free)

**Forms:**
- PAR-Q (Physical Activity Readiness Questionnaire) — legally required
- Liability waiver
- Photo/video release

**KPIs:**
- Member retention rate (churn is the killer metric)
- Class fill rate % (revenue per class slot)
- Session completion rate (PT clients)
- Membership upgrade rate (drop-in → monthly)
- Revenue per member per month

**License tracking:** NASM/ACE/ISSA personal training certifications, CPR certification

---

## VERTICAL: RESTAURANT

**Default service categories:** Dine-In, Takeout, Delivery, Catering, Bar
**Default setup:**
- Table management (floor plan with tables)
- Menu items (not services)
- Modifier groups (toppings, sides, substitutions)
- Course management (appetizer, main, dessert)

**POS flow:** Menu-based (not service-based). Add items to ticket. Table-based (ticket attached to table, not client).

**Table management:**
- Floor plan layout (drag-and-drop table positioning)
- Table status (available, occupied, reserved, needs cleaning)
- Server assignment per table
- Turn time tracking
- Reservation + walk-in queue hybrid

**Booking = Reservations:**
- Party size
- Table assignment
- Special requests (dietary, celebration, accessibility)
- Reservation confirmation + reminder
- No-show tracking

**KPIs:**
- Table turn rate (covers per table per day)
- Average check per cover
- Revenue per available seat hour (RevPASH)
- Table utilization %
- Server performance (tips, avg check, upsell rate)

**No formula history, no license tracking, no color consent.**

---

## VERTICAL: AUTO SERVICE / TIRE SHOP

**Default service categories:** Oil Change, Tires, Brakes, Engine, Electrical, Inspection
**Default services:**
- Oil Change (Conventional) — $39 — 30min
- Tire Rotation — $25 — 30min
- Brake Inspection (Free) — $0 — 30min
- State Inspection — $25 — 30min
- Tire Installation (per tire) — $25 — 20min

**Client record = Vehicle record:**
Each client has one or more vehicles. The vehicle (VIN, year, make, model, mileage) is the primary service subject.

**Vehicle history:**
- Every service tied to the vehicle
- Mileage at each visit
- Next service due (oil change every 3,000 miles)
- Manufacturer recall lookup (by VIN — via NHTSA API)
- "What was done to my car last time?" is the primary lookup

**Booking flow:** Drop-off and pick-up time. Bay assignment. Service advisor assignment.

**Forms:**
- Vehicle intake form (VIN, mileage, described issue)
- Authorization to repair (before labor begins)
- Parts authorization (if additional parts needed)

**POS:** Service advisor creates repair order. Multiple line items (labor + parts). Technician time tracking. Parts inventory (tires, oil, filters — with cost tracking).

**KPIs:**
- Average repair order value
- Upsell rate (presented additional work → accepted)
- Bay utilization rate
- Parts margin %
- Return rate within 90 days (came back for same issue = poor quality)

---

## VERTICAL: GENERAL BUSINESS

No vertical configuration. Full suite with neutral defaults.

The owner configures:
- Their own service categories
- Their own KPIs
- Their own booking flow (client-first or service-first)
- Their own forms

Use case: massage therapist, photographer, personal chef, dog groomer, music teacher, event planner, tutoring, cleaning service, etc.

---

## VERTICAL CONFIG OBJECT (Technical Reference)

```typescript
interface VerticalConfig {
  id: string // "hair_salon" | "barbershop" | "nail_salon" | "med_spa" | "fitness" | "restaurant" | "auto" | "general"
  displayName: string
  
  booking: {
    flow: "stylist_first" | "service_first" | "walk_in_queue" | "class_based" | "table_based" | "vehicle_based"
    allowWalkIns: boolean
    requireConsultation: boolean
    showProviderCredentials: boolean
  }
  
  features: {
    formulaHistory: boolean
    vehicleRecords: boolean
    classCapacity: boolean
    tableManagement: boolean
    hipaaMode: boolean
    menuBasedPOS: boolean
    membershipFirst: boolean
  }
  
  defaultServices: Array<{ name: string, price: number, duration: number, category: string }>
  defaultStaffRoles: string[]
  defaultCategories: string[]
  defaultKPIs: string[]
  requiredForms: string[]
  licenseTypes: string[]
  
  ai: {
    receptionistContext: string // vertical-specific FAQ training
    coachingPrompts: string[]   // vertical-specific performance coaching
    upsellSuggestions: string[] // vertical-specific upsell logic
  }
}
```
