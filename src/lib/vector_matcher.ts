import { CandidateSkill, OpportunityRequirement, SkillMatchResult, MatchTier, MatchType, MatchStatus } from '../types';
import { evaluateOntologyRelationship } from './skill_ontology';

/**
 * Calculates vector cosine similarity between two 384-dim embedding arrays
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0.0;
  }
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0.0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Evaluates semantic skill matching between candidate skills and an opportunity requirement
 * Uses Skill Ontology for Hierarchical, Canonical, and Partial reasoning.
 */
export function matchSkillToRequirement(
  candidateSkills: CandidateSkill[],
  requirement: OpportunityRequirement
): SkillMatchResult {
  const reqName = requirement.name;
  const reqNorm = requirement.normalized_name.toLowerCase().trim();

  // 1. Evaluate via Skill Ontology (Exact, Canonical, Hierarchical, Specialization)
  const ontologyResult = evaluateOntologyRelationship(candidateSkills, reqName);

  if (ontologyResult.isMatch) {
    let matchTier: MatchTier = 'EXACT_MATCH';
    if (ontologyResult.matchType === 'HIERARCHICAL' || ontologyResult.matchType === 'CANONICAL') {
      matchTier = 'EXACT_MATCH';
    } else if (ontologyResult.matchType === 'SEMANTIC') {
      matchTier = 'STRONG_RELATED';
    } else if (ontologyResult.matchType === 'PARTIAL') {
      matchTier = 'PARTIAL_MATCH';
    }

    const matchedSkillObjs = candidateSkills.filter(s => ontologyResult.matchedSkills.includes(s.name));
    const evidenceQuotes = matchedSkillObjs
      .map(s => s.source_evidence || s.provenance_context)
      .filter((q): q is string => Boolean(q));

    const highestConfidence = matchedSkillObjs.some(s => s.extraction_confidence === 'HIGH')
      ? 'HIGH'
      : matchedSkillObjs[0]?.extraction_confidence || 'MEDIUM';

    const status: MatchStatus = ontologyResult.isPartial ? 'PARTIAL' : 'MATCHED';

    return {
      requirement_name: reqName,
      matched_candidate_skill: ontologyResult.matchedSkills[0],
      matched_skills: ontologyResult.matchedSkills,
      match_tier: matchTier,
      match_type: ontologyResult.matchType,
      status,
      match_score: ontologyResult.matchScore,
      confidence: highestConfidence,
      explanation: ontologyResult.explanation,
      evidence_quotes: evidenceQuotes.length > 0 ? evidenceQuotes : [`Candidate demonstrates verified skill: ${ontologyResult.matchedSkills.join(', ')}`]
    };
  }

  // 2. Vector Cosine Similarity Check (if embeddings exist)
  let bestVectorScore = 0.0;
  let bestVectorSkill: CandidateSkill | undefined;

  for (const skill of candidateSkills) {
    if (skill.embedding && requirement.embedding) {
      const cosSim = calculateCosineSimilarity(skill.embedding, requirement.embedding);
      if (cosSim > bestVectorScore) {
        bestVectorScore = cosSim;
        bestVectorSkill = skill;
      }
    }
  }

  if (bestVectorScore >= 0.85 && bestVectorSkill) {
    return {
      requirement_name: reqName,
      matched_candidate_skill: bestVectorSkill.name,
      matched_skills: [bestVectorSkill.name],
      match_tier: 'STRONG_RELATED',
      match_type: 'SEMANTIC',
      status: 'MATCHED',
      match_score: bestVectorScore,
      confidence: bestVectorSkill.extraction_confidence,
      explanation: `Candidate demonstrates semantic capability '${bestVectorSkill.name}' strongly aligned with '${reqName}'.`,
      evidence_quotes: [bestVectorSkill.source_evidence || `Demonstrated ${bestVectorSkill.name} in resume.`]
    };
  }

  // 3. No match found
  return {
    requirement_name: reqName,
    match_tier: 'NO_MATCH',
    match_type: 'NONE',
    status: 'MISSING',
    match_score: 0.0,
    confidence: 'UNKNOWN',
    explanation: `No verified evidence for '${reqName}' found in candidate profile.`,
    evidence_quotes: []
  };
}
