# SKILLBRIDGE MASTER CONTEXT
## Handoff Context for Claude / Future Development
### Last updated: 2026-08-21

## 1. PROJECT

**SkillBridge AI** is an evidence-grounded career intelligence and execution platform.
Local project: `D:/HITARTH/SKILLSBRIDGE`
Local app: `http://localhost:3000`

Core loop:

Candidate Evidence → Target Career → Real Opportunity Requirements → Eligibility Gate → Deterministic Readiness → Market Gaps → Prioritized Actions → Evidence-Building Projects → Reassessment → Application Execution → Application Tracking

The product must not become a generic job board or generic roadmap generator.

## 2. CURRENT STATUS

Phases 1–7 are substantially implemented. Phase 7 Career Roadmap and Phase 7.1 application tracking exist. Phase 7.X is not yet fully implemented. The immediate priority is fixing the Career Roadmap UI styling/rendering before starting 7.X.

Latest reported baseline from Antigravity:
- 137/137 tests passing across 21 test files
- Production build passing
- 9 static pages and 12 dynamic API routes reported compiling

Always rerun tests/build after changes. Do not assume these numbers remain valid.

## 3. NON-NEGOTIABLE PRODUCT RULES

### Zero hallucination
Never invent candidate skills, projects, education, experience, opportunities, deadlines, organizations, requirements, scores, market statistics, or application states.

### Verified evidence vs future actions
Verified candidate evidence and recommended future actions must remain strictly separate.
A recommended project or clicked “complete” action must NEVER automatically create verified skills or inflate readiness.

### Deterministic readiness
The existing readiness engine is authoritative:
- 50% Skill Match
- 30% Evidence Proof
- 20% Experience Alignment
- existing binary eligibility gate

Do not duplicate or replace this calculation.

### Eligibility blockers vs learnable gaps
Learnable gaps: SQL, React, PySpark, Power BI, Python, etc.
Eligibility blockers: required degree, age, nationality, attempts, formal exam requirements, etc.

If a role requires a Master’s degree and the candidate has a Bachelor’s degree, show `NOT ELIGIBLE`. Never create a “learn Master’s degree” milestone or project to solve it.

## 4. EXISTING ENGINES TO REUSE

- `src/lib/readiness_engine.ts` — authoritative readiness
- `src/lib/hard_rules_engine.ts` — binary eligibility
- `src/lib/gap_analysis_engine.ts` — HARD_ELIGIBILITY_GAP, EXPERIENCE_GAP, SKILL_GAP, EVIDENCE_GAP
- `src/lib/opportunity_freshness.ts` — ACTIVE / EXPIRING_SOON / EXPIRED / ARCHIVED
- `src/lib/personalized_ranking_engine.ts` — opportunity ranking
- `src/lib/project_recommendation_engine.ts` — project recommendations
- `src/lib/application_tracking_engine.ts` — SAVED → PREPARING → APPLIED → INTERVIEWING → OFFER / REJECTED
- `src/lib/roadmap_engine.ts` — roadmap generation

Do not create duplicate readiness, ranking, freshness, or application lifecycle systems.

## 5. PHASE 7 CAREER ROADMAP

Purpose: bridge intelligence to execution.

Input:
- candidate profile
- selected target career
- active opportunity catalog
- authoritative readiness

Output:
- prioritized gaps
- learning milestones
- portfolio project blueprint
- reassessment checkpoint
- application actions

If no target career is selected, show an explicit selection state. Never invent a default career.

Exclude expired and archived opportunities from current roadmap recommendations.

Milestones:
1. High-priority skill acquisition
2. Portfolio capstone / evidence-building project
3. Readiness reassessment
4. Application execution

Recommended projects must be labeled `RECOMMENDED FUTURE ACTION`.
Projected changes must be labeled `PROJECTED` / `ESTIMATED` and must not mutate the real profile.

## 6. PRIORITY RULE

Original Phase 7 rule:

P0_CRITICAL:
- hard eligibility blocker, OR
- missing mandatory skill present in **>50%** of target opportunities

P1_HIGH:
- mandatory skill present in **<=50%**, OR
- high-frequency preferred skill

