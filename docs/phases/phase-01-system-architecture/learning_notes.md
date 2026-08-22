# Phase 01: Technical Learning Notes

## Concept 1: PostgreSQL `pgvector` Cosine Similarity Queries
- **What it means**: Using Supabase `pgvector` extension with vector operators (`<=>` for cosine distance, `<->` for L2 distance) directly inside SQL queries.
- **Why SkillBridge uses it**: Allows performing high-speed semantic skill matching natively inside PostgreSQL without running external vector database microservices.
- **Where it appears**: Stage 3 Semantic Skill Alignment Engine & `docs/DATABASE.md`.

## Concept 2: Row Level Security (RLS) Policies
- **What it means**: Database-enforced authorization rules in PostgreSQL where queries automatically filter rows based on `auth.uid()`.
- **Why SkillBridge uses it**: Guarantees candidates can only access their own profile, assessment, and action plan records even if API logic has bugs.
- **Where it appears**: `docs/DATABASE.md` Security Architecture.

## Concept 3: Zod Schema Validation for LLM Structured Output
- **What it means**: Using TypeScript-first Zod schemas to enforce exact JSON output formats from LLM function/structured calls.
- **Why SkillBridge uses it**: Guarantees downstream readiness calculations receive valid typescript types without JSON parsing exceptions.
- **Where it appears**: API Route Handlers & AI Services.
