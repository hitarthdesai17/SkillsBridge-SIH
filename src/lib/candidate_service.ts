import { CandidateProfile } from '../types';
import { supabase, getServiceRoleSupabase } from './supabase';

/**
 * Normalize a raw parsed_resume object (from localStorage) or a proper CandidateProfile
 * into a consistent CandidateProfile shape for the readiness, gap analysis, and recommendation engines.
 */
export function normalizeToCandidateProfile(raw: any): CandidateProfile {
  if (raw && raw.id && raw.user_id && Array.isArray(raw.experience) && Array.isArray(raw.skills) && raw.skills.length > 0 && raw.skills[0].id) {
    return raw as CandidateProfile;
  }

  const profileId = raw?.id || 'cand_parsed_01';
  const userId = raw?.user_id || '00000000-0000-0000-0000-000000000000';

  // Normalize skills: ensure each has id, profile_id, normalized_name
  const rawSkills = raw?.skills || [];
  const normalizedSkills = rawSkills.map((s: any, idx: number) => ({
    ...s,
    id: s.id || `sk_norm_${idx}`,
    profile_id: s.profile_id || profileId,
    name: s.name || '',
    normalized_name: s.normalized_name || (s.name || '').toLowerCase().replace(/\s+/g, '_'),
    proficiency_level: s.proficiency_level || 'intermediate',
    provenance_source: s.provenance_source || 'Resume PDF',
    provenance_context: s.provenance_context || 'Extracted from resume',
    extraction_confidence: s.extraction_confidence || 'HIGH',
    source_evidence: s.source_evidence || 'Listed in resume',
    // Anything without an explicit origin came from the resume; user
    // corrections must arrive already tagged USER_ADDED.
    evidence_origin: s.evidence_origin || 'RESUME'
  }));

  // Normalize projects (spread first so origin / evidence_quote survive)
  const rawProjects = raw?.projects || [];
  const normalizedProjects = rawProjects.map((p: any, idx: number) => ({
    ...p,
    id: p.id || `proj_norm_${idx}`,
    profile_id: p.profile_id || profileId,
    title: p.title || '',
    description: p.description || '',
    tech_stack: p.tech_stack || [],
    github_url: p.github_url || undefined,
    live_url: p.live_url || undefined,
    origin: p.origin || 'RESUME_DERIVED'
  }));

  // Normalize experience: ParsedResumeData has `experiences`, CandidateProfile has `experience`
  const rawExperience = raw?.experience || raw?.experiences || [];
  const normalizedExperience = rawExperience.map((e: any, idx: number) => ({
    id: e.id || `exp_norm_${idx}`,
    profile_id: e.profile_id || profileId,
    organization: e.organization || '',
    role_title: e.role_title || '',
    duration_months: e.duration_months || 0,
    description: e.description || '',
    is_current: e.is_current || false
  }));

  return {
    id: profileId,
    user_id: userId,
    full_name: raw?.full_name || 'Candidate',
    email: raw?.email || 'candidate@example.com',
    summary: raw?.summary || '',
    desired_role_title: raw?.desired_role_title || 'Candidate Profile',
    education_level: raw?.education_level || "Bachelor's Degree",
    raw_resume_text: raw?.raw_resume_text || '',
    skills: normalizedSkills,
    projects: normalizedProjects,
    experience: normalizedExperience,
    education: raw?.education || [],
    certifications: raw?.certifications || [],
    extraction_coverage: raw?.extraction_coverage,
    created_at: raw?.created_at || new Date().toISOString()
  };
}

let activeCandidateProfileStore: CandidateProfile | null = null;

export function setCandidateProfileStore(profile: CandidateProfile) {
  activeCandidateProfileStore = normalizeToCandidateProfile(profile);
}

export function clearCandidateProfileStore() {
  activeCandidateProfileStore = null;
}

