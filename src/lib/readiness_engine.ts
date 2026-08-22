import { 
  CandidateProfile, 
  Opportunity, 
  ReadinessAssessment, 
  ReadinessState, 
  SkillGap, 
  SkillMatchResult,
  RequirementEvaluation 
} from '../types';
import { evaluateHardEligibility } from './hard_rules_engine';
import { matchSkillToRequirement } from './vector_matcher';
import { classifyCandidateDomain } from './domain_classifier';
import { calculateCandidateExperienceSummary, evaluateWorkplaceExperienceEligibility } from './experience_engine';

/**
 * Career-Agnostic Deterministic Readiness Engine 2.0
 * Evaluates Hard Eligibility, Skill Ontology, Canonical Experience, and Evidence Provenance.
 */
export function calculateOpportunityReadiness(
  candidate: CandidateProfile,
  opportunity: Opportunity
): ReadinessAssessment {
  // 1. Canonical Experience Evaluation
  const expSummary = candidate.experience_summary || calculateCandidateExperienceSummary(candidate);

  // 2. Evaluate Deterministic Binary Hard Eligibility Gate
  const hardGateResult = evaluateHardEligibility(candidate, opportunity);
  const hardGateMultiplier = hardGateResult.eligible ? 1.0 : 0.0;

  // 3. Candidate Career Domain Classification & Cross-Domain Gating
  const candSkillsList = (candidate.skills || []).map(s => s.normalized_name || s.name);
  const candDomain = classifyCandidateDomain(candidate.raw_resume_text || candidate.summary || '', candSkillsList);

  const isGovExam = opportunity.opportunity_type === 'government' || 
                    opportunity.opportunity_type === 'competitive_exam' || 
                    opportunity.pathway_category === 'GOVERNMENT_JOB' || 
                    opportunity.pathway_category === 'COMPETITIVE_EXAM';

  let domainMultiplier = 1.0;

  const isTechOpportunity = opportunity.career_domain === 'SOFTWARE_ENGINEERING' || 
                            opportunity.career_domain === 'DATA_ANALYTICS' || 
                            opportunity.career_domain === 'CLOUD_DEVOPS' ||
                            !opportunity.career_domain;

  const hasExplicitTechSkill = (candidate.skills || []).some(s => {
    const raw = (s.normalized_name || s.name || '').toLowerCase();
    const techTokens = ['python', 'sql', 'javascript', 'typescript', 'c++', 'c#', 'java', 'react', 'docker', 'node.js', 'django', 'mongodb', 'postgresql', 'mysql', 'git', 'pandas', 'numpy', 'html', 'css', 'fastapi', 'flask', 'spring'];
    return techTokens.some(t => raw.includes(t)) || (/\b(?:c programming|c language)\b/i.test(raw) || (raw.trim() === 'c' && !raw.includes('cpr')));
  });

  // If candidate is purely in Fitness/Non-Tech and targeting a tech role without tech skills, strictly gate
  if (!isGovExam && isTechOpportunity && candDomain.domain === 'FITNESS_WELLNESS' && !hasExplicitTechSkill) {
    domainMultiplier = 0.0;
  }

  // 4. Evaluate Required Skills via Skill Ontology (Exact, Canonical, Hierarchical)
  const requiredSkillReqs = opportunity.requirements.filter(
    r => r.requirement_type === 'required_skill' || r.requirement_type === 'preferred_skill' || r.requirement_type === 'exam_stage'
  );

  const matchResults: SkillMatchResult[] = requiredSkillReqs.map(req => 
    matchSkillToRequirement(candidate.skills, req)
  );

  const totalSkillsCount = requiredSkillReqs.length || 1;
  const matchedScoresSum = matchResults.reduce((acc, m) => acc + m.match_score, 0);
  const skillMatchRatio = matchedScoresSum / totalSkillsCount;
  const skillMatchScore = Math.min(100.0, skillMatchRatio * 100.0);

  // 5. Evaluate Evidence Proof Component (30% weight)
  let evidenceVerifiedCount = 0;
  for (const match of matchResults) {
    if (match.match_score > 0) {
      const candProjects = candidate.projects || [];
      const hasProjectProof = candProjects.some(p => 
        (p.tech_stack || []).some(t => match.matched_skills?.some(ms => t.toLowerCase().includes(ms.toLowerCase()))) ||
        (p.description || '').toLowerCase().includes((match.matched_candidate_skill || '').toLowerCase())
      );

      if (hasProjectProof || match.confidence === 'HIGH' || match.evidence_quotes.length > 0) {
        evidenceVerifiedCount++;
      }
    }
  }
  const evidenceProofRatio = totalSkillsCount > 0 ? evidenceVerifiedCount / totalSkillsCount : 0.0;
  const evidenceProofScore = Math.min(100.0, evidenceProofRatio * 100.0);

  // 6. Evaluate Experience Alignment Component (20% weight)
  const allowInternships = opportunity.opportunity_type === 'internship' || (opportunity.min_experience_years || 0) <= 1;
  const expEval = evaluateWorkplaceExperienceEligibility(expSummary, opportunity.min_experience_years || 0, allowInternships);

  let rawExpScore = 100.0;
  if ((opportunity.min_experience_years || 0) > 0) {
    const ratio = expEval.actualYears / (opportunity.min_experience_years || 1);
    rawExpScore = Math.min(100.0, Math.max(0.0, ratio * 100.0));
  }

  // Rigorous Guard: If candidate has 0 matching skills, experience in an unrelated field cannot grant readiness points
  const experienceAlignmentScore = skillMatchRatio === 0 ? 0.0 : rawExpScore;

  // 7. Calculate Final Deterministic Capability Score
  let rawScore = 0.0;
  if (skillMatchScore > 0) {
    rawScore = (0.50 * skillMatchScore) + (0.30 * evidenceProofScore) + (0.20 * experienceAlignmentScore);
  }
  const finalScore = Number((hardGateMultiplier * domainMultiplier * rawScore).toFixed(2));

  // 8. Map Pathway-Specific Readiness State (Hard eligibility is required for READY / ALMOST_READY)
  let readinessState: ReadinessState = 'NOT_READY';
  if (hardGateResult.eligible && domainMultiplier > 0.5 && skillMatchScore >= 35.0) {
    if (isGovExam) {
      if (finalScore >= 80.0) readinessState = 'EXAM_READY';
      else if (finalScore >= 50.0) readinessState = 'PREPARING';
      else readinessState = 'FOUNDATION';
    } else {
      if (finalScore >= 80.0) readinessState = 'READY';
      else if (finalScore >= 50.0) readinessState = 'ALMOST_READY';
      else readinessState = 'NOT_READY';
    }
  } else {
    readinessState = 'NOT_READY';
  }

  // 9. Generate Structured Requirement Evaluations & Explainable Gaps
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const gaps: SkillGap[] = [];
  const reqEvaluations: RequirementEvaluation[] = [];

  // Hard eligibility reasons
  if (!hardGateResult.eligible) {
    for (const failReason of hardGateResult.reasons.filter(r => r.status === 'FAILED')) {
      weaknesses.push(failReason.explanation);
      gaps.push({
        id: `gap_hard_${Math.random().toString(36).substring(7)}`,
        assessment_id: '',
        gap_type: isGovExam ? 'ELIGIBILITY_GAP' : 'HARD_ELIGIBILITY_GAP',
        missing_capability: `${failReason.requirement_name}: ${failReason.explanation}`,
        severity: 'critical',
        suggested_action: 'Review eligibility criteria or target alternative pathway.'
      });
    }
  }

  // Experience requirement evaluation
  if ((opportunity.min_experience_years || 0) > 0) {
    if (!expEval.isSatisfied) {
      weaknesses.push(expEval.explanation);
      gaps.push({
        id: `gap_exp_${Math.random().toString(36).substring(7)}`,
        assessment_id: '',
        gap_type: 'EXPERIENCE_GAP',
        missing_capability: expEval.explanation,
        severity: (opportunity.min_experience_years || 0) > 1 ? 'critical' : 'moderate',
        suggested_action: 'Acquire workplace tenure or complete industry capstones.'
      });
    } else if (skillMatchScore > 0) {
      strengths.push(expEval.explanation);
    }
  }

  // Skill requirement evaluations
  for (let i = 0; i < requiredSkillReqs.length; i++) {
    const req = requiredSkillReqs[i];
    const match = matchResults[i];

    reqEvaluations.push({
      requirement_id: req.id,
      requirement_name: req.name,
      requirement_type: req.requirement_type,
      is_mandatory: req.is_mandatory,
      status: match.status,
      match_type: match.match_type,
      match_score: match.match_score,
      explanation: match.explanation,
      evidence_sources: match.evidence_quotes
    });

    if (match.status === 'MATCHED') {
      strengths.push(`${req.name}: ${match.explanation}`);
    } else if (match.status === 'PARTIAL') {
      weaknesses.push(`${req.name}: Partial match. ${match.explanation}`);
      gaps.push({
        id: `gap_partial_${req.id}`,
        assessment_id: '',
        requirement_id: req.id,
        gap_type: 'EVIDENCE_GAP',
        missing_capability: `${req.name}: Demonstrates baseline skill but lacks advanced / administrative evidence.`,
        severity: req.is_mandatory ? 'moderate' : 'minor',
        suggested_action: `Build advanced demonstration project focusing on ${req.name}.`
      });
    } else if (match.status === 'MISSING') {
      weaknesses.push(`${req.name}: No evidence found in candidate profile.`);
      gaps.push({
        id: `gap_skill_${req.id}`,
        assessment_id: '',
        requirement_id: req.id,
        gap_type: 'SKILL_GAP',
        missing_capability: `Missing ${req.name}`,
        severity: req.is_mandatory ? 'critical' : 'moderate',
        suggested_action: `Acquire competency in ${req.name} and build a demonstrable project artifact.`
      });
    }
  }

  // Generate explainable why_recommended narrative
  let whyRecommended = '';
  if (domainMultiplier === 0.0) {
    whyRecommended = `Domain mismatch: Candidate profile is focused in ${candDomain.domain} with no technical foundation for ${opportunity.title}.`;
  } else if (!hardGateResult.eligible) {
    whyRecommended = `Application is currently gated by hard eligibility criteria: ${hardGateResult.reasons.find(r => r.status === 'FAILED')?.explanation || 'Prerequisites not met'}. Focus on eligible pathways.`;
  } else if (readinessState === 'READY' || readinessState === 'EXAM_READY') {
    whyRecommended = `Strong readiness alignment (${finalScore.toFixed(0)}%). You satisfy core requirements with verified technical evidence.`;
  } else if (readinessState === 'ALMOST_READY' || readinessState === 'PREPARING') {
    whyRecommended = `High potential match (${finalScore.toFixed(0)}%). Completing targeted bridge projects for identified gaps will jump readiness above 80%.`;
  } else {
    whyRecommended = `Foundational phase (${finalScore.toFixed(0)}%). Multiple core skills or experience requirements require development.`;
  }

  return {
    id: `assess_${opportunity.id}_${Math.random().toString(36).substring(7)}`,
    profile_id: candidate.id,
    opportunity_id: opportunity.id,
    readiness_state: readinessState,
    readiness_score: finalScore,
    hard_eligibility_passed: hardGateResult.eligible,
    skill_match_score: Number(skillMatchScore.toFixed(1)),
    evidence_proof_score: Number(evidenceProofScore.toFixed(1)),
    experience_alignment_score: Number(experienceAlignmentScore.toFixed(1)),
    strengths_summary: strengths,
    weaknesses_summary: weaknesses,
    why_recommended: whyRecommended,
    gaps,
    requirement_evaluations: reqEvaluations,
    experience_summary: expSummary,
    official_source_metadata: opportunity.official_source_metadata,
    created_at: new Date().toISOString()
  };
}
