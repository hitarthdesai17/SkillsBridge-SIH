import { describe, it, expect } from 'vitest';
import { generateTargetedProjectRecommendation } from './project_recommendation_engine';
import { CandidateProfile, Opportunity, SkillGap } from '../types';

describe('Phase 3: Targeted Project Recommendation Engine', () => {
  const mockCandidate: CandidateProfile = {
    id: 'cand_demo_01',
    user_id: 'usr_demo',
    full_name: 'Alex Rivers',
    email: 'alex@example.com',
    skills: [
      { id: 's1', profile_id: 'cand_demo_01', name: 'Python', normalized_name: 'python', proficiency_level: 'intermediate', provenance_source: 'Resume', extraction_confidence: 'HIGH' }
    ],
    projects: [],
    experience: []
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
    requirements: []
  };

  const mockGaps: SkillGap[] = [
    { id: 'g1', gap_type: 'SKILL_GAP', missing_capability: 'Power BI Dashboarding', severity: 'critical' }
  ];

  it('CASE 10: Generates targeted project addressing primary missing skill gap', async () => {
    const project = await generateTargetedProjectRecommendation(mockCandidate, mockOpportunity, mockGaps);

    expect(project.title).toContain('Power BI');
    expect(project.feasibility_score).toBeGreaterThanOrEqual(70);
    expect(project.expected_readiness_delta).toBeGreaterThan(0);
    expect(project.scope_deliverables.length).toBeGreaterThan(0);
    expect(project.suggested_tech_stack.some(t => t.toLowerCase().includes('power bi'))).toBe(true);
  });
});
