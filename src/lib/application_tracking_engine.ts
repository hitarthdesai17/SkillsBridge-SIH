import { 
  ApplicationStage, 
  Opportunity, 
  OpportunityTrackingItem, 
  ApplicationStatusHistoryItem, 
  ReadinessState,
  OpportunityFreshnessInfo 
} from '../types';

/**
 * Valid Stage Transitions Graph for SkillBridge Application Tracker
 * Enforces strict deterministic state progression.
 */
export const ALLOWED_STAGE_TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  SAVED: ['PREPARING', 'APPLIED', 'WITHDRAWN', 'ARCHIVED'],
  PREPARING: ['APPLIED', 'SAVED', 'WITHDRAWN', 'ARCHIVED'],
  APPLIED: ['INTERVIEWING', 'REJECTED', 'WITHDRAWN', 'ARCHIVED'],
  INTERVIEWING: ['OFFER', 'REJECTED', 'WITHDRAWN', 'ARCHIVED'],
  OFFER: ['ARCHIVED', 'WITHDRAWN'],
  REJECTED: ['ARCHIVED'],
  WITHDRAWN: ['SAVED', 'ARCHIVED'],
  ARCHIVED: ['SAVED']
};

/**
 * Validates whether a transition from one application stage to another is permissible.
 */
export function isValidStageTransition(fromStage: ApplicationStage, toStage: ApplicationStage): boolean {
  if (fromStage === toStage) return true;
  const allowed = ALLOWED_STAGE_TRANSITIONS[fromStage] || [];
  return allowed.includes(toStage);
}

/**
 * Deterministically computes the next recommended action for an application item
 * based on its lifecycle stage, candidate readiness, and opportunity freshness.
 */
export function calculateApplicationNextAction(
  stage: ApplicationStage,
  readiness?: { score: number; state: ReadinessState },
  freshness?: OpportunityFreshnessInfo
): string {
  // If opportunity is expired or archived, block application action
  if (freshness?.is_expired || freshness?.state === 'EXPIRED' || freshness?.state === 'ARCHIVED') {
    return 'Opportunity deadline has passed. Review and archive or target active alternatives.';
  }

  const score = readiness?.score ?? 0;
  const readinessState = readiness?.state ?? 'NOT_READY';

  switch (stage) {
    case 'SAVED':
      if (readinessState === 'READY' || score >= 80) {
        return 'High readiness match. Prepare application package and submit before deadline.';
      } else if (readinessState === 'ALMOST_READY' || score >= 50) {
        return 'Close key skill/evidence gaps to increase candidate readiness score before applying.';
      } else {
        return 'Review requirement gaps and complete recommended portfolio capstone project.';
      }

    case 'PREPARING':
      if (freshness?.is_expiring_soon || freshness?.state === 'EXPIRING_SOON') {
        return 'Deadline approaching soon. Finalize resume evidence and submit immediately.';
      }
      return 'Finalize customized resume evidence, verify project links, and submit application.';

    case 'APPLIED':
      return 'Application submitted. Monitor candidate portal and prepare for preliminary screening.';

    case 'INTERVIEWING':
      return 'Interview stage active. Review opportunity requirements, practice technical deep-dives, and prepare project case studies.';

    case 'OFFER':
      return 'Offer received. Review compensation package, start date, and terms.';

    case 'REJECTED':
      return 'Opportunity closed. Reassess gap blueprint to strengthen portfolio for future openings.';

    case 'WITHDRAWN':
      return 'Application withdrawn. Role saved in portfolio for future reference.';

    case 'ARCHIVED':
      return 'Archived from active tracker.';

    default:
      return 'Review opportunity details and track progress.';
  }
}

/**
 * Factory to create a new OpportunityTrackingItem with grounded deadline and initial history trail.
 */
