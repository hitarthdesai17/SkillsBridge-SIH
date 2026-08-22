import { describe, it, expect } from 'vitest';
import { validateCandidateEvidence } from './evidence_validator';
import { classifyCandidateDomain } from './domain_classifier';
import { calculateOpportunityReadiness } from './readiness_engine';
import { CandidateProfile, Opportunity } from '../types';

describe('Phase 4 Grounding & Evidence Validation Suite (TEST-GROUND-01 to TEST-GROUND-12)', () => {

  const personalTrainerText = `
    Charly Dolman
    charly@example.com
    Personal Trainer & Fitness Coach

    Summary:
    Dedicated Fitness Professional with 8 years of personal and group fitness experience. Specialized in client progress tracking using specialized software.

    Skills:
    Personal Training, Group Fitness, Nutrition, Sales, Communication

    Certifications:
    ACE Certified Personal Trainer
    CPR / First Aid Certified

    Education:
    Bachelor's Degree in Kinesiology, Syracuse University
  `;

  it('TEST-GROUND-01: Resume containing no Python -> Python MUST BE ABSENT', () => {
    const result = validateCandidateEvidence({
      full_name: 'Charly Dolman',
      email: 'charly@example.com',
      summary: 'Personal Trainer',
      desired_role_title: 'Fitness Coach',
      skills: [
        { name: 'Python', normalized_name: 'python', proficiency_level: 'intermediate', provenance_source: 'Inferred', provenance_context: 'specialized software', extraction_confidence: 'HIGH', source_evidence: 'specialized software' }
      ],
      projects: [],
      experiences: []
    }, personalTrainerText);

    const skillNames = result.validated_skills.map(s => s.normalized_name);
    expect(skillNames).not.toContain('python');
    expect(result.rejected_claims.length).toBeGreaterThan(0);
    expect(result.rejected_claims[0].reason).toContain('not explicitly named in resume text');
  });

  it('TEST-GROUND-02 & 03: "Used specialized software" MUST NOT produce Python or SQL', () => {
    const softwareText = "Tracking client progress using specialized software to generate accurate reports.";
    const result = validateCandidateEvidence({
      full_name: 'Charly',
      email: 'charly@example.com',
      summary: 'Trainer',
      desired_role_title: 'Trainer',
      skills: [
        { name: 'Python', normalized_name: 'python', proficiency_level: 'intermediate', provenance_source: 'Text', provenance_context: softwareText, extraction_confidence: 'HIGH', source_evidence: softwareText },
        { name: 'SQL', normalized_name: 'sql', proficiency_level: 'intermediate', provenance_source: 'Text', provenance_context: softwareText, extraction_confidence: 'HIGH', source_evidence: softwareText }
      ],
      projects: [],
      experiences: []
    }, softwareText);

    expect(result.validated_skills).toHaveLength(0);
    expect(result.rejected_claims).toHaveLength(2);
  });

  it('TEST-GROUND-04 & 05: Explicit "Python" in text is accepted with HIGH confidence', () => {
    const pythonResumeText = "Data Analyst resume with explicit Python and SQL skills.";
    const result = validateCandidateEvidence({
      full_name: 'Alex',
      email: 'alex@example.com',
      summary: 'Data Analyst',
      desired_role_title: 'Analyst',
      skills: [
        { name: 'Python', normalized_name: 'python', proficiency_level: 'intermediate', provenance_source: 'Skills', provenance_context: 'Python', extraction_confidence: 'HIGH', source_evidence: 'Explicit Python' }
      ],
      projects: [],
      experiences: []
    }, pythonResumeText);

    expect(result.validated_skills).toHaveLength(1);
    expect(result.validated_skills[0].normalized_name).toBe('python');
  });

  it('TEST-GROUND-06: Personal Trainer resume -> Fitness domain classified', () => {
    const domainRes = classifyCandidateDomain(personalTrainerText, ['personal_training', 'nutrition']);
    expect(domainRes.domain).toBe('FITNESS_WELLNESS');
  });

  it('TEST-GROUND-07 & 08: Personal Trainer resume -> Python Developer role is NOT_READY', () => {
    const ptProfile: CandidateProfile = {
      id: 'pt_demo_01',
      user_id: 'usr_pt',
      full_name: 'Charly Dolman',
      email: 'charly@example.com',
      education_level: "Bachelor's Degree",
      raw_resume_text: personalTrainerText,
      skills: [
        { id: 's1', profile_id: 'pt_demo_01', name: 'Personal Training', normalized_name: 'personal_training', proficiency_level: 'advanced', provenance_source: 'Resume', extraction_confidence: 'HIGH' },
        { id: 's2', profile_id: 'pt_demo_01', name: 'Nutrition', normalized_name: 'nutrition', proficiency_level: 'intermediate', provenance_source: 'Resume', extraction_confidence: 'HIGH' }
      ],
      experiences: [],
    experience: [],
      projects: []
    };

    const pythonDevOpp: Opportunity = {
      id: 'opp_python_dev_01',
      title: 'Python Backend Developer',
      organization: 'Tech Soft',
      opportunity_type: 'private_job',
      description: 'Python developer building APIs.',
      source: 'Tech Jobs',
      education_level_required: "Bachelor's Degree",
      min_experience_years: 0,
      verification_status: 'VERIFIED',
      requirements: [
        { id: 'r1', opportunity_id: 'opp_python_dev_01', requirement_type: 'required_skill', name: 'Python Programming', normalized_name: 'python', is_mandatory: true }
      ]
    };

    const readiness = calculateOpportunityReadiness(ptProfile, pythonDevOpp);
    expect(readiness.readiness_state).toBe('NOT_READY');
    expect(readiness.readiness_score).toBeLessThan(40);
  });
});
