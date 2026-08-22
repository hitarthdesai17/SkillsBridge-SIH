-- ============================================================
-- SkillBridge Database Migration Script
-- Target: Supabase PostgreSQL + pgvector
-- ============================================================


-- ============================================================
-- 1. ENABLE PGVECTOR
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;


-- ============================================================
-- 2. CANDIDATE PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    summary TEXT,
    desired_role_title TEXT,
    raw_resume_text TEXT,
    resume_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. CANDIDATE SKILLS
-- Evidence Provenance + Extraction Confidence
-- ============================================================

CREATE TABLE IF NOT EXISTS candidate_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID NOT NULL
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,

    -- 384-dimensional HuggingFace embedding
    embedding VECTOR(384),

    proficiency_level TEXT DEFAULT 'intermediate'
        CHECK (
            proficiency_level IN (
                'beginner',
                'intermediate',
                'advanced'
            )
        ),

    provenance_source TEXT NOT NULL,
    provenance_context TEXT,

    extraction_confidence TEXT NOT NULL DEFAULT 'HIGH'
        CHECK (
            extraction_confidence IN (
                'HIGH',
                'MEDIUM',
                'LOW',
                'UNKNOWN'
            )
        ),

    source_evidence TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. CANDIDATE PROJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS candidate_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID NOT NULL
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,
    description TEXT NOT NULL,

    tech_stack TEXT[] DEFAULT '{}',

    github_url TEXT,
    live_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. CANDIDATE EXPERIENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS candidate_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID NOT NULL
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE,

    organization TEXT NOT NULL,
    role_title TEXT NOT NULL,

    duration_months INT DEFAULT 0,

    description TEXT,

    is_current BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 6. OPPORTUNITIES
-- Jobs / Internships / Government / Apprenticeships
-- ============================================================

CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,

    title TEXT NOT NULL,
    organization TEXT NOT NULL,

    opportunity_type TEXT NOT NULL
        CHECK (
            opportunity_type IN (
                'private_job',
                'internship',
                'government',
                'apprenticeship'
            )
        ),

    description TEXT NOT NULL,

    source TEXT NOT NULL,
    source_url TEXT,

    deadline TIMESTAMPTZ,

    location TEXT,

    education_level_required TEXT,

    min_experience_years NUMERIC DEFAULT 0,

    stipend_salary_range TEXT,

    verification_status TEXT NOT NULL DEFAULT 'VERIFIED'
        CHECK (
            verification_status IN (
                'OFFICIAL',
                'VERIFIED',
                'DEMO'
            )
        ),

    explicit_eligibility JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 7. OPPORTUNITY REQUIREMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS opportunity_requirements (
    id TEXT PRIMARY KEY,

    opportunity_id TEXT NOT NULL
        REFERENCES opportunities(id)
        ON DELETE CASCADE,

    requirement_type TEXT NOT NULL
        CHECK (
            requirement_type IN (
                'hard_eligibility',
                'required_skill',
                'preferred_skill',
                'experience',
                'education'
            )
        ),

    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,

    -- 384-dimensional embedding
    embedding VECTOR(384),

    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,

    min_years NUMERIC DEFAULT 0,

    provenance_context TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 8. READINESS ASSESSMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS readiness_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID NOT NULL
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE,

    opportunity_id TEXT NOT NULL
        REFERENCES opportunities(id)
        ON DELETE CASCADE,

    readiness_state TEXT NOT NULL
        CHECK (
            readiness_state IN (
                'READY',
                'ALMOST_READY',
                'NOT_READY'
            )
        ),

    readiness_score NUMERIC(5,2) NOT NULL
        CHECK (
            readiness_score >= 0
            AND readiness_score <= 100
        ),

    hard_eligibility_passed BOOLEAN NOT NULL,

    strengths_summary JSONB DEFAULT '[]'::jsonb,

    weaknesses_summary JSONB DEFAULT '[]'::jsonb,

    why_recommended TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 9. SKILL GAPS
-- ============================================================

CREATE TABLE IF NOT EXISTS skill_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    assessment_id UUID NOT NULL
        REFERENCES readiness_assessments(id)
        ON DELETE CASCADE,

    requirement_id TEXT
        REFERENCES opportunity_requirements(id)
        ON DELETE SET NULL,

    gap_type TEXT NOT NULL
        CHECK (
            gap_type IN (
                'SKILL_GAP',
                'EVIDENCE_GAP',
                'EXPERIENCE_GAP',
                'HARD_ELIGIBILITY_GAP'
            )
        ),

    missing_capability TEXT NOT NULL,

    severity TEXT DEFAULT 'moderate'
        CHECK (
            severity IN (
                'critical',
                'moderate',
                'minor'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 10. PROJECT RECOMMENDATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS project_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    assessment_id UUID NOT NULL
        REFERENCES readiness_assessments(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    objective TEXT NOT NULL,

    why_recommended TEXT NOT NULL,

    skills_demonstrated TEXT[] NOT NULL,

    skills_learned TEXT[] NOT NULL,

    existing_strengths_leveraged TEXT[] NOT NULL,

    suggested_tech_stack TEXT[] NOT NULL,

    scope_deliverables JSONB NOT NULL,

    difficulty TEXT DEFAULT 'Intermediate'
        CHECK (
            difficulty IN (
                'Beginner',
                'Intermediate',
                'Advanced'
            )
        ),

    feasibility_score NUMERIC(5,2) DEFAULT 85.00,

    estimated_effort_hours INT DEFAULT 12,

    expected_readiness_delta NUMERIC(5,2) DEFAULT 20.00,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 11. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_candidate_skills_profile
    ON candidate_skills(profile_id);

CREATE INDEX IF NOT EXISTS idx_opp_requirements_opp
    ON opportunity_requirements(opportunity_id);

CREATE INDEX IF NOT EXISTS idx_readiness_profile
    ON readiness_assessments(profile_id);

CREATE INDEX IF NOT EXISTS idx_readiness_opp
    ON readiness_assessments(opportunity_id);


-- ============================================================
-- 12. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE candidate_profiles
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE candidate_skills
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE candidate_projects
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE readiness_assessments
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE project_recommendations
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE opportunities
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE opportunity_requirements
    ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 13. OPPORTUNITY RLS POLICIES
-- ============================================================

-- Remove old policies if they exist

DROP POLICY IF EXISTS opportunities_select_policy
    ON opportunities;

DROP POLICY IF EXISTS opp_reqs_select_policy
    ON opportunity_requirements;

DROP POLICY IF EXISTS opportunities_all_policy
    ON opportunities;

DROP POLICY IF EXISTS opp_reqs_all_policy
    ON opportunity_requirements;


-- Allow read/write access to opportunities
-- This is currently used for:
-- 1. Seed data
-- 2. Public opportunity feed

CREATE POLICY opportunities_all_policy
ON opportunities
FOR ALL
USING (TRUE)
WITH CHECK (TRUE);


-- Allow read/write access to opportunity requirements

CREATE POLICY opp_reqs_all_policy
ON opportunity_requirements
FOR ALL
USING (TRUE)
WITH CHECK (TRUE);


-- ============================================================
-- 14. CANDIDATE PROFILE RLS
-- ============================================================

CREATE POLICY candidate_profiles_select_policy
ON candidate_profiles
FOR ALL
USING (auth.uid() = user_id);