P2_MEDIUM:
- evidence/partial gaps or moderate-demand capabilities

P3_OPTIONAL:
- low-frequency optional/stretch capabilities

Boundary test explicitly locked:
- 100% → P0
- exactly 50% → P1

Do not casually change this rule.

## 7. IMPORTANT KNOWN LOGIC ISSUES

### Target-career relevance
A Data Analyst roadmap has sometimes pulled unrelated requirements such as:
- PySpark / Data Pipelines
- Linux Security Auditing
- Network Security Fundamentals
- PyTorch Deep Learning

Investigate target-career relevance filtering. A Data Analyst roadmap should primarily use genuinely relevant Data Analyst opportunities. If no matching opportunities exist, do not silently mix unrelated occupations or invent jobs. Prefer an insufficient-market-data state or clearly explained fallback.

### Eligibility blocker incorrectly becoming milestone
A degree blocker has previously become a learning milestone. This is incorrect and must be fixed.

### Project names containing internal gap labels
Bad example:
`Interactive Missing PySpark / Data Pipelines Retail Sales Analytics Dashboard`

Use a natural project title, e.g.:
`Retail Data Pipeline & Analytics Dashboard`

Then separately say it addresses the PySpark / Data Pipelines gap.

### “Live market data” wording
Seeded/static opportunities must not be presented as genuinely live unless they are actually live. Use accurate source/freshness labels.

## 8. DEMO CANDIDATE: RIYA SHAH

Location: Ahmedabad
Target: Data Analyst

Example verified skills:
Python, JavaScript, PostgreSQL, Database Management Systems, SQL, Flask, HTML, CSS, GitHub, VS Code, Docker, Pandas, NumPy, Power BI, Machine Learning, Sales & Client Relations.

Verified projects:

### Retail Sales Analytics Dashboard
End-to-end analytics workflow from raw CSV data to SQL transformations and interactive Power BI dashboard. KPI cards, monthly trends, product analysis, regional comparisons and drill-downs.
Technologies: Python, SQL, Pandas, Power BI, CSV.

### Customer Churn Prediction
Telecom dataset cleaning, EDA, feature engineering, Logistic Regression and Random Forest; precision, recall and F1 comparison.
Technologies: Python, Pandas, scikit-learn, Matplotlib.

### Inventory Management API
CRUD inventory service with PostgreSQL persistence, validation and Dockerized local setup.

## 9. EXISTING MARKETPLACE / OPPORTUNITY EXAMPLES

The seeded marketplace includes examples such as:
- Business Intelligence Intern
- Junior Data Analyst Apprentice
- Digital India e-Governance Apprentice
- Data Analyst Intern
- Python Backend Engineer Intern
- Junior Software Engineer
- Full-Stack Web Development Intern
- Mobile Application Intern
- Data Engineering Intern
- QA Automation Engineer Intern
- Product Analytics & UI/UX Intern
- UPSC Civil Services Examination
- Personal Fitness Trainer & Coach
- Machine Learning Engineer Intern
- Frontend Developer Intern (Closed)
- DevOps & Cloud Engineering Apprentice
- Junior Cybersecurity Analyst
- AI Research Intern

Some are intentionally seeded test opportunities. Do not assume all are live market data.

Example Data Analyst opportunity:
Apex Analytics Corp, Data Analyst Intern, Bangalore hybrid, ₹25,000–₹35,000/month, deadline 12/1/2026.
Requirements: Python Data Analysis (Pandas, NumPy), SQL Querying & Data Extraction, Data Visualization Fundamentals.
Previously observed readiness: 98.5%, Ready.

## 10. PHASE 7 PRESENTATION / DIFFERENTIATION GOALS

SkillBridge must answer:
“Why use SkillBridge if students can just check job requirements or ask ChatGPT?”

Generic roadmaps:
- same curriculum for everyone
- ignore verified resume evidence
- disconnected from active employer requirements
- blind to hard eligibility blockers
- no deterministic readiness
- no application lifecycle

SkillBridge:
- candidate-specific
- evidence-grounded
- market-demand driven
- eligibility-aware
- deterministic readiness
- application execution and tracking

Desired features include:

