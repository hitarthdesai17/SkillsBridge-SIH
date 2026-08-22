import { LearningPlanStage, ProjectVerificationRecord } from '../types';

/**
 * Tracks the pre-project portion (NOT_STARTED / LEARNING / PRACTICING) of a
 * candidate's progress through a GapActionPlan.
 *
 * CRITICAL: This deliberately does NOT duplicate or re-implement project
 * verification. Once a candidate starts the project milestone, the
 * authoritative state comes from the existing project_verification_engine
 * (ProjectVerificationRecord), looked up by the plan's associated milestone
 * id. This module only derives the combined, candidate-facing
 * LearningPlanStage by reading that record -- it never writes to it and
 * never marks anything VERIFIED itself.
 */

export type LocalLearningStage = 'NOT_STARTED' | 'LEARNING' | 'PRACTICING';

const LEARNING_STAGE_STORAGE_KEY = 'skillbridge_gap_learning_stage_v1';
const REASSESSED_STORAGE_KEY = 'skillbridge_gap_reassessed_v1';

export const LOCAL_LEARNING_STAGE_TRANSITIONS: Record<LocalLearningStage, LocalLearningStage[]> = {
  NOT_STARTED: ['LEARNING'],
  LEARNING: ['PRACTICING', 'NOT_STARTED'],
  PRACTICING: ['LEARNING']
};

export function loadLocalLearningStageStore(): Record<string, LocalLearningStage> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LEARNING_STAGE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function setLocalLearningStage(planId: string, stage: LocalLearningStage): void {
  if (typeof window === 'undefined') return;
  try {
    const store = loadLocalLearningStageStore();
    store[planId] = stage;
    window.localStorage.setItem(LEARNING_STAGE_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    // Best-effort only; this is non-authoritative UI progress state.
  }
}

export function getLocalLearningStage(planId: string): LocalLearningStage {
  return loadLocalLearningStageStore()[planId] || 'NOT_STARTED';
}

export function loadReassessedSet(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(REASSESSED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function markReassessed(planId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const store = loadReassessedSet();
    store[planId] = true;
    window.localStorage.setItem(REASSESSED_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    // Best-effort only.
  }
}

/**
 * Derives the composite, candidate-facing LearningPlanStage:
 *   NOT_STARTED -> LEARNING -> PRACTICING -> PROJECT_IN_PROGRESS ->
 *   PROJECT_SUBMITTED -> VERIFICATION -> VERIFIED -> READINESS_REASSESSMENT
 *
 * Project-related stages (PROJECT_IN_PROGRESS / PROJECT_SUBMITTED / VERIFIED)
 * are entirely driven by the real ProjectVerificationRecord -- never
 * self-declared -- so this function can never advance a candidate to VERIFIED
 * on its own.
 */
export function deriveLearningPlanStage(
  planId: string,
  projectVerification: ProjectVerificationRecord | undefined,
  hasReassessed: boolean
): LearningPlanStage {
  if (projectVerification) {
    switch (projectVerification.status) {
      case 'VERIFIED':
        return hasReassessed ? 'READINESS_REASSESSMENT' : 'VERIFIED';
      case 'SUBMITTED_FOR_VERIFICATION':
        return 'PROJECT_SUBMITTED';
      case 'REJECTED_NEEDS_MORE_EVIDENCE':
        return 'PROJECT_IN_PROGRESS';
      case 'IN_PROGRESS':
        return 'PROJECT_IN_PROGRESS';
      case 'NOT_STARTED':
      default:
        break;
    }
  }

  const localStage = getLocalLearningStage(planId);
  return localStage; // 'NOT_STARTED' | 'LEARNING' | 'PRACTICING'
}

export const LEARNING_PLAN_STAGE_LABELS: Record<LearningPlanStage, string> = {
  NOT_STARTED: 'Not Started',
  LEARNING: 'Learning',
  PRACTICING: 'Practicing',
  PROJECT_IN_PROGRESS: 'Building Project',
  PROJECT_SUBMITTED: 'Submitted for Verification',
  VERIFICATION: 'Verification Pending',
  VERIFIED: 'Verified',
  READINESS_REASSESSMENT: 'Readiness Reassessed'
};

export const LEARNING_PLAN_STAGE_ORDER: LearningPlanStage[] = [
  'NOT_STARTED',
  'LEARNING',
  'PRACTICING',
  'PROJECT_IN_PROGRESS',
  'PROJECT_SUBMITTED',
  'VERIFICATION',
  'VERIFIED',
  'READINESS_REASSESSMENT'
];
