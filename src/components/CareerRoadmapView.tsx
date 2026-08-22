'use client';

import React, { useState, useEffect } from 'react';
import {
  LearningRoadmap,
  LearningMilestone,
  CandidateProfile,
  PrioritizedSkillGap,
  RoadmapTargetOpportunitySummary,
  ApplicationStage,
  ProjectVerificationStatus,
  ProjectVerificationRecord,
  GapActionPlanResult,
  GapActionPlan,
  LearningPlanStage
} from '@/types';
import { ReadinessBadge } from './ui/Badges';
import {
  createProjectVerificationRecord,
  transitionProjectVerification,
  loadProjectVerificationStore,
  saveProjectVerificationRecord,
  PROJECT_VERIFICATION_STATUS_LABELS
} from '@/lib/project_verification_engine';
import { CAREER_FAMILY_REGISTRY } from '@/lib/roadmap_engine';
import {
  deriveLearningPlanStage,
  getLocalLearningStage,
  setLocalLearningStage,
  loadReassessedSet,
  markReassessed,
  LEARNING_PLAN_STAGE_LABELS
} from '@/lib/gap_learning_progress';
import {
  Compass,
  Target,
  Sparkles,
  Clock,
  AlertTriangle,
  ArrowRight,
  Send,
  RefreshCw,
  HelpCircle,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  BookmarkPlus,
  CheckCircle2,
  ListOrdered,
  Filter,
  ThumbsUp,
  Building2,
  MapPin,
  Rocket,
  Zap,
  Loader2,
  XCircle,
  GraduationCap,
  Layers,
  ClipboardCheck
} from 'lucide-react';
import Link from 'next/link';

interface CareerRoadmapViewProps {
  initialTargetCareer?: string;
  candidateProfile?: CandidateProfile | null;
}

// Derived from the engine registry rather than hand-copied, so a career family
// added to roadmap_engine automatically becomes selectable here instead of
// silently existing in the engine while the UI keeps offering a stale list.
const COMMON_CAREER_TARGETS = Object.values(CAREER_FAMILY_REGISTRY).map(f => f.canonicalTitle);

const ROADMAP_CATEGORY_LABELS: Record<string, string> = {
  BEST_MATCH: 'Best Match',
  ALMOST_READY: 'Almost Ready',
  GAP_TO_BRIDGE: 'Gap to Bridge',
  NOT_ELIGIBLE: 'Not Eligible'
};

