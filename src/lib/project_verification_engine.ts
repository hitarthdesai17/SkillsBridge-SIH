import {
  ProjectVerificationStatus,
  ProjectVerificationRecord,
  ProjectVerificationHistoryItem
} from '../types';

/**
 * Deterministic Project Verification Checkpoint state machine (Phase 7.X Feature 6).
 *
 * This models the candidate-facing execution loop for a RECOMMENDED FUTURE ACTION
 * portfolio project milestone:
 *
 *   NOT STARTED -> IN PROGRESS -> SUBMITTED FOR VERIFICATION -> VERIFIED / REJECTED
 *
 * CRITICAL INVARIANT: This engine NEVER marks a project VERIFIED on its own, and
 * transitioning to VERIFIED here does NOT update the candidate profile or
 * readiness score. "Verified" evidence only ever comes from the existing evidence
 * pipeline (candidate profile projects/skills feeding readiness_engine.ts). This
 * state machine exists purely to give the candidate a clear, honest checkpoint UI
 * distinguishing "I clicked complete" from "SkillBridge has verified evidence."
 */
export const PROJECT_VERIFICATION_TRANSITIONS: Record<ProjectVerificationStatus, ProjectVerificationStatus[]> = {
  NOT_STARTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['SUBMITTED_FOR_VERIFICATION', 'NOT_STARTED'],
  SUBMITTED_FOR_VERIFICATION: ['VERIFIED', 'REJECTED_NEEDS_MORE_EVIDENCE', 'IN_PROGRESS'],
  VERIFIED: [],
  REJECTED_NEEDS_MORE_EVIDENCE: ['IN_PROGRESS']
};

export function isValidVerificationTransition(
  from: ProjectVerificationStatus,
  to: ProjectVerificationStatus
): boolean {
  if (from === to) return true;
  return (PROJECT_VERIFICATION_TRANSITIONS[from] || []).includes(to);
}

/**
 * Note: SUBMITTED_FOR_VERIFICATION -> VERIFIED is a technically "valid" graph edge
 * (a human reviewer / future verification workflow can move it), but this client-side
 * engine deliberately never performs that transition automatically. UI callers must
 * treat VERIFIED as reachable only through the real evidence-verification path
 * (candidate profile update), not through a button in this checkpoint widget.
 */
export const UI_SELF_SERVICE_TRANSITIONS: ProjectVerificationStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'SUBMITTED_FOR_VERIFICATION'
];

export function createProjectVerificationRecord(
  milestoneId: string,
  projectTitle: string
): ProjectVerificationRecord {
  const now = new Date().toISOString();
  const initial: ProjectVerificationHistoryItem = {
    from_status: null,
    to_status: 'NOT_STARTED',
    changed_at: now
  };

  return {
    milestone_id: milestoneId,
    project_title: projectTitle,
    status: 'NOT_STARTED',
    history: [initial],
    updated_at: now
  };
}

export function transitionProjectVerification(
  record: ProjectVerificationRecord,
  newStatus: ProjectVerificationStatus,
  notes?: string
): { success: boolean; record: ProjectVerificationRecord; error?: string } {
  if (!isValidVerificationTransition(record.status, newStatus)) {
    return {
      success: false,
      record,
      error: `Invalid checkpoint transition from '${record.status}' to '${newStatus}'. Allowed: ${(PROJECT_VERIFICATION_TRANSITIONS[record.status] || []).join(', ') || 'none'}`
    };
  }

  const now = new Date().toISOString();
  const history = [...record.history];
  if (record.status !== newStatus) {
    history.push({ from_status: record.status, to_status: newStatus, changed_at: now, notes });
  }

  return {
    success: true,
    record: {
      ...record,
      status: newStatus,
      history,
      updated_at: now
    }
  };
}

export const PROJECT_VERIFICATION_STATUS_LABELS: Record<ProjectVerificationStatus, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  SUBMITTED_FOR_VERIFICATION: 'Submitted for Verification',
  VERIFIED: 'Verified',
  REJECTED_NEEDS_MORE_EVIDENCE: 'Needs More Evidence'
};

// ============================================================
// Local (per-browser) persistence -- verification checkpoints are candidate
// execution state, not authoritative evidence, so they live in localStorage
// alongside the existing candidate_profile_data client cache. Never sent to the
// readiness engine as evidence.
// ============================================================
const STORAGE_KEY = 'skillbridge_project_verification_v1';

export function loadProjectVerificationStore(): Record<string, ProjectVerificationRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveProjectVerificationRecord(record: ProjectVerificationRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const store = loadProjectVerificationStore();
    store[record.milestone_id] = record;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    // Best-effort only; verification checkpoint state is non-authoritative.
  }
}
