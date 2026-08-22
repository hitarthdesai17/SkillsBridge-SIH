# Phase 00: Open Issues & Phase 1 Decision Candidates

| Issue ID | Description | Why it exists | Severity | Status | Affected Area | Recommended Phase 1 Step | Target Phase |
|---|---|---|---|---|---|---|---|
| ISS-01-1 | Final Technology Stack Selection | Choice of Next.js 14 App Router vs Vite SPA; Supabase client vs Prisma ORM; Next.js API Routes vs Node/Express backend. | High | OPEN | Architecture / Full-Stack | Finalize stack choice prior to coding in Phase 1. | Phase 01 |
| ISS-01-2 | Readiness Formula Calibration & Thresholds | Calibration of score weights ($W_s, W_e, W_x$) and score cutoffs for 🟢 READY ($\ge 80\%$), 🟡 ALMOST READY ($50-79\%$), 🔴 NOT READY ($<50\%$). | High | OPEN | Readiness Engine | Design exact scoring formula & threshold boundaries in Phase 1. | Phase 01 |
| ISS-01-3 | Evidence Provenance Schema Integration | Incorporating `source`, `source_location`, `extracted_claim`, and `confidence` fields into Postgres DDL tables. | Medium | OPEN | Database Schema | Design DDL table definitions with provenance fields in Phase 1. | Phase 01 |
| ISS-01-4 | Extraction Confidence Rating Logic | Rules for categorizing extracted skills into High, Medium, Low, or Unknown confidence. | Medium | OPEN | AI Backend / Parsing | Define confidence scoring heuristic in Phase 1. | Phase 01 |
| ISS-01-5 | Vector Embedding Provider Strategy | Choice between OpenAI `text-embedding-3-small`, local HuggingFace embeddings, or client-side Transformers.js. | Medium | OPEN | Vector Matcher | Benchmark vector embedding options during Phase 1 AI setup. | Phase 01 |
| ISS-01-6 | Project Recommendation Feasibility Logic | Algorithm logic balancing Gap Coverage, Opportunity Relevance, Evidence Value, and Candidate Feasibility. | Medium | OPEN | Project Spec Generator | Specify feasibility evaluation rules in Phase 1. | Phase 01 |
| ISS-01-7 | Seed Data Curated Dataset Scope | Defining the initial 15-20 verified opportunity seed records (Private, Govt, Internships, Apprenticeships). | Low | OPEN | Database Seed Engine | Create JSON seed dataset and migration script in Phase 1. | Phase 01 |
