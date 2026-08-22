import { describe, it, expect } from 'vitest';
import { evaluateHardEligibility } from './hard_rules_engine';
import { CandidateProfile, Opportunity } from '../types';

describe('Hard Rules Engine', () => {
  const sampleCandidate: CandidateProfile = {
    id: 'c1',
    user_id: 'u1',
    full_name: 'Test Student',
    email: 'test@example.com',
    education_level: "Bachelor's Degree in CS",
    skills: [],
    projects: [],
    experience: [{ id: 'e1', profile_id: 'c1', organization: 'Tech Corp', role_title: 'Intern', duration_months: 12 }],
    created_at: new Date().toISOString()
  };

  const sampleOpportunity: Opportunity = {
    id: 'o1',
    title: 'Data Intern',
    organization: 'Apex Analytics',
    opportunity_type: 'internship',
    description: 'Internship',
    source: 'Demo Portal',
    deadline: '2026-12-31T23:59:59Z',
    education_level_required: "Bachelor's Degree",
    min_experience_years: 0,
    verification_status: 'VERIFIED',
    requirements: [],
    created_at: new Date().toISOString()
  };

  it('should pass eligibility when all hard constraints are satisfied', () => {
    const result = evaluateHardEligibility(sampleCandidate, sampleOpportunity);
    expect(result.eligible).toBe(true);
  });

  it('should fail eligibility when candidate degree is below required level', () => {
    const candidateHighSchool: CandidateProfile = { ...sampleCandidate, education_level: 'High School Diploma' };
    const masterReqOpportunity: Opportunity = { ...sampleOpportunity, education_level_required: "Master's Degree" };
    
    const result = evaluateHardEligibility(candidateHighSchool, masterReqOpportunity);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some(r => r.status === 'FAILED')).toBe(true);
  });

  it('should fail eligibility when application deadline has passed', () => {
    const expiredOpportunity: Opportunity = { ...sampleOpportunity, deadline: '2020-01-01T00:00:00Z' };
    const result = evaluateHardEligibility(sampleCandidate, expiredOpportunity);
    expect(result.eligible).toBe(false);
  });
});
