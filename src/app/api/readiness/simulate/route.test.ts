import { describe, it, expect } from 'vitest';
import { calculateOpportunityReadiness } from '../../../../lib/readiness_engine';
import { CandidateProfile, Opportunity } from '../../../../types';

describe('Phase 4: Reassessment Simulator Engine', () => {
  const baseProfile: CandidateProfile = {
    id: 'cand_demo_01',
    user_id: 'usr_demo',
    full_name: 'Alex Rivers',
    email: 'alex@example.com',
    education_level: "Bachelor's Degree",
    skills: [
      { id: 's1', profile_id: 'cand_demo_01', name: 'Python', normalized_name: 'python', proficiency_level: 'intermediate', provenance_source: 'Resume', extraction_confidence: 'HIGH' },
      { id: 's2', profile_id: 'cand_demo_01', name: 'SQL', normalized_name: 'sql', proficiency_level: 'intermediate', provenance_source: 'Resume', extraction_confidence: 'HIGH' }
    ],
    experiences: [],
    experience: [],
    projects: [],
    education: [{ degree: "Bachelor's Degree", field: 'CS' }]
  };

  const biOpportunity: Opportunity = {
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
      { id: 'r2', opportunity_id: 'opp_bi_intern_02', requirement_type: 'required_skill', name: 'Power BI Dashboarding & DAX', normalized_name: 'power_bi', is_mandatory: true }
    ]
  };

  it('TEST-04-M13 & M14: Simulates project completion and recalculates readiness score jump', () => {
    // 1. Initial Score before project completion
    const initialScore = calculateOpportunityReadiness(baseProfile, biOpportunity);

    expect(initialScore.readiness_state).toBe('ALMOST_READY');
    const scoreBefore = initialScore.readiness_score;

    // 2. Simulated Profile after completing targeted Power BI project
    const simulatedSkills: CandidateProfile['skills'] = [
      ...baseProfile.skills,
      { id: 's_sim', profile_id: 'cand_demo_01', name: 'Power BI Dashboarding & DAX', normalized_name: 'power_bi', proficiency_level: 'intermediate', provenance_source: 'Simulated Project', extraction_confidence: 'HIGH' }
    ];

    const simulatedProfile: CandidateProfile = {
      ...baseProfile,
      skills: simulatedSkills
    };

    // 3. Recalculated Score
    const recalculatedScore = calculateOpportunityReadiness(simulatedProfile, biOpportunity);

    expect(recalculatedScore.readiness_score).toBeGreaterThan(scoreBefore);
    expect(recalculatedScore.readiness_state).toBe('READY');
    expect(recalculatedScore.readiness_score - scoreBefore).toBeGreaterThan(15);
  });
});
