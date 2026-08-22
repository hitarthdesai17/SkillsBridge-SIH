# SkillBridge Project Changelog

All notable changes to this project will be documented in this file.

## [Phase 05 - UI/UX Redesign & Functional Frontend Migration] - 2026-08-19
### Added
- Integrated high-contrast design tokens, OKLCH/CSS variables, frosted glassmorphism utilities (`.glass`, `.glass-panel`), halo gradients (`.bg-halo`), grid-fade patterns, shadows, and smooth hover lifts into `src/app/globals.css`.
- Installed UI utility suite: `clsx`, `tailwind-merge`, `class-variance-authority`, `framer-motion`.
- Created brand identity & geometric logo component (`src/components/brand/Logo.tsx`).
- Created core UI Kit: `GlassPanel`, `SectionHeading`, `PageHeader`, `ProgressRing` (dual-tone animated SVG), `SkillBar`, `SkillChip`, `ReadinessBadge`, `StatPill`.
- Built application shell & navigation suite: `AppShell` (fixed desktop sidebar, quick search header, user profile pill, mobile bottom nav), `SiteNavbar`, `SiteFooter`, `AuthLayout` (split-screen branding hero).
- Redesigned all frontend pages with zero mock data imports:
  - Landing Page (`src/app/page.tsx` with hero visual `/assets/hero-visual.jpg`, floating ProgressRing badges, 8-feature grid, 4-step workflow, career loop, principles, FAQ accordion).
  - Split-screen Login & Signup pages (`src/app/login/page.tsx`, `src/app/signup/page.tsx` with 5-point Zod validation & live strength checklist).
  - Resume Upload experience (`src/app/upload/page.tsx`, `src/components/ResumeUploader.tsx` with stage-based processing timeline & Gemini OCR fallback).
  - Candidate Profile (`src/app/profile/page.tsx`, `src/components/CandidateProfileCard.tsx` with verified evidence tags & confidence badges).
  - Opportunity Marketplace Dashboard (`src/app/dashboard/page.tsx`, `src/components/OpportunityCard.tsx` with glass stat counters, search, and category filters).
  - Opportunity Diagnostic Detail (`src/app/opportunity/[id]/page.tsx`, `src/components/GapAnalysisView.tsx`, `src/components/ProjectRecommendationCard.tsx`, `src/components/ReassessmentSimulator.tsx`).
- Preserved 100% of the deterministic backend engines, Supabase SSR authentication, RLS policies, and database schema.
- Verified with Vitest test suite: **31/31 tests across 10 files passing (100% pass rate)**.
- Created Phase 5 documentation suite in `docs/phases/phase-05-ui-redesign/`.

## [Phase 04 - Authentication & Account Security] - 2026-08-19
### Added
- Integrated Supabase Auth with `@supabase/ssr` for cookie-based session persistence and automatic token refresh in Next.js 14 App Router.
- Built root Next.js `middleware.ts` protecting sensitive routes (`/dashboard`, `/upload`, `/profile`, `/opportunity/:id`) and auto-redirecting unauthenticated requests to `/login?redirect=...`.
- Created client `<AuthProvider>` and `useAuth` hook (`src/context/AuthContext.tsx`) for real-time auth state synchronization across client UI.
- Implemented dual-layer 5-point password validation policy (`src/lib/auth_validation.ts`) and dynamic interactive checklist & strength meter on signup form.
- Created glassmorphic `/login` and `/signup` authentication pages with show/hide password toggles, Zod validation, and error alert banners.
- Created development test user auto-provisioning route (`POST /api/auth/seed-test-user`) creating `test_user@skillbridge.local` / `TEST_USER1!`.
- Multi-tenant user isolation: bound candidate profiles, parsed resumes, skills, projects, and experiences to the authenticated `user_id` in `candidate_service.ts` and `resume_parser.ts`.
- Created Multi-Tenant PostgreSQL Row Level Security migration (`supabase/migrations/20260819_auth_rls.sql`) enforcing `auth.uid() = user_id`.
- Added 11 new automated unit tests (`auth_validation.test.ts`, `auth_isolation.test.ts`) bringing test suite to 31 tests across 10 files (100% PASS rate).

