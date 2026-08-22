-- ============================================================
-- SkillBridge Database Migration Script - Phase 4 Authentication & RLS
-- Target: Supabase PostgreSQL
-- ============================================================

-- 1. Enable RLS on all candidate and user-owned tables
ALTER TABLE IF EXISTS candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS skill_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS opportunity_requirements ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing user-owned policies to avoid duplicates
DROP POLICY IF EXISTS candidate_profiles_select_policy ON candidate_profiles;
DROP POLICY IF EXISTS candidate_profiles_owner_policy ON candidate_profiles;
DROP POLICY IF EXISTS candidate_skills_owner_policy ON candidate_skills;
DROP POLICY IF EXISTS candidate_projects_owner_policy ON candidate_projects;
DROP POLICY IF EXISTS candidate_experiences_owner_policy ON candidate_experiences;
DROP POLICY IF EXISTS readiness_assessments_owner_policy ON readiness_assessments;
DROP POLICY IF EXISTS skill_gaps_owner_policy ON skill_gaps;
DROP POLICY IF EXISTS project_recommendations_owner_policy ON project_recommendations;

-- 3. Candidate Profiles: Strictly owned by authenticated user
CREATE POLICY candidate_profiles_owner_policy
ON candidate_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Candidate Skills: Strictly owned through parent candidate profile
CREATE POLICY candidate_skills_owner_policy
ON candidate_skills
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM candidate_profiles cp
    WHERE cp.id = candidate_skills.profile_id
      AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM candidate_profiles cp
    WHERE cp.id = candidate_skills.profile_id
      AND cp.user_id = auth.uid()
  )
);

-- 5. Candidate Projects: Strictly owned through parent candidate profile
CREATE POLICY candidate_projects_owner_policy
ON candidate_projects
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM candidate_profiles cp
    WHERE cp.id = candidate_projects.profile_id
      AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM candidate_profiles cp
    WHERE cp.id = candidate_projects.profile_id
      AND cp.user_id = auth.uid()
  )
);

-- 6. Candidate Experiences: Strictly owned through parent candidate profile
CREATE POLICY candidate_experiences_owner_policy
ON candidate_experiences
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM candidate_profiles cp
    WHERE cp.id = candidate_experiences.profile_id
      AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM candidate_profiles cp
    WHERE cp.id = candidate_experiences.profile_id
      AND cp.user_id = auth.uid()
  )
);

-- 7. Readiness Assessments: Strictly owned through parent candidate profile
CREATE POLICY readiness_assessments_owner_policy
ON readiness_assessments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM candidate_profiles cp
    WHERE cp.id = readiness_assessments.profile_id
      AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM candidate_profiles cp
    WHERE cp.id = readiness_assessments.profile_id
      AND cp.user_id = auth.uid()
  )
);

-- 8. Skill Gaps: Strictly owned through parent assessment -> profile
CREATE POLICY skill_gaps_owner_policy
ON skill_gaps
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM readiness_assessments ra
    JOIN candidate_profiles cp ON ra.profile_id = cp.id
    WHERE ra.id = skill_gaps.assessment_id
      AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM readiness_assessments ra
    JOIN candidate_profiles cp ON ra.profile_id = cp.id
    WHERE ra.id = skill_gaps.assessment_id
      AND cp.user_id = auth.uid()
  )
);

-- 9. Project Recommendations: Strictly owned through parent assessment -> profile
CREATE POLICY project_recommendations_owner_policy
ON project_recommendations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM readiness_assessments ra
    JOIN candidate_profiles cp ON ra.profile_id = cp.id
    WHERE ra.id = project_recommendations.assessment_id
      AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM readiness_assessments ra
    JOIN candidate_profiles cp ON ra.profile_id = cp.id
    WHERE ra.id = project_recommendations.assessment_id
      AND cp.user_id = auth.uid()
  )
);

-- 10. Opportunities & Requirements: Read-accessible to all users
DROP POLICY IF EXISTS opportunities_select_policy ON opportunities;
DROP POLICY IF EXISTS opp_reqs_select_policy ON opportunity_requirements;

CREATE POLICY opportunities_select_policy
ON opportunities
FOR SELECT
USING (TRUE);

CREATE POLICY opp_reqs_select_policy
ON opportunity_requirements
FOR SELECT
USING (TRUE);
