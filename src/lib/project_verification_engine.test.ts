import { describe, it, expect } from 'vitest';
import {
  isValidVerificationTransition,
  createProjectVerificationRecord,
  transitionProjectVerification,
  UI_SELF_SERVICE_TRANSITIONS
} from './project_verification_engine';

describe('Project Verification Checkpoint Engine (Phase 7.X Feature 6)', () => {
  it('TEST 1: Allows NOT_STARTED -> IN_PROGRESS -> SUBMITTED_FOR_VERIFICATION', () => {
    expect(isValidVerificationTransition('NOT_STARTED', 'IN_PROGRESS')).toBe(true);
    expect(isValidVerificationTransition('IN_PROGRESS', 'SUBMITTED_FOR_VERIFICATION')).toBe(true);
  });

  it('TEST 2: Rejects skipping straight from NOT_STARTED to VERIFIED', () => {
    expect(isValidVerificationTransition('NOT_STARTED', 'VERIFIED')).toBe(false);
  });

  it('TEST 3: A completed/created record starts at NOT_STARTED with one history entry', () => {
    const record = createProjectVerificationRecord('m_2', 'Retail Sales Analytics Dashboard');
    expect(record.status).toBe('NOT_STARTED');
    expect(record.history.length).toBe(1);
  });

  it('TEST 4: Clicking "complete" alone (self-service transitions) can never reach VERIFIED', () => {
    // This is the core anti-hallucination invariant for Feature 6: a candidate can
    // self-service move through NOT_STARTED/IN_PROGRESS/SUBMITTED_FOR_VERIFICATION,
    // but VERIFIED is never in that self-service set.
    expect(UI_SELF_SERVICE_TRANSITIONS).not.toContain('VERIFIED');
    expect(UI_SELF_SERVICE_TRANSITIONS).not.toContain('REJECTED_NEEDS_MORE_EVIDENCE');
  });

  it('TEST 5: transitionProjectVerification records history and rejects invalid jumps', () => {
    const record = createProjectVerificationRecord('m_2', 'Retail Sales Analytics Dashboard');
    const step1 = transitionProjectVerification(record, 'IN_PROGRESS');
    expect(step1.success).toBe(true);
    expect(step1.record.status).toBe('IN_PROGRESS');
    expect(step1.record.history.length).toBe(2);

    const invalid = transitionProjectVerification(step1.record, 'VERIFIED');
    expect(invalid.success).toBe(false);
    expect(invalid.record.status).toBe('IN_PROGRESS');
  });

  it('TEST 6: SUBMITTED_FOR_VERIFICATION can move to REJECTED_NEEDS_MORE_EVIDENCE, which can restart at IN_PROGRESS', () => {
    let record = createProjectVerificationRecord('m_2', 'Retail Sales Analytics Dashboard');
    record = transitionProjectVerification(record, 'IN_PROGRESS').record;
    record = transitionProjectVerification(record, 'SUBMITTED_FOR_VERIFICATION').record;

    const rejected = transitionProjectVerification(record, 'REJECTED_NEEDS_MORE_EVIDENCE', 'Missing GitHub link');
    expect(rejected.success).toBe(true);
    expect(rejected.record.status).toBe('REJECTED_NEEDS_MORE_EVIDENCE');

    const restart = transitionProjectVerification(rejected.record, 'IN_PROGRESS');
    expect(restart.success).toBe(true);
  });

  it('TEST 7: VERIFIED is a terminal state with no outbound self-service transitions', () => {
    expect(isValidVerificationTransition('VERIFIED', 'IN_PROGRESS')).toBe(false);
    expect(isValidVerificationTransition('VERIFIED', 'NOT_STARTED')).toBe(false);
  });
});
