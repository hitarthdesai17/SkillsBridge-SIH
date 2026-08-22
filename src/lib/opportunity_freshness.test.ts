import { describe, it, expect } from 'vitest';
import { 
  evaluateOpportunityFreshness, 
  enrichOpportunityWithFreshness, 
  filterActionableOpportunities 
} from './opportunity_freshness';
import { Opportunity } from '../types';

describe('Phase 6.2: Opportunity Provenance & Freshness Engine Suite', () => {

  const baseDate = new Date('2026-08-20T12:00:00Z');

  const mockOpportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
    id: 'opp_test_01',
    title: 'Data Analyst Intern',
    organization: 'FinAnalytics Inc',
    opportunity_type: 'internship',
    career_domain: 'DATA_ANALYTICS',
    description: 'Analyze financial datasets with SQL.',
    source: 'Company Careers',
    source_url: 'https://careers.finanalytics.example/jobs/101',
    deadline: '2026-11-30T23:59:59Z',
    min_experience_years: 0,
    verification_status: 'VERIFIED',
    requirements: [],
    ...overrides
  });

  it('TEST-FRESH-01: Identifies ACTIVE opportunity with future deadline and TRUSTED_SECONDARY source', () => {
    const opp = mockOpportunity({ deadline: '2026-10-15T00:00:00Z' });
    const freshness = evaluateOpportunityFreshness(opp, baseDate);

    expect(freshness.state).toBe('ACTIVE');
    expect(freshness.is_expired).toBe(false);
    expect(freshness.is_expiring_soon).toBe(false);
    expect(freshness.days_until_deadline).toBeGreaterThan(30);
    expect(freshness.badge_label).toBe('Active');
  });

  it('TEST-FRESH-02: Identifies EXPIRING_SOON opportunity when deadline is within 7 days', () => {
    // 3 days from baseDate
    const opp = mockOpportunity({ deadline: '2026-08-23T12:00:00Z' });
    const freshness = evaluateOpportunityFreshness(opp, baseDate);

    expect(freshness.state).toBe('EXPIRING_SOON');
    expect(freshness.is_expired).toBe(false);
    expect(freshness.is_expiring_soon).toBe(true);
    expect(freshness.days_until_deadline).toBe(3);
    expect(freshness.badge_label).toContain('3 days');
  });

  it('TEST-FRESH-03: Identifies EXPIRED opportunity when deadline is in the past', () => {
    // Deadline passed 5 days ago
    const opp = mockOpportunity({ deadline: '2026-08-15T00:00:00Z' });
    const freshness = evaluateOpportunityFreshness(opp, baseDate);

    expect(freshness.state).toBe('EXPIRED');
    expect(freshness.is_expired).toBe(true);
    expect(freshness.is_expiring_soon).toBe(false);
    expect(freshness.days_until_deadline).toBe(0);
    expect(freshness.badge_label).toBe('Expired');
  });

  it('TEST-FRESH-04: Identifies ARCHIVED opportunity even if deadline is future', () => {
    const opp = mockOpportunity({ 
      deadline: '2026-12-31T00:00:00Z',
      is_archived: true 
    });
    const freshness = evaluateOpportunityFreshness(opp, baseDate);

    expect(freshness.state).toBe('ARCHIVED');
    expect(freshness.is_expired).toBe(true);
    expect(freshness.badge_label).toBe('Archived');
  });

  it('TEST-FRESH-05: Resolves AUTHORITATIVE trust level for government and official exam bodies', () => {
    const govOpp = mockOpportunity({
      opportunity_type: 'government',
      verification_status: 'OFFICIAL',
      official_source_metadata: {
        official_source_url: 'https://upsc.gov.in',
        source_name: 'Union Public Service Commission',
        last_verified_at: '2026-08-01T00:00:00Z',
        requires_notification_verification: true
      }
    });
    const freshness = evaluateOpportunityFreshness(govOpp, baseDate);

    expect(freshness.source_trust_level).toBe('AUTHORITATIVE');
    expect(freshness.badge_label).toBe('Official Active');
  });

  it('TEST-FRESH-06: Identifies UNVERIFIED_SOURCE for demo listings lacking source URLs', () => {
    const unverifiedOpp = mockOpportunity({
      verification_status: 'DEMO',
      source_url: undefined
    });
    const freshness = evaluateOpportunityFreshness(unverifiedOpp, baseDate);

    expect(freshness.state).toBe('UNVERIFIED_SOURCE');
    expect(freshness.source_trust_level).toBe('UNVERIFIED');
    expect(freshness.badge_label).toBe('Unverified Source');
  });

  it('TEST-FRESH-07: filterActionableOpportunities excludes expired and archived opportunities', () => {
    const opps: Opportunity[] = [
      mockOpportunity({ id: 'active_1', deadline: '2026-11-01T00:00:00Z' }),
      mockOpportunity({ id: 'expiring_1', deadline: '2026-08-22T00:00:00Z' }),
      mockOpportunity({ id: 'expired_1', deadline: '2026-08-10T00:00:00Z' }),
      mockOpportunity({ id: 'archived_1', deadline: '2026-12-01T00:00:00Z', is_archived: true })
    ];

    const actionable = filterActionableOpportunities(opps, baseDate);
    const ids = actionable.map(o => o.id);

    expect(ids).toContain('active_1');
    expect(ids).toContain('expiring_1');
    expect(ids).not.toContain('expired_1');
    expect(ids).not.toContain('archived_1');
    expect(actionable.length).toBe(2);
  });

});
