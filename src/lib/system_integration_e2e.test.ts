import { describe, it, expect } from 'vitest';
import { calculateOpportunityReadiness } from './readiness_engine';
import { evaluateHardEligibility } from './hard_rules_engine';
import { analyzeCandidateGaps } from './gap_analysis_engine';
import { generateTargetedProjectRecommendation } from './project_recommendation_engine';
import { fallbackResumeParser, saveCandidateProfileToDatabase } from './resume_parser';
import { getCandidateProfile, setCandidateProfileStore, clearCandidateProfileStore } from './candidate_service';
import { getOpportunities, getOpportunityById } from './opportunity_service';
import { SignupSchema, LoginSchema, evaluatePasswordStrength } from './auth_validation';
import { CandidateProfile, Opportunity } from '../types';

describe('SkillBridge Comprehensive Pre-Phase-5 System Audit Suite', () => {

  describe('1. Authentication & Security Validation Audit', () => {
    it('AUTH-01: Validates registration with strong credentials', () => {
      const valid = SignupSchema.safeParse({
        fullName: 'Alex Rivers',
        email: 'alex@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      });
      expect(valid.success).toBe(true);
    });

    it('AUTH-02: Rejects empty or invalid registration inputs', () => {
      const emptyName = SignupSchema.safeParse({
        fullName: '',
        email: 'alex@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      });
      expect(emptyName.success).toBe(false);

      const invalidEmail = SignupSchema.safeParse({
        fullName: 'Alex',
        email: 'not-an-email',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      });
      expect(invalidEmail.success).toBe(false);

      const mismatch = SignupSchema.safeParse({
        fullName: 'Alex',
        email: 'alex@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPassword123!'
      });
      expect(mismatch.success).toBe(false);
    });

    it('AUTH-03: Validates login credentials correctly', () => {
      const validLogin = LoginSchema.safeParse({
        email: 'alex@example.com',
        password: 'Password123!'
      });
      expect(validLogin.success).toBe(true);

      const emptyLogin = LoginSchema.safeParse({
        email: '',
        password: ''
      });
      expect(emptyLogin.success).toBe(false);
    });
  });

  describe('2. Multi-Tenant User Data Isolation Audit', () => {
    it('ISOL-01: Candidate profiles and extracted skills are strictly isolated per user_id', async () => {
      clearCandidateProfileStore();

      // User A Upload
      const userAId = 'usr_tenant_alpha_01';
      const resumeA = `Alex Rivers\nalex@example.com\nSkills: Python, SQL\nProjects: ETL Pipeline`;
      const parsedA = fallbackResumeParser(resumeA);
      await saveCandidateProfileToDatabase(parsedA, resumeA, userAId);

      const profileA = await getCandidateProfile(userAId);
      expect(profileA.full_name).toContain('Alex');
      expect(profileA.skills.map(s => s.name)).toContain('Python');

      // User B Upload
      const userBId = 'usr_tenant_beta_02';
      const resumeB = `Sarah Connor\nsarah@example.com\nSkills: React.js, Docker\nProjects: CyberDefense UI`;
      const parsedB = fallbackResumeParser(resumeB);
      await saveCandidateProfileToDatabase(parsedB, resumeB, userBId);

      const profileB = await getCandidateProfile(userBId);
      expect(profileB.full_name).toContain('Sarah');
      expect(profileB.skills.map(s => s.name)).toContain('React.js');
      expect(profileB.skills.map(s => s.name)).not.toContain('Python');
    });
  });

  describe('3. Resume Re-Upload & Anti-Pollution Audit', () => {
    it('REUPLOAD-01: Re-uploading a new resume completely replaces old skills', async () => {
      const userId = 'usr_reupload_test_01';

      // First upload: Python + Java
      const resumeV1 = `Hitarth Desai\nhitarth@example.com\nSkills: Python, Java`;
      const parsedV1 = fallbackResumeParser(resumeV1);
      await saveCandidateProfileToDatabase(parsedV1, resumeV1, userId);

      let currentProfile = await getCandidateProfile(userId);
      let skillNames = currentProfile.skills.map(s => s.name);
      expect(skillNames).toContain('Python');
      expect(skillNames).toContain('Java');
      expect(skillNames).not.toContain('MySQL');

      // Second upload: Python + React.js + MySQL (Java removed)
      const resumeV2 = `Hitarth Desai\nhitarth@example.com\nSkills: Python, React.js, MySQL`;
      const parsedV2 = fallbackResumeParser(resumeV2);
      await saveCandidateProfileToDatabase(parsedV2, resumeV2, userId);

      currentProfile = await getCandidateProfile(userId);
      skillNames = currentProfile.skills.map(s => s.name);
      expect(skillNames).toContain('Python');
      expect(skillNames).toContain('React.js');
      expect(skillNames).toContain('MySQL');
      expect(skillNames).not.toContain('Java'); // Stale skill MUST NOT linger
    });
  });

  describe('4. Deterministic Readiness & Hard Eligibility Engine Audit', () => {
    const mockOpportunity: Opportunity = {
      id: 'opp_da_01',
      title: 'Junior Data Analyst',
      organization: 'TechCorp Analytics',
      opportunity_type: 'private_job',
      description: 'Analyze data datasets',
      source: 'Direct Careers',
      deadline: '2026-12-31T23:59:59Z',
      min_experience_years: 0,
      education_level_required: "Bachelor's Degree",
      verification_status: 'VERIFIED',
      requirements: [
        {
          id: 'req_01',
          opportunity_id: 'opp_da_01',
          requirement_type: 'required_skill',
          name: 'Python',
          normalized_name: 'python',
          is_mandatory: true
        },
        {
          id: 'req_02',
          opportunity_id: 'opp_da_01',
          requirement_type: 'required_skill',
          name: 'SQL',
          normalized_name: 'sql',
          is_mandatory: true
        }
      ]
    };

    it('READY-01: Calculates deterministic readiness score accurately', () => {
      const candidate: CandidateProfile = {
        id: 'cand_test_01',
        user_id: 'usr_01',
        full_name: 'Data Analyst Candidate',
        email: 'candidate@example.com',
        education_level: "Bachelor's Degree",
        skills: [
          {
            id: 's_01',
            profile_id: 'cand_test_01',
            name: 'Python',
            normalized_name: 'python',
            proficiency_level: 'intermediate',
            provenance_source: 'Skills Section',
            extraction_confidence: 'HIGH',
            source_evidence: 'Explicit'
          },
          {
            id: 's_02',
            profile_id: 'cand_test_01',
            name: 'SQL',
            normalized_name: 'sql',
            proficiency_level: 'intermediate',
            provenance_source: 'Skills Section',
            extraction_confidence: 'HIGH',
            source_evidence: 'Explicit'
          }
        ],
        projects: [
          {
            id: 'p_01',
            profile_id: 'cand_test_01',
            title: 'Sales Pipeline',
            description: 'Python and SQL analytics',
            tech_stack: ['Python', 'SQL']
          }
        ],
        experience: []
      };

      const diagnosis = calculateOpportunityReadiness(candidate, mockOpportunity);
      expect(diagnosis.hard_eligibility_passed).toBe(true);
      expect(diagnosis.readiness_score).toBeGreaterThanOrEqual(80.0);
      expect(diagnosis.readiness_state).toBe('READY');
    });

    it('READY-02: Hard eligibility failure strictly forces final score to 0.00', () => {
      const candidateWithoutDegree: CandidateProfile = {
        id: 'cand_test_02',
        user_id: 'usr_02',
        full_name: 'Undergrad Candidate',
        email: 'undergrad@example.com',
        education_level: 'High School', // Fails required Bachelor's Degree
        skills: [
          {
            id: 's_01',
            profile_id: 'cand_test_02',
            name: 'Python',
            normalized_name: 'python',
            proficiency_level: 'intermediate',
            provenance_source: 'Skills',
            extraction_confidence: 'HIGH',
            source_evidence: 'Explicit'
          }
        ],
        projects: [],
        experience: []
      };

      const diagnosis = calculateOpportunityReadiness(candidateWithoutDegree, mockOpportunity);
      expect(diagnosis.hard_eligibility_passed).toBe(false);
      expect(diagnosis.readiness_score).toBe(0.0);
      expect(diagnosis.readiness_state).toBe('NOT_READY');
      expect(diagnosis.weaknesses_summary.length).toBeGreaterThan(0);
    });
  });

  describe('5. Gap Analysis & Targeted Project Blueprint Engine Audit', () => {
    it('GAP-01: Identifies critical skill gaps and provides structured project recommendations', async () => {
      const candidateWithGap: CandidateProfile = {
        id: 'cand_gap_01',
        user_id: 'usr_gap',
        full_name: 'Python Only Dev',
        email: 'py@example.com',
        education_level: "Bachelor's Degree",
        skills: [
          {
            id: 's_01',
            profile_id: 'cand_gap_01',
            name: 'Python',
            normalized_name: 'python',
            proficiency_level: 'intermediate',
            provenance_source: 'Skills',
            extraction_confidence: 'HIGH',
            source_evidence: 'Explicit'
          }
        ],
        projects: [],
        experience: []
      };

      const oppWithSql: Opportunity = {
        id: 'opp_bi_01',
        title: 'Business Intelligence Analyst',
        organization: 'Enterprise Corp',
        opportunity_type: 'private_job',
        description: 'BI analysis',
        source: 'Portal',
        verification_status: 'VERIFIED',
        deadline: '2026-12-31T23:59:59Z',
        min_experience_years: 0,
        education_level_required: "Bachelor's Degree",
        requirements: [
          {
            id: 'req_01',
            opportunity_id: 'opp_bi_01',
            requirement_type: 'required_skill',
            name: 'SQL',
            normalized_name: 'sql',
            is_mandatory: true
          }
        ]
      };

      const gapResult = analyzeCandidateGaps(candidateWithGap, oppWithSql);
      expect(gapResult.gaps.length).toBeGreaterThan(0);
      expect(gapResult.gaps[0].gap_type).toBe('SKILL_GAP');

      const projectRec = await generateTargetedProjectRecommendation(candidateWithGap, oppWithSql, gapResult.gaps);
      expect(projectRec).toBeDefined();
      expect(projectRec.title).toBeTruthy();
      expect(projectRec.skills_learned.length).toBeGreaterThan(0);
    });
  });

  describe('6. Opportunity Catalog Service & Persistence Audit', () => {
    it('OPP-01: Retrieves all curated opportunities across pathways with complete schema', async () => {
      const opportunities = await getOpportunities();
      expect(opportunities.length).toBeGreaterThanOrEqual(10);

      for (const opp of opportunities) {
        expect(opp.id).toBeTruthy();
        expect(opp.title).toBeTruthy();
        expect(opp.organization).toBeTruthy();
        expect(opp.opportunity_type).toBeTruthy();
        expect(opp.requirements.length).toBeGreaterThan(0);
      }
    });

    it('OPP-02: Retrieves individual opportunity by ID', async () => {
      const opp = await getOpportunityById('opp_data_analyst_intern_01');
      expect(opp).toBeDefined();
      expect(opp?.title).toBe('Data Analyst Intern');
    });
  });

});
