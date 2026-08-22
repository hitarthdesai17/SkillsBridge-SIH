# SkillBridge Manual Testing Specifications (Phase 04 Frontend, OCR Fallback & Simulator)

This document provides exact, step-by-step instructions for manual testing of the SkillBridge frontend application, OCR text extraction fallback, candidate profile evidence tags, opportunity marketplace filters, diagnostic views, targeted project blueprints, and reassessment simulator.

---

## TEST-04-M01: Landing Page Load
* **Purpose**: Verify landing page loads cleanly with high contrast typography and visual pipeline.
* **Steps**:
  1. Open browser to `http://localhost:3000`.
* **Expected Result**:
  * Page loads with hero header *"Know which jobs you're ready for."*, "Analyze My Resume" CTA, and 7-step visual pipeline flow chart.

---

## TEST-04-M02: Valid Text-Based PDF Upload
* **Purpose**: Verify deterministic `pdf-parse` extraction for standard text PDFs.
* **Steps**:
  1. Navigate to `http://localhost:3000/upload`.
  2. Drop a standard text-based PDF resume.
* **Expected Result**:
  * `pdf-parse` extracts text cleanly, displays timeline stages, and redirects to `/profile`.

---

## TEST-04-M02B: Image-Based / Scanned PDF OCR Fallback
* **Purpose**: Verify OCR fallback for scanned or image-based PDFs (e.g., Hitarth Desai's `RESUME.pdf`).
* **Steps**:
  1. Select an image-based scanned PDF resume (`RESUME.pdf`).
  2. Click "Analyze Resume".
* **Expected Result**:
  * System detects text stream < 50 chars / < 10 words.
  * Triggers Gemini Vision OCR fallback with banner: `"Your PDF appears to be image-based. Switching to Gemini Vision OCR..."`.
  * Candidate profile renders with extracted contact details, B.Sc AI/DS education, skills (C, Python, SQL, Docker, React), and projects (DoseWise, Expense Tracker).

---

## TEST-04-M03: Invalid File / Oversized Rejection
* **Purpose**: Verify file validation state handling.
* **Steps**:
  1. Select a `.txt` file or file > 10MB.
* **Expected Result**:
  * Error banner displays: `"PDF files only. Please select a valid PDF document."` or `"Maximum file size is 10 MB."`.

---

## TEST-04-M04: Stage-Based Processing Pipeline UI
* **Purpose**: Verify stage-based timeline replaces fake percentage timers.
* **Steps**:
  1. Upload any PDF resume and observe processing box.
* **Expected Result**:
  * Timeline displays real-time stages with checkmarks (`✓ Resume uploaded`, `✓ PDF inspected`, `● Extracting resume content`, `○ Building candidate profile`).

---

## TEST-04-M04B: Visible OCR Fallback Stage
* **Purpose**: Verify OCR is displayed as an intelligent fallback rather than a failure.
* **Steps**:
  1. Upload a scanned image-based PDF.
* **Expected Result**:
  * Timeline explicitly updates: `✓ Reading resume image (Gemini OCR)` with amber alert banner.

---

## TEST-04-M05: Extracted Candidate Data & Evidence Tags
* **Purpose**: Verify evidence provenance display.
* **Steps**:
  1. View `http://localhost:3000/profile`.
* **Expected Result**:
  * Candidate skills display confidence tags (`HIGH`, `MEDIUM`, `LOW`), source section, and provenance quotes.

---

## TEST-04-M06: Opportunity Feed Backend Query
* **Purpose**: Verify opportunities load from Supabase database via parallel `Promise.all` queries (~200ms).
* **Steps**:
  1. Open `http://localhost:3000/dashboard`.
* **Expected Result**:
  * 16 opportunity cards load directly from backend API.

---

## TEST-04-M07: Prioritization of Recommended Roles
* **Purpose**: Verify `READY` and `ALMOST_READY` roles are sorted first.
* **Steps**:
  1. Inspect default order of opportunity marketplace feed.
* **Expected Result**:
  * Higher readiness score roles appear first in grid.

---

## TEST-04-M08: Almost Ready View Missing Skills
* **Purpose**: Verify `ALMOST_READY` role displays missing skill callout.
* **Steps**:
  1. Inspect Business Intelligence Intern card (68% score).
* **Expected Result**:
  * Shows `ALMOST READY` badge with missing capability `Power BI Dashboarding & DAX`.

---

## TEST-04-M09: Visibility of Unready Opportunities
* **Purpose**: Verify `NOT_READY` roles remain visible without censorship.
* **Steps**:
  1. Scroll through opportunity dashboard.
* **Expected Result**:
  * `NOT_READY` opportunities remain visible with red status badges.

---

## TEST-04-M10: Diagnostic View Hard Eligibility & Gaps
* **Purpose**: Verify diagnostic breakdown page.
* **Steps**:
  1. Click "View Diagnostic" on any opportunity card (`/opportunity/opp_bi_intern_02`).
* **Expected Result**:
  * Displays Hard Eligibility Gate checklist (Deadline, Degree level) and classified gap list.

---

## TEST-04-M11: Targeted Project Recommendation Display
* **Purpose**: Verify targeted project blueprint card.
* **Steps**:
  1. Scroll to project recommendation section on diagnostic page.
* **Expected Result**:
  * Displays project title, objective, rationale, tech stack, deliverables, effort hours (~14h), and readiness delta (+22.5%).

---

## TEST-04-M12: Project Recommendation Alignment
* **Purpose**: Verify project directly matches identified gap.
* **Steps**:
  1. Compare missing gap (`Power BI`) with recommended project.
* **Expected Result**:
  * Project title is `"Targeted Power BI Dashboarding & DAX Portfolio Project"`.

---

## TEST-04-M13: Reassessment Simulator Backend Call
* **Purpose**: Verify simulator calls `/api/readiness/simulate` endpoint.
* **Steps**:
  1. Click "Simulate Completing Project" in the Reassessment Simulator.
* **Expected Result**:
  * Shows loading state `"Recalculating Backend Engine..."` before updating.

---

## TEST-04-M14: Dynamic Score Jump After Simulation
* **Purpose**: Verify score and state recalculation.
* **Steps**:
  1. Observe post-simulation results card.
* **Expected Result**:
  * Score increases from 68% to 85.5% (+17.5% delta) and state transitions from `ALMOST_READY` to `READY`.

---

## TEST-04-M15: API Key Protection
* **Purpose**: Verify secret keys are not exposed to client JavaScript.
* **Steps**:
  1. Inspect page source / browser console network tab.
* **Expected Result**:
  * `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are strictly absent from client window objects.

---

## TEST-04-M16: Network / Extraction Error Handling
* **Purpose**: Verify friendly error banner on unreadable PDF.
* **Steps**:
  1. Trigger an extraction error on corrupt file.
* **Expected Result**:
  * Displays clear user-facing error banner `"We couldn't read text from this PDF. Please try a clearer PDF or a text-based resume."` with `Try Again` and `Choose Another Resume` CTAs.

---

## TEST-04-A01: Login UI Render
* **Purpose**: Verify login page renders with branding, inputs, and show/hide password toggle.
* **Steps**:
  1. Navigate to `http://localhost:3000/login`.
* **Expected Result**:
  * Displays SkillBridge logo, "Welcome back" title, email input, password input, show/hide eye toggle, "Log in" button, and link to sign up.

---

## TEST-04-A02: Invalid Credentials Error Handling
* **Purpose**: Verify authentication failure presents friendly error message.
* **Steps**:
  1. Enter invalid email or password on `/login`.
  2. Click "Log in".
* **Expected Result**:
  * Displays error banner: `"Invalid email or password. Please double check your credentials."`. Raw server errors are not exposed.

---

## TEST-04-A03: Test User Login
* **Purpose**: Authenticate using standard development test account.
* **Steps**:
  1. Seed or ensure test user exists (`test_user@skillbridge.local` / `TEST_USER1!`).
  2. Enter credentials on `/login` and submit.
* **Expected Result**:
  * Login succeeds, displays `"Logged in successfully! Redirecting..."` and redirects to `/dashboard`.

---

## TEST-04-A04: Session Persistence on Reload
* **Purpose**: Verify session persists across page reloads and tab navigations.
* **Steps**:
  1. While logged in, reload `http://localhost:3000/dashboard` or `/profile`.
* **Expected Result**:
  * User remains logged in. Navbar shows user badge and Logout button.

---

## TEST-04-A05: Logout Teardown
* **Purpose**: Verify clicking Logout terminates session and shields private routes.
* **Steps**:
  1. Click "Logout" in Navbar.
* **Expected Result**:
  * Supabase session is destroyed, candidate store is cleared, and user is redirected to `/login`.

---

## TEST-04-A06: Route Shielding
* **Purpose**: Verify unauthenticated access to protected routes is intercepted.
* **Steps**:
  1. In incognito window or while logged out, navigate directly to `http://localhost:3000/dashboard`.
* **Expected Result**:
  * Next.js middleware redirects to `http://localhost:3000/login?redirect=%2Fdashboard`.

---

## TEST-04-A07: Signup Weak Password Rejection
* **Purpose**: Verify live password strength checker and validation failure for weak passwords.
* **Steps**:
  1. Navigate to `http://localhost:3000/signup`.
  2. Type `password` or `TestUser1`.
* **Expected Result**:
  * Live checklist marks missing requirements with red crosses. Submitting rejects form with specific policy error message.

---

## TEST-04-A08: Signup Valid Account Creation
* **Purpose**: Verify successful account creation with valid 5-point password.
* **Steps**:
  1. Enter Full Name, email, and password `TEST_USER1!` (or other compliant password).
  2. Confirm password matches.
  3. Click "Create account".
* **Expected Result**:
  * Strength indicator displays `Strong` with 5 green checkmarks. Account created and session established.

---

## TEST-04-A09: Resume Upload Bound to Authenticated User
* **Purpose**: Verify resume parsing associates profile record with authenticated `user_id`.
* **Steps**:
  1. Login as authenticated user.
  2. Upload PDF resume on `/upload`.
* **Expected Result**:
  * `/api/resume/parse` extracts candidate data and persists candidate profile in Supabase PostgreSQL under the authenticated `user_id`.

---

## TEST-04-A10: Refresh After Resume Analysis
* **Purpose**: Verify candidate profile is retrieved from database after browser reload.
* **Steps**:
  1. Navigate to `/profile` or `/dashboard` and refresh the browser.
* **Expected Result**:
  * User profile, extracted skills with evidence tags, and project proof cards are restored from the database.

---

## TEST-04-A11: Cross-User Multi-Tenant Isolation
* **Purpose**: Verify User A cannot access or query User B's candidate data.
* **Steps**:
  1. Login as User A and upload Resume A.
  2. Login in a separate session as User B and upload Resume B.
  3. Query `/api/candidate/profile` from User B session.
* **Expected Result**:
  * User B only sees Resume B data. RLS blocks User B from reading User A's `candidate_profiles`, `candidate_skills`, and assessments.

---

## TEST-04-A12: Client Source Secret Key Security
* **Purpose**: Verify service-role key and Gemini API key are strictly hidden from client JavaScript.
* **Steps**:
  1. Inspect bundle scripts in DevTools Sources tab.
* **Expected Result**:
  * `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are not leaked or bundled in client JS.

