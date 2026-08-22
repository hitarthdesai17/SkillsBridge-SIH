# Phase 03: Educational Learning Notes (AI Engine & Provenance Architecture)

> *Designed for a 1st-year AI / Data Science student.*

---

## 1. What is PDF Text Extraction?
When a user uploads a PDF file (e.g. `resume.pdf`), it is stored as a binary stream of numbers (Buffer). `pdf-parse` extracts character offsets and line text layout from the PDF structure to return plain text string format. This allows our backend to extract text deterministically at **$0.00 cost** without calling expensive LLM vision models.

---

## 2. What is Zod Schema Validation?
LLMs (like OpenAI GPT-4o-mini) return natural language text. `Zod` is a TypeScript runtime validation library that enforces exact schema shapes. By pairing OpenAI's `response_format: { type: "json_object" }` with `Zod.safeParse()`, we guarantee that every parsed resume contains valid arrays, enum strings (`HIGH`, `MEDIUM`, `LOW`), and required fields before writing to PostgreSQL.

---

## 3. What is Skill Evidence Provenance?
In SkillBridge, we never just extract a skill name like "Python". We extract **Evidence Provenance**:
* `provenance_source`: Where in the resume the skill appeared (e.g., "Projects Section").
* `provenance_context`: The sentence snippet demonstrating the skill.
* `extraction_confidence`: `HIGH` (demonstrated in project/work) vs `MEDIUM` (listed in skills section without context).

This enables SkillBridge to distinguish a candidate who *claims* Python from a candidate who has *portfolio proof* of Python!

---

## 4. How Targeted Project Feasibility Works
Instead of giving vague advice ("build a website"), SkillBridge calculates a **Project Feasibility Score**:
$$\text{Feasibility} = 0.35 \times \text{GapCoverage} + 0.30 \times \text{Relevance} + 0.20 \times \text{Evidence} + 0.15 \times \text{Feasibility}$$

This ensures the system recommends a project that directly closes top candidate gaps, leverages existing candidate strengths, and can be completed within 8-24 hours.
