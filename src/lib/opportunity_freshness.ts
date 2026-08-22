import { 
  Opportunity, 
  OpportunityFreshnessInfo, 
  OpportunityFreshnessState, 
  SourceTrustLevel 
} from '../types';

export const DEFAULT_EXPIRING_SOON_DAYS_THRESHOLD = 7;

/**
 * Evaluates the freshness lifecycle and provenance trustworthiness of an opportunity.
 * Uses deterministic date comparisons and explicit source metadata.
 */
export function evaluateOpportunityFreshness(
  opportunity: Opportunity,
  referenceDate: Date = new Date()
): OpportunityFreshnessInfo {
  // 1. Check Archived State
  if (opportunity.is_archived) {
    return {
      state: 'ARCHIVED',
      is_expired: true,
      is_expiring_soon: false,
      source_trust_level: opportunity.source_trust_level || 'TRUSTED_SECONDARY',
      badge_label: 'Archived',
      explanation: 'This opportunity listing has been archived and is no longer accepting submissions.'
    };
  }

  // 2. Resolve Source Trust Level
  let trustLevel: SourceTrustLevel = opportunity.source_trust_level || 'TRUSTED_SECONDARY';
  if (
    opportunity.verification_status === 'OFFICIAL' ||
    opportunity.opportunity_type === 'government' ||
    opportunity.opportunity_type === 'competitive_exam' ||
    Boolean(opportunity.official_source_metadata)
  ) {
    trustLevel = 'AUTHORITATIVE';
  } else if (opportunity.verification_status === 'DEMO') {
    trustLevel = 'UNVERIFIED';
  }

  // 3. Evaluate Source Verification
  if (trustLevel === 'UNVERIFIED' && !opportunity.source_url) {
    return {
      state: 'UNVERIFIED_SOURCE',
      is_expired: false,
      is_expiring_soon: false,
      last_verified_at: opportunity.last_verified_at,
      published_at: opportunity.published_at,
      source_trust_level: 'UNVERIFIED',
      badge_label: 'Unverified Source',
      explanation: 'Opportunity source and eligibility details have not been independently verified.'
    };
  }

  // 4. Evaluate Deadline & Expiration (Deterministic Date Math)
  if (opportunity.deadline) {
    const deadlineDate = new Date(opportunity.deadline);
    const nowTime = referenceDate.getTime();
    const deadlineTime = deadlineDate.getTime();

    if (!isNaN(deadlineTime)) {
      const diffMs = deadlineTime - nowTime;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Expired: deadline in the past
      if (diffMs <= 0) {
        return {
          state: 'EXPIRED',
          days_until_deadline: 0,
          is_expired: true,
          is_expiring_soon: false,
          last_verified_at: opportunity.last_verified_at,
          published_at: opportunity.published_at,
          source_trust_level: trustLevel,
          badge_label: 'Expired',
          explanation: `Application deadline passed on ${deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`
        };
      }

      // Expiring Soon: within threshold days (e.g. 7 days)
      if (diffDays <= DEFAULT_EXPIRING_SOON_DAYS_THRESHOLD) {
        return {
          state: 'EXPIRING_SOON',
          days_until_deadline: diffDays,
          is_expired: false,
          is_expiring_soon: true,
          last_verified_at: opportunity.last_verified_at,
          published_at: opportunity.published_at,
          source_trust_level: trustLevel,
          badge_label: diffDays === 1 ? 'Closes Tomorrow' : `Closes in ${diffDays} days`,
          explanation: `Urgent: Application deadline closes in ${diffDays} day${diffDays === 1 ? '' : 's'} (${deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}).`
        };
      }

      // Active with future deadline
      return {
        state: 'ACTIVE',
        days_until_deadline: diffDays,
        is_expired: false,
        is_expiring_soon: false,
        last_verified_at: opportunity.last_verified_at,
        published_at: opportunity.published_at,
        source_trust_level: trustLevel,
        badge_label: trustLevel === 'AUTHORITATIVE' ? 'Official Active' : 'Active',
        explanation: `Active listing. Application open until ${deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`
      };
    }
  }

  // 5. Active without explicit deadline (e.g. rolling admission)
  return {
    state: 'ACTIVE',
    is_expired: false,
    is_expiring_soon: false,
    last_verified_at: opportunity.last_verified_at,
    published_at: opportunity.published_at,
    source_trust_level: trustLevel,
    badge_label: trustLevel === 'AUTHORITATIVE' ? 'Official Active' : 'Active',
    explanation: 'Active opportunity with rolling admission.'
  };
}

/**
 * Enriches an opportunity with its computed freshness info.
 */
export function enrichOpportunityWithFreshness(
  opportunity: Opportunity,
  referenceDate?: Date
): Opportunity {
  const freshnessInfo = evaluateOpportunityFreshness(opportunity, referenceDate);
  return {
    ...opportunity,
    source_trust_level: freshnessInfo.source_trust_level,
    freshness_info: freshnessInfo
  };
}

/**
 * Filters out expired and archived opportunities to ensure only actionable opportunities appear in recommendations.
 */
export function filterActionableOpportunities(
  opportunities: Opportunity[],
  referenceDate?: Date
): Opportunity[] {
  return opportunities.filter(opp => {
    const freshness = evaluateOpportunityFreshness(opp, referenceDate);
    return freshness.state === 'ACTIVE' || freshness.state === 'EXPIRING_SOON';
  });
}
