# Phase 02: Architectural & Implementation Decisions Record

## DEC-02-01: Next.js 14 App Router Project Initialization
- **Context**: Need standard Next.js 14 App Router project setup with TypeScript, TailwindCSS/Vanilla CSS support, and ESLint.
- **Decision**: Initialized project with `src/` directory layout, Next.js 14 API routes, and Vitest test runner.
- **Status**: LOCKED

## DEC-02-02: Local PostgreSQL / Supabase Client Setup
- **Context**: Require both client-side and server-side Supabase client instances.
- **Decision**: Implemented `@supabase/supabase-js` client helper with fallback mock client mode for offline automated testing.
- **Status**: LOCKED

## DEC-02-03: Deterministic Hard Eligibility Engine
- **Context**: Hard gates must never be calculated by LLMs.
- **Decision**: Implemented 100% deterministic TypeScript module `hard_rules_engine.ts` evaluating explicit degree, min years, age, location, and deadline rules.
- **Status**: LOCKED

## DEC-02-04: Deterministic Readiness Scoring Engine
- **Context**: Soft readiness score calculation ($0.50 S_{\text{match}} + 0.30 E_{\text{proof}} + 0.20 X_{\text{align}}$) gated by Hard Eligibility.
- **Decision**: Implemented `readiness_engine.ts` with explicit score thresholds: READY ($\ge 80\%$), ALMOST READY ($50\% - 79\%$), NOT READY ($<50\%$).
- **Status**: LOCKED
