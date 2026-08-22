# Phase 01: Architectural Decisions Record

## Decision 01-01: Full-Stack Framework Selection (Next.js 14 App Router)
- **Context**: Need a unified, high-performance web application framework for single developer build during hackathon.
- **Options Considered**:
  1. Vite React SPA + Express.js Node Backend.
  2. Next.js 14 App Router (Full-Stack SSR + Route Handlers).
  3. Remix Run + Express.
- **Chosen Option**: Option 2 (Next.js 14 App Router + TypeScript).
- **Reasoning**: Next.js combines frontend React server components with backend API Route Handlers in a single repository. Eliminates CORS configuration, double deployments, and complex client-server state sync.
- **Cost / Complexity**: Free (Vercel deployment tier). Minimal complexity for single primary developer.

## Decision 01-02: Database & Backend Infrastructure (Supabase PostgreSQL + pgvector)
- **Context**: Require relational storage, vector similarity search, user authentication, file uploads, and security policies.
- **Options Considered**:
  1. Custom PostgreSQL server + Redis + AWS S3 + Auth0.
  2. Supabase PostgreSQL + `pgvector` + Supabase Auth + Supabase Storage.
  3. MongoDB Atlas + Firebase Auth.
- **Chosen Option**: Option 2 (Supabase).
- **Reasoning**: Supabase provides free tier Postgres database with native `pgvector` extension for vector similarity search, built-in Auth, Storage buckets for resumes, and Row Level Security (RLS). Zero monthly infrastructure cost for hackathon demo.
- **Cost / Complexity**: $0.00 / month (Free Tier).

## Decision 01-03: AI Engine & Vector Embedding Strategy
- **Context**: Need fast, reliable structured parsing (resumes/JDs), grounded explanation generation, and zero-cost vector embeddings for semantic skill matching.
- **Options Considered**:
  1. OpenAI `gpt-4o-mini` for parsing/generation + HuggingFace `all-MiniLM-L6-v2` / `bge-small-en-v1.5` for vector embeddings.
  2. OpenAI `gpt-4o` + OpenAI `text-embedding-3-small`.
  3. Local Ollama LLM + SentenceTransformers.
- **Chosen Option**: Option 1.
- **Reasoning**: `gpt-4o-mini` costs $< \$0.15$ per 1M tokens with near-instant execution speed and strong JSON Schema support. HuggingFace Inference API or Transformers.js provides 384-dimensional vector embeddings at zero cost.
- **Cost / Complexity**: Extremely low cost ($<\$0.50$ total demo run budget).

## Decision 01-04: Document Parsing Strategy (pdf-parse)
- **Context**: Need reliable resume text extraction from uploaded PDF documents.
- **Options Considered**:
  1. Heavy OCR services (Tesseract / AWS Textract).
  2. Heavy Python Unstructured parser library.
  3. Native Node.js `pdf-parse` library with raw text fallback paste.
- **Chosen Option**: Option 3 (`pdf-parse`).
- **Reasoning**: Student resumes are electronically created PDFs (Word/Google Docs exports) with selectable text. `pdf-parse` extracts text instantly in Node.js serverless functions with zero external software or OCR API costs.
- **Cost / Complexity**: $0 cost, instant speed.