### Why SkillBridge?
Generic vs SkillBridge comparison.

### How is this calculated?
Explain actual 50/30/20 readiness contributions and eligibility gate using the existing engine.

### Market-demand evidence
For each major gap: requirement, demand, candidate status, priority, affected opportunities.

### Evidence Chain / Why?
Candidate Evidence → Target Career → Active Opportunities → Requirement Frequency → Gap Classification → Priority → Action.

Use explicit labels:
- VERIFIED EVIDENCE
- MARKET EVIDENCE
- RECOMMENDED FUTURE ACTION
- PROJECTED IMPACT
- ELIGIBILITY CONSTRAINT

## 11. PHASE 7.X TO BUILD LATER

Build one feature at a time, after UI is stable.

1. Requirement traceability
2. Why / Evidence Chain
3. Eligibility vs Learnable Gap
4. Readiness Calculation Explainer
5. Project → Gap Connection
6. Project Verification Checkpoint
7. Project Simulation
8. Application Execution polish
9. Opportunity Prioritization
10. Personalization Proof
11. Market Evidence Panel
12. Empty/low-data states
13. Non-CS and government/exam pathways
14. Trust/freshness presentation

### Requirement traceability
Every gap must connect to actual opportunity requirements, including opportunity IDs/titles, organizations, demand, mandatory/preferred status, freshness and candidate evidence.

### Project verification
States should be:
NOT STARTED → IN PROGRESS → SUBMITTED FOR VERIFICATION → VERIFIED / REJECTED
Clicking complete must not automatically verify skills.

### Simulation
Show CURRENT VERIFIED STATE vs SIMULATED FUTURE STATE. Clearly label simulation as projected/not verified. Never mutate profile.

### Application execution
Use existing application tracker. Actions: View Opportunity, Track in SkillBridge, Prepare Application, Mark Applied.

### Personalization proof
Show what a generic roadmap would recommend versus what SkillBridge avoids because the candidate already has that evidence.

### Non-CS/government support
Support careers such as Financial Accountant, Teacher and Civil Services. Do not assume coding. Government/exam paths may require education, age, attempts, nationality, subjects, exam preparation and deadlines where data exists.

## 12. IMMEDIATE UI PROBLEM

The Career Roadmap UI has repeatedly rendered as nearly unstyled/raw HTML.

Root cause identified:
The project does not have a functioning Tailwind CSS setup, while some new UI used Tailwind utility classes. Therefore classes such as `flex`, `grid`, `rounded-xl`, `p-5`, `bg-*`, `text-*`, etc. were ignored.

Symptoms:
- default browser buttons
- missing spacing
- broken grids/flex layouts
- missing card backgrounds/borders
- stacked content
- raw-looking controls

## 13. UI ARCHITECTURE DECISION

Recommended approach:

**Do not migrate the entire project to Tailwind.**

Existing styling architecture:
- `globals.css`
- CSS custom properties
- styled-jsx
- reusable components such as `GlassPanel`

Replace Tailwind utility usage in the roadmap UI with the existing styling architecture.

Do not install Tailwind merely as a patch unless a deliberate full-project migration is approved.

## 14. UI FILES TO INSPECT FIRST

- `src/components/CareerRoadmapView.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/globals.css`
- `src/components/GlassPanel.tsx`
- `src/components/ReadinessSummaryCards.tsx`
- `src/components/OpportunityFilterToolbar.tsx`
- `src/components/Navbar.tsx`
- `src/components/AppShell.tsx`
- `package.json`
- any PostCSS/Tailwind configuration

## 15. UI TARGET

Polished modern SaaS dashboard using the existing SkillBridge design language.

Hero:
- dark glass card
- title/subtitle
- closed-loop pipeline: Verified Evidence → Market Demand → Readiness Score → Actionable Roadmap → Application Tracking

KPI strip:
- Authoritative Readiness
- Target Readiness Goal
- Relevant Opportunities
- High Priority Gaps
- Estimated Timeline

Career context:
- selected target career
- active opportunity indicator
- styled Change Career

Middle grid:
- Market Demand / Gap Matrix
- Eligibility Gate

