# Phase 5: Manual Verification Protocol & Checklist

## Manual Verification Results

### 1. Landing Page (`/`)
* [x] Sticky `SiteNavbar` renders brand logo, navigation links, theme toggle, and auth status.
* [x] Hero section displays `/assets/hero-visual.jpg` with floating `GlassPanel` ProgressRing badges.
* [x] 8 platform feature cards render with glass hover effects.
* [x] 4-step "How It Works" cards render clearly.
* [x] 8-step Career Journey Timeline renders cleanly.
* [x] Expandable FAQ accordion opens and closes smoothly.
* [x] Bottom CTA buttons link properly to `/upload` and `/signup`.

### 2. Authentication Pages (`/login`, `/signup`)
* [x] Split-screen layout displays on desktop with branding hero on right.
* [x] 5-point Zod password validation displays live checklist on `/signup`.
* [x] Show/hide password toggles work on both pages.
* [x] Redirect query parameters are preserved upon login.

### 3. Application Shell & Dashboard (`/dashboard`)
* [x] Desktop fixed left sidebar renders with active item indicator.
* [x] Header displays quick search, theme toggle, user avatar initials, and working Logout button.
* [x] Mobile bottom navigation bar renders on viewport width < 1024px.
* [x] Top statistics glass cards display counts for Ready, Almost Ready, and Gaps to Bridge.
* [x] Category filters (All, Jobs, Internships, Government Exams) filter the grid dynamically.
* [x] Search input filters opportunities by title and organization.

### 4. Resume Upload (`/upload`)
* [x] Glass drag-and-drop ingestion container handles PDF selection and size validation (<10MB).
* [x] Processing timeline steps cycle through stages with visual status indicators.
* [x] OCR fallback banner displays if image-based PDF is detected.

### 5. Candidate Profile (`/profile`)
* [x] Extracted candidate header renders avatar, target role, and verified evidence badge.
* [x] Skills grid renders with `HIGH`/`MEDIUM`/`LOW` confidence badges and provenance quotes.
* [x] Projects render with verified tags and tech stack badges.
* [x] Experience timeline renders duration and organization details.

### 6. Opportunity Diagnostic & Reassessment Simulator (`/opportunity/[id]`)
* [x] Header hero card renders dual ProgressRing with formula breakdown ($0.50 S + 0.30 E + 0.20 X$).
* [x] Binary Hard Eligibility Gate checklist renders PASSED/FAILED with detailed reasons.
* [x] 4-tier gap analysis lists missing capabilities with blocking impact severity.
* [x] Targeted portfolio project blueprint card displays feasibility score, effort hours, and deliverables.
* [x] Reassessment Simulator recalculates live score jump upon clicking "Simulate Project Completion".
