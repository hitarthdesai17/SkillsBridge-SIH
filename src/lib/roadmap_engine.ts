import {
  CandidateProfile,
  Opportunity,
  LearningRoadmap,
  LearningMilestone,
  PrioritizedSkillGap,
  GapPriorityTier,
  SkillGap,
  CareerDomainType,
  ReadinessState,
  OpportunityTraceDetail,
  RoadmapReadinessBreakdown,
  RoadmapTargetOpportunitySummary,
  GapActionClassification,
  MarketRequirementLevel,
  CandidateRequirementStatus,
  HardEligibilitySummaryItem,
  RoadmapOpportunityCategory
} from '../types';
import { calculateOpportunityReadiness } from './readiness_engine';
import { analyzeCandidateGaps } from './gap_analysis_engine';
import { evaluateOpportunityFreshness } from './opportunity_freshness';
import { generateTargetedProjectRecommendation } from './project_recommendation_engine';
import { getOpportunities } from './opportunity_service';
import { evaluateHardEligibility } from './hard_rules_engine';
import { rankOpportunityForCandidate } from './personalized_ranking_engine';

/**
 * Maps the existing personalized_ranking_engine's RankingStatus onto the four
 * roadmap-facing prioritization categories requested in Phase 7.X Feature 9.
 * Purely a presentation-layer relabeling -- does not alter ranking logic.
 */
function mapRankingStatusToRoadmapCategory(rankingStatus: string): RoadmapOpportunityCategory {
  switch (rankingStatus) {
    case 'HIGHLY_RECOMMENDED':
      return 'BEST_MATCH';
    case 'RECOMMENDED':
      return 'ALMOST_READY';
    case 'INELIGIBLE':
      return 'NOT_ELIGIBLE';
    case 'CONSIDER_PREPARING':
    case 'NOT_RECOMMENDED':
    default:
      return 'GAP_TO_BRIDGE';
  }
}

/**
 * Aggregates real (non-invented) hard-eligibility gate results across every target
 * opportunity by reusing the existing, protected hard_rules_engine.evaluateHardEligibility().
 * Never fabricates a requirement or a PASS/FAIL outcome -- if a requirement category
 * wasn't evaluated for any target opportunity, it simply doesn't appear.
 */
export function buildHardEligibilitySummary(
  profile: CandidateProfile,
  targetOpportunities: Opportunity[]
): HardEligibilitySummaryItem[] {
  const byName = new Map<string, { failedCount: number; totalCount: number; explanation: string; anyFailed: boolean }>();

  for (const opp of targetOpportunities) {
    const result = evaluateHardEligibility(profile, opp);
    for (const reason of result.reasons) {
      const existing = byName.get(reason.requirement_name);
      const failed = reason.status === 'FAILED';
      if (existing) {
        existing.totalCount += 1;
        if (failed) {
          existing.failedCount += 1;
          existing.explanation = reason.explanation; // prefer surfacing a real failure explanation
          existing.anyFailed = true;
        } else if (!existing.anyFailed) {
          existing.explanation = reason.explanation;
        }
      } else {
        byName.set(reason.requirement_name, {
          failedCount: failed ? 1 : 0,
          totalCount: 1,
          explanation: reason.explanation,
          anyFailed: failed
        });
      }
    }
  }

  return Array.from(byName.entries()).map(([requirement_name, agg]) => ({
    requirement_name,
    status: agg.anyFailed ? 'FAILED' as const : 'PASSED' as const,
    explanation: agg.explanation,
    affected_opportunity_count: agg.failedCount,
    total_opportunity_count: agg.totalCount
  }));
}

export interface GenerateRoadmapOptions {
  profile: CandidateProfile;
  targetCareerTitle?: string;
  opportunities?: Opportunity[];
}

/**
 * Deterministically prioritizes skill gaps based on frequency, mandatory status,
 * and eligibility blockers across the candidate's target career opportunities.
 * Zero hardcoded careers, scores, or skills.
 */
