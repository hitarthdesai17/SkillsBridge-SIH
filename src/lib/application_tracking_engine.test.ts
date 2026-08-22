import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createApplicationTrackingItem, 
  transitionApplicationStage, 
  isValidStageTransition, 
  calculateApplicationNextAction,
  ALLOWED_STAGE_TRANSITIONS,
  getMemoryTrackedApplications,
  saveMemoryTrackedApplication,
  deleteMemoryTrackedApplication,
  clearMemoryTrackerStore
} from './application_tracking_engine';
import { Opportunity, OpportunityFreshnessInfo } from '../types';

const MOCK_OPPORTUNITY: Opportunity = {
  id: 'opp_python_backend_01',
  title: 'Junior Python Backend Engineer',
  organization: 'Apex Tech Solutions',
  opportunity_type: 'internship',
  description: 'Develop FastAPI endpoints and SQL database queries.',
  source: 'Apex Careers',
  deadline: '2026-12-15T23:59:59Z',
  education_level_required: "Bachelor's Degree",
  min_experience_years: 0,
  stipend_salary_range: '₹30,000 / month',
  verification_status: 'VERIFIED',
  requirements: [
    {
      id: 'req_01',
      opportunity_id: 'opp_python_backend_01',
      requirement_type: 'required_skill',
      name: 'Python Backend Development',
      normalized_name: 'python',
      is_mandatory: true
    }
  ],
  created_at: new Date().toISOString()
};

const MOCK_OPPORTUNITY_NO_DEADLINE: Opportunity = {
  ...MOCK_OPPORTUNITY,
  id: 'opp_no_deadline_02',
  title: 'Open Source Contributor Fellowship',
  deadline: undefined
};

