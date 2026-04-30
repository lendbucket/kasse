# KASSE WHITE-LABEL GUIDE
## Reseller Setup and Brand Configuration

**Version:** 1.0 | **Audience:** Resellers and Internal Team

---

## WHAT WHITE-LABELING KASSE MEANS

A reseller (e.g., "BeautySoft") gets a fully branded version of Kasse with their logo, colors, domain, and copy. Their merchants never see the word "Kasse." They see "BeautySoft."

**What gets re-branded:**
- Logo (replace kasse. with reseller logo)
- Color scheme (replace #606E74 with reseller brand colors)
- Domain (portal.kasseapp.com → app.beautysoft.com)
- Splash screen and email templates
- Receipt header
- App Store listing (separate iOS submission)
- Onboarding copy

**What does NOT get re-branded (ever):**
- "Powered by Reyna Pay" footer notice (legal/compliance — SD-K-010)
- Underlying engine API (SalonTransact)
- Payroc relationship (reseller has zero Payroc contact)
- Compliance and risk monitoring

---

## THEME CONFIGURATION FILE

Every brand customization lives in one file: `lib/theme/theme.config.ts`

```typescript
export const theme: ThemeConfig = {
  brand: {
    name: "BeautySoft",
    tagline: "Salon Management. Simplified.",
    logoUrl: "/brands/beautysoft/logo.png",
    logoInvertedUrl: "/brands/beautysoft/logo-dark.png",
    faviconUrl: "/brands/beautysoft/favicon.ico",
    appName: "BeautySoft",
    supportEmail: "support@beautysoft.com",
    supportUrl: "https://help.beautysoft.com",
    marketingUrl: "https://beautysoft.com",
  },
  
  colors: {
    primary: "#2563eb",          // Replace with reseller brand color
    primaryHover: "#1d4ed8",
    primaryLight: "rgba(37,99,235,0.08)",
    
    // These stay constant regardless of brand
    success: "#16a34a",
    warning: "#d97706",
    error: "#dc2626",
    info: "#2563eb",
  },
  
  domain: {
    portal: "app.beautysoft.com",
    booking: "book.beautysoft.com",
    marketplace: "stylists.beautysoft.com",
    admin: "admin.beautysoft.com",
  },
  
  email: {
    fromName: "BeautySoft",
    fromAddress: "noreply@beautysoft.com",
    replyTo: "support@beautysoft.com",
    headerBgColor: "#1e293b",    // Dark header (matches brand)
    footerText: "BeautySoft by Reyna Tech LLC",
    poweredByText: "Payments powered by Reyna Pay",  // Non-removable
  },
  
  features: {
    // Which modules are available for this reseller's merchants
    marketplace: true,
    franchiseCreator: false,
    kasseCapital: true,
    aiReceptionist: true,
    salonBacked: false,
    multiLocation: true,
    whiteLabel: false,  // Resellers cannot sub-resell (no sub-resellers)
  },
  
  onboarding: {
    welcomeHeading: "Welcome to BeautySoft",
    welcomeSubtext: "Let's get your salon set up in just a few minutes.",
    steps: "default",  // or custom step array
  },
  
  receipt: {
    footerText: "Thank you for visiting! Book your next appointment at book.beautysoft.com",
    showPoweredByReynaPay: true,  // Always true — non-negotiable
    showSalonTransact: true,      // Always true
  },
}
```

---

## DEPLOYING A WHITE-LABEL INSTANCE

### Step 1 — Reseller Onboarding
1. Reseller signs reseller agreement (legal template — pending counsel review)
2. Reseller pays setup fee (if applicable — pending counsel review per OQ-010)
3. Robert creates reseller record in admin portal
4. System generates reseller configuration in database

### Step 2 — Brand Assets
Reseller provides:
- Logo (SVG preferred, PNG acceptable — min 400px wide)
- Inverted/dark logo (for dark backgrounds)
- Brand primary color (hex value)
- Domain(s) (portal.brand.com, book.brand.com)
- Support email and URL
- Receipt footer text

### Step 3 — Domain Setup
1. Reseller creates DNS records:
   ```
   CNAME app.beautysoft.com → cname.vercel-dns.com
   CNAME book.beautysoft.com → cname.vercel-dns.com
   ```
2. Add domains in Vercel project settings
3. SSL auto-provisions via Vercel
4. Domain activates within 48 hours

### Step 4 — Build and Deploy
1. Create theme config file for reseller brand
2. Set `NEXT_PUBLIC_BRAND_ID` environment variable in Vercel
3. Push to GitHub → auto-deploys

### Step 5 — Test
- Sign up at reseller domain
- Verify logo displays correctly
- Verify colors apply correctly
- Verify emails come from reseller domain
- Verify "Powered by Reyna Pay" appears on receipt
- Test full booking flow

### Step 6 — iOS App Submission (for major resellers)
**Reseller provides:**
- Apple Developer account (paid — $99/year) with developer access granted to Reyna Tech LLC
- Bundle ID: `com.beautysoft.pos`
- App Store screenshots (we create these)
- App description and keywords

**Reyna Tech provides:**
- Themed build of Kasse native app
- App Store submission
- Ongoing updates (reseller gets updates via App Store)

---

## RESELLER COMMERCIAL STRUCTURE

**Pending counsel review — DO NOT market or collect fees until legal review complete (SD from SalonTransact memory)**

Proposed structure:
- $0 onboarding (no FTC Business Opportunity Rule trigger)
- Monthly SaaS fee to Reyna Tech for platform access (per-merchant or flat)
- Reseller earns 25% of Reyna Pay margin on their merchants' payment processing
- Reseller sets their own subscription price to their merchants

**What resellers are responsible for:**
- Their own merchant sales and support
- Their own marketing
- Their own branding assets
- Apple Developer account (if native app)

**What Reyna Tech is responsible for:**
- Platform maintenance and updates
- Payment processing compliance
- Infrastructure (hosting, database)
- Core feature development
- White-label deployment

---

## FEATURE FLAGS PER BRAND

The `features` object in theme config controls what's available to a reseller's merchants:

| Feature | Default | Notes |
|---------|---------|-------|
| marketplace | true | Stylist marketplace listing |
| franchiseCreator | false | Only for enterprise resellers |
| kasseCapital | true | Revenue-based advances |
| aiReceptionist | true | Voice AI |
| salonBacked | false | HCM layer — separate subscription |
| multiLocation | true | Multiple location support |
| whiteLabel | false | Resellers cannot sub-resell |
| advancedReports | true | Full reporting suite |
| developerApi | false | API access for merchants (enterprise only) |

---

## FRANCHISE WHITE-LABEL (SPECIAL CASE)

When a business creates a franchise through the Franchise Creator, their franchise system IS Kasse white-labeled with their brand.

**Flow:**
1. Business builds their franchise using Franchise Creator
2. They configure their brand (logo, colors, domain)
3. When they approve a franchisee → system auto-provisions branded Kasse instance for franchisee
4. Franchisee gets `portal.[franchisebrand].com`
5. All franchisee payments flow through SalonTransact → franchisor fees auto-deducted → remainder to franchisee

This is the most valuable white-label use case because:
- The franchisor becomes a locked-in enterprise customer
- Each franchisee is an additional merchant on our platform
- Fees flow automatically through our payment rails
- The entire franchise infrastructure is built on Kasse

---

## RESELLER ADMIN DASHBOARD

In the Kasse admin portal (admin.kasseapp.com), Robert sees:

- All reseller brands (name, domain, status, merchant count, GPV)
- Per-reseller merchant list
- Per-reseller revenue attribution
- White-label deployment status
- Feature flag overrides per brand
- "Impersonate" — view any reseller's portal as them (for support)
- Reseller performance ranking
- Commission payout tracking to resellers
