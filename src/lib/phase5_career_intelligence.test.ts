import { describe, it, expect } from 'vitest';
import { matchSkillToRequirement } from './vector_matcher';
import { evaluateOntologyRelationship } from './skill_ontology';
import { calculateCandidateExperienceSummary, evaluateWorkplaceExperienceEligibility } from './experience_engine';
import { evaluateHardEligibility } from './hard_rules_engine';
import { calculateOpportunityReadiness } from './readiness_engine';
import { analyzeCandidateGaps } from './gap_analysis_engine';
import { fallbackResumeParser, saveCandidateProfileToDatabase } from './resume_parser';
import { getCandidateProfile, clearCandidateProfileStore } from './candidate_service';
import { CandidateProfile, Opportunity, CandidateSkill } from '../types';

describe('Phase 5: Career Intelligence & Opportunity Domain Engine Suite', () => {

  // =========================================================================
  // TEST 1: Candidate has MySQL + PostgreSQL -> Requirement: Relational Database
  // =========================================================================
  it('TEST 1: Candidate with MySQL and PostgreSQL satisfies "Relational Database" as HIERARCHICAL MATCH', () => {
    const candidateSkills: CandidateSkill[] = [
      {
        id: 'sk_01',
        profile_id: 'p1',
        name: 'MySQL',
        normalized_name: 'mysql',
        proficiency_level: 'intermediate',
        provenance_source: 'Skills Section',
        provenance_context: 'Skills: MySQL',
        extraction_confidence: 'HIGH',
        source_evidence: 'Listed in skills section'
      },
      {
        id: 'sk_02',
        profile_id: 'p1',
        name: 'PostgreSQL',
        normalized_name: 'postgresql',
        proficiency_level: 'intermediate',
        provenance_source: 'Skills Section',
        provenance_context: 'Skills: PostgreSQL',
        extraction_confidence: 'HIGH',
        source_evidence: 'Listed in skills section'
      }
    ];

    const requirement = {
      id: 'req_rdbms',
      opportunity_id: 'opp_1',
      requirement_type: 'required_skill' as const,
      name: 'Relational Database',
      normalized_name: 'relational_database',
      is_mandatory: true
    };

    const match = matchSkillToRequirement(candidateSkills, requirement);

    expect(match.status).toBe('MATCHED');
    expect(match.match_type).toBe('HIERARCHICAL');
    expect(match.match_score).toBeGreaterThanOrEqual(0.90);
    expect(match.matched_skills).toContain('MySQL');
    expect(match.matched_skills).toContain('PostgreSQL');
    expect(match.explanation).toContain('fulfilling the \'Relational Database\' requirement');
  });

  // =========================================================================
  // TEST 1B: Candidate has MySQL -> Requirement: "SQL Querying & Data Extraction"
  // =========================================================================
  it('TEST 1B: Candidate with MySQL and PostgreSQL satisfies "SQL Querying & Data Extraction" as HIERARCHICAL MATCH', () => {
    const candidateSkills: CandidateSkill[] = [
      {
        id: 'sk_01',
        profile_id: 'p1',
        name: 'MySQL',
        normalized_name: 'mysql',
        proficiency_level: 'intermediate',
        provenance_source: 'Skills Section',
        provenance_context: 'Skills: MySQL',
        extraction_confidence: 'HIGH',
        source_evidence: 'Database development in MySQL'
      },
      {
        id: 'sk_02',
        profile_id: 'p1',
        name: 'PostgreSQL',
        normalized_name: 'postgresql',
        proficiency_level: 'intermediate',
        provenance_source: 'Skills Section',
        provenance_context: 'Skills: PostgreSQL',
        extraction_confidence: 'HIGH',
        source_evidence: 'Relational database in PostgreSQL'
      }
    ];

    const requirement = {
      id: 'req_sql_extraction',
      opportunity_id: 'opp_data_analyst_intern_01',
      requirement_type: 'required_skill' as const,
      name: 'SQL Querying & Data Extraction',
      normalized_name: 'sql',
      is_mandatory: true
    };

    const match = matchSkillToRequirement(candidateSkills, requirement);

    expect(match.status).toBe('MATCHED');
    expect(match.match_type).toBe('HIERARCHICAL');
    expect(match.match_score).toBeGreaterThanOrEqual(0.90);
    expect(match.matched_skills).toContain('MySQL');
    expect(match.matched_skills).toContain('PostgreSQL');
  });
  it('TEST 2: Candidate with MySQL does NOT match "MongoDB" requirement', () => {
    const candidateSkills: CandidateSkill[] = [
      {
        id: 'sk_01',
        profile_id: 'p1',
        name: 'MySQL',
        normalized_name: 'mysql',
        proficiency_level: 'intermediate',
        provenance_source: 'Skills Section',
        extraction_confidence: 'HIGH'
      }
    ];

    const requirement = {
      id: 'req_mongo',
      opportunity_id: 'opp_1',
      requirement_type: 'required_skill' as const,
      name: 'MongoDB',
      normalized_name: 'mongodb',
      is_mandatory: true
    };

    const match = matchSkillToRequirement(candidateSkills, requirement);

    expect(match.status).toBe('MISSING');
    expect(match.match_type).toBe('NONE');
    expect(match.match_score).toBe(0.0);
  });

  // =========================================================================
  // TEST 3: Candidate has PostgreSQL -> Requirement: PostgreSQL Administration
  // =========================================================================
  it('TEST 3: Candidate with PostgreSQL matches "PostgreSQL Administration" as PARTIAL without DBA evidence', () => {
    const candidateSkills: CandidateSkill[] = [
      {
        id: 'sk_01',
        profile_id: 'p1',
        name: 'PostgreSQL',
        normalized_name: 'postgresql',
        proficiency_level: 'intermediate',
        provenance_source: 'Skills Section',
        provenance_context: 'Built queries in PostgreSQL',
        extraction_confidence: 'HIGH',
        source_evidence: 'Used PostgreSQL for querying'
      }
    ];

    const requirement = {
      id: 'req_pg_admin',
      opportunity_id: 'opp_1',
      requirement_type: 'required_skill' as const,
      name: 'PostgreSQL Administration',
      normalized_name: 'postgresql_administration',
      is_mandatory: true
    };

    const match = matchSkillToRequirement(candidateSkills, requirement);

    expect(match.status).toBe('PARTIAL');
    expect(match.match_type).toBe('PARTIAL');
    expect(match.explanation).toContain('lacks verified database administration / DBA evidence');
  });

  // =========================================================================
  // TEST 4: Resume contains "CSE", "computer", "experience" -> C must NOT be hallucinated
  // =========================================================================
  it('TEST 4: Resume with "CSE", "computer", "experience" does NOT hallucinate "C" language', () => {
    const resumeText = `
Candidate Name: Alex Rivers
Education: Bachelor of Computer Science Engineering (CSE)
Summary: Computer science student with internship experience in Python web development.
Skills: Python, Django, PostgreSQL
`;

    const parsed = fallbackResumeParser(resumeText);
    const skillNames = parsed.skills.map(s => s.name.toLowerCase());
    const normalizedNames = parsed.skills.map(s => s.normalized_name.toLowerCase());

    expect(skillNames).not.toContain('c');
    expect(skillNames).not.toContain('c programming');
    expect(normalizedNames).not.toContain('c');
    expect(skillNames).toContain('python');
  });

  // =========================================================================
  // TEST 5: Candidate has 1 year professional experience -> Requirement: 1 year experience
  // =========================================================================
  it('TEST 5: Candidate with 1 year professional experience satisfies 1 year workplace requirement', () => {
    const candidate: CandidateProfile = {
      id: 'c1',
      user_id: 'u1',
      full_name: 'Experienced Dev',
      email: 'dev@example.com',
      skills: [],
      projects: [],
      experience: [
        {
          id: 'exp1',
          profile_id: 'c1',
          organization: 'Apex Labs',
          role_title: 'Junior Software Engineer',
          duration_months: 12,
          description: 'Full-time software engineering role',
          is_current: false
        }
      ]
    };

    const summary = calculateCandidateExperienceSummary(candidate);
    expect(summary.workplace_duration_years).toBe(1.0);
    expect(summary.workplace_duration_months).toBe(12);

    const evalResult = evaluateWorkplaceExperienceEligibility(summary, 1.0, true);
    expect(evalResult.isSatisfied).toBe(true);
    expect(evalResult.actualYears).toBe(1.0);
  });

  // =========================================================================
  // TEST 6: Candidate has 2 years academic projects -> Requirement: 2 years workplace experience
  // =========================================================================
  it('TEST 6: Candidate with 2 years academic projects does NOT satisfy workplace experience requirement', () => {
    const candidate: CandidateProfile = {
      id: 'c2',
      user_id: 'u2',
      full_name: 'Student Dev',
      email: 'student@example.com',
      skills: [],
      projects: [
        {
          id: 'proj1',
          profile_id: 'c2',
          title: 'College Capstone',
          description: 'University academic project',
          tech_stack: ['Python', 'SQL']
        }
      ],
      experience: [
        {
          id: 'exp_academic',
          profile_id: 'c2',
          organization: 'University Coursework',
          role_title: 'Academic Project Lead',
          duration_months: 24,
          description: 'Academic student coursework and capstone projects',
          is_current: false
        }
      ]
    };

    const summary = calculateCandidateExperienceSummary(candidate);
    expect(summary.breakdown_by_type.ACADEMIC_PROJECT).toBe(24);
    expect(summary.workplace_duration_months).toBe(0); // Academic projects do not count as workplace

    const evalResult = evaluateWorkplaceExperienceEligibility(summary, 2.0, true);
    expect(evalResult.isSatisfied).toBe(false);
  });

  // =========================================================================
  // TEST 7: Candidate has 6 mo internship + 6 mo professional -> Requirement: 1 year experience
  // =========================================================================
  it('TEST 7: Candidate with 6 mo internship + 6 mo professional has canonical 1.0 year workplace experience', () => {
    const candidate: CandidateProfile = {
      id: 'c3',
      user_id: 'u3',
      full_name: 'Hybrid Experience Candidate',
      email: 'hybrid@example.com',
      skills: [],
      projects: [],
      experience: [
        {
          id: 'e1',
          profile_id: 'c3',
          organization: 'StartUp Inc',
          role_title: 'Frontend Intern',
          duration_months: 6,
          is_current: false
        },
        {
          id: 'e2',
          profile_id: 'c3',
          organization: 'TechCorp',
          role_title: 'Software Engineer',
          duration_months: 6,
          is_current: true
        }
      ]
    };

    const summary = calculateCandidateExperienceSummary(candidate);
    expect(summary.total_duration_months).toBe(12);
    expect(summary.workplace_duration_months).toBe(12);
    expect(summary.breakdown_by_type.INTERNSHIP).toBe(6);
    expect(summary.breakdown_by_type.FULL_TIME_EMPLOYMENT).toBe(6);

    const evalResult = evaluateWorkplaceExperienceEligibility(summary, 1.0, true);
    expect(evalResult.isSatisfied).toBe(true);
    expect(evalResult.actualYears).toBe(1.0);
    expect(evalResult.explanation).toContain('Candidate demonstrates 1 year(s)');
  });

  // =========================================================================
  // TEST 8: Profile experience breakdown and readiness engine produce the SAME canonical data
  // =========================================================================
  it('TEST 8: Candidate profile summary and readiness engine use identical canonical duration', () => {
    const candidate: CandidateProfile = {
      id: 'c4',
      user_id: 'u4',
      full_name: 'Canonical Test Candidate',
      email: 'test@example.com',
      education_level: "Bachelor's Degree",
      skills: [
        {
          id: 's1',
          profile_id: 'c4',
          name: 'Python',
          normalized_name: 'python',
          proficiency_level: 'intermediate',
          provenance_source: 'Skills',
          extraction_confidence: 'HIGH'
        }
      ],
      projects: [],
      experience: [
        {
          id: 'e1',
          profile_id: 'c4',
          organization: 'Apex Analytics',
          role_title: 'Data Intern',
          duration_months: 6,
          is_current: false
        },
        {
          id: 'e2',
          profile_id: 'c4',
          organization: 'Cloud Labs',
          role_title: 'Junior Data Analyst',
          duration_months: 6,
          is_current: true
        }
      ]
    };

    const opportunity: Opportunity = {
      id: 'opp_test',
      title: 'Junior Data Analyst',
      organization: 'Tech Corp',
      opportunity_type: 'private_job',
      description: 'Analytics role',
      source: 'Direct',
      deadline: '2026-12-31T23:59:59Z',
      min_experience_years: 1.0,
      education_level_required: "Bachelor's Degree",
      verification_status: 'VERIFIED',
      requirements: [
        {
          id: 'r1',
          opportunity_id: 'opp_test',
          requirement_type: 'required_skill',
          name: 'Python',
          normalized_name: 'python',
          is_mandatory: true
        }
      ]
    };

    const profileSummary = calculateCandidateExperienceSummary(candidate);
    const readinessDiagnosis = calculateOpportunityReadiness(candidate, opportunity);

    expect(profileSummary.workplace_duration_years).toBe(1.0);
    expect(readinessDiagnosis.experience_summary?.workplace_duration_years).toBe(1.0);
    expect(readinessDiagnosis.experience_alignment_score).toBe(100.0);
    expect(readinessDiagnosis.hard_eligibility_passed).toBe(true);
  });

  // =========================================================================
  // TEST 9: Candidate with MySQL satisfies "Relational Database"
  // =========================================================================
  it('TEST 9: Candidate with standalone MySQL satisfies "Relational Database" requirement', () => {
    const candidateSkills: CandidateSkill[] = [
      {
        id: 'sk_01',
        profile_id: 'p1',
        name: 'MySQL',
        normalized_name: 'mysql',
        proficiency_level: 'intermediate',
        provenance_source: 'Technical Skills',
        extraction_confidence: 'HIGH'
      }
    ];

    const requirement = {
      id: 'req_rdbms',
      opportunity_id: 'opp_1',
      requirement_type: 'required_skill' as const,
      name: 'Relational Database',
      normalized_name: 'relational_database',
      is_mandatory: true
    };

    const match = matchSkillToRequirement(candidateSkills, requirement);
    expect(match.status).toBe('MATCHED');
    expect(match.match_type).toBe('HIERARCHICAL');
    expect(match.matched_skills).toContain('MySQL');
  });

  // =========================================================================
  // TEST 10: Candidate with MySQL against "PostgreSQL Administration" -> NOT fully satisfied
  // =========================================================================
  it('TEST 10: Candidate with MySQL against "PostgreSQL Administration" is NOT fully satisfied', () => {
    const candidateSkills: CandidateSkill[] = [
      {
        id: 'sk_01',
        profile_id: 'p1',
        name: 'MySQL',
        normalized_name: 'mysql',
        proficiency_level: 'intermediate',
        provenance_source: 'Technical Skills',
        extraction_confidence: 'HIGH'
      }
    ];

    const requirement = {
      id: 'req_pg_admin',
      opportunity_id: 'opp_1',
      requirement_type: 'required_skill' as const,
      name: 'PostgreSQL Administration',
      normalized_name: 'postgresql_administration',
      is_mandatory: true
    };

    const match = matchSkillToRequirement(candidateSkills, requirement);
    expect(match.status).not.toBe('MATCHED');
  });

  // =========================================================================
  // TEST 11: Candidate has 95% skills but fails mandatory degree requirement -> Score 0.0
  // =========================================================================
  it('TEST 11: Candidate with high skill match but failing degree requirement gets HARD ELIGIBILITY FAILURE (Score 0.0)', () => {
    const candidate: CandidateProfile = {
      id: 'c5',
      user_id: 'u5',
      full_name: 'Undergrad Prodigy',
      email: 'prodigy@example.com',
      education_level: 'High School', // Fails mandatory Bachelor's Degree
      skills: [
        {
          id: 's1',
          profile_id: 'c5',
          name: 'Python',
          normalized_name: 'python',
          proficiency_level: 'advanced',
          provenance_source: 'Skills',
          extraction_confidence: 'HIGH'
        },
        {
          id: 's2',
          profile_id: 'c5',
          name: 'SQL',
          normalized_name: 'sql',
          proficiency_level: 'advanced',
          provenance_source: 'Skills',
          extraction_confidence: 'HIGH'
        },
        {
          id: 's3',
          profile_id: 'c5',
          name: 'PostgreSQL',
          normalized_name: 'postgresql',
          proficiency_level: 'advanced',
          provenance_source: 'Skills',
          extraction_confidence: 'HIGH'
        }
      ],
      projects: [],
      experience: []
    };

    const opportunity: Opportunity = {
      id: 'opp_degree_gated',
      title: 'Senior Data Specialist',
      organization: 'Gov Analytics',
      opportunity_type: 'private_job',
      description: 'Specialist role',
      source: 'Direct',
      deadline: '2026-12-31T23:59:59Z',
      min_experience_years: 0,
      education_level_required: "Bachelor's Degree",
      verification_status: 'VERIFIED',
      requirements: [
        { id: 'r1', opportunity_id: 'opp_degree_gated', requirement_type: 'required_skill', name: 'Python', normalized_name: 'python', is_mandatory: true },
        { id: 'r2', opportunity_id: 'opp_degree_gated', requirement_type: 'required_skill', name: 'SQL', normalized_name: 'sql', is_mandatory: true }
      ]
    };

    const hardResult = evaluateHardEligibility(candidate, opportunity);
    expect(hardResult.eligible).toBe(false);

    const diagnosis = calculateOpportunityReadiness(candidate, opportunity);
    expect(diagnosis.hard_eligibility_passed).toBe(false);
    expect(diagnosis.readiness_score).toBe(0.0);
    expect(diagnosis.readiness_state).toBe('NOT_READY');
  });

  // =========================================================================
  // TEST 12: User B cannot access User A's private candidate data
  // =========================================================================
  it('TEST 12: Multi-tenant user isolation prevents User B from accessing User A data', async () => {
    clearCandidateProfileStore();

    const userA = 'usr_alpha_99';
    const resumeA = `Full Name: Alice Walker\nalice@example.com\nSkills: Python, Django`;
    const parsedA = fallbackResumeParser(resumeA);
    await saveCandidateProfileToDatabase(parsedA, resumeA, userA);

    const userB = 'usr_beta_99';
    const resumeB = `Full Name: Bob Smith\nbob@example.com\nSkills: React.js, Next.js`;
    const parsedB = fallbackResumeParser(resumeB);
    await saveCandidateProfileToDatabase(parsedB, resumeB, userB);

    const profileB = await getCandidateProfile(userB);
    expect(profileB.full_name).toContain('Bob');
    expect(profileB.skills.map(s => s.name)).toContain('React.js');
    expect(profileB.skills.map(s => s.name)).not.toContain('Django');
  });

  // =========================================================================
  // TEST 13: Personal Trainer with 0 tech skills evaluating Python Backend role
  // =========================================================================
  it('TEST 13: Candidate who is a Personal Trainer with 0 tech skills gets Score 0.0 and NOT_READY for Python Backend role', () => {
    const personalTrainer: CandidateProfile = {
      id: 'cand_pt_01',
      user_id: 'usr_pt_01',
      full_name: 'Charly Dolman Personal Trainer',
      email: 'charly@example.com',
      summary: 'Certified Personal Trainer & Fitness Coach',
      desired_role_title: 'Personal Trainer',
      education_level: "Bachelor's Degree",
      raw_resume_text: 'Charly Dolman\nPersonal Trainer\nSkills: Personal Training, Nutrition, CPR & First Aid, Sales & Client Relations',
      skills: [
        { id: 's1', profile_id: 'cand_pt_01', name: 'Personal Training', normalized_name: 'personal_training', proficiency_level: 'advanced', provenance_source: 'Resume', extraction_confidence: 'HIGH' },
        { id: 's2', profile_id: 'cand_pt_01', name: 'Nutrition', normalized_name: 'nutrition_planning', proficiency_level: 'intermediate', provenance_source: 'Resume', extraction_confidence: 'HIGH' },
        { id: 's3', profile_id: 'cand_pt_01', name: 'CPR & First Aid', normalized_name: 'cpr_first_aid', proficiency_level: 'intermediate', provenance_source: 'Resume', extraction_confidence: 'HIGH' },
        { id: 's4', profile_id: 'cand_pt_01', name: 'Sales & Client Relations', normalized_name: 'sales', proficiency_level: 'intermediate', provenance_source: 'Resume', extraction_confidence: 'HIGH' }
      ],
      projects: [],
      experience: [
        { id: 'e1', profile_id: 'cand_pt_01', organization: 'FitLife Gym', role_title: 'Personal Trainer', duration_months: 24, description: 'Client coaching', is_current: true }
      ]
    };

    const pythonOpportunity: Opportunity = {
      id: 'opp_python_backend_09',
      title: 'Python Backend Engineer Intern',
      organization: 'DataFlow Systems',
      opportunity_type: 'internship',
      career_domain: 'SOFTWARE_ENGINEERING',
      description: 'FastAPI Python web microservices, SQL query models, and Redis caching infrastructure.',
      source: 'Company Careers',
      deadline: '2026-11-25T23:59:59Z',
      location: 'Mumbai, India',
      education_level_required: "Bachelor's Degree",
      min_experience_years: 0,
      verification_status: 'VERIFIED',
      requirements: [
        { id: 'req_09_1', opportunity_id: 'opp_python_backend_09', requirement_type: 'required_skill', name: 'Python Backend Development', normalized_name: 'python', is_mandatory: true },
        { id: 'req_09_2', opportunity_id: 'opp_python_backend_09', requirement_type: 'required_skill', name: 'Relational SQL Databases', normalized_name: 'sql', is_mandatory: true }
      ]
    };

    const diagnosis = calculateOpportunityReadiness(personalTrainer, pythonOpportunity);

    expect(diagnosis.skill_match_score).toBe(0.0);
    expect(diagnosis.readiness_score).toBe(0.0);
    expect(diagnosis.readiness_state).toBe('NOT_READY');
    expect(diagnosis.why_recommended).toContain('Domain mismatch');
  });

});
