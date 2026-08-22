# Phase 02: SQL Operations Log

| SQL ID | Date | Purpose | Environment | Exact SQL Query | Effect | Tables Affected | Schema/Data Impact | Rollback | Verification | Related Phase |
|---|---|---|---|---|---|---|---|---|---|---|
| SQL-02-01 | 2026-08-19 | Enable pgvector Extension | Supabase Cloud Postgres | `CREATE EXTENSION IF NOT EXISTS vector;` | Enables vector embeddings | Database System | pgvector active | `DROP EXTENSION vector;` | Supabase SQL Editor | Phase 02 |
| SQL-02-02 | 2026-08-19 | Create Core 10 Tables & RLS | Supabase Cloud Postgres | DDL script in `supabase/migrations/20260819_init_schema.sql` | Creates candidate & opportunity tables + RLS | candidate_profiles, opportunities, opportunity_requirements, etc. | 10 tables created | `DROP TABLE ... CASCADE;` | Executed via Supabase SQL Editor | Phase 02 |
| SQL-02-03 | 2026-08-19 | Auto-Seed 16 Opportunity Records | Supabase Cloud Postgres via `/api/test-db` | Upsert script in `src/app/api/test-db/route.ts` | Populates 16 seed roles & requirements | opportunities, opportunity_requirements | 16 rows inserted | `DELETE FROM opportunities;` | Verified via `/api/test-db` endpoint | Phase 02 |
