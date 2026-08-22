# Phase 5: Architecture & Design Decisions

## Decision 1: Controlled UI Migration vs Frontend Rewrite
* **Context**: The reference project was built with Vite, TanStack Router, Bun, and hardcoded mock data.
* **Decision**: Adopt the visual styling, CSS tokens, layout patterns, and component ergonomics while keeping the existing Next.js 14 App Router, TypeScript, React 18, Supabase SSR Auth, and deterministic backend API routes.
* **Rationale**: Rebuilding or replacing the Next.js App Router and backend API services would break database RLS isolation, session tokens, Gemini OCR pipelines, and test suites.

## Decision 2: Zero Import of Reference Mock Data
* **Context**: The reference project shipped with mock candidates (`Aarav Sharma`), static job listings, mock careers, and unverified telemetry.
* **Decision**: Refuse to import `src/lib/mock-data.ts` into real application routes. Every component binds strictly to real backend API responses (`/api/candidate/profile`, `/api/opportunities`, `/api/readiness/diagnose`, `/api/readiness/simulate`).
* **Rationale**: Preserves the core principle "NO EVIDENCE = NO CLAIM" and ensures true multi-domain candidate evaluation.

## Decision 3: AppShell vs Standalone Pages
* **Context**: Protected pages (`/dashboard`, `/upload`, `/profile`, `/opportunity/[id]`) benefit from unified navigation, user profile status, and quick search.
* **Decision**: Wrap authenticated pages in `AppShell` with fixed desktop sidebar and mobile bottom navigation, while keeping public pages (`/`, `/login`, `/signup`) wrapped in `SiteNavbar` / `AuthLayout`.
* **Rationale**: Delivers a SaaS operating system experience on desktop while providing responsive mobile ergonomics.
