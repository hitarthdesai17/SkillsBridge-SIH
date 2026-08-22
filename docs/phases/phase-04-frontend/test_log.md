# Phase 04: Test Log

| Test ID | Feature | Test Type | Scenario | Input | Expected Result | Actual Result | Status | Evidence | Related Bug |
|---|---|---|---|---|---|---|---|---|---|
| TEST-04-01 | Reassessment Engine | Unit Test | Reassessment simulation score jump | Profile + BI Opportunity + Power BI Skill | Score increases by >15% and transitions state to READY | Score increased from 68% to 85.5% (READY) | PASS | `src/app/api/readiness/simulate/route.test.ts` | BUG-04-01 |
| TEST-04-02 | Landing Page | Manual Test | Hero load & CTA navigation | Navigate `/` | Renders value proposition hero & Upload CTA | Rendered cleanly | PASS | Manual Verification | N/A |
| TEST-04-03 | PDF Uploader | Manual Test | Drag-and-drop PDF ingestion | Sample PDF File | Shows progress bar and redirects to `/profile` | Extracted resume data & redirected | PASS | Manual Verification | N/A |
| TEST-04-04 | Profile Evidence | Manual Test | Evidence tags display | View `/profile` | Shows skills with HIGH/MEDIUM confidence tags | Rendered skills & provenance context | PASS | Manual Verification | N/A |
| TEST-04-05 | Dashboard Marketplace | Manual Test | Marketplace feed query & sorting | View `/dashboard` | Loads 16 opportunities, sorting READY/ALMOST_READY first | Sorted recommended roles first | PASS | Manual Verification | N/A |
| TEST-04-06 | Diagnostic Page | Manual Test | Hard gate checklist & 4-tier gaps | View `/opportunity/opp_bi_intern_02` | Shows hard eligibility PASSED and Power BI SKILL_GAP | Rendered hard checklist & gaps | PASS | Manual Verification | N/A |
| TEST-04-07 | Targeted Project | Manual Test | Project blueprint card | View `/opportunity/opp_bi_intern_02` | Shows Power BI project blueprint | Rendered project title, effort, deliverables | PASS | Manual Verification | N/A |
| TEST-04-08 | Live Simulator | Manual Test | Interactive simulator execution | Click "Simulate Project Completion" | Recalculates readiness score via backend engine | Score jumped to 85.5% (READY) | PASS | Manual Verification | N/A |
| TEST-04-AUTH01 | Password Security | Unit Test | Password 5-rule criteria validation | `TEST_USER1!`, `SecureP@ss123` | Passes validation | Validation succeeded | PASS | `src/lib/auth_validation.test.ts` | N/A |
| TEST-04-AUTH02 | Password Security | Unit Test | Rejects spec-defined invalid passwords | `password`, `12345678`, `TESTUSER`, `TestUser1`, `TestUser!` | Rejected | All 5 rejected | PASS | `src/lib/auth_validation.test.ts` | N/A |
| TEST-04-AUTH03 | Dynamic Evaluator | Unit Test | Evaluates password strength report | `short`, `TestUser1`, `TEST_USER1!` | Returns breakdown & label | Weak/Fair/Strong accurate | PASS | `src/lib/auth_validation.test.ts` | N/A |
| TEST-04-AUTH04 | Signup Schema | Unit Test | Validates full signup input | Full name + Email + Password + Confirm | Passes validation | Validation succeeded | PASS | `src/lib/auth_validation.test.ts` | N/A |
| TEST-04-AUTH05 | Signup Schema | Unit Test | Rejects mismatched passwords | Password != ConfirmPassword | Rejects with "Passwords don't match" | Rejected with message | PASS | `src/lib/auth_validation.test.ts` | N/A |
| TEST-04-AUTH06 | Signup Schema | Unit Test | Rejects invalid email format | `not-an-email` | Rejects with email error | Rejected | PASS | `src/lib/auth_validation.test.ts` | N/A |
| TEST-04-AUTH07 | Login Schema | Unit Test | Validates login payload | Email + Password | Passes validation | Validation succeeded | PASS | `src/lib/auth_validation.test.ts` | N/A |
| TEST-04-AUTH08 | Login Schema | Unit Test | Rejects empty password / invalid email | `bad-email`, empty password | Rejection | Rejected | PASS | `src/lib/auth_validation.test.ts` | N/A |
| TEST-04-ISO01 | User Isolation | Unit Test | Clear profile store on logout | `clearCandidateProfileStore` | Clears active store | Store cleared | PASS | `src/lib/auth_isolation.test.ts` | BUG-04-02 |
| TEST-04-ISO02 | Resume Persistence | Unit Test | Save candidate profile with userId | Parsed data + `usr_tenant_test_999` | Retrievable for target user | Profile bound to userId | PASS | `src/lib/auth_isolation.test.ts` | BUG-04-02 |
| TEST-04-ISO03 | Tenant Isolation | Unit Test | User A cannot retrieve User B data | Query User B when User A logged in | Disjoint profiles returned | User A data isolated | PASS | `src/lib/auth_isolation.test.ts` | BUG-04-02 |
| TEST-04-A01 | Login UI | Manual Test | Render login page | Visit `/login` | Glassmorphic card, email/pwd inputs, show/hide, submit button | Rendered cleanly | PASS | Manual Verification | N/A |
| TEST-04-A02 | Login Failure | Manual Test | Invalid login credentials | Wrong email / password | User-friendly error message | Displayed error banner | PASS | Manual Verification | N/A |
| TEST-04-A03 | Test User Login | Manual Test | Authenticate test user | `test_user@skillbridge.local` / `TEST_USER1!` | Successful login and dashboard access | Session established & redirected | PASS | Manual Verification | N/A |
| TEST-04-A04 | Session Persistence | Manual Test | Page reload persistence | Refresh `/dashboard` | User remains authenticated | Auth session maintained | PASS | Manual Verification | N/A |
| TEST-04-A05 | Logout | Manual Test | Logout teardown | Click Logout in Navbar | Session cleared, redirected to `/login` | Logged out & protected page shielded | PASS | Manual Verification | N/A |
| TEST-04-A06 | Route Shield | Manual Test | Access dashboard while logged out | Visit `/dashboard` directly | Redirects to `/login?redirect=%2Fdashboard` | Redirected | PASS | Manual Verification | N/A |
| TEST-04-A07 | Weak Password Signup | Manual Test | Type weak password | `password` | Live requirements show red checkmarks, button disabled/rejected | Rejected | PASS | Manual Verification | N/A |
| TEST-04-A08 | Valid Password Signup | Manual Test | Type valid password | `TEST_USER1!` | Live checklist shows all green checkmarks, "Strong" badge | Succeeded | PASS | Manual Verification | N/A |
| TEST-04-A09 | Authenticated Resume | Manual Test | Upload resume while logged in | Upload PDF in `/upload` | Candidate profile bound to authenticated user | Profile saved with user_id | PASS | Manual Verification | N/A |
| TEST-04-A10 | Result Retrieval | Manual Test | Refresh after analysis | Refresh `/profile` | Candidate profile & skills retrieved from database | Data populated | PASS | Manual Verification | N/A |
| TEST-04-A11 | Cross-User RLS | Manual Test | User A vs User B data query | Separate user sessions | User A cannot see User B's profile/assessments | Access restricted by RLS | PASS | Manual Verification | N/A |
| TEST-04-A12 | Security Keys | Manual Test | Inspect client bundle & source | Browser DevTools source inspection | `SUPABASE_SERVICE_ROLE_KEY` & `GEMINI_API_KEY` are not in client bundle | Keys not exposed | PASS | Manual Verification | N/A |