export async function getCandidateProfile(userId?: string): Promise<CandidateProfile> {
  // 1. If in-memory store has been updated by recent resume upload for this user, return it
  if (activeCandidateProfileStore) {
    if (!userId || activeCandidateProfileStore.user_id === userId) {
      return activeCandidateProfileStore;
    }
  }

  // 2. Query Supabase Cloud PostgreSQL database for candidate profile if configured
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isSupabaseConfigured) {
    try {
      const client = getServiceRoleSupabase() || supabase;
      const targetUserId = userId || '00000000-0000-0000-0000-000000000000';

      // Try the full evidence-layer read first; fall back to the original
      // shape when 20260822_canonical_evidence_layer.sql has not been applied.
      const FULL_SELECT =
        '*, candidate_skills(*), candidate_projects(*), candidate_experiences(*), candidate_education(*), candidate_certifications(*)';
      const BASE_SELECT = '*, candidate_skills(*), candidate_projects(*), candidate_experiences(*)';

      let { data: dbProfiles, error: profileErr } = await client
        .from('candidate_profiles')
        .select(FULL_SELECT)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (profileErr) {
        ({ data: dbProfiles, error: profileErr } = await client
          .from('candidate_profiles')
          .select(BASE_SELECT)
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(1));
      }

      if (!profileErr && dbProfiles && dbProfiles.length > 0) {
        const p = dbProfiles[0];
        const fetchedProfile: CandidateProfile = {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name || 'Extracted Candidate Profile',
          email: p.email || 'candidate@example.com',
          summary: p.summary || '',
          desired_role_title: p.desired_role_title || 'Candidate Profile',
          education_level: p.education_level || "Bachelor's Degree",
          raw_resume_text: p.raw_resume_text || '',
          skills: (p.candidate_skills || []).map((s: any) => ({
            id: s.id,
            profile_id: s.profile_id,
            name: s.name,
            normalized_name: s.normalized_name,
            proficiency_level: s.proficiency_level || 'intermediate',
            provenance_source: s.provenance_source || 'Resume PDF',
            provenance_context: s.provenance_context || 'Extracted from resume text',
            extraction_confidence: s.extraction_confidence || 'HIGH',
            source_evidence: s.source_evidence || 'Listed in resume',
            original_term: s.original_term || undefined,
            canonical_term: s.canonical_term || undefined,
            normalization_reason: s.normalization_reason || undefined,
            skill_kind: s.skill_kind || undefined,
            category: s.skill_category || undefined,
            parent_skill: s.parent_skill || undefined,
            evidence_strength: s.evidence_strength || undefined,
            level_qualifier: s.level_qualifier || undefined,
            is_unmapped: s.is_unmapped ?? undefined,
            suggested_category: s.suggested_category || undefined,
            evidence: s.evidence_json || undefined,
            evidence_origin: s.evidence_origin || 'RESUME'
          })),
          projects: (p.candidate_projects || []).map((proj: any) => ({
            id: proj.id,
            profile_id: proj.profile_id,
            title: proj.title,
            description: proj.description || '',
            tech_stack: proj.tech_stack || [],
            github_url: proj.github_url || null,
            live_url: proj.live_url || null,
            origin: proj.origin || 'RESUME_DERIVED',
            evidence_quote: proj.evidence_quote || undefined,
            skills_demonstrated: proj.skills_demonstrated || undefined
          })),
          education: (p.candidate_education || []).map((e: any) => ({
            id: e.id,
            profile_id: e.profile_id,
            degree: e.degree,
            field: e.field || undefined,
            institution: e.institution || undefined,
            start_year: e.start_year || undefined,
            end_year: e.end_year || undefined,
            level: e.level || undefined,
            evidence_quote: e.evidence_quote || undefined,
            evidence_origin: e.evidence_origin || 'RESUME'
          })),
          certifications: (p.candidate_certifications || []).map((c: any) => ({
            id: c.id,
            profile_id: c.profile_id,
            name: c.name,
            issuer: c.issuer || undefined,
            issued_on: c.issued_on || undefined,
            associated_skills: c.associated_skills || [],
            evidence_quote: c.evidence_quote || undefined,
            evidence_origin: c.evidence_origin || 'RESUME'
          })),
          extraction_coverage: p.extraction_coverage || undefined,
          experience: (p.candidate_experiences || []).map((exp: any) => ({
            id: exp.id,
            profile_id: exp.profile_id,
            organization: exp.organization,
            role_title: exp.role_title,
            duration_months: exp.duration_months || 0,
            description: exp.description || '',
            is_current: exp.is_current || false
          })),
          created_at: p.created_at || new Date().toISOString()
        };

        activeCandidateProfileStore = fetchedProfile;
        return fetchedProfile;
      }
    } catch (err) {
      // Fall back to default
    }
  }

  // Fallback candidate profile if database has no record for this user yet
  const defaultProfile: CandidateProfile = {
    id: 'cand_demo_student_01',
    user_id: userId || 'usr_student_101',
    full_name: 'Hitarth Desai',
    email: 'hitarth@example.com',
    summary: 'B.Sc AI/DS Student',
    desired_role_title: 'AI/ML Candidate',
    education_level: "Bachelor's Degree",
    skills: [
      {
        id: 'sk_01',
        profile_id: 'cand_demo_student_01',
        name: 'Python',
        normalized_name: 'python',
        proficiency_level: 'intermediate',
        provenance_source: 'Resume PDF',
        provenance_context: 'Skills section',
        extraction_confidence: 'HIGH',
        source_evidence: 'Listed in technical skills'
      }
    ],
    projects: [],
    experience: [],
    created_at: new Date().toISOString()
  };

  return defaultProfile;
}

export async function updateCandidateProfile(updated: Partial<CandidateProfile>): Promise<CandidateProfile> {
  const current = await getCandidateProfile(updated.user_id);
  activeCandidateProfileStore = { ...current, ...updated };
  return activeCandidateProfileStore;
}
