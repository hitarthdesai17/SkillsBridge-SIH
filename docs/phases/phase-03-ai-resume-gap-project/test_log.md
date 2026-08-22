# Phase 03: Test Log

| Test ID | Feature | Test Type | Scenario | Input | Expected Result | Actual Result | Status | Evidence | Related Bug |
|---|---|---|---|---|---|---|---|---|---|
| TEST-03-01 | PDF Extraction | Unit Test | Valid PDF text extraction | PDF Buffer | Raw readable string | Extracted text string | PASS | `src/lib/resume_parser.test.ts` | N/A |
| TEST-03-02 | Structured Parser | Unit Test | OpenAI Zod schema parsing | Raw Resume String | Valid ParsedResumeData | Validated JSON object with skills & evidence | PASS | `src/lib/resume_parser.test.ts` | N/A |
| TEST-03-03 | Empty PDF Handling | Unit Test | Rejection of empty/corrupt PDF | Empty Buffer | Controlled error throw | Threw "Invalid PDF: Uploaded buffer is empty" | PASS | `src/lib/resume_parser.test.ts` | N/A |
| TEST-03-04 | Gap Analysis Engine | Unit Test | SKILL_GAP and EVIDENCE_GAP classification | Candidate + BI Opportunity | Identified Power BI SKILL_GAP and SQL EVIDENCE_GAP | Correctly returned gaps array | PASS | `src/lib/gap_analysis_engine.test.ts` | BUG-03-01 |
| TEST-03-05 | Project Recommendation | Unit Test | Targeted project generation | Profile + Opportunity + Gaps | Specific portfolio project with deliverables & feasibility score | Returned "Targeted Power BI Dashboarding & DAX Portfolio Project" | PASS | `src/lib/project_recommendation_engine.test.ts` | N/A |
| TEST-03-M01 | Live Gap API | Integration Test | POST `/api/gaps/analyze` | `{ "opportunity_id": "opp_bi_intern_02" }` | HTTP 200 with gap analysis breakdown | Returned 1 SKILL_GAP ("Power BI Dashboarding & DAX") | PASS | Task-380 execution log | N/A |
| TEST-03-M02 | Live Project API | Integration Test | POST `/api/projects/recommend` | `{ "opportunity_id": "opp_bi_intern_02" }` | HTTP 200 with targeted project recommendation | Returned specific Power BI portfolio project | PASS | Task-380 execution log | N/A |