Milestones:
01 → 02 → 03 → 04 on desktop
2×2 tablet
vertical mobile

Opportunities:
- readiness
- organization
- deadline
- track
- prepare
- apply
- view

Modals:
- Why SkillBridge
- How readiness is calculated
- Change Career
- Why / Evidence Chain

Avoid excessive glow, gradients, huge decorative elements, giant empty cards, inconsistent radii and random colors.

No browser-default controls.
No literal `svg` text in the DOM.
Use actual SVG/Lucide icon components.

## 16. UI VERIFICATION

Do not call the UI fixed just because tests/build pass.
Actually render and inspect the Career Roadmap.

Verify at:
1440px, 1280px, 1024px, 768px, 390px.

Check:
- no horizontal overflow
- no clipped controls
- no overlapping cards
- no broken modals
- no default buttons
- no raw SVG text
- correct spacing
- correct backgrounds/borders
- responsive layout

## 17. PROTECTED FILES / LOGIC

Do not modify without explicit need:
- `readiness_engine.ts`
- `hard_rules_engine.ts`
- `gap_analysis_engine.ts`
- `opportunity_freshness.ts`
- `personalized_ranking_engine.ts`
- `project_recommendation_engine.ts`
- `application_tracking_engine.ts`
- `roadmap_engine.ts`

Do not change the readiness formula, eligibility semantics, evidence rules, freshness rules or application lifecycle just to make UI work.

## 18. TESTING INVARIANTS

Always preserve these:
1. Candidate profile is immutable during recommendations.
2. Recommended projects do not create verified skills.
3. Simulation does not mutate profile/readiness.
4. Expired opportunities do not drive current recommendations.
5. Eligibility blockers remain blockers.
6. No invented opportunities or deadlines.
7. Candidate A and B can receive different roadmaps.
8. Target career selection matters.
9. Market demand comes from actual opportunity data.
10. Existing readiness engine remains authoritative.
11. Existing application tracker remains authoritative.

## 19. HACKATHON DEMO STORY

The strongest demo is:

1. Upload resume.
2. Show verified evidence.
3. Select target career.
4. Show relevant opportunity requirements.
5. Show deterministic readiness.
6. Explain why the candidate is not fully ready.
7. Show market frequency of the missing requirement.
8. Separate eligibility blockers from learnable gaps.
9. Generate a targeted project/action.
10. Simulate future improvement without changing actual evidence.
11. Verify evidence.
12. Recalculate readiness.
13. Show best-fit opportunities.
14. Track an application.

Core message:

> SkillBridge does not merely tell you what to learn. It explains why you need to learn it, proves that the market asks for it, connects it to your current evidence, gives you an action to close the gap, verifies the resulting evidence, and helps you execute the application.

## 20. ORDER OF WORK

NOW:
Fix CareerRoadmapView styling/rendering architecture.

THEN:
Verify other pages are unaffected.

THEN:
Review Phase 7 intelligence for:
- target-career relevance
- eligibility blocker handling
- natural project naming
- market-data grounding

THEN:
Implement Phase 7.X one feature at a time in this order:
1. Requirement Traceability
2. Why / Evidence Chain
3. Eligibility vs Learnable Gap
4. Readiness Calculation Explainer
5. Project → Gap Connection
6. Project Verification
7. Simulation
8. Application Execution polish
9. Opportunity Prioritization
10. Personalization Proof
11. Market Evidence
12. Empty/low-data states
13. Non-CS/government pathways
14. Trust/freshness presentation

## 21. INSTRUCTIONS TO CLAUDE

Read this entire file first.
Then inspect the actual repository.

This file is product/development context, not a substitute for the codebase. If it conflicts with actual code, report the conflict and use the repository as the technical source of truth.

Before editing:
1. Identify what exists.
2. Identify what is partial.
3. Identify what is missing.
4. Avoid duplication.
5. Make the smallest safe change.
6. Run tests.
7. Run build.
8. Actually inspect rendered UI.
9. Report exact files changed and exact verification results.

FIRST TASK:
Fix the CareerRoadmapView styling/rendering problem without breaking the existing application.

Do not start Phase 7.X until the UI foundation is stable.