export default function CareerRoadmapView({
  initialTargetCareer = 'Data Analyst',
  candidateProfile
}: CareerRoadmapViewProps) {
  const [targetCareer, setTargetCareer] = useState<string>(initialTargetCareer);
  const [customCareerInput, setCustomCareerInput] = useState<string>('');
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive Modal & Drawer States
  const [showCalculationModal, setShowCalculationModal] = useState<boolean>(false);
  const [showWhyDifferentModal, setShowWhyDifferentModal] = useState<boolean>(false);
  const [showChangeCareerModal, setShowChangeCareerModal] = useState<boolean>(false);
  const [selectedGapWhy, setSelectedGapWhy] = useState<PrioritizedSkillGap | null>(null);
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);

  // Application tracker action states
  const [trackedMap, setTrackedMap] = useState<Record<string, { stage: ApplicationStage; loading: boolean; message?: string }>>({});
  const [lastRecalculatedTime, setLastRecalculatedTime] = useState<string>('Today, 11:43 AM');

  // Phase 7.X: Project Verification Checkpoint state (local/UI-only, never mutates readiness)
  const [verificationStore, setVerificationStore] = useState<Record<string, ProjectVerificationRecord>>({});

  // Phase 7.X: Inline Reassessment Simulation state for Milestone 3 (PROJECTED / SIMULATION ONLY)
  const [simulation, setSimulation] = useState<{
    loading: boolean;
    error: string | null;
    before: { score: number; state: string } | null;
    after: { score: number; state: string } | null;
    delta: number | null;
  }>({ loading: false, error: null, before: null, after: null, delta: null });

  // Phase 7.X+: Gap -> Action Plan -> Learning -> Practice -> Project -> Evidence
  // -> Verification -> Reassessment. Generated on-demand via /api/roadmap/action-plan,
  // which reuses roadmap_engine + project_recommendation_engine -- never duplicated here.
  const [gapActionPlanResult, setGapActionPlanResult] = useState<GapActionPlanResult | null>(null);
  const [gapActionPlanLoading, setGapActionPlanLoading] = useState<boolean>(false);
  const [gapActionPlanErrorMsg, setGapActionPlanErrorMsg] = useState<string | null>(null);
  const [showGapActionPlan, setShowGapActionPlan] = useState<boolean>(false);
  const [progressTick, setProgressTick] = useState<number>(0); // forces re-render after localStorage progress writes
  const [gapPlanSimulation, setGapPlanSimulation] = useState<{
    loading: boolean;
    error: string | null;
    before: { score: number; state: string } | null;
    after: { score: number; state: string } | null;
    delta: number | null;
  }>({ loading: false, error: null, before: null, after: null, delta: null });

  const fetchRoadmap = async (careerTitle: string) => {
    setLoading(true);
    setError(null);
    try {
      let profilePayload = candidateProfile;
      if (!profilePayload && typeof window !== 'undefined') {
        const stored = localStorage.getItem('candidate_profile_data');
        if (stored) {
          try {
            profilePayload = JSON.parse(stored);
          } catch (e) {}
        }
      }

      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_career: careerTitle,
          candidate_profile: profilePayload
        })
      });

      const data = await res.json();
      if (data.success && data.roadmap) {
        setRoadmap(data.roadmap);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastRecalculatedTime(`Today, ${timeStr}`);
      } else {
        setError(data.error || 'Failed to generate roadmap');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with roadmap service');
    } finally {
      setLoading(false);
    }
  };

  const loadTrackedApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      if (data.success && Array.isArray(data.applications)) {
        const map: Record<string, { stage: ApplicationStage; loading: boolean }> = {};
        for (const app of data.applications) {
          map[app.opportunity_id] = { stage: app.stage, loading: false };
        }
        setTrackedMap(map);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchRoadmap(targetCareer);
    loadTrackedApplications();
    setVerificationStore(loadProjectVerificationStore());
  }, [targetCareer]);

  // Phase 7.X: Project Verification Checkpoint handlers (local-only; never touches
  // the candidate profile or readiness score -- see project_verification_engine.ts)
  const getVerificationRecord = (milestoneId: string, projectTitle: string): ProjectVerificationRecord => {
    return verificationStore[milestoneId] || createProjectVerificationRecord(milestoneId, projectTitle);
  };

  const handleVerificationTransition = (milestoneId: string, projectTitle: string, newStatus: ProjectVerificationStatus) => {
    const current = getVerificationRecord(milestoneId, projectTitle);
    const result = transitionProjectVerification(current, newStatus);
    if (result.success) {
      saveProjectVerificationRecord(result.record);
      setVerificationStore(prev => ({ ...prev, [milestoneId]: result.record }));
    }
  };

  // Phase 7.X: Inline Reassessment Simulation (PROJECTED / SIMULATION ONLY, uses the
  // real /api/readiness/simulate endpoint backed by the authoritative readiness engine)
  const handleRunInlineSimulation = async () => {
    const topOpp = roadmap?.target_opportunities_summary?.[0];
    const topGap = learnableCriticalGaps[0];
    if (!topOpp) return;

    setSimulation(prev => ({ ...prev, loading: true, error: null }));
    try {
      let profilePayload = candidateProfile;
      if (!profilePayload && typeof window !== 'undefined') {
        const stored = localStorage.getItem('candidate_profile_data');
        if (stored) {
          try { profilePayload = JSON.parse(stored); } catch (e) {}
        }
      }

      const gapSkillName = topGap ? topGap.skill_gap.missing_capability.replace(/^Missing\s+/i, '') : undefined;
      const projectTitle = projectMilestone?.project_recommendation?.title || projectMilestone?.title;

      const res = await fetch('/api/readiness/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: topOpp.id,
          completed_skills: gapSkillName ? [gapSkillName] : [],
          completed_project_title: projectTitle,
          candidate_profile: profilePayload
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Simulation failed');

      setSimulation({
        loading: false,
        error: null,
        before: { score: data.before.score, state: data.before.state },
        after: { score: data.after.score, state: data.after.state },
        delta: data.delta
      });
    } catch (err: any) {
      setSimulation(prev => ({ ...prev, loading: false, error: err.message || 'Simulation failed' }));
    }
  };

  // Phase 7.X+: Opens the personalized Gap Action Plan drawer for one gap.
  // Works identically whether the gap is learnable or an eligibility blocker --
  // the backend (gap_action_plan_engine.generateGapActionPlan) is the single
  // source of truth for that classification; the UI never decides it locally.
  const handleOpenGapActionPlan = async (gap: PrioritizedSkillGap) => {
    setShowGapActionPlan(true);
    setGapActionPlanLoading(true);
    setGapActionPlanErrorMsg(null);
    setGapActionPlanResult(null);
    setGapPlanSimulation({ loading: false, error: null, before: null, after: null, delta: null });
    try {
      let profilePayload = candidateProfile;
      if (!profilePayload && typeof window !== 'undefined') {
        const stored = localStorage.getItem('candidate_profile_data');
        if (stored) {
          try { profilePayload = JSON.parse(stored); } catch (e) {}
        }
      }

      const res = await fetch('/api/roadmap/action-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_career: targetCareer,
          gap_capability: gap.skill_gap.missing_capability.replace(/^Missing\s+/i, ''),
          candidate_profile: profilePayload
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate gap action plan');
      setGapActionPlanResult(data.result);
    } catch (err: any) {
      setGapActionPlanErrorMsg(err.message || 'Failed to generate gap action plan');
    } finally {
      setGapActionPlanLoading(false);
    }
  };

  // Local, non-authoritative learning-stage progress (NOT_STARTED/LEARNING/PRACTICING).
  // Once the candidate reaches the project stage, progress is driven entirely by the
  // real ProjectVerificationRecord (see gap_learning_progress.deriveLearningPlanStage) --
  // this never self-declares VERIFIED.
  const handleAdvanceLocalLearningStage = (planId: string, stage: 'NOT_STARTED' | 'LEARNING' | 'PRACTICING') => {
    setLocalLearningStage(planId, stage);
    setProgressTick(t => t + 1);
  };

  const handleAcknowledgeReassessment = (planId: string) => {
    markReassessed(planId);
    setProgressTick(t => t + 1);
  };

  // Phase 7.X+ Step 9/10: Reassessment simulation scoped to one Gap Action Plan,
  // reusing the same real /api/readiness/simulate endpoint as the milestone-level
  // simulator (Phase 7.X Feature 7) -- never a second scoring implementation.
  const handleRunGapPlanSimulation = async (plan: GapActionPlan) => {
    const topOppId = plan.market_evidence.related_opportunity_details[0]?.id;
    if (!topOppId) return;

    setGapPlanSimulation(prev => ({ ...prev, loading: true, error: null }));
    try {
      let profilePayload = candidateProfile;
      if (!profilePayload && typeof window !== 'undefined') {
        const stored = localStorage.getItem('candidate_profile_data');
        if (stored) { try { profilePayload = JSON.parse(stored); } catch (e) {} }
      }

      const res = await fetch('/api/readiness/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: topOppId,
          completed_skills: [plan.gap_capability_name],
          completed_project_title: plan.project_blueprint?.recommendation.title,
          candidate_profile: profilePayload
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Simulation failed');

      setGapPlanSimulation({
        loading: false,
        error: null,
        before: { score: data.before.score, state: data.before.state },
        after: { score: data.after.score, state: data.after.state },
        delta: data.delta
      });
      markReassessed(plan.id);
      setProgressTick(t => t + 1);
    } catch (err: any) {
      setGapPlanSimulation(prev => ({ ...prev, loading: false, error: err.message || 'Simulation failed' }));
    }
  };

  const handleCustomCareerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCareerInput.trim()) {
      setTargetCareer(customCareerInput.trim());
      setCustomCareerInput('');
      setShowChangeCareerModal(false);
    }
  };

  const handleSelectPredefinedCareer = (career: string) => {
    setTargetCareer(career);
    setShowChangeCareerModal(false);
  };

  // Application Tracker API integration
  const handleTrackOpportunity = async (oppId: string, action: 'CREATE' | 'TRANSITION', targetStage?: ApplicationStage) => {
    setTrackedMap(prev => ({
      ...prev,
      [oppId]: { stage: prev[oppId]?.stage || 'SAVED', loading: true }
    }));

    try {
      let profilePayload = candidateProfile;
      if (!profilePayload && typeof window !== 'undefined') {
        const stored = localStorage.getItem('candidate_profile_data');
        if (stored) {
          try {
            profilePayload = JSON.parse(stored);
          } catch (e) {}
        }
      }

      let res;
      if (action === 'CREATE') {
        res = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CREATE',
            opportunity_id: oppId,
            stage: 'SAVED',
            candidate_profile: profilePayload
          })
        });
      } else {
        const resList = await fetch('/api/applications');
        const listData = await resList.json();
        const found = (listData.applications || []).find((a: any) => a.opportunity_id === oppId);
        
        if (found) {
          res = await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'TRANSITION',
              tracking_id: found.id,
              stage: targetStage || 'PREPARING',
              candidate_profile: profilePayload
            })
          });
        }
      }

      if (res) {
        const data = await res.json();
        if (data.success && data.item) {
          setTrackedMap(prev => ({
            ...prev,
            [oppId]: { stage: data.item.stage, loading: false, message: data.message }
          }));
        } else {
          setTrackedMap(prev => ({
            ...prev,
            [oppId]: { stage: prev[oppId]?.stage || 'SAVED', loading: false, message: data.error }
          }));
        }
      }
    } catch (e: any) {
      setTrackedMap(prev => ({
        ...prev,
        [oppId]: { stage: prev[oppId]?.stage || 'SAVED', loading: false, message: e.message }
      }));
    }
  };

  const priorityGaps = (roadmap?.critical_gaps_summary || []).filter(g => g.priority_tier === 'P0_CRITICAL' || g.priority_tier === 'P1_HIGH');
  const learnableCriticalGaps = priorityGaps.filter(g => !g.is_eligibility_blocker);
  const targetOppsCount = roadmap?.active_opportunities_count || 0;
  const currentReadiness = roadmap?.current_readiness_score || 0;
  const targetReadiness = roadmap?.target_readiness_score || 80;
  const pointsAway = Math.max(0, Number((targetReadiness - currentReadiness).toFixed(1)));
  const isHardPassed = roadmap?.readiness_breakdown?.hard_eligibility_passed ?? true;
  const milestoneCount = roadmap ? roadmap.milestones.length : 0;
  const totalWeeksDisplay = roadmap ? roadmap.total_estimated_weeks : 0;
  const projectMilestone = roadmap?.milestones.find(m => m.project_recommendation !== undefined);

  // Phase 7.X Feature 12: explicit empty / low-data states -- never fall through to a
  // dashboard full of misleading zeros when there is genuinely no roadmap to show.
  if (!loading && roadmap?.is_empty_selection) {
    return (
      <div className="roadmap-root">
        <style jsx>{`
          .empty-state-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 1rem;
            padding: 3rem 2rem;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 18px;
          }
          .empty-state-title { font-size: 1.25rem; font-weight: 800; color: var(--foreground); margin: 0; }
          .empty-state-desc { color: var(--muted-foreground); font-size: 0.9rem; max-width: 420px; margin: 0; }
        `}</style>
        <div className="empty-state-card">
          <Compass style={{ width: '32px', height: '32px', color: 'var(--primary)' }} />
          <h2 className="empty-state-title">Select Your Target Career</h2>
          <p className="empty-state-desc">
            {roadmap.selection_prompt_message || 'SkillBridge cannot generate a personalized roadmap until a target pathway is selected.'}
          </p>
          <button type="button" className="btn-primary" onClick={() => setShowChangeCareerModal(true)}>
            Choose a Target Career
          </button>
        </div>
        {showChangeCareerModal && (
          <div className="modal-overlay" onClick={() => setShowChangeCareerModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <h3 className="modal-title">Select Target Career Pathway</h3>
                <button type="button" onClick={() => setShowChangeCareerModal(false)} className="close-btn"><X style={{ width: '18px', height: '18px' }} /></button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {COMMON_CAREER_TARGETS.map((career) => (
                    <button type="button" key={career} onClick={() => handleSelectPredefinedCareer(career)} className="modal-close-btn" style={{ textAlign: 'left' }}>
                      {career}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleCustomCareerSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" placeholder="e.g. Teacher, DevOps Engineer..." value={customCareerInput} onChange={(e) => setCustomCareerInput(e.target.value)} style={{ flex: 1 }} />
                  <button type="submit" className="modal-close-btn">Apply</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!loading && roadmap && !roadmap.is_empty_selection && (roadmap.active_opportunities_count || 0) === 0) {
    return (
      <div className="roadmap-root">
        <style jsx>{`
          .empty-state-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 1rem;
            padding: 3rem 2rem;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 18px;
          }
          .empty-state-title { font-size: 1.25rem; font-weight: 800; color: var(--foreground); margin: 0; }
          .empty-state-desc { color: var(--muted-foreground); font-size: 0.9rem; max-width: 460px; margin: 0; }
        `}</style>
        <div className="empty-state-card">
          <AlertTriangle style={{ width: '32px', height: '32px', color: 'var(--warning)' }} />
          <h2 className="empty-state-title">Insufficient Market Data</h2>
          <p className="empty-state-desc">
            {roadmap.selection_prompt_message || `No verified active opportunities currently match "${targetCareer}". SkillBridge does not invent opportunities or requirements -- try a different target career or check back as new listings are added.`}
          </p>
          <button type="button" className="btn-primary" onClick={() => setShowChangeCareerModal(true)}>
            Try a Different Career
          </button>
        </div>
        {showChangeCareerModal && (
          <div className="modal-overlay" onClick={() => setShowChangeCareerModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <h3 className="modal-title">Select Target Career Pathway</h3>
                <button type="button" onClick={() => setShowChangeCareerModal(false)} className="close-btn"><X style={{ width: '18px', height: '18px' }} /></button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {COMMON_CAREER_TARGETS.map((career) => (
                    <button type="button" key={career} onClick={() => handleSelectPredefinedCareer(career)} className="modal-close-btn" style={{ textAlign: 'left' }}>
                      {career}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleCustomCareerSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" placeholder="e.g. Teacher, DevOps Engineer..." value={customCareerInput} onChange={(e) => setCustomCareerInput(e.target.value)} style={{ flex: 1 }} />
                  <button type="submit" className="modal-close-btn">Apply</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading && !roadmap) {
    return (
      <div className="roadmap-root">
        <style jsx>{`
          .loading-card {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.6rem;
            padding: 4rem 2rem;
            color: var(--muted-foreground);
            font-size: 0.9rem;
          }
        `}</style>
        <div className="loading-card">
          <Loader2 style={{ width: '18px', height: '18px' }} className="animate-spin" />
          <span>Generating your personalized roadmap...</span>
        </div>
      </div>
    );
  }

  if (error && !roadmap) {
    return (
      <div className="roadmap-root">
        <style jsx>{`
          .error-card {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            align-items: center;
            text-align: center;
            padding: 2.5rem 2rem;
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.25);
            border-radius: 16px;
            color: var(--foreground);
          }
        `}</style>
        <div className="error-card">
          <AlertTriangle style={{ width: '28px', height: '28px', color: 'var(--destructive)' }} />
          <p style={{ margin: 0 }}>{error}</p>
          <button type="button" className="btn-primary" onClick={() => fetchRoadmap(targetCareer)}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="roadmap-root">
      <style jsx>{`
        .roadmap-root {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          color: var(--foreground);
          font-family: 'Manrope', system-ui, sans-serif;
          padding-bottom: 2.5rem;
        }

        /* Top Meta Row */
        .top-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-size: 0.8rem;
        }

        .meta-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.85rem;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.35);
          color: #a5b4fc;
          border-radius: 9999px;
          font-weight: 700;
        }

        .meta-timestamp {
          color: var(--muted-foreground);
        }
        .meta-timestamp strong {
          color: var(--text-secondary);
        }

        .recalculate-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.95rem;
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--foreground);
          border-radius: 8px;
          font-size: 0.775rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .recalculate-btn:hover {
          border-color: var(--primary);
          background: var(--surface);
        }

        /* Hero Header Card */
        .hero-card {
          background: var(--card);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem 1.75rem;
          box-shadow: var(--shadow-soft);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        @media (min-width: 1024px) {
          .hero-card {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .hero-left {
          max-width: 580px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .hero-title-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .hero-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #818cf8;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hero-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.45rem;
          font-weight: 800;
          color: var(--foreground);
          margin: 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .hero-desc {
          font-size: 0.825rem;
          color: var(--muted-foreground);
          margin: 0;
          line-height: 1.5;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
          padding-top: 0.25rem;
        }

        .hero-outline-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.85rem;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #a5b4fc;
          border-radius: 8px;
          font-size: 0.775rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .hero-outline-btn:hover {
          background: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.5);
        }

        .hero-subtle-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.85rem;
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: 8px;
          font-size: 0.775rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .hero-subtle-btn:hover {
          color: var(--foreground);
          background: var(--surface);
        }

        /* Hero Pipeline */
        .pipeline-chain {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.5rem 0;
          flex-shrink: 0;
        }

        .pipeline-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          flex-shrink: 0;
        }

        .pipeline-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
        }

        .pipeline-node.green .pipeline-icon-circle {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: var(--success);
        }
        .pipeline-node.amber .pipeline-icon-circle {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: var(--warning);
        }
        .pipeline-node.purple .pipeline-icon-circle {
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.45);
          color: #c4b5fd;
        }
        .pipeline-node.indigo .pipeline-icon-circle {
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.35);
          color: #818cf8;
        }
        .pipeline-node.teal .pipeline-icon-circle {
          background: rgba(20, 184, 166, 0.15);
          border: 1px solid rgba(20, 184, 166, 0.35);
          color: #2dd4bf;
        }

        .pipeline-label {
          font-size: 0.675rem;
          font-weight: 700;
          text-align: center;
          line-height: 1.2;
          color: var(--text-secondary);
        }

        /* 5-Card KPI Row */
        .kpi-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.85rem;
          width: 100%;
        }
        @media (min-width: 640px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .kpi-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }

        .kpi-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.15rem 1.25rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 0.5rem;
          box-shadow: var(--shadow-soft);
          transition: border-color 0.2s ease;
        }
        .kpi-card:hover {
          border-color: rgba(99, 102, 241, 0.4);
        }

        .kpi-top-label {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted-foreground);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .kpi-value-row {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin: 0.25rem 0;
        }

        .kpi-num {
          font-family: 'Sora', sans-serif;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--foreground);
          line-height: 1.1;
        }

        .kpi-badge {
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .kpi-badge.ready {
          background: rgba(16, 185, 129, 0.2);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.4);
        }
        .kpi-badge.almost {
          background: rgba(245, 158, 11, 0.2);
          color: var(--warning);
          border: 1px solid rgba(245, 158, 11, 0.4);
        }
        .kpi-badge.not-ready {
          background: rgba(239, 68, 68, 0.2);
          color: var(--destructive);
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .kpi-subtext {
          font-size: 0.725rem;
          color: var(--muted-foreground);
          line-height: 1.35;
          margin: 0;
        }

        /* Career Context Bar */
        .career-context-bar {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0.85rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .career-context-bar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .career-context-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .career-focus-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.35);
          color: #818cf8;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .career-focus-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--foreground);
        }
        .career-focus-desc {
          font-size: 0.75rem;
          color: var(--muted-foreground);
          margin: 0;
        }

        .career-context-right {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-shrink: 0;
        }

        .filter-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.65rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 0.725rem;
          color: var(--muted-foreground);
        }

        .active-tag {
          padding: 0.1rem 0.45rem;
          border-radius: 4px;
          background: rgba(16, 185, 129, 0.2);
          color: var(--success);
          font-weight: 700;
          font-size: 0.675rem;
        }

        .change-career-btn {
          padding: 0.35rem 0.85rem;
          border-radius: 8px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--foreground);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .change-career-btn:hover {
          border-color: var(--primary);
          background: var(--surface);
        }

        /* 2-Column Middle Grid */
        .middle-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          width: 100%;
        }
        @media (min-width: 1024px) {
          .middle-grid {
            grid-template-columns: 1.45fr 1fr;
          }
        }

        .panel-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.35rem 1.5rem;
          box-shadow: var(--shadow-soft);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1.25rem;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid var(--border-subtle);
        }

        .panel-title {
          font-family: 'Sora', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--foreground);
          margin: 0 0 0.2rem 0;
        }

        .panel-subtitle {
          font-size: 0.75rem;
          color: var(--muted-foreground);
          margin: 0;
        }

        /* Market Table */
        .matrix-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
          text-align: left;
        }

        .matrix-table th {
          padding: 0.6rem 0.5rem;
          font-size: 0.675rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted-foreground);
          border-bottom: 1px solid var(--border-subtle);
        }

        .matrix-table td {
          padding: 0.65rem 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
        }
        .matrix-table tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }

        .demand-bar-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 120px;
        }

        .demand-progress-track {
          flex: 1;
          height: 6px;
          border-radius: 9999px;
          background: var(--surface-2);
          overflow: hidden;
        }

        .demand-progress-fill {
          height: 100%;
          border-radius: 9999px;
        }

        .evidence-pill {
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .evidence-pill.strong {
          background: rgba(16, 185, 129, 0.2);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.4);
        }
        .evidence-pill.partial {
          background: rgba(245, 158, 11, 0.2);
          color: var(--warning);
          border: 1px solid rgba(245, 158, 11, 0.4);
        }
        .evidence-pill.none {
          background: rgba(239, 68, 68, 0.2);
          color: var(--destructive);
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .action-table-btn {
          padding: 0.25rem 0.65rem;
          border-radius: 6px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--foreground);
          font-size: 0.725rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-table-btn:hover {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }

        /* Eligibility Gate Panel */
        .eligibility-check-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0.85rem;
          background: var(--surface-2);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          margin-bottom: 0.5rem;
        }

        .check-item-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .check-item-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--foreground);
        }
        .check-item-desc {
          font-size: 0.725rem;
          color: var(--muted-foreground);
        }

        .pass-tag {
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: var(--success);
          font-size: 0.65rem;
          font-weight: 800;
        }

        .eligibility-bottom-callout {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.85rem 1rem;
          border-radius: 12px;
          font-size: 0.775rem;
        }
        .eligibility-bottom-callout.passed {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #a7f3d0;
        }
        .eligibility-bottom-callout.blocked {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        /* 4-Step Milestone Sequence */
        .milestones-section {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .milestones-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .milestones-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          width: 100%;
        }
        @media (min-width: 640px) {
          .milestones-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1100px) {
          .milestones-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .milestone-card-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .milestone-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: var(--shadow-soft);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 0.85rem;
          flex: 1;
          transition: all 0.2s ease;
        }
        .milestone-card:hover {
          border-color: rgba(99, 102, 241, 0.45);
          transform: translateY(-2px);
        }

        .milestone-tag-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .step-tag {
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #a5b4fc;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .priority-tag {
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .priority-tag.p0 {
          background: rgba(239, 68, 68, 0.2);
          color: var(--destructive);
          border: 1px solid rgba(239, 68, 68, 0.4);
        }
        .priority-tag.p1 {
          background: rgba(245, 158, 11, 0.2);
          color: var(--warning);
          border: 1px solid rgba(245, 158, 11, 0.4);
        }
        .priority-tag.p2 {
          background: var(--surface-2);
          color: var(--muted-foreground);
          border: 1px solid var(--border);
        }

        .milestone-title {
          font-family: 'Sora', sans-serif;
          font-size: 0.925rem;
          font-weight: 700;
          color: var(--foreground);
          margin: 0.2rem 0;
          line-height: 1.25;
        }

        .milestone-why {
          font-size: 0.725rem;
          color: var(--muted-foreground);
          margin: 0;
          line-height: 1.4;
        }

        .milestone-steps-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding-top: 0.35rem;
        }

        .milestone-step-item {
          display: flex;
          align-items: flex-start;
          gap: 0.4rem;
          font-size: 0.725rem;
          color: var(--text-secondary);
          line-height: 1.35;
        }
        .step-arrow {
          color: var(--primary);
          font-weight: 800;
        }

        .milestone-outcome-box {
          padding: 0.55rem 0.75rem;
          border-radius: 10px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          text-align: center;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .details-toggle-btn {
          width: 100%;
          background: none;
          border: none;
          color: #a5b4fc;
          font-size: 0.725rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0.35rem 0;
          transition: color 0.2s ease;
        }
        .details-toggle-btn:hover {
          color: #ffffff;
        }

        /* Milestone Connector Arrow (Desktop) */
        .milestone-desktop-connector {
          display: none;
        }
        @media (min-width: 1100px) {
          .milestone-desktop-connector {
            display: flex;
            position: absolute;
            right: -14px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
            width: 26px;
            height: 26px;
            border-radius: 9999px;
            background: var(--surface);
            border: 1px solid var(--border);
            align-items: center;
            justify-content: center;
            color: var(--primary);
            font-size: 0.75rem;
            box-shadow: var(--shadow-soft);
          }
        }

        /* Opportunities Grid */
        .opps-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          width: 100%;
        }
        @media (min-width: 640px) {
          .opps-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .opps-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .opp-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.15rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 0.85rem;
          box-shadow: var(--shadow-soft);
        }

        .opp-track-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.45rem 0.85rem;
          border-radius: 8px;
          background: var(--primary);
          color: #ffffff;
          border: none;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .opp-track-btn:hover {
          opacity: 0.9;
        }

        /* Modals */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
        }

        .modal-content {
          width: 100%;
          max-width: 620px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 1.75rem;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .modal-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid var(--border-subtle);
        }

        .modal-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--foreground);
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--muted-foreground);
          cursor: pointer;
          padding: 0.25rem;
        }
        .close-btn:hover {
          color: var(--foreground);
        }

        .modal-body {
          font-size: 0.825rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .modal-close-btn {
          align-self: flex-end;
          padding: 0.5rem 1.25rem;
          border-radius: 8px;
          background: var(--primary);
          color: #ffffff;
          border: none;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
        }

        /* Phase 7.X+: "Your Action Plan" teaser card */
        .action-plan-teaser {
          border: 1px solid rgba(99, 102, 241, 0.35);
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), var(--card));
        }
        .action-plan-teaser-body {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .action-plan-teaser-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--foreground);
        }
        .action-plan-teaser-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.8rem;
          color: var(--muted-foreground);
        }
        .action-plan-teaser-btn {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .priority-pill {
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .priority-pill.critical {
          background: rgba(239, 68, 68, 0.18);
          color: var(--destructive);
          border: 1px solid rgba(239, 68, 68, 0.4);
        }
        .priority-pill.high {
          background: rgba(99, 102, 241, 0.18);
          color: #a5b4fc;
          border: 1px solid rgba(99, 102, 241, 0.4);
        }

        /* Phase 7.X+: Gap Action Plan drawer */
        .gap-plan-modal-content {
          width: 100%;
          max-width: 880px;
          max-height: 88vh;
          overflow-y: auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 1.75rem;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .gap-plan-section {
          padding: 0.9rem 1.1rem;
          border-radius: 12px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .gap-plan-section-label {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--muted-foreground);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .gap-plan-stat-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
          font-size: 0.8rem;
          color: var(--foreground);
        }
        .gap-plan-evidence-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .gap-plan-evidence-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.6rem;
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 700;
          border: 1px solid var(--border);
        }
        .gap-plan-evidence-chip.verified {
          background: rgba(16, 185, 129, 0.15);
          color: var(--success);
          border-color: rgba(16, 185, 129, 0.4);
        }
        .gap-plan-evidence-chip.not-verified {
          background: rgba(239, 68, 68, 0.12);
          color: var(--destructive);
          border-color: rgba(239, 68, 68, 0.35);
        }
        .prereq-chain {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
        }
        .prereq-chain-step {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.6rem;
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 700;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--muted-foreground);
        }
        .prereq-chain-step.satisfied {
          color: var(--success);
          border-color: rgba(16, 185, 129, 0.4);
        }
        .prereq-chain-step.starting-point {
          color: #ffffff;
          background: var(--primary);
          border-color: var(--primary);
        }
        .prereq-chain-arrow {
          color: var(--muted-foreground);
          font-size: 0.75rem;
        }
        .gap-plan-phase-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0.85rem 1rem;
          background: var(--surface);
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .gap-plan-phase-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .gap-plan-phase-title {
          font-weight: 800;
          color: var(--foreground);
          font-size: 0.9rem;
        }
        .gap-plan-phase-days {
          font-size: 0.7rem;
          color: var(--muted-foreground);
          font-weight: 700;
        }
        .gap-plan-topics {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .gap-plan-topic-chip {
          font-size: 0.68rem;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          background: var(--surface-2);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
        }
        .gap-plan-task {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.5rem;
          font-size: 0.75rem;
        }
        .gap-plan-task-block {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .gap-plan-task-label {
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--primary);
        }
        .gap-plan-effort-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 0.5rem;
        }
        .gap-plan-effort-item {
          text-align: center;
          padding: 0.5rem;
          border-radius: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
        }
        .gap-plan-effort-value {
          font-size: 1rem;
          font-weight: 800;
          color: var(--foreground);
        }
        .gap-plan-effort-label {
          font-size: 0.65rem;
          color: var(--muted-foreground);
          text-transform: uppercase;
        }
        .progress-stage-track {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .progress-stage-dot {
          padding: 0.3rem 0.6rem;
          border-radius: 999px;
          font-size: 0.65rem;
          font-weight: 700;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--muted-foreground);
        }
        .progress-stage-dot.reached {
          background: rgba(99, 102, 241, 0.18);
          color: #a5b4fc;
          border-color: rgba(99, 102, 241, 0.4);
        }
        .progress-stage-dot.current {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }
        .gap-plan-action-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .gap-plan-btn {
          padding: 0.45rem 0.9rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--foreground);
        }
        .gap-plan-btn.primary {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }
        .gap-plan-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .gap-plan-spinner {
          animation: gap-plan-spin 1s linear infinite;
        }
        @keyframes gap-plan-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ─────────────────────────────────────────────────────────────
          1. TOP META ROW
      ───────────────────────────────────────────────────────────── */}
      <div className="top-meta-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="meta-tag">
            <Compass style={{ width: '14px', height: '14px' }} />
            <span>Career Roadmap</span>
          </div>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="meta-timestamp">
            Last recalculated: <strong>{lastRecalculatedTime}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={() => fetchRoadmap(targetCareer)}
          disabled={loading}
          className="recalculate-btn"
        >
          <RefreshCw style={{ width: '13px', height: '13px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Recalculate</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. PERSONALIZED CAREER ROADMAP HERO CARD
      ───────────────────────────────────────────────────────────── */}
      <div className="hero-card">
        <div className="hero-left">
          <div className="hero-title-row">
            <div className="hero-icon-box">
              <Target style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <h1 className="hero-title">Personalized Career Roadmap</h1>
              <p className="hero-desc">
                Deterministic, evidence-grounded pathway connecting verified candidate evidence, market demand, and application tracking.
              </p>
            </div>
          </div>

          <div className="hero-actions">
            <button
              type="button"
              onClick={() => setShowWhyDifferentModal(true)}
              className="hero-outline-btn"
            >
              <Sparkles style={{ width: '14px', height: '14px' }} />
              <span>Why SkillBridge?</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCalculationModal(true)}
              className="hero-subtle-btn"
            >
              <HelpCircle style={{ width: '14px', height: '14px' }} />
              <span>How it works</span>
            </button>
          </div>
        </div>

        {/* Closed-Loop Visual Pipeline */}
        <div className="pipeline-chain">
          {/* Node 1 */}
          <div className="pipeline-node green">
            <div className="pipeline-icon-circle">
              <ShieldCheck style={{ width: '18px', height: '18px' }} />
            </div>
            <span className="pipeline-label">Verified<br/>Evidence</span>
          </div>

          <ArrowRight style={{ width: '14px', height: '14px', color: 'var(--muted-foreground)', marginTop: '-12px' }} />

          {/* Node 2 */}
          <div className="pipeline-node amber">
            <div className="pipeline-icon-circle">
              <Briefcase style={{ width: '18px', height: '18px' }} />
            </div>
            <span className="pipeline-label">Market<br/>Demand</span>
          </div>

          <ArrowRight style={{ width: '14px', height: '14px', color: 'var(--muted-foreground)', marginTop: '-12px' }} />

          {/* Node 3 */}
          <div className="pipeline-node purple">
            <div className="pipeline-icon-circle">
              {Math.round(currentReadiness)}%
            </div>
            <span className="pipeline-label">Readiness<br/>Score</span>
          </div>

          <ArrowRight style={{ width: '14px', height: '14px', color: 'var(--muted-foreground)', marginTop: '-12px' }} />

          {/* Node 4 */}
          <div className="pipeline-node indigo">
            <div className="pipeline-icon-circle">
              <ListOrdered style={{ width: '18px', height: '18px' }} />
            </div>
            <span className="pipeline-label">Actionable<br/>Roadmap</span>
          </div>

          <ArrowRight style={{ width: '14px', height: '14px', color: 'var(--muted-foreground)', marginTop: '-12px' }} />

          {/* Node 5 */}
          <div className="pipeline-node teal">
            <div className="pipeline-icon-circle">
              <Send style={{ width: '18px', height: '18px' }} />
            </div>
            <span className="pipeline-label">Application<br/>Tracking</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. 5-CARD KPI STRIP
      ───────────────────────────────────────────────────────────── */}
      <div className="kpi-grid">
        {/* Card 1 */}
        <div className="kpi-card">
          <div className="kpi-top-label">
            <span>Authoritative Match</span>
            <button 
              type="button" 
              onClick={() => setShowCalculationModal(true)} 
              style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}
            >
              <HelpCircle style={{ width: '13px', height: '13px' }} />
            </button>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-num">{currentReadiness}%</span>
            <span className={`kpi-badge ${currentReadiness >= 80 ? 'ready' : currentReadiness >= 50 ? 'almost' : 'not-ready'}`}>
              {roadmap?.readiness_state?.replace('_', ' ') || 'ALMOST READY'}
            </span>
          </div>
          <p className="kpi-subtext">Average across {targetOppsCount} relevant {targetCareer} opportunities</p>
        </div>

        {/* Card 2 */}
        <div className="kpi-card">
          <div className="kpi-top-label">
            <span>Target Readiness Goal</span>
            <span style={{ color: 'var(--success)' }}>✓</span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-num" style={{ color: 'var(--success)' }}>{targetReadiness}%+</span>
          </div>
          <p className="kpi-subtext">
            Strong shortlist threshold · <span style={{ color: 'var(--success)' }}>{pointsAway} pts away</span>
          </p>
        </div>

        {/* Card 3 */}
        <div className="kpi-card">
          <div className="kpi-top-label">
            <span>Relevant Opportunities</span>
            <span style={{ color: 'var(--primary)' }}>Active</span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-num" style={{ color: '#818cf8' }}>{targetOppsCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Analyzed</span>
          </div>
          <p className="kpi-subtext">{targetCareer} related (active &amp; open)</p>
        </div>

        {/* Card 4 */}
        <div className="kpi-card">
          <div className="kpi-top-label">
            <span>High Priority Gaps</span>
            <AlertTriangle style={{ width: '13px', height: '13px', color: 'var(--destructive)' }} />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-num" style={{ color: 'var(--destructive)' }}>{priorityGaps.length}</span>
          </div>
          <p className="kpi-subtext">
            Focus on these first · <a href="#market-demand-section" style={{ color: '#818cf8' }}>View gaps →</a>
          </p>
        </div>

        {/* Card 5 */}
        <div className="kpi-card">
          <div className="kpi-top-label">
            <span>Estimated Timeline</span>
            <Clock style={{ width: '13px', height: '13px', color: '#c4b5fd' }} />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-num" style={{ color: '#c4b5fd' }}>
              {totalWeeksDisplay}–{totalWeeksDisplay + 1} wks
            </span>
          </div>
          <p className="kpi-subtext">To reach 80%+ readiness · {milestoneCount} milestone steps</p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. CAREER FOCUS CONTEXT BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="career-context-bar">
        <div className="career-context-left">
          <div className="career-focus-icon">
            <Target style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <div className="career-focus-title">Career Focus: {targetCareer}</div>
            <p className="career-focus-desc">
              We analyze only {targetCareer} and closely related roles (Analytics, BI, Data Science entry roles).
            </p>
          </div>
        </div>

        <div className="career-context-right">
          <div className="filter-pill">
            <Filter style={{ width: '12px', height: '12px' }} />
            <span>Opportunity Filter:</span>
            <span className="active-tag">Active Only</span>
          </div>

          <button
            type="button"
            onClick={() => setShowChangeCareerModal(true)}
            className="change-career-btn"
          >
            Change Career
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. 2-COLUMN MIDDLE GRID (Market Matrix & Eligibility Gate)
      ───────────────────────────────────────────────────────────── */}
      <div id="market-demand-section" className="middle-grid">
        
        {/* LEFT COLUMN: Market Demand & Gap Intelligence */}
        <div className="panel-card">
          <div>
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Market Demand &amp; Gap Intelligence</h2>
                <p className="panel-subtitle">Based on {targetOppsCount} relevant {targetCareer} opportunities</p>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                {priorityGaps.length} Actionable Gaps
              </span>
            </div>

            <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Market Demand</th>
                    <th>Your Evidence</th>
                    <th>Gap Type</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(roadmap?.critical_gaps_summary && roadmap.critical_gaps_summary.length > 0) ? (
                    roadmap.critical_gaps_summary.map((gap, gIdx) => {
                      const reqCount = gap.opportunities_requiring_count || 1;
                      const totalCount = gap.total_target_opportunities_count || targetOppsCount || 1;
                      const demandPct = gap.demand_percentage || Math.round((reqCount / totalCount) * 100);
                      const candStatus = gap.candidate_status || 'NO';
                      const isEligibility = gap.is_eligibility_blocker;
                      const capName = gap.skill_gap.missing_capability.replace(/^Missing\s+/i, '');

                      const barFillColor = demandPct >= 80 ? 'var(--success)' : demandPct >= 40 ? 'var(--warning)' : 'var(--destructive)';

                      return (
                        <tr key={gIdx}>
                          <td style={{ fontWeight: 600, color: 'var(--foreground)' }}>{capName}</td>
                          <td>
                            <div className="demand-bar-wrapper">
                              <span style={{ fontSize: '0.725rem', fontFamily: 'monospace', width: '28px' }}>
                                {reqCount}/{totalCount}
                              </span>
                              <div className="demand-progress-track">
                                <div 
                                  className="demand-progress-fill" 
                                  style={{ width: `${Math.min(100, Math.max(10, demandPct))}%`, background: barFillColor }} 
                                />
                              </div>
                              <span style={{ fontSize: '0.725rem', fontWeight: 800, width: '32px' }}>
                                {demandPct}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`evidence-pill ${candStatus === 'YES' ? 'strong' : candStatus === 'PARTIAL' ? 'partial' : 'none'}`}>
                              {candStatus === 'YES' ? 'STRONG' : candStatus === 'PARTIAL' ? 'PARTIAL' : 'NONE'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                              {isEligibility ? 'Eligibility' : candStatus === 'YES' ? 'Strength' : candStatus === 'PARTIAL' ? 'Evidence Gap' : 'Skill Gap'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => candStatus === 'YES' ? setSelectedGapWhy(gap) : handleOpenGapActionPlan(gap)}
                              className="action-table-btn"
                            >
                              {candStatus === 'YES' ? 'View Proof' : isEligibility ? 'View Rule' : 'Improve'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--muted-foreground)' }}>
                        No critical skill gaps flagged for this career pathway.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--muted-foreground)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>Your Evidence:</span>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>● STRONG (Verified)</span>
              <span style={{ color: 'var(--warning)', fontWeight: 700 }}>● PARTIAL</span>
              <span style={{ color: 'var(--destructive)', fontWeight: 700 }}>● NONE</span>
            </div>
            <span>Market Demand: % of openings requiring this</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Eligibility Gate (Hard Requirements) */}
        <div className="panel-card">
          <div>
            <div className="panel-header">
              <h2 className="panel-title">Eligibility Gate (Hard Requirements)</h2>
              <span className={`kpi-badge ${isHardPassed ? 'ready' : 'not-ready'}`}>
                ● {isHardPassed ? 'Passed' : 'Blocked'}
              </span>
            </div>

            <div style={{ marginTop: '0.85rem' }}>
              {(roadmap?.hard_eligibility_summary && roadmap.hard_eligibility_summary.length > 0) ? (
                roadmap.hard_eligibility_summary.map((item, idx) => (
                  <div className="eligibility-check-item" key={idx}>
                    <div className="check-item-left">
                      {item.status === 'PASSED' ? (
                        <CheckCircle2 style={{ width: '16px', height: '16px', color: 'var(--success)', flexShrink: 0 }} />
                      ) : (
                        <XCircle style={{ width: '16px', height: '16px', color: 'var(--destructive)', flexShrink: 0 }} />
                      )}
                      <div>
                        <div className="check-item-title">{item.requirement_name}</div>
                        <div className="check-item-desc">{item.explanation}</div>
                      </div>
                    </div>
                    <span className={item.status === 'PASSED' ? 'pass-tag' : 'pass-tag'} style={item.status === 'FAILED' ? { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--destructive)' } : undefined}>
                      {item.status === 'PASSED' ? 'PASS' : `FAIL (${item.affected_opportunity_count}/${item.total_opportunity_count})`}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '0.85rem', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                  No hard eligibility prerequisites (degree, minimum experience, deadline, age, or citizenship) were declared on the analyzed opportunities.
                </div>
              )}
            </div>
          </div>

          <div className={`eligibility-bottom-callout ${isHardPassed ? 'passed' : 'blocked'}`}>
            {isHardPassed ? (
              <>
                <ThumbsUp style={{ width: '16px', height: '16px', color: 'var(--success)', flexShrink: 0 }} />
                <span>Great! You meet all hard eligibility criteria for the analyzed opportunities.</span>
              </>
            ) : (
              <>
                <AlertTriangle style={{ width: '16px', height: '16px', color: 'var(--destructive)', flexShrink: 0 }} />
                <span>One or more opportunities require prerequisites not met by your profile. These are ELIGIBILITY CONSTRAINTS, not learnable skill gaps -- see below.</span>
              </>
            )}
          </div>

          {/* Feature 4: Eligibility Blocker vs Learnable Gap -- explicit, never conflated */}
          {priorityGaps.filter(g => g.is_eligibility_blocker).length > 0 && (
            <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                Eligibility Constraints (Not Learnable)
              </div>
              {priorityGaps.filter(g => g.is_eligibility_blocker).map((gap, idx) => (
                <div key={idx} style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '0.78rem', color: 'var(--foreground)' }}>
                  <strong>NOT ELIGIBLE:</strong> {gap.skill_gap.missing_capability.replace(/^Missing\s+/i, '')}. {gap.eligibility_guidance}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          5.5 YOUR ACTION PLAN (Gap -> Action Plan entry point, Phase 7.X+)
      ───────────────────────────────────────────────────────────── */}
      {learnableCriticalGaps.length > 0 && (
        <div className="panel-card action-plan-teaser">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Your Action Plan</h2>
              <p className="panel-subtitle">Your highest-priority learnable gap, personalized from your profile and target opportunities.</p>
            </div>
            <span className={`priority-pill ${learnableCriticalGaps[0].priority_tier === 'P0_CRITICAL' ? 'critical' : 'high'}`}>
              {learnableCriticalGaps[0].priority_tier?.replace('_', ' ')}
            </span>
          </div>
          <div className="action-plan-teaser-body">
            <div className="action-plan-teaser-title">
              {learnableCriticalGaps[0].skill_gap.missing_capability.replace(/^Missing\s+/i, '')}
            </div>
            <div className="action-plan-teaser-stats">
              <span>
                <strong>{learnableCriticalGaps[0].demand_percentage}%</strong> market demand
                {' '}({learnableCriticalGaps[0].opportunities_requiring_count}/{learnableCriticalGaps[0].total_target_opportunities_count} openings)
              </span>
              <span>
                {learnableCriticalGaps[0].candidate_status === 'YES' ? 'Verified evidence present' : learnableCriticalGaps[0].candidate_status === 'PARTIAL' ? 'Partial verified evidence' : 'No verified evidence'}
              </span>
            </div>
            <button type="button" className="btn-primary action-plan-teaser-btn" onClick={() => handleOpenGapActionPlan(learnableCriticalGaps[0])}>
              <GraduationCap style={{ width: '16px', height: '16px' }} />
              Start Learning Plan
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. 4-STEP SEQUENTIAL EXECUTION MILESTONES
      ───────────────────────────────────────────────────────────── */}
      <div className="milestones-section">
        <div className="milestones-header-row">
          <div>
            <h2 className="panel-title" style={{ fontSize: '1.1rem' }}>
              Execution Roadmap: Step-by-Step Milestones
            </h2>
            <p className="panel-subtitle">Follow the sequence to reach 80%+ readiness</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.775rem', color: 'var(--muted-foreground)' }}>
            <span>Total Duration: <strong style={{ color: 'var(--foreground)' }}>{totalWeeksDisplay}–{totalWeeksDisplay + 1} weeks</strong></span>
            <span>|</span>
            <span><strong style={{ color: 'var(--foreground)' }}>{milestoneCount} Milestones</strong></span>
          </div>
        </div>

        <div className="milestones-grid">
          {(roadmap?.milestones && roadmap.milestones.length > 0) ? (
            roadmap.milestones.map((m, mIdx) => {
              const isExpanded = expandedMilestoneId === m.id;
              const isLast = mIdx === roadmap.milestones.length - 1;

              return (
                <div key={m.id || mIdx} className="milestone-card-wrapper">
                  <div className="milestone-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div className="milestone-tag-row">
                        <span className="step-tag">STEP 0{m.milestone_index}</span>
                        <span className={`priority-tag ${m.priority_tier === 'P0_CRITICAL' ? 'p0' : m.priority_tier === 'P1_HIGH' ? 'p1' : 'p2'}`}>
                          ● {m.priority_tier?.replace('_', ' ') || 'P1 HIGH'}
                        </span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <h3 className="milestone-title">{m.title}</h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                            {m.estimated_duration_weeks}w
                          </span>
                        </div>
                        <p className="milestone-why">{m.why_recommended}</p>
                      </div>

                      <div className="milestone-steps-list">
                        {(m.action_steps || []).slice(0, 3).map((step, sIdx) => (
                          <div key={sIdx} className="milestone-step-item">
                            <span className="step-arrow">→</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                      <div className="milestone-outcome-box">
                        Outcome: {m.deliverable_title || 'Verified Skill Proof'}
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedMilestoneId(isExpanded ? null : m.id)}
                        className="details-toggle-btn"
                      >
                        {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.35rem' }}>Detailed Action Steps:</div>
                        <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                          {(m.action_steps || []).map((step, sIdx) => (
                            <li key={sIdx} style={{ marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>{step}</li>
                          ))}
                        </ul>
                        <div style={{ marginTop: '0.5rem', color: 'var(--muted-foreground)' }}>
                          <strong>Deliverable:</strong> {m.deliverable_description}
                        </div>

                        {/* Feature 5: Project -> Gap Connection + Feature 6: Verification Checkpoint */}
                        {m.project_recommendation && (() => {
                          const record = getVerificationRecord(m.id, m.project_recommendation!.title);
                          const addressedGaps = learnableCriticalGaps.filter(g =>
                            (m.target_skill || '').toLowerCase().includes(g.skill_gap.missing_capability.replace(/^Missing\s+/i, '').toLowerCase())
                          );
                          const addressedNames = addressedGaps.length > 0
                            ? addressedGaps.map(g => g.skill_gap.missing_capability.replace(/^Missing\s+/i, ''))
                            : (m.project_recommendation!.skills_learned || []);

                          return (
                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
                                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.7rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Rocket size={12} /> Recommended Future Action
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>
                                  Projected impact: +{(m.project_recommendation!.expected_readiness_delta || 0).toFixed(0)}% (not verified)
                                </span>
                              </div>
                              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--foreground)' }}>
                                This project is recommended because it addresses: <strong>{addressedNames.join(', ') || m.target_skill}</strong>
                              </p>

                              {/* Verification Checkpoint state chip + self-service transitions */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span
                                  className="step-tag"
                                  style={record.status === 'VERIFIED' ? { background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' } : record.status === 'REJECTED_NEEDS_MORE_EVIDENCE' ? { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--destructive)' } : undefined}
                                >
                                  {PROJECT_VERIFICATION_STATUS_LABELS[record.status]}
                                </span>

                                {record.status === 'NOT_STARTED' && (
                                  <button type="button" className="action-table-btn" onClick={() => handleVerificationTransition(m.id, m.project_recommendation!.title, 'IN_PROGRESS')}>
                                    Start Project
                                  </button>
                                )}
                                {record.status === 'IN_PROGRESS' && (
                                  <button type="button" className="action-table-btn" onClick={() => handleVerificationTransition(m.id, m.project_recommendation!.title, 'SUBMITTED_FOR_VERIFICATION')}>
                                    Submit Evidence
                                  </button>
                                )}
                                {record.status === 'SUBMITTED_FOR_VERIFICATION' && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                                    Awaiting verification through your Candidate Profile evidence review -- not auto-verified.
                                  </span>
                                )}
                                {record.status === 'REJECTED_NEEDS_MORE_EVIDENCE' && (
                                  <button type="button" className="action-table-btn" onClick={() => handleVerificationTransition(m.id, m.project_recommendation!.title, 'IN_PROGRESS')}>
                                    Resume Project
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Feature 7: Inline Reassessment Simulation for the Reassess milestone */}
                        {m.title.toLowerCase().includes('reassess') && (
                          <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                              <span style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '0.75rem' }}>Reassessment Simulator</span>
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase' }}>Simulation Only · Not Verified</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.6rem' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Current Verified State</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)' }}>
                                  {simulation.before ? `${simulation.before.score.toFixed(0)}%` : `${currentReadiness.toFixed(0)}%`}
                                </div>
                              </div>
                              <ArrowRight size={16} style={{ color: 'var(--primary)' }} />
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: simulation.after ? 'var(--success)' : 'var(--muted-foreground)', textTransform: 'uppercase' }}>Projected Future State</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: simulation.after ? 'var(--success)' : 'var(--muted-foreground)' }}>
                                  {simulation.after ? `${simulation.after.score.toFixed(0)}%` : '--%'}
                                </div>
                              </div>
                            </div>
                            {simulation.error && (
                              <p style={{ color: 'var(--destructive)', fontSize: '0.7rem', marginTop: '0.5rem' }}>{simulation.error}</p>
                            )}
                            <button
                              type="button"
                              className="details-toggle-btn"
                              style={{ width: '100%', marginTop: '0.6rem', justifyContent: 'center' }}
                              disabled={simulation.loading}
                              onClick={handleRunInlineSimulation}
                            >
                              {simulation.loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}><Loader2 size={13} className="animate-spin" /> Recalculating...</span>
                              ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}><Zap size={13} /> Simulate If Top Gap + Project Verified</span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!isLast && (
                    <div className="milestone-desktop-connector">→</div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', color: 'var(--muted-foreground)' }}>
              No milestones generated for current selection.
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          7. ACTIVE TARGET OPPORTUNITIES (APPLICATION TRACKER)
      ───────────────────────────────────────────────────────────── */}
      {roadmap?.target_opportunities_summary && roadmap.target_opportunities_summary.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send style={{ width: '16px', height: '16px', color: 'var(--success)' }} />
                <span>Active Target Opportunities</span>
              </h2>
              <p className="panel-subtitle">Direct Phase 7.1 application lifecycle tracking for verified openings</p>
            </div>
            <span style={{ fontSize: '0.775rem', color: 'var(--muted-foreground)' }}>
              {roadmap.target_opportunities_summary.length} matching openings
            </span>
          </div>

          <div className="opps-grid">
            {[...roadmap.target_opportunities_summary]
              .sort((a, b) => {
                const order: Record<string, number> = { BEST_MATCH: 0, ALMOST_READY: 1, GAP_TO_BRIDGE: 2, NOT_ELIGIBLE: 3 };
                const aRank = order[a.roadmap_category || 'GAP_TO_BRIDGE'] ?? 2;
                const bRank = order[b.roadmap_category || 'GAP_TO_BRIDGE'] ?? 2;
                if (aRank !== bRank) return aRank - bRank;
                return b.readiness_score - a.readiness_score;
              })
              .slice(0, 4)
              .map((opp) => {
              const trackingInfo = trackedMap[opp.id];
              const currentStage = trackingInfo?.stage;
              const isActionLoading = trackingInfo?.loading;
              const categoryStyle: Record<string, { bg: string; color: string }> = {
                BEST_MATCH: { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' },
                ALMOST_READY: { bg: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' },
                GAP_TO_BRIDGE: { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' },
                NOT_ELIGIBLE: { bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--destructive)' }
              };
              const catStyle = categoryStyle[opp.roadmap_category || 'GAP_TO_BRIDGE'];

              return (
                <div key={opp.id} className="opp-card">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '999px', background: catStyle.bg, color: catStyle.color, textTransform: 'uppercase' }}>
                        {ROADMAP_CATEGORY_LABELS[opp.roadmap_category || 'GAP_TO_BRIDGE']}
                      </span>
                      {opp.freshness_badge_label && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                          {opp.freshness_badge_label}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Link
                        href={`/opportunity/${opp.id}`}
                        style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none', lineHeight: 1.3 }}
                      >
                        {opp.title}
                      </Link>
                      <ReadinessBadge score={opp.readiness_score} state={opp.readiness_state} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.35rem' }}>
                      <Building2 style={{ width: '12px', height: '12px' }} />
                      <span>{opp.organization}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.65rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin style={{ width: '11px', height: '11px' }} />
                        {opp.location || 'India / Remote'}
                      </span>
                      <span>{opp.deadline ? `Due: ${new Date(opp.deadline).toLocaleDateString()}` : 'Active'}</span>
                    </div>

                    {opp.key_recommendation_reasons && opp.key_recommendation_reasons.length > 0 && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                        Why: {opp.key_recommendation_reasons[0]}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                    {!currentStage ? (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleTrackOpportunity(opp.id, 'CREATE')}
                        className="opp-track-btn"
                      >
                        <BookmarkPlus style={{ width: '14px', height: '14px' }} />
                        <span>Track in SkillBridge</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, gap: '0.5rem' }}>
                        <span className="step-tag">{currentStage}</span>
                        {currentStage === 'SAVED' && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleTrackOpportunity(opp.id, 'TRANSITION', 'PREPARING')}
                            className="action-table-btn"
                          >
                            Prepare App
                          </button>
                        )}
                        {currentStage === 'PREPARING' && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleTrackOpportunity(opp.id, 'TRANSITION', 'APPLIED')}
                            className="action-table-btn"
                            style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}
                          >
                            Mark Applied
                          </button>
                        )}
                      </div>
                    )}

                    <Link
                      href={`/opportunity/${opp.id}`}
                      style={{ padding: '0.45rem', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="View Details"
                    >
                      <ExternalLink style={{ width: '14px', height: '14px' }} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: "Why SkillBridge?" Comparison Dialog
      ───────────────────────────────────────────────────────────── */}
      {showWhyDifferentModal && (
        <div className="modal-overlay" onClick={() => setShowWhyDifferentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles style={{ width: '18px', height: '18px', color: 'var(--primary)' }} />
                <h3 className="modal-title">Why SkillBridge is Different</h3>
              </div>
              <button type="button" onClick={() => setShowWhyDifferentModal(false)} className="close-btn">
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Feature 10: Personalization Proof -- this candidate's actual roadmap reasoning, not marketing copy */}
              {roadmap?.why_this_roadmap_narrative && (
                <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Why This Roadmap Is YOUR Roadmap
                  </div>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--foreground)', lineHeight: 1.55 }}>
                    {roadmap.why_this_roadmap_narrative}
                  </p>
                  {learnableCriticalGaps.length > 0 && (
                    <div style={{ marginTop: '0.65rem', fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span>
                        <strong style={{ color: 'var(--foreground)' }}>Priority:</strong> {learnableCriticalGaps[0].skill_gap.missing_capability.replace(/^Missing\s+/i, '')} &mdash; required by {learnableCriticalGaps[0].opportunities_requiring_count}/{learnableCriticalGaps[0].total_target_opportunities_count} target opportunities.
                      </span>
                      {projectMilestone?.project_recommendation && (
                        <span>
                          <strong style={{ color: 'var(--foreground)' }}>Project:</strong> {projectMilestone.project_recommendation.title} &mdash; builds verifiable evidence for this exact gap.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--destructive)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    ✕ Generic Roadmaps
                  </div>
                  <ul style={{ paddingLeft: '1.15rem', margin: 0, fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                    <li>Same curriculum for everyone</li>
                    <li>Blind to verified resume proof</li>
                    <li>Disconnected from live jobs</li>
                    <li>No hard eligibility checks</li>
                    <li>No application tracking</li>
                  </ul>
                </div>

                <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    ✓ SkillBridge Closed Loop
                  </div>
                  <ul style={{ paddingLeft: '1.15rem', margin: 0, fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                    <li>Candidate-specific evidence</li>
                    <li>Market-demand driven</li>
                    <li>Eligibility-aware</li>
                    <li>Deterministic readiness</li>
                    <li>Application execution</li>
                  </ul>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => setShowWhyDifferentModal(false)} className="modal-close-btn">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: "How is this calculated?" Breakdown Dialog
      ───────────────────────────────────────────────────────────── */}
      {showCalculationModal && (
        <div className="modal-overlay" onClick={() => setShowCalculationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck style={{ width: '18px', height: '18px', color: 'var(--primary)' }} />
                <h3 className="modal-title">Authoritative Readiness Formula</h3>
              </div>
              <button type="button" onClick={() => setShowCalculationModal(false)} className="close-btn">
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p>SkillBridge computes an authoritative, multi-factor match score against evaluated target opportunities:</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ padding: '0.85rem', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted-foreground)' }}>1. SKILL (50%)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
                    {roadmap?.readiness_breakdown?.skill_match_score || 0}%
                  </div>
                </div>

                <div style={{ padding: '0.85rem', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted-foreground)' }}>2. EVIDENCE (30%)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c4b5fd', marginTop: '0.25rem' }}>
                    {roadmap?.readiness_breakdown?.evidence_proof_score || 0}%
                  </div>
                </div>

                <div style={{ padding: '0.85rem', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted-foreground)' }}>3. EXPERIENCE (20%)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.25rem' }}>
                    {roadmap?.readiness_breakdown?.experience_score || 0}%
                  </div>
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '0.75rem', color: '#a5b4fc' }}>
                Score = (0.50 × Skill) + (0.30 × Evidence) + (0.20 × Experience) × Eligibility Multiplier
              </div>
            </div>

            <button type="button" onClick={() => setShowCalculationModal(false)} className="modal-close-btn">
              Close
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: "Change Career" Selection Modal
      ───────────────────────────────────────────────────────────── */}
      {showChangeCareerModal && (
        <div className="modal-overlay" onClick={() => setShowChangeCareerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass style={{ width: '18px', height: '18px', color: 'var(--primary)' }} />
                <h3 className="modal-title">Select Target Career Pathway</h3>
              </div>
              <button type="button" onClick={() => setShowChangeCareerModal(false)} className="close-btn">
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                Common Pathways
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {COMMON_CAREER_TARGETS.map((career) => {
                  const isSelected = targetCareer.toLowerCase() === career.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={career}
                      onClick={() => handleSelectPredefinedCareer(career)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        textAlign: 'left',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: isSelected ? 'var(--primary)' : 'var(--surface-2)',
                        color: isSelected ? '#ffffff' : 'var(--foreground)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {career}
                    </button>
                  );
                })}
              </div>

              <div style={{ paddingTop: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Or enter another custom role
                </div>
                <form onSubmit={handleCustomCareerSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. UPSC Civil Services, DevOps Engineer..."
                    value={customCareerInput}
                    onChange={(e) => setCustomCareerInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="modal-close-btn" style={{ padding: '0.55rem 1.25rem' }}>
                    Apply
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: "Why?" Deterministic Evidence Chain Dialog
      ───────────────────────────────────────────────────────────── */}
      {selectedGapWhy && (
        <div className="modal-overlay" onClick={() => setSelectedGapWhy(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle style={{ width: '18px', height: '18px', color: 'var(--warning)' }} />
                <h3 className="modal-title">
                  Evidence Chain: {selectedGapWhy.skill_gap.missing_capability.replace(/^Missing\s+/i, '')}
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedGapWhy(null)} className="close-btn">
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  1. Candidate Evidence
                </div>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--foreground)' }}>
                  {selectedGapWhy.candidate_evidence_summary || 'No verified project proof found in candidate profile.'}
                </p>
              </div>

              <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  2. Target Career &amp; Active Opportunities Analyzed
                </div>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--foreground)' }}>
                  {targetCareer} · <strong>{selectedGapWhy.total_target_opportunities_count || targetOppsCount}</strong> active opportunities analyzed.
                </p>
              </div>

              <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  3. Requirement Frequency &amp; Traceability
                </div>
                <p style={{ margin: '0.25rem 0 0.5rem 0', color: 'var(--foreground)' }}>
                  Required in <strong>{selectedGapWhy.demand_percentage}%</strong> of relevant target opportunities ({selectedGapWhy.opportunities_requiring_count || 1} of {selectedGapWhy.total_target_opportunities_count || targetOppsCount} openings)
                  {selectedGapWhy.market_requirement_level ? <> · <strong>{selectedGapWhy.market_requirement_level.replace('_', ' ')}</strong></> : null}.
                </p>
                {selectedGapWhy.related_opportunity_details && selectedGapWhy.related_opportunity_details.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {selectedGapWhy.related_opportunity_details.map((detail, i) => (
                      <li key={i}>
                        <strong style={{ color: 'var(--foreground)' }}>{detail.title}</strong> · {detail.organization}
                        {detail.is_mandatory ? ' · Mandatory' : ' · Preferred'}
                        {detail.freshness_state ? ` · ${detail.freshness_state.replace('_', ' ')}` : ''}
                        <span style={{ color: 'var(--muted-foreground)' }}> (ID: {detail.id})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  4. Gap Classification &amp; Priority
                </div>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--foreground)' }}>
                  {selectedGapWhy.is_eligibility_blocker ? 'ELIGIBILITY BLOCKER' : 'MANDATORY / LEARNABLE SKILL GAP'} · Priority: <strong style={{ color: '#a5b4fc' }}>{selectedGapWhy.priority_tier?.replace('_', ' ')}</strong>
                </p>
              </div>

              <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  5. Recommended Action
                </div>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--foreground)' }}>
                  {selectedGapWhy.is_eligibility_blocker ? (
                    <><strong style={{ color: 'var(--destructive)' }}>NOT ELIGIBLE.</strong> {selectedGapWhy.eligibility_guidance}</>
                  ) : (
                    <>Recommended Action: <strong style={{ color: 'var(--success)' }}>{selectedGapWhy.gap_action_classification?.replace('_', ' ')}</strong></>
                  )}
                </p>
              </div>
            </div>

            <button type="button" onClick={() => setSelectedGapWhy(null)} className="modal-close-btn">
              Close
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 5: Gap Action Plan Drawer (Phase 7.X+)
          Gap -> Action Plan -> Learning -> Practice -> Project -> Evidence ->
          Verification -> Reassessment. Fully derived from generateGapActionPlan
          (real candidate profile + real market/opportunity data); nothing here
          is candidate- or market-invented.
      ───────────────────────────────────────────────────────────── */}
      {showGapActionPlan && (
        <div className="modal-overlay" onClick={() => setShowGapActionPlan(false)}>
          <div className="gap-plan-modal-content" onClick={(e) => e.stopPropagation()} data-progress-tick={progressTick}>
            <div className="modal-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap style={{ width: '20px', height: '20px', color: 'var(--primary)' }} />
                <h3 className="modal-title">
                  {gapActionPlanResult?.kind === 'PLAN' && `Close Gap: ${gapActionPlanResult.plan.gap_capability_name}`}
                  {gapActionPlanResult?.kind === 'ELIGIBILITY_BLOCKER' && `Eligibility Blocker: ${gapActionPlanResult.blocker.gap_capability_name}`}
                  {gapActionPlanResult?.kind === 'NOT_FOUND' && 'Gap Action Plan'}
                  {!gapActionPlanResult && 'Gap Action Plan'}
                </h3>
              </div>
              <button type="button" onClick={() => setShowGapActionPlan(false)} className="close-btn">
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {gapActionPlanLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '2.5rem 0', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
                <Loader2 className="gap-plan-spinner" style={{ width: '20px', height: '20px' }} />
                Generating your personalized action plan...
              </div>
            )}

            {!gapActionPlanLoading && gapActionPlanErrorMsg && (
              <div className="gap-plan-section" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle style={{ width: '18px', height: '18px', color: 'var(--destructive)' }} />
                  <span className="gap-plan-section-label" style={{ color: 'var(--destructive)' }}>Error</span>
                </div>
                <p style={{ margin: 0, color: 'var(--foreground)' }}>{gapActionPlanErrorMsg}</p>
              </div>
            )}

            {!gapActionPlanLoading && !gapActionPlanErrorMsg && gapActionPlanResult?.kind === 'NOT_FOUND' && (
              <div className="gap-plan-section">
                <div className="gap-plan-section-label">Insufficient Market Data</div>
                <p style={{ margin: 0, color: 'var(--foreground)' }}>{gapActionPlanResult.message}</p>
              </div>
            )}

            {!gapActionPlanLoading && !gapActionPlanErrorMsg && gapActionPlanResult?.kind === 'ELIGIBILITY_BLOCKER' && (
              <div className="gap-plan-section" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <XCircle style={{ width: '18px', height: '18px', color: 'var(--destructive)' }} />
                  <span className="gap-plan-section-label" style={{ color: 'var(--destructive)' }}>Eligibility Blocker</span>
                </div>
                <p style={{ margin: 0, color: 'var(--foreground)' }}>
                  <strong>{gapActionPlanResult.blocker.explanation}</strong> No learning plan has been generated for this requirement.
                </p>
                {gapActionPlanResult.blocker.eligibility_guidance && (
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{gapActionPlanResult.blocker.eligibility_guidance}</p>
                )}
              </div>
            )}

            {!gapActionPlanLoading && !gapActionPlanErrorMsg && gapActionPlanResult?.kind === 'PLAN' && (() => {
              const plan = gapActionPlanResult.plan;
              const projectTitle = plan.project_blueprint?.recommendation.title || `${plan.gap_capability_name} Project`;
              const verRecord = getVerificationRecord(plan.id, projectTitle);
              const reassessed = loadReassessedSet()[plan.id] === true;
              const stage: LearningPlanStage = deriveLearningPlanStage(plan.id, verRecord, reassessed);
              const stageOrder: LearningPlanStage[] = ['NOT_STARTED', 'LEARNING', 'PRACTICING', 'PROJECT_IN_PROGRESS', 'PROJECT_SUBMITTED', 'VERIFIED', 'READINESS_REASSESSMENT'];

              return (
                <>
                  {/* Step 2/10: Gap summary, priority, market evidence, classification, target */}
                  <div className="gap-plan-section">
                    <div className="gap-plan-stat-row">
                      <span className={`priority-pill ${plan.priority_tier === 'P0_CRITICAL' ? 'critical' : 'high'}`}>
                        {plan.priority_tier.replace('_', ' ')}
                      </span>
                      <span><strong>{plan.market_evidence.demand_percentage}%</strong> market demand ({plan.market_evidence.opportunities_requiring_count}/{plan.market_evidence.total_target_opportunities_count} opportunities)</span>
                      <span>Classification: <strong>{plan.classification.replace(/_/g, ' ')}</strong></span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--foreground)' }}>Target: {plan.target_statement}</p>
                    {plan.market_evidence.related_opportunity_details.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {plan.market_evidence.related_opportunity_details.slice(0, 4).map((d, i) => (
                          <li key={i}>
                            <Link href={`/opportunity/${d.id}`} style={{ color: 'var(--foreground)', fontWeight: 700, textDecoration: 'none' }}>
                              {d.title}
                            </Link>
                            {' '}· {d.organization}
                            {d.freshness_state ? ` · ${d.freshness_state.replace(/_/g, ' ')}` : ''}
                            {d.is_mandatory ? ' · Mandatory' : ' · Preferred'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Step 2/4: Current Evidence */}
                  <div className="gap-plan-section">
                    <div className="gap-plan-section-label">Current Evidence</div>
                    <div className="gap-plan-evidence-grid">
                      {plan.current_evidence.map((ev, i) => (
                        <span key={i} className={`gap-plan-evidence-chip ${ev.status === 'VERIFIED' ? 'verified' : 'not-verified'}`}>
                          {ev.status === 'VERIFIED' ? <Check style={{ width: '12px', height: '12px' }} /> : <X style={{ width: '12px', height: '12px' }} />}
                          {ev.skill_name}: {ev.status === 'VERIFIED' ? 'VERIFIED' : 'NOT VERIFIED'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Step 13: Personalization Proof -- "Already Verified / Build On These" */}
                  <div className="gap-plan-section" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}>
                    <div className="gap-plan-section-label" style={{ color: 'var(--success)' }}>Why This Plan Is Personalized</div>
                    {plan.already_verified_skills.length > 0 ? (
                      <p style={{ margin: 0, color: 'var(--foreground)' }}>
                        You already have verified evidence for <strong>{plan.already_verified_skills.join(', ')}</strong> -- this plan builds on those and skips re-teaching them, focusing instead on <strong>{plan.gap_capability_name}</strong>.
                      </p>
                    ) : (
                      <p style={{ margin: 0, color: 'var(--foreground)' }}>
                        No verified prerequisite evidence was found on your profile yet, so this plan starts from the foundations of <strong>{plan.gap_capability_name}</strong>.
                      </p>
                    )}
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      This gap appears in <strong>{plan.market_evidence.opportunities_requiring_count} of {plan.market_evidence.total_target_opportunities_count}</strong> analyzed target opportunities ({plan.market_evidence.demand_percentage}%).
                    </p>
                  </div>

                  {/* Step 4: Prerequisite / Dependency chain -- skip already-verified skills */}
                  <div className="gap-plan-section">
                    <div className="gap-plan-section-label">Prerequisite Path ({plan.starting_point_label.includes('start at') ? plan.starting_point_label.split('(start at:')[1]?.replace(')', '').trim() : plan.gap_capability_name})</div>
                    <div className="prereq-chain">
                      {plan.prerequisite_chain.map((step, i) => (
                        <React.Fragment key={step.key}>
                          {i > 0 && <ArrowRight className="prereq-chain-arrow" style={{ width: '12px', height: '12px' }} />}
                          <span className={`prereq-chain-step ${step.is_satisfied ? 'satisfied' : ''} ${step.is_starting_point ? 'starting-point' : ''}`}>
                            {step.is_satisfied && <Check style={{ width: '11px', height: '11px' }} />}
                            {step.label}
                            {step.is_starting_point && ' (start here)'}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Step 3/5: Personalized learning plan -- ACTION -> PRACTICE -> DELIVERABLE -> VERIFICATION */}
                  <div className="gap-plan-section">
                    <div className="gap-plan-section-label">
                      <Layers style={{ width: '13px', height: '13px', display: 'inline', marginRight: '0.3rem' }} />
                      Personalized Learning Plan
                    </div>
                    {plan.learning_phases.map((phase) => (
                      <div className="gap-plan-phase-card" key={phase.phase_index}>
                        <div className="gap-plan-phase-header">
                          <span className="gap-plan-phase-title">Phase {phase.phase_index} -- {phase.title}</span>
                          <span className="gap-plan-phase-days">{phase.day_range_label}</span>
                        </div>
                        <div className="gap-plan-topics">
                          {phase.topics.map((t, i) => <span key={i} className="gap-plan-topic-chip">{t}</span>)}
                        </div>
                        {phase.tasks.map((task, i) => (
                          <div className="gap-plan-task" key={i}>
                            <div className="gap-plan-task-block"><span className="gap-plan-task-label">Action</span><span>{task.action}</span></div>
                            <div className="gap-plan-task-block"><span className="gap-plan-task-label">Practice</span><span>{task.practice}</span></div>
                            <div className="gap-plan-task-block"><span className="gap-plan-task-label">Deliverable</span><span>{task.deliverable}</span></div>
                            <div className="gap-plan-task-block"><span className="gap-plan-task-label">Verification</span><span>{task.verification}</span></div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Step 6/7: Project Blueprint -- reused from project_recommendation_engine */}
                  {plan.project_blueprint && (
                    <div className="gap-plan-section">
                      <div className="gap-plan-section-label">
                        <Rocket style={{ width: '13px', height: '13px', display: 'inline', marginRight: '0.3rem' }} />
                        Project Blueprint
                      </div>
                      <p style={{ margin: 0, fontWeight: 700, color: 'var(--foreground)' }}>{plan.project_blueprint.recommendation.title}</p>
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{plan.project_blueprint.recommendation.objective}</p>
                      <div style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700 }}>
                        This project closes {plan.project_blueprint.closes_gap_count} identified market gap{plan.project_blueprint.closes_gap_count === 1 ? '' : 's'}: {plan.project_blueprint.closes_gap_capabilities.join(', ')}.
                      </div>
                      <div className="gap-plan-stat-row" style={{ fontSize: '0.75rem' }}>
                        <span><strong>Leverages:</strong> {plan.project_blueprint.recommendation.existing_strengths_leveraged.join(', ') || '—'}</span>
                        <span><strong>New skills:</strong> {plan.project_blueprint.recommendation.skills_learned.join(', ') || '—'}</span>
                      </div>
                      <div className="gap-plan-section-label" style={{ marginTop: '0.4rem' }}>Architecture</div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {plan.project_blueprint.architecture_flow.join(' -> ')}
                      </p>
                      <div className="gap-plan-section-label" style={{ marginTop: '0.4rem' }}>Implementation Tasks</div>
                      <ol style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {plan.project_blueprint.implementation_tasks.map((t, i) => <li key={i}>{t}</li>)}
                      </ol>
                      <div className="gap-plan-section-label" style={{ marginTop: '0.4rem' }}>Expected Evidence</div>
                      <div className="gap-plan-topics">
                        {plan.project_blueprint.expected_evidence.map((e, i) => <span key={i} className="gap-plan-topic-chip">{e}</span>)}
                      </div>
                    </div>
                  )}

                  {/* Step 8: Effort estimate -- deterministic, no fabricated precision */}
                  <div className="gap-plan-section">
                    <div className="gap-plan-section-label">Estimated Effort</div>
                    <div className="gap-plan-effort-grid">
                      <div className="gap-plan-effort-item"><div className="gap-plan-effort-value">{plan.effort_estimate.learning_hours}h</div><div className="gap-plan-effort-label">Learning</div></div>
                      <div className="gap-plan-effort-item"><div className="gap-plan-effort-value">{plan.effort_estimate.practice_hours}h</div><div className="gap-plan-effort-label">Practice</div></div>
                      <div className="gap-plan-effort-item"><div className="gap-plan-effort-value">{plan.effort_estimate.project_hours}h</div><div className="gap-plan-effort-label">Project</div></div>
                      <div className="gap-plan-effort-item"><div className="gap-plan-effort-value">{plan.effort_estimate.documentation_hours}h</div><div className="gap-plan-effort-label">Docs</div></div>
                      <div className="gap-plan-effort-item"><div className="gap-plan-effort-value">{plan.effort_estimate.verification_hours}h</div><div className="gap-plan-effort-label">Verify</div></div>
                      <div className="gap-plan-effort-item" style={{ background: 'var(--primary)' }}><div className="gap-plan-effort-value" style={{ color: '#fff' }}>{plan.effort_estimate.total_hours}h</div><div className="gap-plan-effort-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Total</div></div>
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>{plan.effort_estimate.estimated_duration_label}</p>
                  </div>

                  {/* Step 9: Progress tracker + execution controls */}
                  <div className="gap-plan-section">
                    <div className="gap-plan-section-label">
                      <ClipboardCheck style={{ width: '13px', height: '13px', display: 'inline', marginRight: '0.3rem' }} />
                      Progress
                    </div>
                    <div className="progress-stage-track">
                      {stageOrder.map((s) => {
                        const sIdx = stageOrder.indexOf(s);
                        const curIdx = stageOrder.indexOf(stage);
                        return (
                          <span key={s} className={`progress-stage-dot ${s === stage ? 'current' : sIdx < curIdx ? 'reached' : ''}`}>
                            {LEARNING_PLAN_STAGE_LABELS[s]}
                          </span>
                        );
                      })}
                    </div>

                    <div className="gap-plan-action-row" style={{ marginTop: '0.5rem' }}>
                      {stage === 'NOT_STARTED' && (
                        <button type="button" className="gap-plan-btn primary" onClick={() => handleAdvanceLocalLearningStage(plan.id, 'LEARNING')}>Start Learning</button>
                      )}
                      {stage === 'LEARNING' && (
                        <button type="button" className="gap-plan-btn primary" onClick={() => handleAdvanceLocalLearningStage(plan.id, 'PRACTICING')}>Mark Practicing</button>
                      )}
                      {(stage === 'LEARNING' || stage === 'PRACTICING') && (
                        <button type="button" className="gap-plan-btn" onClick={() => handleVerificationTransition(plan.id, projectTitle, 'IN_PROGRESS')}>Start Project</button>
                      )}
                      {stage === 'PROJECT_IN_PROGRESS' && (
                        <button type="button" className="gap-plan-btn primary" onClick={() => handleVerificationTransition(plan.id, projectTitle, 'SUBMITTED_FOR_VERIFICATION')}>Submit Evidence</button>
                      )}
                      {stage === 'PROJECT_SUBMITTED' && verRecord.status !== 'REJECTED_NEEDS_MORE_EVIDENCE' && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', alignSelf: 'center' }}>
                          Submitted -- verification requires real evidence added to your Candidate Profile (never auto-verified from this checkpoint).
                        </span>
                      )}
                      {stage === 'VERIFIED' && !gapPlanSimulation.after && (
                        <button type="button" className="gap-plan-btn primary" disabled={gapPlanSimulation.loading} onClick={() => handleRunGapPlanSimulation(plan)}>
                          {gapPlanSimulation.loading ? 'Simulating...' : 'Run Readiness Reassessment (Simulation Only)'}
                        </button>
                      )}
                    </div>

                    {/* Step 8: Rejected evidence -- shown with reason, always resumable, never a dead end */}
                    {verRecord.status === 'REJECTED_NEEDS_MORE_EVIDENCE' && (
                      <div style={{ marginTop: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.8rem' }}>
                        <strong style={{ color: 'var(--destructive)' }}>Needs More Evidence.</strong>{' '}
                        {verRecord.history[verRecord.history.length - 1]?.notes || 'The submitted evidence was not sufficient for verification.'}
                        <div style={{ marginTop: '0.5rem' }}>
                          <button type="button" className="gap-plan-btn primary" onClick={() => handleVerificationTransition(plan.id, projectTitle, 'IN_PROGRESS')}>Resubmit</button>
                        </div>
                      </div>
                    )}

                    {gapPlanSimulation.error && (
                      <p style={{ margin: '0.5rem 0 0 0', color: 'var(--destructive)', fontSize: '0.78rem' }}>{gapPlanSimulation.error}</p>
                    )}
                    {gapPlanSimulation.before && gapPlanSimulation.after && (
                      <div style={{ marginTop: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                          <span>CURRENT VERIFIED READINESS: <strong>{gapPlanSimulation.before.score}%</strong></span>
                          <span>SIMULATED / PROJECTED READINESS: <strong style={{ color: '#a5b4fc' }}>{gapPlanSimulation.after.score}%</strong>
                            {gapPlanSimulation.delta !== null && <> ({gapPlanSimulation.delta >= 0 ? '+' : ''}{gapPlanSimulation.delta} pts)</>}
                          </span>
                        </div>
                        <p style={{ margin: '0.4rem 0 0 0', color: 'var(--muted-foreground)' }}>
                          <strong style={{ color: '#a5b4fc' }}>SIMULATION ONLY -- NOT VERIFIED.</strong> Your verified profile and readiness are unchanged until you add this evidence yourself and the authoritative readiness engine recalculates it.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step 9/10: Verification requirements */}
                  <div className="gap-plan-section">
                    <div className="gap-plan-section-label">Verification Requirements</div>
                    <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {plan.verification_requirements.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  </div>

                  {/* Step 11: Resources -- structured categories only, never a fabricated URL */}
                  {plan.resource_recommendations.length > 0 && (
                    <div className="gap-plan-section">
                      <div className="gap-plan-section-label">Resources</div>
                      <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {plan.resource_recommendations.map((r, i) => (
                          <li key={i}>
                            <strong style={{ color: 'var(--foreground)' }}>{r.resource_type.replace(/_/g, ' ')}:</strong> {r.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              );
            })()}

            <button type="button" onClick={() => setShowGapActionPlan(false)} className="modal-close-btn">
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
