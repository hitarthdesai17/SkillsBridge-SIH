import { describe, it, expect } from 'vitest';
import { analyzeCandidateGaps } from './gap_analysis_engine';
import { CandidateProfile, Opportunity } from '../types';

describe('Phase 3: Gap Analysis Engine', () => {
  const mockCandidate: CandidateProfile = {
    id: 'cand_demo_01',
    user_id: 'usr_demo',
    full_name: 'Alex Rivers',
    email: 'alex@example.com',
    skills: [
      { id: 's1', profile_id: 'cand_demo_01', name: 'Python', normalized_name: 'python', proficiency_level: 'intermediate', provenance_source: 'Resume', extraction_confidence: 'HIGH' },
      { id: 's2', profile_id: 'cand_demo_01', name: 'SQL', normalized_name: 'sql', proficiency_level: 'intermediate', provenance_source: 'Resume', extraction_confidence: 'MEDIUM' }
    ],
    experiences: [],
    experience: [],
    education_level: "Bachelor's Degree",
    projects: []
  };

  const mockOpportunity: Opportunity = {
    id: 'opp_bi_intern_02',
    title: 'Business Intelligence Intern',
    organization: 'Global Retail Insights',
    opportunity_type: 'internship',
    description: 'BI intern role requiring SQL and Power BI.',
    source: 'Jobs Board',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    verification_status: 'VERIFIED',
    requirements: [
      { id: 'r1', opportunity_id: 'opp_bi_intern_02', requirement_type: 'required_skill', name: 'SQL Querying', normalized_name: 'sql', is_mandatory: true },
      { id: 'r2', opportunity_id: 'opp_bi_intern_02', requirement_type: 'required_skill', name: 'Power BI Dashboarding', normalized_name: 'power_bi', is_mandatory: true }
    ]
  };

  it('CASE 8 & 9: Identifies SKILL_GAP and EVIDENCE_GAP items', () => {
    const result = analyzeCandidateGaps(mockCandidate, mockOpportunity);

    expect(result.hard_eligibility_passed).toBe(true);
    expect(result.gaps.length).toBeGreaterThan(0);
    
    const hasSkillGap = result.gaps.some(g => g.gap_type === 'SKILL_GAP' && g.missing_capability.includes('Power BI'));
    const hasEvidenceGap = result.gaps.some(g => g.gap_type === 'EVIDENCE_GAP' && g.missing_capability.includes('SQL'));

    expect(hasSkillGap).toBe(true);
    expect(hasEvidenceGap).toBe(true);
  });
});
