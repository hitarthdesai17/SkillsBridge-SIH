-- ============================================================
-- CANONICAL EVIDENCE LAYER
-- ============================================================
-- Additive only. Every column is nullable and every table is new, so existing
-- readiness / gap / roadmap queries keep working untouched and an un-migrated
-- database still accepts the old INSERT shape (the writer falls back).

-- ------------------------------------------------------------
-- 1. Richer skill provenance
-- ------------------------------------------------------------
-- `extraction_confidence` keeps its existing meaning (how sure are we we read
-- the term correctly). `evidence_strength` is the new, orthogonal axis: how
-- deeply the candidate actually demonstrated the skill.

ALTER TABLE candidate_skills
    ADD COLUMN IF NOT EXISTS original_term TEXT,
    ADD COLUMN IF NOT EXISTS canonical_term TEXT,
    ADD COLUMN IF NOT EXISTS normalization_reason TEXT,
    ADD COLUMN IF NOT EXISTS skill_kind TEXT,
    ADD COLUMN IF NOT EXISTS skill_category TEXT,
    ADD COLUMN IF NOT EXISTS parent_skill TEXT,
    ADD COLUMN IF NOT EXISTS evidence_strength TEXT,
    ADD COLUMN IF NOT EXISTS level_qualifier TEXT,
    ADD COLUMN IF NOT EXISTS is_unmapped BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS suggested_category TEXT,
    -- RESUME vs USER_ADDED. User corrections must never be readable as
    -- resume-derived evidence.
    ADD COLUMN IF NOT EXISTS evidence_origin TEXT DEFAULT 'RESUME',
    ADD COLUMN IF NOT EXISTS evidence_json JSONB;

-- ------------------------------------------------------------
-- 2. Project provenance
-- ------------------------------------------------------------
-- RESUME_DERIVED projects are evidence. Recommended future projects live in
-- project_recommendations and must never be written here.

ALTER TABLE candidate_projects
    ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'RESUME_DERIVED',
    ADD COLUMN IF NOT EXISTS evidence_quote TEXT,
    ADD COLUMN IF NOT EXISTS skills_demonstrated TEXT[];

-- ------------------------------------------------------------
-- 3. Extraction coverage
-- ------------------------------------------------------------
ALTER TABLE candidate_profiles
    ADD COLUMN IF NOT EXISTS extraction_coverage JSONB;

-- ------------------------------------------------------------
-- 4. Education
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidate_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE,
    degree TEXT NOT NULL,
    field TEXT,
    institution TEXT,
    start_year INTEGER,
    end_year INTEGER,
    level TEXT,
    evidence_quote TEXT,
    evidence_origin TEXT DEFAULT 'RESUME',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_education_profile
    ON candidate_education(profile_id);

-- ------------------------------------------------------------
-- 5. Certifications & coursework
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidate_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuer TEXT,
    issued_on TEXT,
    associated_skills TEXT[],
    evidence_quote TEXT,
    evidence_origin TEXT DEFAULT 'RESUME',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_certifications_profile
    ON candidate_certifications(profile_id);

-- ------------------------------------------------------------
-- 6. Row level security, mirroring the existing candidate tables
-- ------------------------------------------------------------
ALTER TABLE candidate_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_certifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'candidate_education' AND policyname = 'own_education'
    ) THEN
        CREATE POLICY own_education ON candidate_education
            USING (
                profile_id IN (
                    SELECT id FROM candidate_profiles WHERE user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'candidate_certifications' AND policyname = 'own_certifications'
    ) THEN
        CREATE POLICY own_certifications ON candidate_certifications
            USING (
                profile_id IN (
                    SELECT id FROM candidate_profiles WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;
