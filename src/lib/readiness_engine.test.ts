import { describe, it, expect } from 'vitest';
import { calculateOpportunityReadiness } from './readiness_engine';
import { CandidateProfile, Opportunity } from '../types';

describe('Readiness Engine', () => {
  const candidate: CandidateProfile = {
    id: 'c1',
    user_id: 'u1',
    full_name: 'Test Student',
    email: 'test@example.com',
    education_level: "Bachelor's Degree",
    skills: [
      { id: 's1', profile_id: 'c1', name: 'Python', normalized_name: 'python', proficiency_level: 'advanced', provenance_source: 'Resume', extraction_confidence: 'HIGH' },
      { id: 's2', profile_id: 'c1', name: 'SQL', normalized_name: 'sql', proficiency_level: 'advanced', provenance_source: 'Resume', extraction_confidence: 'HIGH' }
    ],
    projects: [
      { id: 'p1', profile_id: 'c1', title: 'Data Cleaning', description: 'Used Python and SQL', tech_stack: ['Python', 'SQL'] }
    ],
    experience: [],
    created_at: new Date().toISOString()
  };

  const opportunity: Opportunity = {
    id: 'o1',
    title: 'Data Analyst Intern',
    organization: 'Apex',
    opportunity_type: 'internship',
    description: 'Data role',
    source: 'Demo',
    deadline: '2026-12-31T23:59:59Z',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    verification_status: 'VERIFIED',
    requirements: [
      { id: 'r1', opportunity_id: 'o1', requirement_type: 'required_skill', name: 'Python', normalized_name: 'python', is_mandatory: true },
      { id: 'r2', opportunity_id: 'o1', requirement_type: 'required_skill', name: 'SQL', normalized_name: 'sql', is_mandatory: true }
    ],
    created_at: new Date().toISOString()
  };

  it('CASE 1: Fully eligible + strong skills + evidence -> READY', () => {
    const result = calculateOpportunityReadiness(candidate, opportunity);
    expect(result.hard_eligibility_passed).toBe(true);
    expect(result.readiness_state).toBe('READY');
    expect(result.readiness_score).toBeGreaterThanOrEqual(80.0);
  });

  it('CASE 3: Hard eligibility failure + excellent skills -> Must NOT become READY', () => {
    const expiredOpp: Opportunity = { ...opportunity, deadline: '2020-01-01T00:00:00Z' };
    const result = calculateOpportunityReadiness(candidate, expiredOpp);
    expect(result.hard_eligibility_passed).toBe(false);
    expect(result.readiness_state).toBe('NOT_READY');
    expect(result.readiness_score).toBe(0.0);
  });
});
