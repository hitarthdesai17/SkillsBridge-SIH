# SkillBridge Manual Testing Instructions (Phase 02 Database Infrastructure)

This document provides exact, step-by-step instructions for manual testing of Supabase connectivity, schema execution, seed data verification, opportunity retrieval, RLS authorization, and diagnostic engine execution.

---

## TEST-02-M01: Supabase Live Connection Check
* **Purpose**: Verify that Next.js can communicate with the live Supabase project at `https://eancggpfiualugxxoips.supabase.co`.
* **Steps**:
  1. Ensure `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  2. Start local server: `npm run dev`.
  3. Open browser to `http://localhost:3000/api/test-db`.
* **Expected Result**:
  * Response returns `status: "CONNECTION + QUERY + SEED SUCCESSFUL"` or diagnostic details confirming host reachability.

---

## TEST-02-M02: Live Opportunity Seed Verification
* **Purpose**: Prove that 16 real opportunity records exist in the live Supabase PostgreSQL `opportunities` table.
* **Steps**:
  1. Open Supabase Dashboard $\rightarrow$ SQL Editor for project `eancggpfiualugxxoips`.
  2. Run the policy update from `supabase/migrations/20260819_init_schema.sql` (allowing `opportunities_all_policy`).
  3. Open `http://localhost:3000/api/test-db` in your browser.
  4. Inspect the JSON response payload.
  5. Open `http://localhost:3000/api/opportunities` in your browser tab.
* **Expected Result**:
  * `http://localhost:3000/api/test-db` returns:
    * `actual_records_count`: **16**
    * `expected_records_count`: **16**
    * `sample_record`: non-null object (e.g. `opp_data_analyst_intern_01`)
  * `http://localhost:3000/api/opportunities` returns all 16 seed opportunities from the live database.

---

## TEST-02-M03: Invalid Request Parameter Handling
* **Purpose**: Verify controlled validation error response without server crashes when invalid parameters are sent.
* **Steps**:
  1. Send a POST request to `http://localhost:3000/api/readiness/diagnose` with an empty JSON body `{}`.
* **Expected Result**:
  * HTTP status `400 Bad Request` with response `{ success: false, error: "opportunity_id is required" }`.

---

## TEST-02-M04: Row Level Security (RLS) User Data Isolation
* **Purpose**: Verify that Row Level Security policies prevent unauthorized cross-user access to candidate profile and assessment data.
* **Steps**:
  1. Log into Supabase SQL Editor as User A (`auth.uid() = 'usr_A'`).
  2. Attempt `SELECT * FROM candidate_profiles WHERE user_id = 'usr_B'`.
* **Expected Result**:
  * PostgreSQL returns 0 rows due to `candidate_profiles_select_policy ON candidate_profiles FOR ALL USING (auth.uid() = user_id)`.