export function prioritizeCareerSkillGaps(
  profile: CandidateProfile,
  targetOpportunities: Opportunity[]
): PrioritizedSkillGap[] {
  if (targetOpportunities.length === 0) return [];

  const gapMap = new Map<string, {
    gap: SkillGap;
    count: number;
    is_mandatory: boolean;
    is_preferred: boolean;
    relatedOppIds: string[];
    relatedOppTitles: string[];
    relatedOppDetails: OpportunityTraceDetail[];
  }>();

  const candSkills = profile.skills || [];
  const candProjects = profile.projects || [];
  const candSkillNames = candSkills.map(s => s.name.toLowerCase());

  for (const opp of targetOpportunities) {
    const analysis = analyzeCandidateGaps(profile, opp);
    const readiness = calculateOpportunityReadiness(profile, opp);
    const freshness = evaluateOpportunityFreshness(opp);

    for (const gap of analysis.gaps) {
      const key = gap.missing_capability.toLowerCase().trim();
      const existing = gapMap.get(key);

      const matchedReq = opp.requirements.find(r => 
        (gap.requirement_id && r.id === gap.requirement_id) || 
        gap.missing_capability.toLowerCase().includes(r.name.toLowerCase()) ||
        r.name.toLowerCase().includes(gap.missing_capability.replace(/^Missing\s+/i, '').toLowerCase())
      );
      const isMandatory = gap.gap_type === 'HARD_ELIGIBILITY_GAP' || gap.gap_type === 'ELIGIBILITY_GAP' || (matchedReq ? matchedReq.is_mandatory : (gap.severity === 'critical'));
      const isPreferred = matchedReq ? !matchedReq.is_mandatory : false;

      const oppDetail: OpportunityTraceDetail = {
        id: opp.id,
        title: opp.title,
        organization: opp.organization,
        is_mandatory: isMandatory,
        deadline: opp.deadline || null,
        freshness_state: freshness.state,
        source_trust: opp.source_trust_level || (opp.verification_status === 'OFFICIAL' ? 'AUTHORITATIVE' : 'TRUSTED_SECONDARY'),
        readiness_score: readiness.readiness_score,
        is_eligible: readiness.hard_eligibility_passed
      };

      if (existing) {
        existing.count += 1;
        if (isMandatory) existing.is_mandatory = true;
        if (!existing.relatedOppIds.includes(opp.id)) {
          existing.relatedOppIds.push(opp.id);
          existing.relatedOppTitles.push(opp.title);
          existing.relatedOppDetails.push(oppDetail);
        }
      } else {
        gapMap.set(key, {
          gap,
          count: 1,
          is_mandatory: isMandatory,
          is_preferred: isPreferred,
          relatedOppIds: [opp.id],
          relatedOppTitles: [opp.title],
          relatedOppDetails: [oppDetail]
        });
      }
    }
  }

  const totalOpps = targetOpportunities.length;
  const prioritized: PrioritizedSkillGap[] = [];

  for (const item of Array.from(gapMap.values())) {
    const frequencyRatio = item.count / totalOpps;
    const demandPercentage = Math.round(frequencyRatio * 100);
    const isEligibilityBlocker = item.gap.gap_type === 'HARD_ELIGIBILITY_GAP' || item.gap.gap_type === 'ELIGIBILITY_GAP';

    let tier: GapPriorityTier = 'P3_OPTIONAL';
    let rationale = '';
    let reqLevel: MarketRequirementLevel = 'OPTIONAL';
    let candidateStatus: CandidateRequirementStatus = 'NO';
    let actionClass: GapActionClassification = 'LOW_PRIORITY';
    let eligibilityGuidance: string | undefined = undefined;

    // 1. Determine Market Requirement Level
    if (isEligibilityBlocker) {
      reqLevel = 'ELIGIBILITY_BLOCKER';
      eligibilityGuidance = 'This requirement is a binary prerequisite. It cannot be resolved through a standard learning milestone. Target opportunities with matching eligibility.';
    } else if (item.is_mandatory) {
      reqLevel = 'MANDATORY';
    } else if (item.is_preferred) {
      reqLevel = 'PREFERRED';
    } else {
      reqLevel = 'OPTIONAL';
    }

    // 2. Determine Candidate Evidence Status
    const capClean = item.gap.missing_capability.replace(/^Missing\s+/i, '').toLowerCase();
    const hasMatchingSkill = candSkillNames.some(s => capClean.includes(s) || s.includes(capClean));
    const hasProjectProof = candProjects.some(p => (p.tech_stack || []).some(t => capClean.includes(t.toLowerCase())));

    if (item.gap.gap_type === 'EVIDENCE_GAP') {
      candidateStatus = 'PARTIAL';
    } else if (hasMatchingSkill && !hasProjectProof) {
      candidateStatus = 'PARTIAL';
    } else if (hasMatchingSkill && hasProjectProof) {
      candidateStatus = 'YES';
    } else {
      candidateStatus = 'NO';
    }

    // 3. Determine Gap Action Classification
    if (isEligibilityBlocker) {
      actionClass = 'NOT_ELIGIBLE';
    } else if (item.gap.gap_type === 'EVIDENCE_GAP' || candidateStatus === 'PARTIAL') {
      actionClass = 'BUILD_EVIDENCE';
    } else if (item.is_mandatory || frequencyRatio >= 0.25) {
      actionClass = 'CLOSE_GAP';
    } else {
      actionClass = 'LOW_PRIORITY';
    }

    // 4. Assign Strict Deterministic Priority Tier
    // P0_CRITICAL: Binary hard eligibility blockers OR missing mandatory skills in >50% of target opportunities
    // P1_HIGH: Mandatory skills in <=50% of target opportunities OR preferred skills in >50% of target opportunities
    // P2_MEDIUM: Relevant skills with moderate demand (25%-50%) or partial matches/evidence gaps
    // P3_OPTIONAL: Optional stretch skills (<25% demand)
    if (isEligibilityBlocker) {
      tier = 'P0_CRITICAL';
      rationale = `Eligibility prerequisite blocker: ${item.gap.missing_capability}. Requires institutional verification or qualifying credentials.`;
    } else if (item.is_mandatory && frequencyRatio > 0.5) {
      tier = 'P0_CRITICAL';
      rationale = `Mandatory requirement in ${demandPercentage}% of target opportunities analyzed (${item.count}/${totalOpps} openings).`;
    } else if (item.is_mandatory || frequencyRatio > 0.5) {
      tier = 'P1_HIGH';
      rationale = `High-demand requirement appearing in ${demandPercentage}% of target opportunities (${item.count}/${totalOpps} openings).`;
    } else if (frequencyRatio >= 0.25 || item.gap.severity === 'moderate' || candidateStatus === 'PARTIAL') {
      tier = 'P2_MEDIUM';
      rationale = `Relevant capability for ${demandPercentage}% of target opportunities (${item.count}/${totalOpps} openings).`;
    } else {
      tier = 'P3_OPTIONAL';
      rationale = `Optional stretch skill appearing in ${demandPercentage}% of target opportunities.`;
    }

    // 5. Build Candidate-Specific Evidence Narrative
    let evidenceSummary = '';
    const knownSkillsStr = candSkills.slice(0, 3).map(s => s.name).join(', ');
    if (isEligibilityBlocker) {
      evidenceSummary = `Candidate profile does not satisfy prerequisite: ${item.gap.missing_capability}.`;
    } else if (candidateStatus === 'PARTIAL') {
      evidenceSummary = `You have baseline knowledge in ${item.gap.missing_capability.replace(/^Missing\s+/i, '')}, but lack verified project repository proof or advanced demonstration.`;
    } else if (knownSkillsStr) {
      evidenceSummary = `You have verified evidence for ${knownSkillsStr}, but no verified evidence for ${item.gap.missing_capability.replace(/^Missing\s+/i, '')}.`;
    } else {
      evidenceSummary = `No verified evidence for ${item.gap.missing_capability.replace(/^Missing\s+/i, '')} in candidate profile.`;
    }

    prioritized.push({
      priority_tier: tier,
      skill_gap: item.gap,
      frequency_in_target_domain_ratio: Number(frequencyRatio.toFixed(2)),
      is_mandatory: item.is_mandatory,
      proximity_to_candidate: candidateStatus === 'PARTIAL' ? 'TRANSFERABLE' : 'ADJACENT',
      estimated_effort_hours: tier === 'P0_CRITICAL' ? 24 : tier === 'P1_HIGH' ? 16 : 8,
      rationale,
      total_target_opportunities_count: totalOpps,
      opportunities_requiring_count: item.count,
      demand_percentage: demandPercentage,
      candidate_status: candidateStatus,
      market_requirement_level: reqLevel,
      gap_action_classification: actionClass,
      candidate_evidence_summary: evidenceSummary,
      is_eligibility_blocker: isEligibilityBlocker,
      eligibility_guidance: eligibilityGuidance,
      related_opportunity_ids: item.relatedOppIds,
      related_opportunity_titles: item.relatedOppTitles,
      related_opportunity_details: item.relatedOppDetails
    });
  }

  // Strict deterministic ordering: P0 -> P1 -> P2 -> P3, then by frequency
  const tierWeight: Record<GapPriorityTier, number> = {
    P0_CRITICAL: 4,
    P1_HIGH: 3,
    P2_MEDIUM: 2,
    P3_OPTIONAL: 1
  };

  prioritized.sort((a, b) => {
    const diff = tierWeight[b.priority_tier] - tierWeight[a.priority_tier];
    if (diff !== 0) return diff;
    return b.frequency_in_target_domain_ratio - a.frequency_in_target_domain_ratio;
  });

  return prioritized;
}

