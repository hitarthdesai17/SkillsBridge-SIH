import { 
  CandidateProfile, 
  Opportunity, 
  CandidatePreferences, 
  PersonalizedOpportunityScore, 
  PersonalizedRankingScoreBreakdown, 
  RankingStatus,
  ReadinessAssessment
} from '../types';
import { calculateOpportunityReadiness } from './readiness_engine';
import { evaluateOpportunityFreshness } from './opportunity_freshness';

/**
 * Personalized Ranking Engine (Phase 6.3)
 * Computes deterministic, fully explainable personalized ranking scores.
 * 
 * INVARIANT: Hard eligibility failure ALWAYS prevents an opportunity from becoming 
 * recommendable (ranking_status = 'INELIGIBLE' or 'NOT_RECOMMENDED').
 */
export function rankOpportunityForCandidate(
  candidate: CandidateProfile,
  opportunity: Opportunity,
  preferences?: CandidatePreferences,
  referenceDate: Date = new Date()
): PersonalizedOpportunityScore {
  // 1. Core Phase 5 Reasoning (Protected Readiness Foundation)
  const readiness: ReadinessAssessment = calculateOpportunityReadiness(candidate, opportunity);
  const freshness = evaluateOpportunityFreshness(opportunity, referenceDate);

  // 2. Compute Readiness Component (50% weight)
  const readinessComp = Math.min(100.0, Math.max(0.0, readiness.readiness_score));

  // 3. Compute Preference Alignment Component (25% weight)
  let prefScore = 50.0; // Baseline neutral alignment if no preferences set
  const reasons: string[] = [];

  if (preferences) {
    let prefPoints = 0;
    let maxPrefPoints = 0;

    // Target Role Title Match (Weight: 40% of preference)
    if (preferences.target_career_title) {
      maxPrefPoints += 40;
      const targetLower = preferences.target_career_title.toLowerCase();
      const oppTitleLower = opportunity.title.toLowerCase();
      if (oppTitleLower.includes(targetLower) || targetLower.includes(oppTitleLower)) {
        prefPoints += 40;
        reasons.push(`Direct match for your target career goal: "${preferences.target_career_title}"`);
      } else if (opportunity.career_domain && targetLower.includes(opportunity.career_domain.toLowerCase().replace(/_/g, ' '))) {
        prefPoints += 25;
        reasons.push(`Aligns with your target career field`);
      }
    }

    // Preferred Domains Match (Weight: 30% of preference)
    if (preferences.preferred_domains && preferences.preferred_domains.length > 0) {
      maxPrefPoints += 30;
      if (opportunity.career_domain && preferences.preferred_domains.includes(opportunity.career_domain)) {
        prefPoints += 30;
        reasons.push(`Matches your preferred domain (${opportunity.career_domain.replace(/_/g, ' ')})`);
      }
    }

    // Preferred Opportunity Types Match (Weight: 15% of preference)
    if (preferences.preferred_opportunity_types && preferences.preferred_opportunity_types.length > 0) {
      maxPrefPoints += 15;
      if (preferences.preferred_opportunity_types.includes(opportunity.opportunity_type)) {
        prefPoints += 15;
        reasons.push(`Matches your preferred opportunity type (${opportunity.opportunity_type.replace(/_/g, ' ')})`);
      }
    }

    // Remote / Location Preference (Weight: 15% of preference)
    if (preferences.is_remote_only) {
      maxPrefPoints += 15;
      const isRemote = (opportunity.location || '').toLowerCase().includes('remote') || (opportunity.description || '').toLowerCase().includes('remote');
      if (isRemote) {
        prefPoints += 15;
        reasons.push('Meets your remote work preference');
      }
    } else if (preferences.preferred_locations && preferences.preferred_locations.length > 0) {
      maxPrefPoints += 15;
      const locMatch = preferences.preferred_locations.some(loc => 
        (opportunity.location || '').toLowerCase().includes(loc.toLowerCase())
      );
      if (locMatch) {
        prefPoints += 15;
        reasons.push(`Located in your preferred region`);
      }
    }

    if (maxPrefPoints > 0) {
      prefScore = (prefPoints / maxPrefPoints) * 100.0;
    }
  }

  // 4. Compute Urgency Component (15% weight)
  let urgencyScore = 50.0;
  if (freshness.is_expiring_soon && freshness.days_until_deadline !== undefined) {
    // Highly urgent: closing soon
    urgencyScore = Math.max(70.0, 100.0 - (freshness.days_until_deadline * 5));
    reasons.push(`Application closes soon (${freshness.badge_label})`);
  } else if (freshness.state === 'ACTIVE') {
    urgencyScore = 60.0;
  } else if (freshness.is_expired) {
    urgencyScore = 0.0;
  }

  // 5. Compute Provenance / Freshness Quality Component (10% weight)
  let freshnessScore = 60.0;
  if (freshness.source_trust_level === 'AUTHORITATIVE') {
    freshnessScore = 100.0;
    reasons.push('Authoritative official opportunity source');
  } else if (freshness.source_trust_level === 'TRUSTED_SECONDARY') {
    freshnessScore = 75.0;
  } else {
    freshnessScore = 35.0;
  }

  const breakdown: PersonalizedRankingScoreBreakdown = {
    readiness_component: Number(readinessComp.toFixed(2)),
    preference_component: Number(prefScore.toFixed(2)),
    urgency_component: Number(urgencyScore.toFixed(2)),
    freshness_component: Number(freshnessScore.toFixed(2))
  };

  // 6. Calculate Weighted Composite Rank Score
  const compositeScore = Number((
    (0.50 * readinessComp) +
    (0.25 * prefScore) +
    (0.15 * urgencyScore) +
    (0.10 * freshnessScore)
  ).toFixed(2));

  // 7. STRICT HARD ELIGIBILITY INVARIANT GATE
  let isRecommendable = true;
  let rankingStatus: RankingStatus = 'RECOMMENDED';
  let explanation = '';

  if (!readiness.hard_eligibility_passed) {
    isRecommendable = false;
    rankingStatus = 'INELIGIBLE';
    explanation = 'Not Recommended for Immediate Application: Mandatory eligibility requirements are not satisfied.';
  } else if (freshness.is_expired || opportunity.is_archived) {
    isRecommendable = false;
    rankingStatus = 'NOT_RECOMMENDED';
    explanation = 'Not Recommended: Application deadline has expired or listing is archived.';
  } else if (readiness.readiness_state === 'READY' || compositeScore >= 75.0) {
    rankingStatus = 'HIGHLY_RECOMMENDED';
    explanation = 'Top Recommendation: Strong skill match, verified evidence, and high alignment with your profile.';
  } else if (readiness.readiness_state === 'ALMOST_READY' || compositeScore >= 50.0) {
    rankingStatus = 'RECOMMENDED';
    explanation = 'Recommended: Good capability baseline. Minor skill or evidence gaps can be bridged rapidly.';
  } else {
    rankingStatus = 'CONSIDER_PREPARING';
    explanation = 'Consider for Preparation: Foundational skills present; complete suggested roadmap milestones to reach readiness.';
  }

  return {
    opportunity_id: opportunity.id,
    personalized_rank_score: isRecommendable ? compositeScore : Number((compositeScore * 0.25).toFixed(2)),
    is_recommendable: isRecommendable,
    ranking_status: rankingStatus,
    readiness_assessment: readiness,
    freshness_info: freshness,
    score_breakdown: breakdown,
    explanation,
    key_recommendation_reasons: reasons.length > 0 ? reasons : ['Evaluated against verified profile skills and experience']
  };
}

/**
 * Ranks an array of opportunities for a candidate, sorting highest personalized score first.
 * Actionable, eligible opportunities are ranked above blocked/ineligible opportunities.
 */
export function rankOpportunitiesForCandidate(
  candidate: CandidateProfile,
  opportunities: Opportunity[],
  preferences?: CandidatePreferences,
  referenceDate?: Date
): PersonalizedOpportunityScore[] {
  const scored = opportunities.map(opp => 
    rankOpportunityForCandidate(candidate, opp, preferences, referenceDate)
  );

  return scored.sort((a, b) => {
    // 1. Recommendable / eligible opportunities always rank above ineligible ones
    if (a.is_recommendable && !b.is_recommendable) return -1;
    if (!a.is_recommendable && b.is_recommendable) return 1;

    // 2. Sort by highest personalized rank score
    return b.personalized_rank_score - a.personalized_rank_score;
  });
}
