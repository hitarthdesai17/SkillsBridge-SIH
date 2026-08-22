# Phase 00: Decisions Record

## Decision 00-01: Primary User Focus
- **Context**: SkillBridge could potentially serve job seekers, recruiters, career guidance counsellors, or experienced professionals.
- **Options Considered**:
  1. Multi-persona MVP (Students + Recruiters + Counsellors).
  2. Experienced Professionals seeking mid-career transitions.
  3. College students & fresh graduates seeking internships or entry-level roles.
- **Chosen Option**: Option 3 (College students & fresh graduates seeking internships/entry-level jobs).
- **Reasoning**: Entry-level candidates face the highest ambiguity around capability proof, experience gaps, and job readiness. Restricting the persona simplifies parsing logic and standardizes project-based evidence evaluation.
- **Impact**: All MVP user interfaces, resume parsers, and project generators are tailored specifically to entry-level profiles.

## Decision 00-02: Responsible AI Architecture (Hybrid Rule + AI Engine)
- **Context**: LLMs often hallucinate eligibility conclusions or make non-deterministic decisions on strict cutoff rules.
- **Options Considered**:
  1. Pure LLM prompt pipeline for all evaluations.
  2. Pure keyword/rules engine without AI.
  3. Hybrid architecture: Deterministic Rule Engine for hard gates + Vector Embeddings for skill similarity + Structured LLM for explanations & project specs.
- **Chosen Option**: Option 3 (Hybrid Architecture).
- **Reasoning**: Hard eligibility rules (e.g., application deadline passed, missing required Bachelor's degree) must be 100% deterministic. Soft readiness factors (e.g., skill alignment, project evidence strength) benefit from semantic AI.
- **Impact**: Zero false-pass LLM hallucinations on strict job eligibility requirements.

## Decision 00-03: Opportunity Discovery vs. Recommendation Separation
- **Context**: Traditional job platforms filter out unready jobs entirely, while generic job boards show all jobs without readiness guidance.
- **Options Considered**:
  1. Hide all opportunities where candidate score < 70%.
  2. Show all opportunities sorted purely by posting date.
  3. Show all relevant opportunities across readiness tiers (🟢 READY, 🟡 ALMOST READY, 🔴 NOT READY), but prioritize recommendations on ready/near-ready opportunities.
- **Chosen Option**: Option 3.
- **Reasoning**: Hiding unready jobs prevents students from understanding what skills they need to acquire for aspirational roles. Showing readiness tiers provides transparency while keeping aspirational jobs visible.
- **Impact**: Product functions as both an opportunity navigator and a diagnostic career roadmap engine.

## Decision 00-04: Gap & Project Recommendation Scope
- **Context**: Projects can close skill gaps, but cannot replace mandatory degree requirements or years of professional experience.
- **Options Considered**:
  1. Claim that completing a project makes a candidate eligible for any job gap.
  2. Recommend generic learning courses (e.g., Coursera links).
  3. Distinguish 4 gap types (Skill, Evidence, Experience, Hard Gate) and recommend customized portfolio projects only for Skill & Evidence gaps.
- **Chosen Option**: Option 3.
- **Reasoning**: Maintains product integrity and honesty. Projects prove technical capabilities and build evidence, but cannot bypass statutory or hard eligibility requirements.
- **Impact**: Candidates receive actionable, realistic project specifications without deceptive promises.

## Post-Phase-0 Decision Refinements

## Decision 00-05: Strict Hard Gate Disqualification Rule
- **Context**: Candidates with high semantic skill match might fail a mandatory degree or deadline rule.
- **Chosen Option**: Hard eligibility acts as a mandatory binary multiplier ($0$ or $1$). Failing any hard gate forces a 🔴 NOT READY status regardless of skill match score.
- **Reasoning**: Prevents presenting an ineligible candidate as ready for a role they are legally or statutorily barred from pursuing.
- **Impact**: Ensures product integrity and trust.

## Decision 00-06: Non-Authoritative Semantic Skill Matching
- **Context**: Vector similarity calculates semantic distance between skill terms.
- **Chosen Option**: Embeddings perform semantic matching, not authoritative skill equivalence.
- **Reasoning**: Related terms (e.g. ML and Deep Learning) are semantically close but not interchangeable. Strict domain equivalence requires rule-level confirmation.
- **Impact**: Prevents false assumptions of capability.