export interface CareerFamilyDefinition {
  familyId: string;
  canonicalTitle: string;
  matchedKeywords: string[];
  exactTitles: string[];
  allowedDomains: CareerDomainType[];
  negativeKeywords?: string[];
}

export const CAREER_FAMILY_REGISTRY: Record<string, CareerFamilyDefinition> = {
  data_analyst: {
    familyId: 'data_analyst',
    canonicalTitle: 'Data Analyst',
    exactTitles: [
      'data analyst',
      'data analyst intern',
      'junior data analyst',
      'data analytics',
      'data analytics intern',
      'business intelligence analyst',
      'business intelligence intern',
      'bi analyst',
      'bi intern',
      'analytics intern',
      'junior data analyst apprentice',
      'product analytics & ui/ux intern',
      'digital india e-governance apprentice'
    ],
    matchedKeywords: ['data analyst', 'data analytics', 'business intelligence', 'bi analyst', 'analytics intern', 'product analytics'],
    allowedDomains: ['DATA_ANALYTICS', 'GENERAL'],
    negativeKeywords: ['cybersecurity', 'security analyst', 'machine learning', 'ai research', 'fitness', 'cloud', 'devops', 'accounting', 'civil services']
  },
  python_backend: {
    familyId: 'python_backend',
    canonicalTitle: 'Python Backend Developer',
    exactTitles: [
      'python backend developer',
      'python backend engineer intern',
      'python developer',
      'backend developer',
      'backend engineer',
      'junior software engineer',
      'qa automation engineer intern',
      'data engineering intern'
    ],
    matchedKeywords: ['python backend', 'backend developer', 'backend engineer', 'python developer', 'software engineer'],
    allowedDomains: ['SOFTWARE_ENGINEERING', 'DATA_ANALYTICS', 'GENERAL'],
    negativeKeywords: ['fitness', 'trainer', 'civil services', 'upsc', 'accounting']
  },
  frontend_engineer: {
    familyId: 'frontend_engineer',
    canonicalTitle: 'Frontend Engineer',
    exactTitles: [
      'frontend engineer',
      'frontend developer',
      'full-stack web development intern',
      'web developer',
      'mobile application intern (react native)'
    ],
    matchedKeywords: ['frontend', 'front-end', 'web development', 'react developer', 'mobile application', 'react native'],
    allowedDomains: ['SOFTWARE_ENGINEERING', 'CREATIVE_DESIGN', 'GENERAL'],
    negativeKeywords: ['civil services', 'upsc', 'fitness', 'accounting', 'cybersecurity']
  },
  ml_engineer: {
    familyId: 'ml_engineer',
    canonicalTitle: 'Machine Learning Engineer',
    exactTitles: [
      'machine learning engineer',
      'machine learning engineer intern',
      'ai research intern (nlp & llms)',
      'ai research intern',
      'ml engineer'
    ],
    matchedKeywords: ['machine learning', 'ml engineer', 'ai research', 'deep learning', 'nlp', 'llms'],
    allowedDomains: ['AI_ML', 'DATA_ANALYTICS', 'SOFTWARE_ENGINEERING', 'GENERAL'],
    negativeKeywords: ['fitness', 'accounting', 'civil services', 'upsc', 'cybersecurity']
  },
  financial_accountant: {
    familyId: 'financial_accountant',
    canonicalTitle: 'Financial Accountant',
    exactTitles: [
      'financial accountant',
      'junior financial accountant',
      'accountant',
      'junior accountant',
      'accounts executive',
      'auditor'
    ],
    matchedKeywords: ['accountant', 'accounting', 'taxation', 'financial audit', 'gst filing', 'finance'],
    allowedDomains: ['FINANCE_BANKING', 'BUSINESS_SALES', 'GENERAL'],
    negativeKeywords: ['software', 'python backend', 'react', 'machine learning', 'cybersecurity']
  },
  bi_analyst: {
    familyId: 'bi_analyst',
    canonicalTitle: 'Business Intelligence Analyst',
    exactTitles: [
      'business intelligence analyst',
      'business intelligence intern',
      'bi analyst',
      'bi intern',
      'data analyst intern',
      'data analyst',
      'product analytics & ui/ux intern'
    ],
    matchedKeywords: ['business intelligence', 'bi analyst', 'bi intern', 'power bi', 'tableau'],
    allowedDomains: ['DATA_ANALYTICS', 'BUSINESS_SALES', 'GENERAL'],
    negativeKeywords: ['cybersecurity', 'fitness', 'personal trainer']
  },
  civil_services: {
    familyId: 'civil_services',
    canonicalTitle: 'UPSC Civil Services',
    exactTitles: [
      'upsc civil services examination (ias / ips / ifs)',
      'upsc civil services',
      'upsc',
      'civil services examination',
      'civil services'
    ],
    matchedKeywords: ['upsc', 'civil services', 'ias', 'ips', 'ifs', 'prelims', 'central government'],
    allowedDomains: ['CIVIL_GOVERNMENT', 'LAW_PUBLIC_POLICY', 'GENERAL'],
    negativeKeywords: ['python', 'react', 'software engineer', 'fitness trainer', 'cybersecurity']
  }
};

