# Phase 02: Technical Learning Notes

## Concept 1: Hard Eligibility Binary Gating Pattern
- **What it means**: Evaluating mandatory requirements (Degree, Exp Years, Deadline) in code before scoring soft factors, using a $1.0$ or $0.0$ binary multiplier.
- **Why SkillBridge uses it**: Guarantees ineligible candidates (e.g. missing required B.Tech degree or expired deadline) are never classified as 🟢 READY, protecting product credibility.
- **Where it appears**: `src/lib/hard_rules_engine.ts`.

## Concept 2: Zero-LLM Deterministic Readiness Scoring
- **What it means**: Performing mathematical score calculations ($0.50 S_{\text{match}} + 0.30 E_{\text{proof}} + 0.20 X_{\text{align}}$) in explicit TypeScript code without calling an LLM.
- **Why SkillBridge uses it**: Prevents LLM non-determinism, floating point hallucinations, and API costs during readiness assessment.
- **Where it appears**: `src/lib/readiness_engine.ts`.

## Concept 3: Canonical Skill Normalization & 5-Tier Semantic Matcher
- **What it means**: Using string normalization combined with vector cosine distance thresholds (`EXACT_MATCH`, `STRONG_RELATED`, `PARTIAL_MATCH`, `WEAK_RELATED`, `NO_MATCH`).
- **Why SkillBridge uses it**: Allows recognizing synonyms (`React.js` $\leftrightarrow$ `React`) while preserving distinctions (`React` $\neq$ `React Native`).
- **Where it appears**: `src/lib/vector_matcher.ts`.