export function createApplicationTrackingItem(params: {
  id?: string;
  user_id: string;
  opportunity: Opportunity;
  stage?: ApplicationStage;
  notes?: string;
  target_submission_date?: string;
  readiness_summary?: { score: number; state: ReadinessState };
  freshness?: OpportunityFreshnessInfo;
}): OpportunityTrackingItem {
  const initialStage: ApplicationStage = params.stage || 'SAVED';
  const now = new Date().toISOString();

  const historyItem: ApplicationStatusHistoryItem = {
    from_stage: null,
    to_stage: initialStage,
    changed_at: now,
    notes: params.notes,
    reason: 'Initial tracking creation'
  };

  const nextAction = calculateApplicationNextAction(
    initialStage,
    params.readiness_summary,
    params.freshness
  );

  return {
    id: params.id || `track_${Math.random().toString(36).substring(2, 10)}`,
    user_id: params.user_id,
    opportunity_id: params.opportunity.id,
    stage: initialStage,
    applied_at: initialStage === 'APPLIED' ? now : null,
    // NO INVENTED DEADLINE: Strictly grounded in opportunity.deadline
    deadline: params.opportunity.deadline || null,
    target_submission_date: params.target_submission_date,
    notes: params.notes || '',
    next_action: nextAction,
    status_history: [historyItem],
    opportunity: params.opportunity,
    readiness_summary: params.readiness_summary,
    created_at: now,
    updated_at: now
  };
}

/**
 * Transition an application item to a new lifecycle stage with validation and history logging.
 */
export function transitionApplicationStage(
  item: OpportunityTrackingItem,
  newStage: ApplicationStage,
  options?: {
    notes?: string;
    reason?: string;
    applied_at?: string;
    readiness_summary?: { score: number; state: ReadinessState };
    freshness?: OpportunityFreshnessInfo;
  }
): { success: boolean; item: OpportunityTrackingItem; error?: string } {
  if (!isValidStageTransition(item.stage, newStage)) {
    return {
      success: false,
      item,
      error: `Invalid stage transition from '${item.stage}' to '${newStage}'. Allowed targets are: ${(ALLOWED_STAGE_TRANSITIONS[item.stage] || []).join(', ')}`
    };
  }

  const now = new Date().toISOString();
  const currentHistory = Array.isArray(item.status_history) ? [...item.status_history] : [];

  // Record transition if stage changed
  if (item.stage !== newStage) {
    currentHistory.push({
      from_stage: item.stage,
      to_stage: newStage,
      changed_at: now,
      notes: options?.notes || item.notes,
      reason: options?.reason || `Transitioned from ${item.stage} to ${newStage}`
    });
  }

  const updatedAppliedAt = newStage === 'APPLIED' 
    ? (options?.applied_at || item.applied_at || now) 
    : item.applied_at;

  const readiness = options?.readiness_summary || item.readiness_summary;
  const nextAction = calculateApplicationNextAction(newStage, readiness, options?.freshness);

  const updatedItem: OpportunityTrackingItem = {
    ...item,
    stage: newStage,
    applied_at: updatedAppliedAt,
    notes: options?.notes !== undefined ? options.notes : item.notes,
    next_action: nextAction,
    status_history: currentHistory,
    readiness_summary: readiness,
    updated_at: now
  };

  return {
    success: true,
    item: updatedItem
  };
}

// ============================================================
// In-Memory Tracker Store for Demo & Client Sessions
// ============================================================
const trackerMemoryStore = new Map<string, OpportunityTrackingItem>();

export function getMemoryTrackedApplications(userId?: string): OpportunityTrackingItem[] {
  const targetUser = userId || '00000000-0000-0000-0000-000000000000';
  const all = Array.from(trackerMemoryStore.values());
  return all.filter(item => item.user_id === targetUser);
}

export function saveMemoryTrackedApplication(item: OpportunityTrackingItem): OpportunityTrackingItem {
  trackerMemoryStore.set(item.id, item);
  return item;
}

export function deleteMemoryTrackedApplication(id: string): boolean {
  return trackerMemoryStore.delete(id);
}

export function clearMemoryTrackerStore(): void {
  trackerMemoryStore.clear();
}