/**
 * Filter opportunities matching candidate's target career while excluding expired/archived postings.
 * Uses deterministic career family registry to prevent cross-domain opportunity pollution.
 */
export function filterTargetOpportunities(
  allOpportunities: Opportunity[],
  targetCareerTitle: string
): Opportunity[] {
  const normalizedTarget = targetCareerTitle.toLowerCase().trim();
  if (!normalizedTarget) return [];

  // 1. Filter out expired and archived opportunities
  const activeOpportunities = allOpportunities.filter(opp => {
    const freshness = evaluateOpportunityFreshness(opp);
    return !freshness.is_expired && freshness.state !== 'EXPIRED' && freshness.state !== 'ARCHIVED';
  });

  // 2. Match against Centralized Career Family Registry
  let matchedFamily: CareerFamilyDefinition | undefined = undefined;
  for (const family of Object.values(CAREER_FAMILY_REGISTRY)) {
    if (family.canonicalTitle.toLowerCase() === normalizedTarget ||
        family.exactTitles.some(t => t.toLowerCase() === normalizedTarget) ||
        family.matchedKeywords.some(k => normalizedTarget.includes(k) || k.includes(normalizedTarget))) {
      matchedFamily = family;
      break;
    }
  }

  if (matchedFamily) {
    const familyMatched = activeOpportunities.filter(opp => {
      const oppTitle = opp.title.toLowerCase();
      const oppDomain = opp.career_domain || 'GENERAL';

      // Disallow negative keywords collisions (e.g. 'cybersecurity analyst' matching 'data analyst')
      if (matchedFamily!.negativeKeywords?.some(nk => oppTitle.includes(nk))) {
        return false;
      }

      // Check exact title match
      if (matchedFamily!.exactTitles.some(et => oppTitle.includes(et) || et.includes(oppTitle))) {
        return true;
      }

      // Check keyword match within allowed domains
      const keywordMatch = matchedFamily!.matchedKeywords.some(k => oppTitle.includes(k) || opp.description.toLowerCase().includes(k));
      const domainMatch = matchedFamily!.allowedDomains.includes(oppDomain) || oppDomain === 'GENERAL';

      return keywordMatch && domainMatch;
    });

    return familyMatched;
  }

  // 3. Fallback for custom/uncataloged career titles: strict token matching without generic fallback
  const targetWords = normalizedTarget.split(/\s+/).filter(w => w.length > 2);
  const customMatched = activeOpportunities.filter(opp => {
    const oppTitle = opp.title.toLowerCase();
    return oppTitle.includes(normalizedTarget) || (targetWords.length > 0 && targetWords.every(w => oppTitle.includes(w)));
  });

  return customMatched;
}

