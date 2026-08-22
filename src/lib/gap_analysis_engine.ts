import { CandidateProfile, Opportunity, SkillGap, RequirementEvaluation, GapAnalysisResult } from '../types';
import { matchSkillToRequirement } from './vector_matcher';
import { evaluateHardEligibility } from './hard_rules_engine';
import { calculateCandidateExperienceSummary, evaluateWorkplaceExperienceEligibility } from './experience_engine';

/**
 * Analyze candidate profile against an opportunity to identify all readiness gaps.
 * Uses Hierarchical Skill Ontology and Canonical Experience Engine to prevent false gaps.
 */
export function analyzeCandidateGaps(profile: CandidateProfile, opportunity: Opportunity): GapAnalysisResult {
  const gaps: SkillGap[] = [];
  const reqEvaluations: RequirementEvaluation[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // 1. Evaluate Hard Eligibility Gate
  const hardResult = evaluateHardEligibility(profile, opportunity);
  if (!hardResult.eligible) {
    for (const reason of hardResult.reasons.filter(r => r.status === 'FAILED')) {
      weaknesses.push(`${reason.requirement_name}: ${reason.explanation}`);
      gaps.push({
        id: `gap_hard_${Math.random().toString(36).substring(2, 7)}`,
        gap_type: 'HARD_ELIGIBILITY_GAP',
        missing_capability: `${reason.requirement_name}: ${reason.explanation}`,
        severity: 'critical',
        suggested_action: 'Fulfill mandatory eligibility prerequisites or consider pathways matching your current qualifications.'
      });
    }
  }

  // 2. Evaluate Experience Gaps (via Canonical Experience Engine)
  const expSummary = profile.experience_summary || calculateCandidateExperienceSummary(profile);
  if (opportunity.min_experience_years > 0) {
    const allowInternships = opportunity.opportunity_type === 'internship' || opportunity.min_experience_years <= 1;
    const expEval = evaluateWorkplaceExperienceEligibility(expSummary, opportunity.min_experience_years, allowInternships);

    if (!expEval.isSatisfied) {
      gaps.push({
        id: `gap_exp_${Math.random().toString(36).substring(2, 7)}`,
        gap_type: 'EXPERIENCE_GAP',
        missing_capability: `Requires ${opportunity.min_experience_years} year(s) of workplace experience (Candidate has ${expEval.actualYears} years).`,
        severity: opportunity.min_experience_years > 1 ? 'critical' : 'moderate',
        suggested_action: 'Build project portfolio or pursue relevant internships to bridge professional workplace tenure.'
      });
    } else {
      strengths.push(expEval.explanation);
    }
  }

  // 3. Evaluate Skill & Evidence Gaps against Opportunity Requirements
  const candSkills = profile.skills || [];

  for (const req of opportunity.requirements) {
    if (req.requirement_type === 'hard_eligibility') continue;

    const match = matchSkillToRequirement(candSkills, req);
    const evidenceSources = match.evidence_quotes;

    const reqEval: RequirementEvaluation = {
      requirement_id: req.id,
      requirement_name: req.name,
      requirement_type: req.requirement_type,
      is_mandatory: req.is_mandatory,
      status: match.status,
      match_type: match.match_type,
      match_score: match.match_score,
      explanation: match.explanation,
      evidence_sources: evidenceSources,
      missing_aspects: match.status === 'PARTIAL' ? 'Specialized operational / administrative proof' : undefined
    };
    reqEvaluations.push(reqEval);

    if (match.status === 'MATCHED') {
      strengths.push(`${req.name}: ${match.explanation}`);

      // If matched skill has MEDIUM/LOW extraction confidence and lacks project proof, record an EVIDENCE_GAP
      const matchedSkillObj = candSkills.find(s => s.name === match.matched_candidate_skill || (match.matched_skills && match.matched_skills.includes(s.name)));
      const hasProjectEvidence = (profile.projects || []).some(p => 
        (p.tech_stack || []).some(t => t.toLowerCase().includes(req.normalized_name.toLowerCase()) || (matchedSkillObj && t.toLowerCase().includes(matchedSkillObj.name.toLowerCase())))
      );

      if (matchedSkillObj && (matchedSkillObj.extraction_confidence === 'MEDIUM' || matchedSkillObj.extraction_confidence === 'LOW') && !hasProjectEvidence) {
        gaps.push({
          id: `gap_evidence_${req.id}`,
          requirement_id: req.id,
          gap_type: 'EVIDENCE_GAP',
          missing_capability: `${req.name}: Verified skill present, but lacks robust portfolio project proof.`,
          severity: 'minor',
          suggested_action: `Build a portfolio project demonstrating practical ${req.name} usage.`
        });
      }
    } else if (match.status === 'PARTIAL') {
      weaknesses.push(`${req.name}: Partial match. ${match.explanation}`);
      gaps.push({
        id: `gap_partial_${req.id}`,
        requirement_id: req.id,
        gap_type: 'EVIDENCE_GAP',
        missing_capability: `${req.name}: Demonstrates baseline skill but lacks advanced / administrative evidence.`,
        severity: req.is_mandatory ? 'moderate' : 'minor',
        suggested_action: `Demonstrate hands-on project artifacts utilizing advanced ${req.name} capabilities.`
      });
    } else if (match.status === 'MISSING') {
      weaknesses.push(`${req.name}: No evidence found in resume.`);
      gaps.push({
        id: `gap_skill_${req.id}`,
        requirement_id: req.id,
        gap_type: 'SKILL_GAP',
        missing_capability: `Missing ${req.name}`,
        severity: req.is_mandatory ? 'critical' : 'moderate',
        suggested_action: `Acquire foundational competency in ${req.name} and build a demonstrable portfolio artifact.`
      });
    }
  }

  return {
    hard_eligibility_passed: hardResult.eligible,
    hard_eligibility_reasons: hardResult.reasons,
    gaps,
    requirement_evaluations: reqEvaluations,
    strengths_summary: strengths,
    weaknesses_summary: weaknesses
  };
}