## [Phase 04 - Frontend & Reassessment Simulator] - 2026-08-19
### Added
- Implemented glassmorphic styling system & responsive design foundation (`src/app/globals.css`).
- Built reusable UI component suite (`Navbar`, `ReadinessBadge`, `ResumeUploader`, `CandidateProfileCard`, `OpportunityCard`, `GapAnalysisView`, `ProjectRecommendationCard`, `ReassessmentSimulator`).
- Built 5 App Router pages (`/`, `/upload`, `/profile`, `/dashboard`, `/opportunity/[id]`).
- Created Reassessment Simulator API route handler (`POST /api/readiness/simulate`) executing backend readiness & hard rules engines.
- Executed Vitest test runner across 7 test files (13 test cases) with 100% PASS rate.
- Created Phase 4 documentation suite in `docs/phases/phase-04-frontend/` with 16 manual test specifications (`manual_testing.md`).

## [Phase 03] - 2026-08-19
### Added
- Implemented PDF text extraction service (`src/lib/resume_parser.ts`) using `pdf-parse`.
- Implemented structured AI Resume Parser using OpenAI `gpt-4o-mini` with Zod schema validation (`ParsedResumeSchema`) and deterministic fallback parser.
- Added Evidence Provenance tracking (`provenance_source`, `provenance_context`, `source_evidence`) and confidence scoring (`HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`).
- Implemented Gap Analysis Engine (`src/lib/gap_analysis_engine.ts`) classifying gaps into `SKILL_GAP`, `EVIDENCE_GAP`, `EXPERIENCE_GAP`, and `HARD_ELIGIBILITY_GAP`.
- Implemented Targeted Project Recommendation Engine (`src/lib/project_recommendation_engine.ts`) calculating Project Feasibility score.
- Created REST API route handlers (`/api/resume/parse`, `/api/gaps/analyze`, `/api/projects/recommend`).
- Executed Vitest test suite covering 12 test cases with 100% PASS rate across all 6 test files.
- Created Phase 3 documentation suite in `docs/phases/phase-03-ai-resume-gap-project/`.

## [Phase 02] - 2026-08-19
### Added
- Initialized Next.js 14 App Router project foundation with TypeScript (`package.json`, `tsconfig.json`, `.env.example`, `.gitignore`, `src/types/index.ts`).
- Created Supabase connection module `src/lib/supabase.ts`.
- Implemented 100% deterministic, zero-LLM `hard_rules_engine.ts` evaluating education degree, min years, age, location, and deadline gates.
- Implemented 100% deterministic `readiness_engine.ts` scoring ($0.50 S_{\text{match}} + 0.30 E_{\text{proof}} + 0.20 X_{\text{align}}$) gated by Hard Eligibility binary multiplier ($1.0$ or $0.0$).
- Implemented 5-tier semantic `vector_matcher.ts` (`EXACT_MATCH`, `STRONG_RELATED`, `PARTIAL_MATCH`, `WEAK_RELATED`, `NO_MATCH`).
- Created 16 curated seed opportunities in `src/lib/seed_data.ts` covering all 12 testing scenarios.
- Implemented `candidate_service.ts` and `opportunity_service.ts`.
- Implemented RESTful API route foundation (`/api/candidate/profile`, `/api/opportunities`, `/api/readiness/diagnose`) with Zod request validation.
- Executed Vitest automated test suite (`hard_rules_engine.test.ts`, `readiness_engine.test.ts`, `vector_matcher.test.ts`) with 100% PASS rate across all 6 test cases.
- Completed Phase 2 documentation suite in `docs/phases/phase-02-database-infrastructure/`.

## [Post-Phase-0 Specification Refinements] - 2026-08-19
### Refined
- **Architecture Boundaries**: Explicitly separated Phase 0 locked architectural concepts from Phase 1 stack decisions (`STATUS: REQUIRES PHASE 1 DECISION`).
- **Readiness Model**: Documented strict **Hard Eligibility Gate** rule and Phase 1 score calibration requirements.
- **AI Boundaries**: Added Evidence Provenance schema spec, Extraction Confidence Model (High/Medium/Low/Unknown), and Semantic Skill Matching limitations.
- **Project Generator**: Added Project Feasibility dimension ($\text{GAP COVERAGE} \times \text{RELEVANCE} \times \text{EVIDENCE} \times \text{FEASIBILITY}$).
- **Glossary**: Created `docs/GLOSSARY.md` containing 23 SkillBridge domain definitions.
- **Status Tracking**: Created root-level `STATUS.md` snapshot navigator.

## [Phase 00] - 2026-08-19
### Added
- Created complete Product Specification and MVP Freeze Document.
- Defined Core Product Engine: Dual user modes (Discovery & Diagnostic), 4-tier gap classification, hybrid deterministic/AI readiness engine.
- Established repository-wide documentation and knowledge tracking structure in `docs/`.
