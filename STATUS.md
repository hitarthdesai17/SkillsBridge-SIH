# SkillBridge Project Status

## 1. Current Phase
Phase 7.Y: Personalized Gap Improvement & Learning Plan (built on top of Phase 7.X)
Status: COMPLETE -- 163/163 tests passing, clean production build, verified live in a real browser run.

This file was rewritten from an actual inspection of the repository at each step, not
from prior notes. It supersedes the previous Phase 7.X-only version.

## 2. What Was Already In Place (Before This Session's Phase 7.Y Work)

Phase 7.X (Execution & Differentiation Completion) was already fully implemented and
verified: requirement traceability, the real Evidence Chain modal, eligibility-vs-
learnable-gap classification, the Project Verification Checkpoint state machine
(`project_verification_engine.ts`), inline readiness simulation, opportunity
prioritization/freshness badges, and honest empty/insufficient-market-data states.
143/143 tests were passing and the production build was clean. None of this was
rebuilt -- it was inspected, confirmed working, and reused.

## 3. What Was Newly Implemented (Phase 7.Y)

The core gap in the product: clicking "Improve" on a gap only opened a read-only
"Evidence Chain" explanation -- it never told the candidate **how** to actually close
the gap. Phase 7.Y closes that loop:

Gap -> Action Plan -> Learning -> Practice -> Project -> Evidence -> Verification -> Reassessment

1. **New engine: `src/lib/gap_action_plan_engine.ts`.** Given a candidate profile,
   target career, and a specific gap capability, it:
   - Reuses `roadmap_engine.filterTargetOpportunities` and
     `prioritizeCareerSkillGaps` (not duplicated) to find the real, currently-prioritized
     gap and its market evidence.
   - **Refuses to generate a learning plan for an eligibility blocker** -- returns a
     distinct `ELIGIBILITY_BLOCKER` result instead (Feature/Step 2 & 11).
   - Resolves the gap's capability to a small, deterministic skill-dependency graph
     (e.g. Python -> Pandas -> Data Processing -> PySpark -> Spark ETL -> Data
     Pipelines) and determines the candidate's real **starting point** by checking
     which prerequisite skills the candidate's actual profile already has --
     already-verified skills are never re-taught.
   - Builds a specific, non-generic 4-phase learning plan (Foundations -> Applied
     Practice -> Applied Project -> Evidence), where every task follows
     ACTION -> PRACTICE -> DELIVERABLE -> VERIFICATION (never a bare "Learn X").
   - Reuses `project_recommendation_engine.generateTargetedProjectRecommendation`
     (not duplicated) to build a **Project Blueprint** that explicitly states which
     gap(s) it closes, its architecture flow, implementation task list, and expected
     evidence.
   - Computes a deterministic **effort estimate** (learning/practice/project/docs/
     verification hours + a human-readable duration), reduced (not eliminated) when
     prerequisites are already verified.
   - Provides structured, categorized **resource recommendations** (Official
     Documentation / Course / Tutorial / Practice Platform / Dataset / Reference) --
     never a fabricated URL.
   - Surfaces an explicit **"Why This Plan Is Personalized"** proof: which of the
     candidate's real skills are already verified and are being built on, and what
     percentage/count of real target opportunities require this gap.
2. **New engine: `src/lib/gap_learning_progress.ts`.** Tracks the pre-project part of
   progress (Not Started / Learning / Practicing) client-side, and *derives* the full
   candidate-facing stage (through Building Project / Submitted / Verified / Readiness
   Reassessed) by reading the **existing** `ProjectVerificationRecord` from
   `project_verification_engine.ts` -- it never re-implements verification and can
   never self-declare VERIFIED.
3. **New API route: `POST /api/roadmap/action-plan`.** Thin wrapper: validates input,
   loads the candidate profile and opportunities the same way `/api/roadmap` already
   does, and calls `generateGapActionPlan`. No business logic duplicated in the route.