describe('Phase 7.1: Application Tracking Engine Suite', () => {

  beforeEach(() => {
    clearMemoryTrackerStore();
  });

  describe('1. Tracker Item Creation & Grounded Deadlines', () => {
    it('TEST 1.1: Creates a tracking item in SAVED stage with grounded deadline and initial history', () => {
      const item = createApplicationTrackingItem({
        user_id: 'usr_candidate_01',
        opportunity: MOCK_OPPORTUNITY,
        readiness_summary: { score: 85.0, state: 'READY' }
      });

      expect(item.id).toBeDefined();
      expect(item.user_id).toBe('usr_candidate_01');
      expect(item.opportunity_id).toBe('opp_python_backend_01');
      expect(item.stage).toBe('SAVED');
      expect(item.applied_at).toBeNull();
      expect(item.deadline).toBe('2026-12-15T23:59:59Z');
      expect(item.status_history?.length).toBe(1);
      expect(item.status_history?.[0].from_stage).toBeNull();
      expect(item.status_history?.[0].to_stage).toBe('SAVED');
      expect(item.next_action).toContain('High readiness match');
    });

    it('TEST 1.2: Strictly grounds missing deadline as null without fabricating dates', () => {
      const item = createApplicationTrackingItem({
        user_id: 'usr_candidate_01',
        opportunity: MOCK_OPPORTUNITY_NO_DEADLINE
      });

      expect(item.deadline).toBeNull();
    });
  });

  describe('2. Stage Transition Graph & State Validation', () => {
    it('TEST 2.1: Validates permissible forward transitions in lifecycle', () => {
      expect(isValidStageTransition('SAVED', 'PREPARING')).toBe(true);
      expect(isValidStageTransition('SAVED', 'APPLIED')).toBe(true);
      expect(isValidStageTransition('PREPARING', 'APPLIED')).toBe(true);
      expect(isValidStageTransition('APPLIED', 'INTERVIEWING')).toBe(true);
      expect(isValidStageTransition('INTERVIEWING', 'OFFER')).toBe(true);
      expect(isValidStageTransition('OFFER', 'ARCHIVED')).toBe(true);
      expect(isValidStageTransition('APPLIED', 'REJECTED')).toBe(true);
      expect(isValidStageTransition('REJECTED', 'ARCHIVED')).toBe(true);
    });

    it('TEST 2.2: Rejects invalid or illogical stage leaps', () => {
      expect(isValidStageTransition('SAVED', 'OFFER')).toBe(false);
      expect(isValidStageTransition('SAVED', 'INTERVIEWING')).toBe(false);
      expect(isValidStageTransition('SAVED', 'REJECTED')).toBe(false);
      expect(isValidStageTransition('APPLIED', 'OFFER')).toBe(false); // CRITICAL: APPLIED cannot jump directly to OFFER
      expect(isValidStageTransition('REJECTED', 'INTERVIEWING')).toBe(false);
      expect(isValidStageTransition('REJECTED', 'OFFER')).toBe(false);
      expect(isValidStageTransition('OFFER', 'PREPARING')).toBe(false);
    });

    it('TEST 2.3: Executes multi-step lifecycle with cumulative history and timestamps', () => {
      let item = createApplicationTrackingItem({
        user_id: 'usr_candidate_01',
        opportunity: MOCK_OPPORTUNITY,
        readiness_summary: { score: 75.0, state: 'ALMOST_READY' }
      });

      // Step 1: SAVED -> PREPARING
      const res1 = transitionApplicationStage(item, 'PREPARING', {
        notes: 'Working on portfolio project demo.'
      });
      expect(res1.success).toBe(true);
      item = res1.item;
      expect(item.stage).toBe('PREPARING');
      expect(item.notes).toBe('Working on portfolio project demo.');

      // Step 2: PREPARING -> APPLIED
      const res2 = transitionApplicationStage(item, 'APPLIED');
      expect(res2.success).toBe(true);
      item = res2.item;
      expect(item.stage).toBe('APPLIED');
      expect(item.applied_at).toBeDefined();
      expect(typeof item.applied_at).toBe('string');

      // Step 3: APPLIED -> INTERVIEWING
      const res3 = transitionApplicationStage(item, 'INTERVIEWING', {
        notes: 'Technical screening scheduled for Thursday.'
      });
      expect(res3.success).toBe(true);
      item = res3.item;
      expect(item.stage).toBe('INTERVIEWING');

      // Step 4: INTERVIEWING -> OFFER
      const res4 = transitionApplicationStage(item, 'OFFER');
      expect(res4.success).toBe(true);
      item = res4.item;
      expect(item.stage).toBe('OFFER');

      // Verify total history logs (Initial + 4 transitions = 5 logs)
      expect(item.status_history?.length).toBe(5);
      expect(item.status_history?.[1].to_stage).toBe('PREPARING');
      expect(item.status_history?.[2].to_stage).toBe('APPLIED');
      expect(item.status_history?.[3].to_stage).toBe('INTERVIEWING');
      expect(item.status_history?.[4].to_stage).toBe('OFFER');
    });

    it('TEST 2.4: Fails gracefully when attempting an illegal transition from SAVED', () => {
      const item = createApplicationTrackingItem({
        user_id: 'usr_candidate_01',
        opportunity: MOCK_OPPORTUNITY
      });

      const res = transitionApplicationStage(item, 'OFFER');
      expect(res.success).toBe(false);
      expect(res.error).toContain("Invalid stage transition from 'SAVED' to 'OFFER'");
      expect(res.item.stage).toBe('SAVED');
      expect(res.item.status_history?.length).toBe(1);
    });

    it('TEST 2.5: Rejects illegal direct transition from APPLIED to OFFER and preserves state invariant', () => {
      // Create and move to APPLIED
      const itemSaved = createApplicationTrackingItem({
        user_id: 'usr_candidate_01',
        opportunity: MOCK_OPPORTUNITY
      });
      const resApplied = transitionApplicationStage(itemSaved, 'APPLIED');
      expect(resApplied.success).toBe(true);
      const appliedItem = resApplied.item;
      expect(appliedItem.stage).toBe('APPLIED');
      const originalHistoryLength = appliedItem.status_history?.length;

      // Attempt illegal transition APPLIED -> OFFER
      const resIllegal = transitionApplicationStage(appliedItem, 'OFFER');
      expect(resIllegal.success).toBe(false);
      expect(resIllegal.error).toContain("Invalid stage transition from 'APPLIED' to 'OFFER'");
      expect(resIllegal.item.stage).toBe('APPLIED');
      expect(resIllegal.item.status_history?.length).toBe(originalHistoryLength);
    });

    it('TEST 2.6: Rejects illegal transition from REJECTED to INTERVIEWING or OFFER', () => {
      const itemSaved = createApplicationTrackingItem({
        user_id: 'usr_candidate_01',
        opportunity: MOCK_OPPORTUNITY
      });
      const resApplied = transitionApplicationStage(itemSaved, 'APPLIED');
      const resRejected = transitionApplicationStage(resApplied.item, 'REJECTED');
      expect(resRejected.success).toBe(true);
      const rejectedItem = resRejected.item;
      expect(rejectedItem.stage).toBe('REJECTED');

      const resInt = transitionApplicationStage(rejectedItem, 'INTERVIEWING');
      expect(resInt.success).toBe(false);
      expect(resInt.item.stage).toBe('REJECTED');

      const resOffer = transitionApplicationStage(rejectedItem, 'OFFER');
      expect(resOffer.success).toBe(false);
      expect(resOffer.item.stage).toBe('REJECTED');
    });
  });

  describe('3. Deterministic Next Action Calculation', () => {
    it('TEST 3.1: Recommends closing gaps for ALMOST_READY saved opportunities', () => {
      const action = calculateApplicationNextAction('SAVED', { score: 65, state: 'ALMOST_READY' });
      expect(action).toContain('Close key skill/evidence gaps');
    });

    it('TEST 3.2: Recommends preparing and applying for READY saved opportunities', () => {
      const action = calculateApplicationNextAction('SAVED', { score: 92, state: 'READY' });
      expect(action).toContain('High readiness match');
    });

    it('TEST 3.3: Recommends technical interview prep during INTERVIEWING stage', () => {
      const action = calculateApplicationNextAction('INTERVIEWING');
      expect(action).toContain('practice technical deep-dives');
    });

    it('TEST 3.4: Blocks application action when opportunity is expired', () => {
      const expiredFreshness: OpportunityFreshnessInfo = {
        state: 'EXPIRED',
        is_expired: true,
        is_expiring_soon: false,
        source_trust_level: 'AUTHORITATIVE',
        badge_label: 'Closed',
        explanation: 'Deadline passed'
      };

      const action = calculateApplicationNextAction('SAVED', { score: 95, state: 'READY' }, expiredFreshness);
      expect(action).toContain('Opportunity deadline has passed');
    });
  });

  describe('4. In-Memory Tracker Operations', () => {
    it('TEST 4.1: Saves, retrieves, and deletes tracker items for active user sessions', () => {
      const item1 = createApplicationTrackingItem({
        user_id: 'usr_test_101',
        opportunity: MOCK_OPPORTUNITY
      });

      saveMemoryTrackedApplication(item1);

      const items = getMemoryTrackedApplications('usr_test_101');
      expect(items.length).toBe(1);
      expect(items[0].opportunity_id).toBe('opp_python_backend_01');

      const deleted = deleteMemoryTrackedApplication(item1.id);
      expect(deleted).toBe(true);

      const remaining = getMemoryTrackedApplications('usr_test_101');
      expect(remaining.length).toBe(0);
    });
  });

});
