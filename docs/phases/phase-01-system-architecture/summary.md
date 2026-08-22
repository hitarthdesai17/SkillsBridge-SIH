# Phase 01: System Architecture & Technical Foundation - Summary

## Phase Objective
Formulate the comprehensive technical blueprint, database schema design, AI pipeline contracts, security RLS model, and zero-cost stack decisions for **SkillBridge** before writing application code.

## What We Designed & Established
In Phase 1, we defined the complete system foundation:
1. **Zero-Cost Hackathon Tech Stack Selection**:
   - **Frontend & Full-Stack API**: Next.js 14 (App Router) + TypeScript + Vanilla CSS / CSS Modules + Lucide Icons.
   - **Database & Storage**: Supabase PostgreSQL + `pgvector` extension + Supabase Auth + Supabase Storage (Free Tier).
   - **AI & Embeddings**: OpenAI `gpt-4o-mini` (High speed/low cost for structured extraction & generation) + HuggingFace Inference API / `all-MiniLM-L6-v2` (Zero cost vector embeddings).
   - **Document Processing**: `pdf-parse` (Node.js native PDF text extraction, zero OCR overhead).
   - **Deployment**: Vercel (Frontend & Serverless API Routes) + Supabase Cloud (Postgres, Storage, Auth).
2. **System Boundaries**:
   - Deterministic Logic: Hard Eligibility Gate Validation, Score Threshold Logic, RLS Security, Binary Multiplication.
   - AI-Assisted Logic: Resume/JD JSON Parsing, Semantic Skill Matching, Grounded Explanations, Gap-Targeted Project Spec Generation.
3. **Database Architecture & DDL Specs**:
   - 12 Core Entities designed with Primary Keys, Foreign Keys, Indexes, RLS Policies, Evidence Provenance fields, and Confidence metadata.
4. **Evidence Provenance & Confidence Models**:
   - 4-Level Confidence Rating (`HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`).
   - Provenance Lineage metadata tracking (`source`, `source_location`, `extracted_claim`, `evidence_text`).
5. **Semantic Skill Matching Architecture**:
   - 5 Match Tiers (`EXACT_MATCH`, `STRONG_RELATED`, `PARTIAL_MATCH`, `WEAK_RELATED`, `NO_MATCH`) avoiding false equivalences (e.g., React vs React Native).
6. **Readiness Engine Calibration & Scoring Specification**:
   - Hard Eligibility as a binary gate ($0$ multiplier). Soft scoring calibrated across Skill Alignment ($50\%$), Evidence Strength ($30\%$), and Experience ($20\%$).
7. **Personalized Project Recommendation Feasibility Logic**:
   - Multi-objective ranking score: $\text{GAP COVERAGE} \times \text{RELEVANCE} \times \text{EVIDENCE} \times \text{FEASIBILITY}$.
8. **API Surface & OpenAPI Contracts**:
   - 10 RESTful endpoint specifications with strict request/response Zod validation schemas.
9. **Directory Folder Structure**:
   - Monorepo full-stack structure suitable for single developer build in Next.js 14.

## System Architecture Diagram
```
[User Browser]
      │
      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 14 APP ROUTER                           │
│  - React Server Components & UI Views (Dashboard, Diagnostic, Projects)│
│  - Route Handlers API (/api/resume, /api/readiness, /api/projects)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
             ┌──────────────────────┴──────────────────────┐
             ▼                                             ▼
┌───────────────────────────┐                ┌───────────────────────────┐
│     HARD RULE ENGINE      │                │   AI & EMBEDDINGS ENGINE  │
│ - Deterministic Eligibility│                │ - OpenAI gpt-4o-mini      │
│ - Binary Pass/Fail Gates  │                │ - HuggingFace Embeddings  │
│ - Score Threshold Check   │                │ - Zod Structured Output   │
└────────────┬──────────────┘                └─────────────┬─────────────┘
             │                                             │
             └──────────────────────┬──────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     SUPABASE POSTGRESQL + PGVECTOR                     │
│ - Tables: users, candidate_profiles, skills, projects, opportunities...│
│ - Row Level Security (RLS) & Auth                                      │
│ - Storage Bucket: candidate-resumes                                    │
└────────────────────────────────────────────────────────────────────────┘
```

## Phase Result
**SUCCESS (Phase 1 System Architecture & Technical Foundation Complete)**

## What Next Phase Depends On
Requires explicit User approval of Phase 1 Stack Recommendations and System Design to initiate **Phase 2: Database Infrastructure, Seed Data & Core Backend Services**.