4. **UI: `CareerRoadmapView.tsx`** (additive only, no protected engine touched):
   - A new **"Your Action Plan"** teaser card on the roadmap showing the top
     learnable gap with a "Start Learning Plan" button.
   - The "Improve" / "View Rule" button in the Market Demand table now opens a new,
     polished **Gap Action Plan drawer** (styled-jsx + existing CSS variables, no
     Tailwind) instead of only the old Evidence Chain modal. "View Proof" (for gaps
     already backed by strong evidence) still opens the original Evidence Chain modal.
   - The drawer renders, in order: gap summary (priority/market evidence/
     classification/target, with each related opportunity linking to its real
     `/opportunity/[id]` detail page) -> Current Evidence -> Why This Plan Is
     Personalized -> Prerequisite Path (with a "start here" marker) -> Personalized
     Learning Plan (phase cards) -> Project Blueprint ("this project closes N
     identified gap(s)") -> Estimated Effort -> Progress tracker with real
     execution controls (Start Learning / Mark Practicing / Start Project / Submit
     Evidence / Run Readiness Reassessment) -> Verification Requirements ->
     Resources. An eligibility-blocker gap renders a distinct red "Eligibility
     Blocker" panel instead, with no learning-plan content at all.
   - The Reassessment step reuses the existing `/api/readiness/simulate` endpoint
     (not a second scoring implementation) and clearly labels the result "CURRENT
     VERIFIED READINESS" vs "SIMULATED / PROJECTED READINESS -- NOT VERIFIED."
   - A rejected verification (`REJECTED_NEEDS_MORE_EVIDENCE`) renders its stored
     rejection note with a "Resubmit" button, rather than silently collapsing into a
     generic in-progress state.

## 4. Verified Facts (This Session)

- **163/163 tests passing** across 24 test files (`npx vitest run`) -- up from the
  143-test Phase 7.X baseline (20 net new tests: 16 in `gap_action_plan_engine.test.ts`,
  4 in the new API route's test file).
- **Clean production build** (`npx next build`): new `/api/roadmap/action-plan` route
  compiles alongside all existing routes, no type errors.
- **Manually verified in a real headless-browser run** (Playwright, demo login,
  Career Roadmap tab, target "Python Backend Developer"):
  - Clicking "Improve" on the real "PySpark / Data Pipelines" gap (surfaced by this
    repo's own seed data -- confirmed by direct inspection before writing any code,
    not assumed) opened the full drawer with real, grounded content throughout.
  - The prerequisite chain correctly showed Python as already verified and started
    the plan at "Pandas" (the candidate's actual next unmet prerequisite), not at
    Python fundamentals.
  - The Project Blueprint stated "This project closes 1 identified market gap:
    PySpark / Data Pipelines," with a real architecture flow and implementation task
    list built from the existing project recommendation engine's output.
  - Effort estimate rendered as 15h/10h/14h/3h/1h/43h total, "~2 weeks at 3-4
    hours/day" -- reduced from the 18h baseline because one prerequisite (Python)
    was already verified.
  - Clicking through Start Learning -> Mark Practicing -> Start Project -> Submit
    Evidence correctly advanced the real progress tracker.
  - The "Why This Plan Is Personalized" and "Resources" sections rendered with real,
    candidate-specific and skill-specific content (confirmed via the actual page
    text, not just component code).
  - Clicking a linked opportunity's title correctly pointed at its real
    `/opportunity/[id]` detail page.
  - Selecting "Machine Learning Engineer" (the candidate lacks the required Master's
    degree) and clicking "View Rule" on that requirement correctly opened the
    Eligibility Blocker panel with **no learning plan generated** -- confirmed both
    via the engine test suite and live in the browser.
  - Selecting "Teacher" (uncatalogued, no real seed opportunities) correctly showed
    "Insufficient Market Data," not an invented plan.

## 5. Files Modified/Created (Phase 7.Y)

- `src/lib/gap_action_plan_engine.ts` -- new file (plan generation engine).
- `src/lib/gap_action_plan_engine.test.ts` -- new file, 16 tests.
- `src/lib/gap_learning_progress.ts` -- new file (progress-stage derivation; reads
  but never writes `project_verification_engine`'s state).
- `src/app/api/roadmap/action-plan/route.ts` -- new file (API endpoint).
- `src/app/api/roadmap/action-plan/route.test.ts` -- new file, 4 tests.
- `src/types/index.ts` -- additive types only (`GapActionPlan`, `LearningPhase`,
  `LearningTask`, `ProjectBlueprint`, `SkillDependencyStep`, `GapResourceRecommendation`,
  `LearningPlanStage`, `GapActionPlanResult`, and related fields).
- `src/components/CareerRoadmapView.tsx` -- UI-only additions (teaser card, drawer,
  new styled-jsx rules); no protected engine touched, no Tailwind introduced.

Untouched (per project rules): `readiness_engine.ts`, `hard_rules_engine.ts`,
`gap_analysis_engine.ts`, `opportunity_freshness.ts`, `personalized_ranking_engine.ts`,
`project_recommendation_engine.ts`, `application_tracking_engine.ts`,
`project_verification_engine.ts` -- all called, none modified. `roadmap_engine.ts` was
not modified further in this round (only its existing exports were reused).

## 6. Remaining Limitations / Honest Gaps

- There is still no backend reviewer workflow. `REJECTED_NEEDS_MORE_EVIDENCE` is
  correctly modeled end-to-end (engine state machine, derived UI stage, a "Resubmit"
  button that shows the rejection note) but nothing in today's candidate-facing UI
  can actually *set* that state yet, since doing so from the candidate side would
  mean self-declaring a rejection -- exactly the kind of self-service shortcut this
  architecture deliberately avoids for VERIFIED. Once a real reviewer path exists,
  the UI will render it correctly with no further changes.
- The "UPSC Civil Services" quick-pick currently surfaces "Insufficient Market Data"
  in this environment: its one seed opportunity has a deadline of 2026-03-05, which
  has already passed relative to this session's real current date (August 2026).
  This is honest, correct, zero-invention behavior given the data -- not a bug in
  Phase 7.Y or 7.X -- but it does mean the UPSC pathway isn't demoable end-to-end
  until the seed data's dates are refreshed (out of scope for this feature request).
  Every other real target career tested (Data Analyst, Python Backend Developer,
  Machine Learning Engineer, Teacher) behaved as expected.
- Resource recommendations are structured categories with real, generic guidance
  text (e.g. "Official Apache Spark documentation") but intentionally carry no
  clickable URLs, per the explicit "do not invent fake links" instruction -- real
  links can be attached later without changing the data model.
- This session's build/test verification ran in an isolated sandbox with placeholder
  Supabase credentials (seed-data fallback), not the user's real Supabase project --
  re-run `npm test` and `npm run build` locally to confirm against real data/env.

## 7. Manual Verification Steps (repeat locally)

1. `npm run dev`, log in (or hit `/api/auth/demo-login`).
2. Go to Dashboard -> Career Roadmap tab, target "Python Backend Developer".
3. In the Market Demand table, click "Improve" on "PySpark / Data Pipelines."
4. Confirm the drawer shows: real market evidence with a linked opportunity, Current
   Evidence chips, a "Why This Plan Is Personalized" panel naming your actual
   verified skills, a prerequisite chain with a "start here" marker on the correct
   node, a 4-phase learning plan, a Project Blueprint stating which gap(s) it closes,
   an effort estimate, a progress tracker, verification requirements, and resources.
5. Click through Start Learning -> Mark Practicing -> Start Project -> Submit
   Evidence and confirm the progress tracker advances correctly and never jumps to
   "Verified" on its own.
6. Change target career to "Machine Learning Engineer" and click "View Rule" on the
   Master's-degree requirement -- confirm an Eligibility Blocker panel appears with
   no learning plan.
7. Change target career to an uncatalogued title (e.g. "Teacher") -- confirm
   "Insufficient Market Data."
8. `npm test` and `npm run build`.
