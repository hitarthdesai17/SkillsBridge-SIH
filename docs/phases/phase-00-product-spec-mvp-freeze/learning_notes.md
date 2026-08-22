# Phase 00: Technical Learning Notes

## Concept 1: Deterministic vs Probabilistic AI Boundaries
- **What it means**: Using traditional code rules for non-ambiguous logic (deadlines, min age, required degree) while using LLMs and embeddings for natural language parsing, semantic mapping, and creative project specs.
- **Why SkillBridge uses it**: Prevents AI hallucination on mandatory eligibility criteria, protecting product trust and explainability.
- **Where it appears**: Core Engine Pipeline (Stage 2 Hard Gate Rule Engine vs Stage 3 Vector Embeddings vs Stage 6 LLM Generator).

## Concept 2: Semantic Skill Matching vs Authoritative Normalization
- **What it means**: Vector similarity measures semantic proximity in embedding space, but does not prove domain equivalence (e.g. `ML` vs `Deep Learning`).
- **Why SkillBridge uses it**: Prevents treating related but distinct skills as identical while allowing flexible keyword resolution.
- **Where it appears**: Stage 3 Semantic Skill Alignment Engine & `docs/AI_DECISIONS.md`.

## Concept 3: 4-Tier Gap Differentiation
- **What it means**: Categorizing gaps into Skill Gap, Evidence Gap, Experience Gap, and Hard Eligibility Gap.
- **Why SkillBridge uses it**: Recommending a coding project solves a Skill or Evidence Gap, but will NOT solve a mandatory 3-year full-time work experience requirement or a missing B.Tech degree constraint.
- **Where it appears**: Stage 5 Gap Classification Engine.

## Concept 4: Evidence Provenance & Extraction Confidence
- **What it means**: Tracking lineage metadata (source document, context, claim text) and rating extraction certainty (High, Medium, Low, Unknown).
- **Why SkillBridge uses it**: Prevents uncertain AI guesses from becoming unverified candidate facts in readiness evaluations.
- **Where it appears**: `docs/AI_DECISIONS.md` and Database Schema Specs.

## Concept 5: Project Feasibility Evaluation
- **What it means**: Balancing project gap coverage with candidate skill level, prerequisite capabilities, and estimated completion effort.
- **Why SkillBridge uses it**: Ensures recommended projects are achievable and portfolio-ready without overwhelming candidates with unrealistic infrastructure complexity.
- **Where it appears**: Stage 6 Project Generator & `docs/ARCHITECTURE.md`.
