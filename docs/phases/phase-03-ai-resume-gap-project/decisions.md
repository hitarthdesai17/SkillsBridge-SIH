# Phase 03: Architectural Decisions Log

| Decision ID | Date | Component | Decision | Rationale | Alternatives Considered | Status | Impact |
|---|---|---|---|---|---|---|---|
| DEC-03-01 | 2026-08-19 | Resume Extraction | Use `pdf-parse` for PDF text extraction before LLM parsing. | Guarantees $0.00 LLM costs for raw OCR and enforces clean text validation. | Direct multimodal PDF upload to LLM | LOCKED | Zero cost for PDF reading; fast validation. |
| DEC-03-02 | 2026-08-19 | Structured Parser | Use OpenAI `gpt-4o-mini` with Zod schema validation & deterministic fallback. | Guarantees strict JSON output structure and fallback reproducibility in test environments. | Unstructured prose prompt output | LOCKED | Zero invalid JSON crashes. |
| DEC-03-03 | 2026-08-19 | Gap Classification | Enforce 4-tier gap classification (`SKILL_GAP`, `EVIDENCE_GAP`, `EXPERIENCE_GAP`, `HARD_ELIGIBILITY_GAP`). | Clear distinction between missing skills, unproven claims, experience deficit, and hard gates. | Generic binary skill gap list | LOCKED | Explainable gap feedback for candidate. |
| DEC-03-04 | 2026-08-19 | Project Engine | Calculate Project Feasibility ($0.35 \times \text{GapCoverage} + 0.30 \times \text{Relevance} + 0.20 \times \text{Evidence} + 0.15 \times \text{Feasibility}$) and leverage existing candidate strengths. | Prevents recommending overwhelming projects and ensures realistic 8-24 hour effort. | Recommending generic microservice templates | LOCKED | Highly actionable portfolio project ideas. |