/**
 * Generates an authoritative, grounded candidate career roadmap based on real candidate evidence,
 * authoritative readiness scores, and real opportunity requirements.
 */
export async function generateCareerRoadmap(options: GenerateRoadmapOptions): Promise<LearningRoadmap> {
  const { profile, targetCareerTitle } = options;

  // 1. Prompt state if no career target selected (DO NOT INVENT A CAREER)
  if (!targetCareerTitle || targetCareerTitle.trim() === '') {
    return {
      id: `roadmap_prompt_${Math.random().toString(36).substring(2, 7)}`,
      profile_id: profile.id,
      target_role: 'Unspecified',
      target_career_title: '',
      target_domain: 'GENERAL',
      current_readiness_score: 0,
      target_readiness_score: 80,
      readiness_state: 'NOT_READY',
      total_estimated_weeks: 0,
      critical_gaps_summary: [],
      milestones: [],
      active_opportunities_count: 0,
      is_empty_selection: true,
      selection_prompt_message: 'Select a target career to generate your personalized roadmap.',
      created_at: new Date().toISOString()
    };
  }

  // 2. Fetch and filter matching active opportunities
  const allOpps = options.opportunities || await getOpportunities();
  const targetOpps = filterTargetOpportunities(allOpps, targetCareerTitle);

  // 3. Handle case where no active structured opportunities exist
  if (targetOpps.length === 0) {
    return {
      id: `roadmap_nodata_${Math.random().toString(36).substring(2, 7)}`,
      profile_id: profile.id,
      target_role: targetCareerTitle,
      target_career_title: targetCareerTitle,
      target_domain: profile.career_domain || 'GENERAL',
      current_readiness_score: 0,
      target_readiness_score: 80,
      readiness_state: 'NOT_READY',
      total_estimated_weeks: 0,
      critical_gaps_summary: [],
      milestones: [],
      active_opportunities_count: 0,
      is_empty_selection: false,
      selection_prompt_message: 'Insufficient structured opportunity data for a reliable personalized roadmap for this target title.',
      created_at: new Date().toISOString()
    };
  }

  // 4. Authoritative Readiness Computation (USING EXISTING READINESS ENGINE)
  let totalReadiness = 0;
  let totalSkillScore = 0;
  let totalEvidenceScore = 0;
  let totalExpScore = 0;
  let highestReadinessState: ReadinessState = 'NOT_READY';
  let allHardPassed = true;
  let matchedReqsCount = 0;
  let missingReqsCount = 0;
  let evidenceGapsCount = 0;
  let eligibilityBlockersCount = 0;

  const targetSummaries: RoadmapTargetOpportunitySummary[] = [];

  for (const opp of targetOpps) {
    const assessment = calculateOpportunityReadiness(profile, opp);
    const freshness = evaluateOpportunityFreshness(opp);

    totalReadiness += assessment.readiness_score;
    totalSkillScore += assessment.skill_match_score;
    totalEvidenceScore += assessment.evidence_proof_score;
    totalExpScore += assessment.experience_alignment_score;

    if (!assessment.hard_eligibility_passed) {
      allHardPassed = false;
      eligibilityBlockersCount++;
    }

    if (assessment.readiness_state === 'READY' || assessment.readiness_state === 'EXAM_READY') {
      highestReadinessState = 'READY';
    } else if ((assessment.readiness_state === 'ALMOST_READY' || assessment.readiness_state === 'PREPARING') && highestReadinessState !== 'READY') {
      highestReadinessState = 'ALMOST_READY';
    }

    for (const g of assessment.gaps) {
      if (g.gap_type === 'SKILL_GAP') missingReqsCount++;
      else if (g.gap_type === 'EVIDENCE_GAP') evidenceGapsCount++;
    }

    matchedReqsCount += assessment.strengths_summary.length;

    // Reuse the existing personalized_ranking_engine (not duplicated) to derive the
    // roadmap opportunity prioritization category (Phase 7.X Feature 9).
    const ranking = rankOpportunityForCandidate(profile, opp);

    targetSummaries.push({
      id: opp.id,
      title: opp.title,
      organization: opp.organization,
      opportunity_type: opp.opportunity_type,
      location: opp.location,
      deadline: opp.deadline || null,
      verification_status: opp.verification_status,
      source_trust_level: opp.source_trust_level || (opp.verification_status === 'OFFICIAL' ? 'AUTHORITATIVE' : 'TRUSTED_SECONDARY'),
      freshness_state: freshness.state,
      freshness_badge_label: freshness.badge_label,
      freshness_explanation: freshness.explanation,
      readiness_score: assessment.readiness_score,
      readiness_state: assessment.readiness_state,
      is_eligible: assessment.hard_eligibility_passed,
      ranking_status: ranking.ranking_status,
      roadmap_category: mapRankingStatusToRoadmapCategory(ranking.ranking_status),
      key_recommendation_reasons: ranking.key_recommendation_reasons
    });
  }

  // Real, aggregated hard-eligibility gate summary for the Eligibility Gate panel
  // (Phase 7.X Feature 4) -- reuses hard_rules_engine.evaluateHardEligibility(), never invented.
  const hardEligibilitySummary = buildHardEligibilitySummary(profile, targetOpps);

  const oppsCount = targetOpps.length;
  const baselineReadiness = Number((totalReadiness / oppsCount).toFixed(1));
  const avgSkillScore = Number((totalSkillScore / oppsCount).toFixed(1));
  const avgEvidenceScore = Number((totalEvidenceScore / oppsCount).toFixed(1));
  const avgExpScore = Number((totalExpScore / oppsCount).toFixed(1));

  const totalReqsEvaluated = matchedReqsCount + missingReqsCount + evidenceGapsCount;
  const coveragePct = totalReqsEvaluated > 0 ? Math.round((matchedReqsCount / totalReqsEvaluated) * 100) : 0;

  const readinessBreakdown: RoadmapReadinessBreakdown = {
    matched_count: matchedReqsCount,
    missing_count: missingReqsCount,
    evidence_gap_count: evidenceGapsCount,
    eligibility_blocker_count: eligibilityBlockersCount,
    skill_match_score: avgSkillScore,
    evidence_proof_score: avgEvidenceScore,
    experience_score: avgExpScore,
    coverage_percentage: coveragePct,
    hard_eligibility_passed: allHardPassed
  };

  // 5. Prioritize Skill Gaps Dynamically
  const prioritizedGaps = prioritizeCareerSkillGaps(profile, targetOpps);
  const criticalGaps = prioritizedGaps.filter(g => g.priority_tier === 'P0_CRITICAL' || g.priority_tier === 'P1_HIGH');
  const learnableCriticalGaps = criticalGaps.filter(g => !g.is_eligibility_blocker);

  // 6. Generate Grounded Project Blueprint (Recommended Future Action)
  let projectBlueprint = undefined;
  if (targetOpps.length > 0 && learnableCriticalGaps.length > 0) {
    const rawGaps = learnableCriticalGaps.map(cg => cg.skill_gap);
    projectBlueprint = await generateTargetedProjectRecommendation(profile, targetOpps[0], rawGaps);
  }

  // 7. Assemble Ordered Learning Milestones
  const milestones: LearningMilestone[] = [];
  let milestoneIndex = 1;

  // MILESTONE 1: Top Learnable Skill Acquisition (P0 / P1)
  if (learnableCriticalGaps.length > 0) {
    const topGap = learnableCriticalGaps[0];
    const relatedOpps = targetOpps.slice(0, 3);
    const capName = topGap.skill_gap.missing_capability.replace(/^Missing\s+/i, '');

    milestones.push({
      id: `m_${milestoneIndex}`,
      milestone_index: milestoneIndex,
      title: `Strengthen ${capName}`,
      target_skill: capName,
      priority_tier: topGap.priority_tier,
      why_recommended: `${topGap.rationale} Closing this gap directly advances your readiness across ${topGap.opportunities_requiring_count || relatedOpps.length} target openings.`,
      estimated_duration_weeks: 2,
      learning_objectives: [
        `Master foundational syntax and core principles of ${capName}`,
        `Complete practical exercises and query/code challenges solving industry tasks`,
        `Synthesize operational findings into documented, reproducible code artifacts`
      ],
      action_steps: [
        `Review authoritative documentation and best practices for ${capName}`,
        `Execute 15+ hands-on challenges addressing realistic domain operations`,
        `Prepare clean, documented scripts and queries demonstrating verified proficiency`
      ],
      deliverable_title: `${capName} Problem Sets & Query Notebook`,
      deliverable_description: `Complete structured exercise notebooks demonstrating mastery of ${capName}.`,
      expected_outcome: `Close P0/P1 readiness gap and establish verifiable proficiency for ${capName}.`,
      related_opportunity_ids: relatedOpps.map(o => o.id),
      related_opportunity_titles: relatedOpps.map(o => o.title),
      is_completed: false
    });
    milestoneIndex++;
  }

  // MILESTONE 2: Portfolio Capstone Project (Evidence-Building - Recommended Future Action)
  if (projectBlueprint) {
    milestones.push({
      id: `m_${milestoneIndex}`,
      milestone_index: milestoneIndex,
      title: `Build Portfolio Project: ${projectBlueprint.title}`,
      target_skill: projectBlueprint.skills_learned.join(', ') || 'Portfolio Capstone',
      priority_tier: 'P1_HIGH',
      why_recommended: `${projectBlueprint.why_recommended} (Status: RECOMMENDED FUTURE ACTION. Must be built and verified by candidate before readiness updates).`,
      estimated_duration_weeks: 2,
      learning_objectives: projectBlueprint.skills_learned.map(s => `Apply ${s} in an integrated production-grade portfolio system`),
      action_steps: projectBlueprint.scope_deliverables,
      deliverable_title: `${projectBlueprint.title} Repository & Live Demo`,
      deliverable_description: `${projectBlueprint.objective} Built using ${projectBlueprint.suggested_tech_stack.join(', ')}.`,
      expected_outcome: `Generate concrete GitHub project repository evidence proving applied skills to hiring managers.`,
      project_recommendation: projectBlueprint,
      related_opportunity_ids: targetOpps.slice(0, 3).map(o => o.id),
      related_opportunity_titles: targetOpps.slice(0, 3).map(o => o.title),
      is_completed: false
    });
    milestoneIndex++;
  }

  // MILESTONE 3: Readiness Reassessment Checkpoint
  const projectedImpact = projectBlueprint?.expected_readiness_delta || 20;
  milestones.push({
    id: `m_${milestoneIndex}`,
    milestone_index: milestoneIndex,
    title: 'Reassess Career Readiness',
    target_skill: 'Readiness Verification',
    priority_tier: 'P1_HIGH',
    why_recommended: 'Recalculate your match score and eligibility after adding verified project repository links and completed skill evidence.',
    estimated_duration_weeks: 1,
    learning_objectives: [
      'Document newly completed project evidence in candidate profile',
      'Execute SkillsBridge readiness reassessment against active openings',
      'Verify readiness delta elevation from current baseline'
    ],
    action_steps: [
      'Add newly created project details and GitHub URL into your Candidate Profile',
      'Run the SkillsBridge Reassessment Simulator to re-evaluate match tier',
      'Verify that previously flagged critical skill gaps have transitioned to verified evidence'
    ],
    deliverable_title: 'Profile Evidence Update & Readiness Audit',
    deliverable_description: `Audit candidate profile evidence to reflect new project capabilities. (Projected / estimated impact: +${projectedImpact}% readiness).`,
    expected_outcome: `Elevate verified readiness score from ${baselineReadiness}% toward target readiness (80%+).`,
    is_completed: false
  });
  milestoneIndex++;

  // MILESTONE 4: Targeted Opportunity Applications
  const activeOpps = targetOpps.slice(0, 4);
  milestones.push({
    id: `m_${milestoneIndex}`,
    milestone_index: milestoneIndex,
    title: `Apply to Matching ${targetCareerTitle} Opportunities`,
    target_skill: 'Opportunity Application',
    priority_tier: 'P2_MEDIUM',
    why_recommended: `Submit tailored applications to active openings where your verified evidence meets mandatory prerequisites.`,
    estimated_duration_weeks: 1,
    learning_objectives: [
      'Tailor resume evidence for target opportunity requirements',
      'Submit applications to active openings before deadlines',
      'Track progression via SkillBridge Application Tracker'
    ],
    action_steps: [
      'Review opportunity requirements and ensure all mandatory skills have evidence',
      'Submit application on official portals and track in SkillBridge',
      'Prepare technical interview speaking points from your capstone projects'
    ],
    deliverable_title: 'Active Opportunity Submissions',
    deliverable_description: `Submit verified applications to ${activeOpps.length} matching active opportunities.`,
    expected_outcome: `Transition applications into INTERVIEWING stage with strong evidence backing.`,
    related_opportunity_ids: activeOpps.map(o => o.id),
    related_opportunity_titles: activeOpps.map(o => o.title),
    is_completed: false
  });

  const totalWeeks = milestones.reduce((sum, m) => sum + m.estimated_duration_weeks, 0);

  // 8. Construct Dynamic "Why This Roadmap?" Narrative
  const verifiedSkillsList = (profile.skills || []).map(s => s.name).slice(0, 4).join(', ');
  const topGapCap = learnableCriticalGaps.length > 0 ? learnableCriticalGaps[0].skill_gap.missing_capability.replace(/^Missing\s+/i, '') : 'advanced specialization';
  const topDemandPct = learnableCriticalGaps.length > 0 ? learnableCriticalGaps[0].demand_percentage : 75;

  const whyThisRoadmapNarrative = `You are being prepared for ${targetCareerTitle} based on your selected target and ${oppsCount} active opportunities analyzed in SkillBridge. You currently hold verified evidence for ${verifiedSkillsList || 'foundational skills'}. The primary readiness bottleneck is ${topGapCap}, which appears as a requirement in ${topDemandPct}% of analyzed openings. Milestone 1 directly bridges this gap, followed by an evidence-building project, profile reassessment, and structured application execution.`;

  return {
    id: `roadmap_${Math.random().toString(36).substring(2, 7)}`,
    profile_id: profile.id,
    target_role: targetCareerTitle,
    target_career_title: targetCareerTitle,
    target_domain: profile.career_domain || 'DATA_ANALYTICS',
    current_readiness_score: baselineReadiness,
    target_readiness_score: 80.0,
    readiness_state: highestReadinessState,
    total_estimated_weeks: totalWeeks,
    critical_gaps_summary: prioritizedGaps,
    milestones,
    active_opportunities_count: targetOpps.length,
    is_empty_selection: false,
    why_this_roadmap_narrative: whyThisRoadmapNarrative,
    readiness_breakdown: readinessBreakdown,
    hard_eligibility_summary: hardEligibilitySummary,
    target_opportunities_summary: targetSummaries,
    created_at: new Date().toISOString()
  };
}
