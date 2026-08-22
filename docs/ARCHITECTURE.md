# SkillBridge System Architecture (Global)

## 1. High-Level Architectural Pattern
SkillBridge follows a modular full-stack application architecture separating presentation, API routing, rule evaluation, vector matching, and structured AI generation.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND PRESENTATION LAYER                     │
│  - Candidate Dashboard ("What Can I Reach?") [LOCKED PHASE 0]          │
│  - Opportunity Diagnostic Mode ("Can I Reach This?") [LOCKED PHASE 0]  │
│  - Readiness & Gap Visualizer (🟢 READY / 🟡 ALMOST / 🔴 NOT READY)    │
│  - Targeted Action & Project Specification Viewer                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION BACKEND API                       │
│  - Candidate Profile Ingestion Service                                 │
│  - Opportunity Management & Diagnostic Router                          │
│  - Readiness Delta Engine (Simulated Action Impact)                    │
│  [STATUS: REQUIRES PHASE 1 STACK DECISION]                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
             ┌──────────────────────┴──────────────────────┐
             ▼                                             ▼
┌───────────────────────────┐                ┌───────────────────────────┐
│     HARD RULE ENGINE      │                │   AI & EMBEDDINGS ENGINE  │
│ - Deterministic Eligibility│                │ - Resume & JD Extractor   │
│ - Binary Pass/Fail Gates  │                │ - Semantic Skill Matching │
│ - Deadline Checkers       │                │ - Explanation Generator   │
│ [LOCKED IN PHASE 0]       │                │ - Gap-Targeted Project Gen│
└────────────┬──────────────┘                │ [STATUS: REQUIRES PHASE 1 │
             │                               │  MODEL SELECTION]         │
             │                               └─────────────┬─────────────┘
             └──────────────────────┬──────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER (PostgreSQL / Supabase)             │
│ - Users, CandidateProfiles, Skills, Projects, Experience               │
│ - Opportunities, Requirements, Explicit Constraints                    │
│ - ReadinessAssessments, SkillGaps, ActionPlans, RecommendedProjects    │
│ [STATUS: REQUIRES PHASE 1 DB ACCESS DECISION]                          │
└────────────────────────────────────────────────────────────────────────┘
```

## 2. Core Operational Modes (Locked in Phase 0)
- **Mode A: Discovery & Prioritization ("What Can I Reach?")**: Analyzes candidate against curated opportunities, returning prioritized recommendations while keeping unready opportunities accessible.
- **Mode B: Diagnostic ("Can I Reach This?")**: Evaluates candidate against a single specified opportunity (URL, pasted JD, or selected item) to produce a 4-tier gap breakdown and actionable roadmap.

## 3. Readiness Calculation Specification

Readiness must be composed of multiple evidence-backed dimensions:
1. **Hard Eligibility**: Binary pass/fail validation of mandatory constraints.
2. **Skill Alignment**: Semantic overlap between candidate capabilities and opportunity requirements.
3. **Evidence & Portfolio Alignment**: Demonstration of required skills through public project deliverables.
4. **Relevant Experience**: Alignment of academic, internship, or prior workplace history.
5. **Education Level**: Degree requirements and academic discipline alignment.

> [!IMPORTANT]
> **HARD ELIGIBILITY IS A GATE**: A candidate who fails a mandatory hard eligibility requirement (e.g., missing Bachelor's degree, age restriction, expired deadline) **MUST NOT** be represented as 🟢 READY, regardless of high semantic skill alignment. Hard eligibility failure forces a 🔴 NOT READY classification.

### Phase 1 Readiness Calibration Requirements
The exact mathematical weights and score thresholds must be calibrated and finalized in Phase 1:
- Scoring formula and category weighting schema
- 🟢 READY threshold (e.g. $\ge 80\%$)
- 🟡 ALMOST READY threshold (e.g. $50\% - 79\%$)
- 🔴 NOT READY threshold (e.g. $< 50\%$)
- Rules for handling missing or incomplete profile information
- Calibration of score explanations to avoid false scientific precision

## 4. Project Feasibility Evaluation Dimension

When generating personalized project recommendations to close `SKILL_GAP` or `EVIDENCE_GAP` items, SkillBridge incorporates **Project Feasibility**.

The conceptual recommendation score balances:

$$\text{Project Priority Score} = \text{GAP COVERAGE} \times \text{OPPORTUNITY RELEVANCE} \times \text{EVIDENCE VALUE} \times \text{FEASIBILITY}$$

### Feasibility Factors
- Candidate's current skill level and existing strengths.
- Prerequisite skills required before starting the project.
- Estimated project complexity and completion effort (e.g., 10-15 hours vs 200 hours).
- Familiarity with suggested tech stack.

> [!TIP]
> **Avoid Inappropriate Complexity**: Recommending a 15-hour Sales Performance Dashboard for a missing Power BI skill is appropriate. Recommending a multi-tenant distributed Kubernetes ML infrastructure pipeline for an entry-level BI role violates feasibility and is strictly prohibited.

## 5. Phase 1 Architecture Decisions Required

The following technical implementation choices are explicitly deferred to Phase 1:

| Decision Area | Status | Options for Phase 1 |
|---|---|---|
| **Frontend Framework** | REQUIRES PHASE 1 DECISION | Next.js 14 App Router vs Vite React SPA |
| **Backend Framework** | REQUIRES PHASE 1 DECISION | Next.js API Routes vs Node Express vs FastAPI Python |
| **API Architecture** | REQUIRES PHASE 1 DECISION | REST OpenAPI vs GraphQL |
| **Authentication** | REQUIRES PHASE 1 DECISION | Supabase Auth vs NextAuth.js |
| **Database Access Strategy**| REQUIRES PHASE 1 DECISION | Supabase Client / Prisma ORM / Kysely |
| **AI Provider / Model** | REQUIRES PHASE 1 DECISION | OpenAI GPT-4o-mini vs Anthropic Claude 3.5 Haiku |
| **Embedding Provider** | REQUIRES PHASE 1 DECISION | OpenAI `text-embedding-3-small` vs HuggingFace Local Embeddings |
| **Deployment Target** | REQUIRES PHASE 1 DECISION | Vercel vs Render vs AWS |
| **File Storage** | REQUIRES PHASE 1 DECISION | Supabase Storage vs AWS S3 (for Resumes) |
