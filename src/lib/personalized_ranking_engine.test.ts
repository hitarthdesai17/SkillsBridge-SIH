import { describe, it, expect } from 'vitest';
import { 
  rankOpportunityForCandidate, 
  rankOpportunitiesForCandidate 
} from './personalized_ranking_engine';
import { CandidateProfile, Opportunity, CandidatePreferences } from '../types';

describe('Phase 6.3: Personalized Ranking Engine Suite', () => {

  const baseDate = new Date('2026-08-20T12:00:00Z');

  const mockCandidate: CandidateProfile = {
    id: 'cand_test_01',
    user_id: 'user_01',
    full_name: 'Alex Johnson',
    email: 'alex@example.com',
    education_level: "Bachelor's Degree",
    skills: [
      {
        id: 'sk_1',
        profile_id: 'cand_test_01',
        name: 'Python',
        normalized_name: 'python',
        proficiency_level: 'advanced',
        provenance_source: 'Resume PDF',
        extraction_confidence: 'HIGH',
        source_evidence: '3 years Python backend development'
      },
      {
        id: 'sk_2',
        profile_id: 'cand_test_01',
        name: 'SQL',
        normalized_name: 'sql',
        proficiency_level: 'intermediate',
        provenance_source: 'Resume PDF',
        extraction_confidence: 'HIGH',
        source_evidence: 'Built relational database queries'
      }
    ],
    projects: [
      {
        id: 'proj_1',
        profile_id: 'cand_test_01',
        title: 'Sales Analytics Pipeline',
        description: 'ETL data aggregation pipeline in Python and SQL.',
        tech_stack: ['Python', 'SQL', 'PostgreSQL']
      }
    ],
    experience: [
      {
        id: 'exp_1',
        profile_id: 'cand_test_01',
        organization: 'Tech Corp',
        role_title: 'Junior Data Developer',
        duration_months: 12,
        is_current: false
      }
    ]
  };

  const eligibleOpportunity: Opportunity = {
    id: 'opp_eligible_01',
    title: 'Python Data Engineer',
    organization: 'DataCorp',
    opportunity_type: 'private_job',
    career_domain: 'DATA_ANALYTICS',
    description: 'Python and SQL data engineering.',
    source: 'DataCorp Careers',
    source_url: 'https://datacorp.example/jobs/1',
    deadline: '2026-11-30T00:00:00Z',
    min_experience_years: 0,
    education_level_required: "Bachelor's Degree",
    verification_status: 'VERIFIED',
    requirements: [
      {
        id: 'req_1',
        opportunity_id: 'opp_eligible_01',
        requirement_type: 'required_skill',
        name: 'Python',
        normalized_name: 'python',
        is_mandatory: true
      },
      {
        id: 'req_2',
        opportunity_id: 'opp_eligible_01',
        requirement_type: 'required_skill',
        name: 'SQL',
        normalized_name: 'sql',
        is_mandatory: true
      }
    ]
  };

  const ineligibleOpportunity: Opportunity = {
    id: 'opp_ineligible_01',
    title: 'Senior Lead Architect',
    organization: 'Enterprise Co',
    opportunity_type: 'private_job',
    career_domain: 'SOFTWARE_ENGINEERING',
    description: 'Lead architect requiring 10 years experience.',
    source: 'Enterprise Careers',
    source_url: 'https://enterprise.example/jobs/2',
    deadline: '2026-11-30T00:00:00Z',
    min_experience_years: 10, // Candidate has 1 year -> Fails hard gate
    education_level_required: "Master's Degree", // Fails hard gate
    verification_status: 'VERIFIED',
    requirements: [
      {
        id: 'req_3',
        opportunity_id: 'opp_ineligible_01',
        requirement_type: 'required_skill',
        name: 'Python',
        normalized_name: 'python',
        is_mandatory: true
      }
    ]
  };

  it('TEST-RANK-01: Correctly scores and recommends eligible opportunity with Python/SQL skills', () => {
    const result = rankOpportunityForCandidate(mockCandidate, eligibleOpportunity, undefined, baseDate);

    expect(result.is_recommendable).toBe(true);
    expect(result.readiness_assessment.readiness_score).toBeGreaterThanOrEqual(70.0);
    expect(result.personalized_rank_score).toBeGreaterThanOrEqual(65.0);
    expect(['HIGHLY_RECOMMENDED', 'RECOMMENDED']).toContain(result.ranking_status);
  });

  it('TEST-RANK-02: Strict Hard Eligibility Invariant: Ineligible opportunity is NOT recommendable despite matching skills', () => {
    const preferences: CandidatePreferences = {
      target_career_title: 'Senior Lead Architect', // Direct title match preference
      preferred_domains: ['SOFTWARE_ENGINEERING']
    };

    const result = rankOpportunityForCandidate(mockCandidate, ineligibleOpportunity, preferences, baseDate);

    expect(result.is_recommendable).toBe(false);
    expect(result.ranking_status).toBe('INELIGIBLE');
    expect(result.explanation).toContain('Mandatory eligibility');
  });

  it('TEST-RANK-03: Preference alignment boosts score for aligned target career', () => {
    const neutralScore = rankOpportunityForCandidate(mockCandidate, eligibleOpportunity, undefined, baseDate);

    const alignedPreferences: CandidatePreferences = {
      target_career_title: 'Python Data Engineer',
      preferred_domains: ['DATA_ANALYTICS'],
      preferred_opportunity_types: ['private_job']
    };

    const boostedScore = rankOpportunityForCandidate(mockCandidate, eligibleOpportunity, alignedPreferences, baseDate);

    expect(boostedScore.score_breakdown.preference_component).toBeGreaterThan(neutralScore.score_breakdown.preference_component);
    expect(boostedScore.personalized_rank_score).toBeGreaterThan(neutralScore.personalized_rank_score);
    expect(boostedScore.key_recommendation_reasons.length).toBeGreaterThan(0);
  });

  it('TEST-RANK-04: rankOpportunitiesForCandidate always sorts recommendable opportunities before ineligible ones', () => {
    const ranked = rankOpportunitiesForCandidate(
      mockCandidate, 
      [ineligibleOpportunity, eligibleOpportunity], 
      undefined, 
      baseDate
    );

    expect(ranked[0].opportunity_id).toBe('opp_eligible_01');
    expect(ranked[0].is_recommendable).toBe(true);
    expect(ranked[1].opportunity_id).toBe('opp_ineligible_01');
    expect(ranked[1].is_recommendable).toBe(false);
  });

});
