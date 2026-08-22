# SkillBridge Project Accumulated Learnings

This document logs core architectural, product, and engineering takeaways accumulated across development phases.

## Phase 00 Learnings

### 1. Scope Boundaries in AI Products
AI career tools fail when attempting to act as full LinkedIn replacements or generic job aggregators. SkillBridge succeeds by focusing strictly on the **Opportunity Readiness Intelligence Engine** layer.

### 2. Honesty in Recommendations & Hard Eligibility Gates
A candidate must never be tricked into thinking a 3-day project bypasses a mandatory college degree or a 3-year full-time work experience requirement. Separating Hard Eligibility Gaps from Skill/Evidence Gaps protects product credibility. Hard eligibility acts as an un-bypassable gate.

### 3. Discovery vs Recommendation
Filtering out unready opportunities limits user ambition. Showing unready opportunities tagged as 🟡 ALMOST READY or 🔴 NOT READY while recommending 🟢 READY items provides both actionable guidance and long-term skill visibility.

### 4. Evidence Provenance & Confidence Transparency
AI systems lose candidate trust when they silently assert vague inferences as definitive facts. Explicitly recording evidence provenance (where a skill claim originated) and confidence levels (High, Medium, Low) keeps diagnostics grounded and explainable.

### 5. Semantic Skill Matching Boundaries
Vector embeddings compute semantic distance, not strict domain equivalence. Assuming "Machine Learning" equals "Deep Learning" creates false readiness scores. Semantic matching must be paired with deterministic rules where domain distinctions matter.

### 6. Project Feasibility
Recommending an overly complex infrastructure project to close a simple BI tool gap defeats the user's purpose. Project recommendations must evaluate candidate skill level, effort feasibility, and evidence value.

## Phase 04 Learnings

### 7. Multi-Tenant Row Level Security & Identity Architecture
Never rely on client-provided IDs, local storage, or React state for authorization. Security in an AI assessment system requires:
* Supabase Auth managing identity and signing JWTs.
* Next.js 14 Middleware handling cookie validation and early edge route deflection.
* PostgreSQL Row Level Security (RLS) policies enforcing `auth.uid() = user_id` at the database layer.

### 8. Interactive Feedback in Security Policies
Complex password policies (e.g. 5-point requirements) frustrate users if validation is only executed on form submission. Providing a real-time dynamic requirement checklist and strength indicator as the user types significantly reduces signup drop-off while maintaining rigorous account security.

## Phase 05 Learnings

### 9. Decoupling Visual Design Tokens from Data Hardcoding
Reference templates and UI kits frequently combine high-polish visuals with tightly coupled mock fixtures. Migrating the design successfully requires extracting pure design tokens (OKLCH variables, frosted glassmorphism utilities, gradient definitions) into clean atomic components (`GlassPanel`, `ProgressRing`, `Badges`, `AppShell`) that bind directly to live backend APIs rather than mock data.

### 10. Concurrency in Multi-Item Diagnostic Dashboards
When rendering a dashboard where each opportunity requires a multi-dimensional readiness calculation, serial API requests degrade user experience. Running diagnostic queries in parallel using `Promise.all` on the client or batching on the server maintains instantaneous responsiveness while preserving 100% mathematical fidelity.
