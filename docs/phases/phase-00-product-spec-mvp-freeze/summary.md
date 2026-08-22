# Phase 00: Product Specification & MVP Freeze - Summary

## Phase Objective
Define, validate, and document the complete product specification, core readiness engine mechanism, AI responsibility matrix, user journeys, data models, and MVP scope freeze for **SkillBridge** prior to writing code.

## What We Built / Designed
In Phase 0, no application code was generated. We designed the complete technical and product architecture for SkillBridge:
1. **Product Core Definition & Positioning**: AI Opportunity Readiness & Career Pathway Engine for college students and fresh graduates.
2. **Dual-User Mode Journeys**:
   - **Mode A ("What Can I Reach?")**: Candidate profile analysis against discovery pool of opportunities, prioritizing recommendations without hiding unready opportunities.
   - **Mode B ("Can I Reach This?")**: Diagnostic analysis of candidate against a specific opportunity target.
3. **Opportunity Readiness Engine**:
   - Deterministic Rule Engine for Hard Eligibility Gates (Education degree, hard experience years, age, location, deadlines).
   - Hybrid AI & Rule Engine for Soft Readiness Scoring (Skill alignment, project evidence, soft experience).
   - Three Readiness States: 🟢 READY, 🟡 ALMOST READY, 🔴 NOT READY.
4. **4-Tier Gap Model**:
   - **Skill Gap**: Missing domain/technical capability.
   - **Evidence Gap**: Possesses candidate claim/skill but lacks portfolio/project proof.
   - **Experience Gap**: Lacks formal workplace experience required by non-entry job specs.
   - **Hard Eligibility Gap**: Failed mandatory hard gate constraint (cannot be solved by projects).
5. **Personalized Project Recommendation Model**:
   - Targeted project generation addressing specific Skill and Evidence Gaps for high-priority target opportunities. Reuses candidate strengths while remaining realistic for current skill levels.
6. **AI Responsibility Matrix & Pipeline**:
   - Strict separation: Rules for hard constraints/deadlines; Embeddings for semantic skill matching; LLM for parsing unstructured resume/JD text, generating natural language explanations, and structuring targeted project specifications.
7. **Documentation & Knowledge System**:
   - Established repository-bound technical memory structure under `docs/` and `docs/phases/`.

## Architecture & Data Flow Overview
```
[User Resume / Profile] + [Target / Batch Opportunities]
                        │
                        ▼
           [Stage 1: Parsing & Extraction]
       (LLM + Rule-based Schema Validation)
                        │
                        ▼
          [Stage 2: Deterministic Hard Eligibility]
           (Rule Engine - Binary Pass/Fail Gates)
                        │
                        ▼
        [Stage 3: Semantic Skill Matching]
              (Vector Embeddings - Cosine Sim)
                        │
                        ▼
          [Stage 4: Soft Readiness Scoring]
         (Weighted Hybrid Scoring Model 0-100%)
                        │
                        ▼
      [Stage 5: 4-Tier Gap Classification & Recommendation]
       (Skill Gap / Evidence Gap / Experience Gap / Hard Gate)
                        │
                        ▼
     [Stage 6: Action Planning & Targeted Project Generation]
     (LLM + Feasibility Evaluation + Structured Output)
                        │
                        ▼
    [Stage 7: Reassessment & Newly Reachable Opportunities]
               (Simulated State Delta Engine)
```

## Post-Phase-0 Refinements
Following a controlled post-freeze quality review pass, the specification was refined as follows:
- **Architecture Ambiguity Clarification**: Separated Phase 0 locked architectural concepts from Phase 1 technology stack decisions (Framework, DB client, AI models).
- **Readiness Model Precision**: Explicitly documented that Hard Eligibility is a strict binary gate (failing a hard gate forces 🔴 NOT READY regardless of high skill match) and defined Phase 1 formula calibration parameters.
- **Evidence Provenance**: Defined lineage requirements (source, context, claim text, confidence) for candidate skills and opportunity rules.
- **Extraction Confidence Model**: Specified confidence taxonomy (High, Medium, Low, Unknown) to prevent unverified AI inference from being treated as definitive fact.
- **Semantic Skill Matching**: Clarified that vector embeddings perform semantic matching, not perfect authoritative skill equivalence (e.g. ML vs Deep Learning are related, not identical).
- **Project Feasibility Dimension**: Added feasibility ($\text{GAP COVERAGE} \times \text{RELEVANCE} \times \text{EVIDENCE} \times \text{FEASIBILITY}$) to prevent recommending inappropriately complex projects.
- **Glossary Creation**: Created `docs/GLOSSARY.md` with 23 core SkillBridge domain definitions.
- **Documentation Cleanup**: Replaced placeholder entries in bug logs with clear statements confirming zero application code bugs during Phase 0.

> [!NOTE]
> **Scope Confirmation**: These post-freeze refinements do **NOT** expand the MVP feature scope. They improve technical precision, explainability, and Phase 1 implementation readiness.

## Important Algorithms / Technologies & Purpose
- **Rule Engine (Deterministic)**: Evaluates hard eligibility constraints (Deadlines, Min Degree, Min Work Years). Prevents LLM hallucination on strict requirements.
- **Vector Embeddings (pgvector / SentenceTransformers)**: Computes semantic similarity between variant skill keywords (e.g., `ML`, `Machine Learning`, `Sklearn`).
- **LLM Structured Output (JSON Schema / Pydantic / Zod)**: Used for resume parsing, JD requirement parsing, explainable output generation, and personalized project scope creation.

## Files Created / Modified & Responsibilities
- `STATUS.md`: Compact root-level project status snapshot.
- `docs/GLOSSARY.md`: Core domain terminology definitions.
- `docs/phases/phase-00-product-spec-mvp-freeze/summary.md`: Primary Phase 0 reference document.
- `docs/phases/phase-00-product-spec-mvp-freeze/decisions.md`: Architectural and product decisions record.
- `docs/phases/phase-00-product-spec-mvp-freeze/bugs_encountered.md`: Initial bug log template.
- `docs/phases/phase-00-product-spec-mvp-freeze/sql_log.md`: Database query log template.
- `docs/phases/phase-00-product-spec-mvp-freeze/learning_notes.md`: Technical learning log for Phase 0.
- `docs/phases/phase-00-product-spec-mvp-freeze/test_log.md`: Verification and test plan record.
- `docs/phases/phase-00-product-spec-mvp-freeze/open_issues.md`: Open architectural decisions needing approval.
- `docs/ARCHITECTURE.md`: Global system architecture spec.
- `docs/CHANGELOG.md`: Repository changelog.
- `docs/DATABASE.md`: Global database schema spec.
- `docs/AI_DECISIONS.md`: Global AI responsibility & boundary spec.
- `docs/PROJECT_LEARNINGS.md`: Accumulated project learnings.

## Phase Result
**SUCCESS (Phase 0 Specification, MVP Freeze, & Post-Phase-0 Refinements Complete)**

## What Next Phase Depends On
Requires explicit User approval of Phase 0 Product Specification, Post-Phase-0 Refinements, and Phase 1 Open Decisions before initiating **Phase 1: Environment Setup, Database Schema & Seed Data Engine**.
