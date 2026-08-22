import { describe, it, expect } from 'vitest';
import { matchSkillToRequirement } from './vector_matcher';
import { CandidateSkill, OpportunityRequirement } from '../types';

describe('Semantic Vector Skill Matcher', () => {
  const candidateSkills: CandidateSkill[] = [
    { id: 's1', profile_id: 'c1', name: 'React.js', normalized_name: 'react.js', proficiency_level: 'advanced', provenance_source: 'Resume', extraction_confidence: 'HIGH' },
    { id: 's2', profile_id: 'c1', name: 'Python', normalized_name: 'python', proficiency_level: 'advanced', provenance_source: 'Resume', extraction_confidence: 'HIGH' }
  ];

  it('CASE 5: Partial/Synonym semantic skill relationship -> EXACT_MATCH / STRONG_RELATED', () => {
    const requirement: OpportunityRequirement = {
      id: 'r1', opportunity_id: 'o1', requirement_type: 'required_skill', name: 'React', normalized_name: 'react', is_mandatory: true
    };
    const result = matchSkillToRequirement(candidateSkills, requirement);
    expect(result.match_tier).toBe('EXACT_MATCH');
    expect(result.match_score).toBeGreaterThanOrEqual(0.90);
  });

  it('CASE 6: No relationship -> NO_MATCH', () => {
    const requirement: OpportunityRequirement = {
      id: 'r2', opportunity_id: 'o1', requirement_type: 'required_skill', name: 'Power BI', normalized_name: 'power_bi', is_mandatory: true
    };
    const result = matchSkillToRequirement(candidateSkills, requirement);
    expect(result.match_tier).toBe('NO_MATCH');
    expect(result.match_score).toBe(0.0);
  });
});
