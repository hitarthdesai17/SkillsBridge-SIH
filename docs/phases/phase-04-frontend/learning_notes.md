# Phase 04: Educational Learning Notes (App Router Architecture & Reassessment Simulation)

> *Designed for a 1st-year AI / Data Science student.*

---

## 1. Separation of Concerns in Web Architecture
In modern software engineering, **React Components** are responsible strictly for presentation (rendering UI, handling clicks, showing loading spinners). All complex mathematical formulas (such as our readiness score $0.50 S_{\text{match}} + 0.30 E_{\text{proof}} + 0.20 X_{\text{align}}$) and binary eligibility gate logic remain isolated inside **Backend Engines** (`readiness_engine.ts`).

The frontend communicates with the backend via REST API route handlers (`/api/readiness/simulate`). This guarantees that if our readiness scoring formula changes in the future, we only update code in one central backend file without breaking or duplicating code across multiple React pages!

---

## 2. Dynamic Reassessment Simulation
A key innovation of SkillBridge is the **Reassessment Simulator**. When a student completes a recommended portfolio project, they click "Simulate Project Completion". The backend:
1. Clones the candidate profile object in memory.
2. Appends the newly acquired skill (e.g. `Power BI Dashboarding & DAX`) with `HIGH` extraction confidence.
3. Re-runs `calculateOpportunityReadiness` and `evaluateHardEligibility` through the production engine.
4. Returns the exact score delta (+17.5%) and state transition (`ALMOST READY` $\rightarrow$ `READY`).

---

## 3. Transparent Marketplace (No Censorship)
Traditional Job ATS portals hide job posts from users who lack qualifications. SkillBridge takes an **Evidence-Based Pathway approach**:
* All jobs remain visible so students understand career options.
* Roles are categorized into `READY`, `ALMOST READY`, and `NOT READY`.
* Recommended roles are prioritized at the top of the marketplace feed.
* For `ALMOST READY` roles, SkillBridge generates a targeted project blueprint to bridge the exact gap!

---

## 4. Multi-Tenant Row Level Security (RLS)
Why don't we just filter data by `WHERE user_id = current_user` in our frontend React code?
* If authorization is only handled on the frontend, anyone can open browser DevTools, edit JavaScript memory, and fetch other users' sensitive resumes!
* **Row Level Security (RLS)** is enforced directly at the PostgreSQL database engine level. When a user authenticates via Supabase Auth, PostgreSQL knows their `auth.uid()`.
* Even if an attacker executes `SELECT * FROM candidate_profiles;`, PostgreSQL only returns the rows where `user_id = auth.uid()`.

---

## 5. Next.js 14 App Router Middleware & SSR Cookies
In Next.js 14, client components and server components need synchronized access to authentication tokens.
* `@supabase/ssr` stores auth tokens in encrypted HTTP cookies.
* The Next.js `middleware.ts` runs on edge before any protected route (`/dashboard`, `/upload`, `/profile`) renders.
* If a session is valid, it automatically refreshes expiring JWT tokens.
* If unauthenticated, it redirects the browser to `/login?redirect=...` without exposing server components to unauthenticated access.

