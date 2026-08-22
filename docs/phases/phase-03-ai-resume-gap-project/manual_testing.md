# SkillBridge Manual Testing Instructions (Phase 03 AI Engine)

This document provides exact, step-by-step instructions for manual testing of PDF resume extraction, structured parsing, gap analysis, targeted project recommendations, and hallucination prevention.

---

## TEST-03-M01: PDF Resume Ingestion & Parsing
* **Purpose**: Verify that an uploaded resume PDF is extracted, parsed into structured data, and saved to Supabase.
* **Steps**:
  1. Start application: `npm run dev`.
  2. Send a POST request to `http://localhost:3000/api/resume/parse` with `multipart/form-data` (field name: `resume`, file: any sample resume PDF) OR JSON body:
     ```json
     {
       "raw_resume_text": "Alex Rivers\nalex@example.com\nData Analyst\nSkills: Python, SQL"
     }
     ```
* **Expected Result**:
  * Response returns `success: true`, `profile_id`, and structured `parsed_resume` JSON object with skills and evidence provenance.

---

## TEST-03-M02: Controlled Error Handling for Empty or Invalid PDFs
* **Purpose**: Verify that empty or corrupt files produce controlled HTTP 400 validation error responses without server crashes.
* **Steps**:
  1. Send a POST request to `http://localhost:3000/api/resume/parse` with an empty text body or non-PDF file.
* **Expected Result**:
  * Returns HTTP 400 Bad Request with error: `"Resume contains insufficient or unreadable text."`

---

## TEST-03-M03: 4-Tier Gap Analysis
* **Purpose**: Verify that the gap analysis engine correctly identifies `SKILL_GAP`, `EVIDENCE_GAP`, and `HARD_ELIGIBILITY_GAP` items against a target opportunity.
* **Steps**:
  1. Send a POST request to `http://localhost:3000/api/gaps/analyze`:
     ```json
     {
       "opportunity_id": "opp_bi_intern_02"
     }
     ```
* **Expected Result**:
  * Response returns `success: true`, `hard_eligibility_passed: true`, `total_gaps_count`, and a `gaps` array identifying `Power BI Dashboarding & DAX` as a `SKILL_GAP`.

---

## TEST-03-M04: Targeted Project Recommendation Generation
* **Purpose**: Verify that the project recommendation engine generates a specific, realistic project targeting the candidate's top gaps.
* **Steps**:
  1. Send a POST request to `http://localhost:3000/api/projects/recommend`:
     ```json
     {
       "opportunity_id": "opp_bi_intern_02"
     }
     ```
* **Expected Result**:
  * Response returns `project_recommendation` with title `"Targeted Power BI Dashboarding & DAX Portfolio Project"`, objective, why recommended, scope deliverables, feasibility score ($\ge 70$), and expected readiness delta ($+22.5\%$).

---

## TEST-03-M13: Controlled Resume Extraction Verification
* **Purpose**: Verify that every extracted skill exists in the source resume text.
* **Steps**:
  1. Send controlled resume text containing only `Python, Pandas, NumPy, SQL, PostgreSQL`.
* **Expected Result**:
  * Only Python, Pandas, NumPy, SQL, PostgreSQL are extracted.

---

## TEST-03-M14: Hallucination Prevention (Unsupported Skills)
* **Purpose**: Verify that skills missing from source text (TypeScript, React, Java, Power BI) are NEVER invented.
* **Steps**:
  1. Inspect parsed output of controlled resume text.
* **Expected Result**:
  * `TypeScript`, `React`, `Java`, `Power BI` are strictly ABSENT from extracted skills array.

---

## TEST-03-M15: Grounded Project Extraction
* **Purpose**: Verify project title is extracted from actual resume text (`Customer Sales Analytics ETL Pipeline`).
* **Steps**:
  1. Inspect `projects` array in parsed output.
* **Expected Result**:
  * Project title is `"Customer Sales Analytics ETL Pipeline"` (NOT generic `"Resume Portfolio Project"`).

---

## TEST-03-M16: URL Null Preservation
* **Purpose**: Verify missing URLs remain `null` instead of being fabricated.
* **Steps**:
  1. Inspect `github_url` and `live_url` fields when no URL is present in source text.
* **Expected Result**:
  * `github_url: null` and `live_url: null`.
