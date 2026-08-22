import { describe, it, expect } from 'vitest';
import { generateGapActionPlan } from './gap_action_plan_engine';
import {
  deriveLearningPlanStage,
  getLocalLearningStage,
  setLocalLearningStage
} from './gap_learning_progress';
import { CandidateProfile, GapActionPlan, ProjectVerificationRecord } from '../types';
import { SEED_OPPORTUNITIES } from './seed_data';

// Same demo candidate used by roadmap_engine.test.ts, extended with PostgreSQL
// (matches the Phase 7.X+ spec's illustrative "Python, SQL, Pandas, PostgreSQL"
// candidate). Real seed data confirms this exact candidate against target
// career "Python Backend Developer" surfaces a real "PySpark / Data Pipelines"
// gap (via the "Data Engineering Intern" opportunity) -- verified by direct
// inspection before writing these tests, not assumed.
const CANDIDATE: CandidateProfile = {
  id: 'cand_aarav_mehta_01',
  user_id: 'usr_aarav_mehta',
  full_name: 'Aarav Mehta',
  email: 'aarav.mehta@example.com',
  education_level: "Bachelor's Degree",
  education_field: 'Computer Science',
  graduation_year: 2025,
  career_domain: 'DATA_ANALYTICS',
  skills: [
    { id: 's1', profile_id: 'cand_aarav_mehta_01', name: 'Python', normalized_name: 'python', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' },
    { id: 's2', profile_id: 'cand_aarav_mehta_01', name: 'SQL', normalized_name: 'sql', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' },
    { id: 's7', profile_id: 'cand_aarav_mehta_01', name: 'Pandas', normalized_name: 'pandas', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' },
    { id: 's8', profile_id: 'cand_aarav_mehta_01', name: 'PostgreSQL', normalized_name: 'postgresql', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' }
  ],
  projects: [
    { id: 'p2', profile_id: 'cand_aarav_mehta_01', title: 'Student Performance Analysis', description: 'Analyzed student exam scores using Python and Pandas.', tech_stack: ['Python', 'Pandas'] }
  ],
  experience: [],
  created_at: new Date().toISOString()
};

describe('Phase 7.X+: Gap Action Plan Engine', () => {

  describe('1. Prerequisite skipping using real candidate evidence', () => {
    it('TEST 1: Candidate with Python + Pandas verified does not start at Python fundamentals', async () => {
      const result = await generateGapActionPlan({
        profile: CANDIDATE,
        targetCareerTitle: 'Python Backend Developer',
        gapCapabilityKey: 'PySpark / Data Pipelines',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(result.kind).toBe('PLAN');
      const plan = (result as { kind: 'PLAN'; plan: GapActionPlan }).plan;

      const pythonStep = plan.prerequisite_chain.find(s => s.label === 'Python');
      const pandasStep = plan.prerequisite_chain.find(s => s.label === 'Pandas');
      expect(pythonStep?.is_satisfied).toBe(true);
      expect(pandasStep?.is_satisfied).toBe(true);
      expect(pythonStep?.is_starting_point).toBe(false);
      expect(pandasStep?.is_starting_point).toBe(false);
    });
  });

  describe('2. Missing PySpark creates a PySpark-specific learning plan', () => {
    it('TEST 2: Generates a non-generic PySpark / Data Pipelines plan', async () => {
      const result = await generateGapActionPlan({
        profile: CANDIDATE,
        targetCareerTitle: 'Python Backend Developer',
        gapCapabilityKey: 'PySpark / Data Pipelines',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(result.kind).toBe('PLAN');
      const plan = (result as { kind: 'PLAN'; plan: GapActionPlan }).plan;

      expect(plan.gap_capability_name).toContain('PySpark');
      expect(plan.learning_phases.length).toBeGreaterThanOrEqual(4);
      const allTopics = plan.learning_phases.flatMap(p => p.topics).join(' ').toLowerCase();
      expect(allTopics).toContain('spark architecture');
      expect(allTopics).toContain('dataframes');

      // Every task follows ACTION -> PRACTICE -> DELIVERABLE -> VERIFICATION, never a bare "Learn X."
      for (const phase of plan.learning_phases) {
        for (const task of phase.tasks) {
          expect(task.action.length).toBeGreaterThan(0);
          expect(task.practice.length).toBeGreaterThan(0);
          expect(task.deliverable.length).toBeGreaterThan(0);
          expect(task.verification.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('3. Prerequisite ordering', () => {
    it('TEST 3: Missing prerequisite appears before its dependent skill in the chain', async () => {
      const result = await generateGapActionPlan({
        profile: CANDIDATE,
        targetCareerTitle: 'Python Backend Developer',
        gapCapabilityKey: 'PySpark / Data Pipelines',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(result.kind).toBe('PLAN');
      const plan = (result as { kind: 'PLAN'; plan: GapActionPlan }).plan;
      const labels = plan.prerequisite_chain.map(s => s.label);

      expect(labels.indexOf('Python')).toBeLessThan(labels.indexOf('Pandas'));
      expect(labels.indexOf('Pandas')).toBeLessThan(labels.indexOf('PySpark'));
      expect(labels.indexOf('PySpark')).toBeLessThan(labels.indexOf('Spark ETL'));

      // Exactly one starting point, and it is the first unsatisfied node.
      const startingPoints = plan.prerequisite_chain.filter(s => s.is_starting_point);
      expect(startingPoints.length).toBe(1);
      const startIdx = plan.prerequisite_chain.findIndex(s => s.is_starting_point);
      expect(plan.prerequisite_chain.slice(0, startIdx).every(s => s.is_satisfied)).toBe(true);
    });
  });

  describe('4. Hard eligibility safety', () => {
    it('TEST 4: An eligibility blocker gap does NOT produce a learning plan', async () => {
      const result = await generateGapActionPlan({
        profile: CANDIDATE, // has only Bachelor's degree
        targetCareerTitle: 'Machine Learning Engineer',
        gapCapabilityKey: 'Mandatory Education Degree',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(result.kind).toBe('ELIGIBILITY_BLOCKER');
      if (result.kind === 'ELIGIBILITY_BLOCKER') {
        expect(result.blocker.classification).toBe('ELIGIBILITY_BLOCKER');
        expect(result.blocker.explanation).toContain('cannot be resolved through skill learning');
      }
    });
  });

  describe('5. Market evidence traceability', () => {
    it('TEST 5: Market-derived gap maps to real, traceable opportunity evidence', async () => {
      const result = await generateGapActionPlan({
        profile: CANDIDATE,
        targetCareerTitle: 'Python Backend Developer',
        gapCapabilityKey: 'PySpark / Data Pipelines',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(result.kind).toBe('PLAN');
      const plan = (result as { kind: 'PLAN'; plan: GapActionPlan }).plan;

      expect(plan.market_evidence.total_target_opportunities_count).toBeGreaterThan(0);
      expect(plan.market_evidence.opportunities_requiring_count).toBeGreaterThan(0);
      expect(plan.market_evidence.related_opportunity_details.length).toBeGreaterThan(0);
      expect(plan.market_evidence.related_opportunity_details[0].title).toBeDefined();
      expect(plan.market_evidence.related_opportunity_details[0].organization).toBeDefined();
    });
  });

  describe('6. Project -> Gap connection', () => {
    it('TEST 6: Recommended project explicitly states which gap it closes', async () => {
      const result = await generateGapActionPlan({
        profile: CANDIDATE,
        targetCareerTitle: 'Python Backend Developer',
        gapCapabilityKey: 'PySpark / Data Pipelines',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(result.kind).toBe('PLAN');
      const plan = (result as { kind: 'PLAN'; plan: GapActionPlan }).plan;

      expect(plan.project_blueprint).toBeDefined();
      expect(plan.project_blueprint!.closes_gap_capabilities).toContain(plan.gap_capability_name);
      expect(plan.project_blueprint!.closes_gap_count).toBeGreaterThanOrEqual(1);
      expect(plan.project_blueprint!.expected_evidence).toContain('GitHub repository');
    });
  });

  describe('7. Non-mutation invariant', () => {
    it('TEST 7: Generating a plan does not mutate the candidate profile', async () => {
      const originalSkillCount = CANDIDATE.skills.length;
      const originalProjectCount = CANDIDATE.projects.length;

      await generateGapActionPlan({
        profile: CANDIDATE,
        targetCareerTitle: 'Python Backend Developer',
        gapCapabilityKey: 'PySpark / Data Pipelines',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(CANDIDATE.skills.length).toBe(originalSkillCount);
      expect(CANDIDATE.projects.length).toBe(originalProjectCount);
    });
  });

  describe('8. Determinism', () => {
    it('TEST 8: Same input produces the same output (aside from the generated_at timestamp)', async () => {
      const opts = {
        profile: CANDIDATE,
        targetCareerTitle: 'Python Backend Developer',
        gapCapabilityKey: 'PySpark / Data Pipelines',
        opportunities: SEED_OPPORTUNITIES
      };

      const r1 = await generateGapActionPlan(opts);
      const r2 = await generateGapActionPlan(opts);

      expect(r1.kind).toBe('PLAN');
      expect(r2.kind).toBe('PLAN');
      // Exclude generated_at (timestamp) and the nested project recommendation's
      // id (project_recommendation_engine's own deterministic-content-but-random-id
      // fallback generator, unrelated to this engine's determinism) from comparison.
      const normalize = (plan: any) => ({
        ...plan,
        generated_at: null,
        project_blueprint: plan.project_blueprint ? {
          ...plan.project_blueprint,
          recommendation: { ...plan.project_blueprint.recommendation, id: null }
        } : plan.project_blueprint
      });
      const p1 = normalize((r1 as any).plan);
      const p2 = normalize((r2 as any).plan);
      expect(p1).toEqual(p2);
    });
  });

  describe('9. Unsupported career', () => {
    it('TEST 9: An uncatalogued career with no active opportunities returns NOT_FOUND (insufficient market data)', async () => {
      const result = await generateGapActionPlan({
        profile: CANDIDATE,
        targetCareerTitle: 'Teacher',
        gapCapabilityKey: 'Anything',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(result.kind).toBe('NOT_FOUND');
    });
  });

  describe('10. Career switching regenerates the plan', () => {
    it('TEST 10: Changing target career changes which gaps/plans are available (never reuses a stale plan)', async () => {
      const dataAnalystResult = await generateGapActionPlan({
        profile: CANDIDATE,
        targetCareerTitle: 'Data Analyst',
        gapCapabilityKey: 'PySpark / Data Pipelines',
        opportunities: SEED_OPPORTUNITIES
      });
      // PySpark / Data Pipelines is not a Data Analyst-relevant gap in this repo's real seed
      // data (the opportunity that requires it only matches the Python Backend Developer family).
      expect(dataAnalystResult.kind).toBe('NOT_FOUND');

      const backendResult = await generateGapActionPlan({
        profile: CANDIDATE,
        targetCareerTitle: 'Python Backend Developer',
        gapCapabilityKey: 'PySpark / Data Pipelines',
        opportunities: SEED_OPPORTUNITIES
      });
      expect(backendResult.kind).toBe('PLAN');
    });
  });

  describe('11. Progress state transitions', () => {
    it('TEST 11: Local learning stage transitions and derived composite stage progress correctly', () => {
      // vitest runs this suite in a plain Node environment (no `window`), so
      // install a minimal in-memory localStorage stub -- mirrors how the
      // module already degrades to a no-op when window is unavailable
      // (e.g. SSR), but lets us exercise the real read/write path here.
      const store = new Map<string, string>();
      (globalThis as any).window = {
        localStorage: {
          getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
          setItem: (k: string, v: string) => { store.set(k, v); },
          removeItem: (k: string) => { store.delete(k); }
        }
      };

      try {
        const planId = 'gap_plan_test_progress';
        expect(getLocalLearningStage(planId)).toBe('NOT_STARTED');

        setLocalLearningStage(planId, 'LEARNING');
        expect(getLocalLearningStage(planId)).toBe('LEARNING');

        setLocalLearningStage(planId, 'PRACTICING');
        expect(getLocalLearningStage(planId)).toBe('PRACTICING');

        // No project verification record yet -> composite stage mirrors local stage.
        expect(deriveLearningPlanStage(planId, undefined, false)).toBe('PRACTICING');
      } finally {
        delete (globalThis as any).window;
      }
    });
  });

  describe('12. Project verification stays separate from candidate evidence', () => {
    it('TEST 12: Composite stage is driven by the real ProjectVerificationRecord, never self-declared VERIFIED', () => {
      const planId = 'gap_plan_test_separation';

      const submittedRecord: ProjectVerificationRecord = {
        milestone_id: 'm_2',
        project_title: 'Test Project',
        status: 'SUBMITTED_FOR_VERIFICATION',
        history: [],
        updated_at: new Date().toISOString()
      };
      expect(deriveLearningPlanStage(planId, submittedRecord, false)).toBe('PROJECT_SUBMITTED');
      expect(deriveLearningPlanStage(planId, submittedRecord, false)).not.toBe('VERIFIED');

      const verifiedRecord: ProjectVerificationRecord = { ...submittedRecord, status: 'VERIFIED' };
      expect(deriveLearningPlanStage(planId, verifiedRecord, false)).toBe('VERIFIED');

      // Even once verified, reaching READINESS_REASSESSMENT requires an explicit,
      // separate simulation acknowledgement -- never implied by verification alone.
      expect(deriveLearningPlanStage(planId, verifiedRecord, true)).toBe('READINESS_REASSESSMENT');
    });

    it('TEST 12b: A REJECTED_NEEDS_MORE_EVIDENCE record can be resubmitted (never silently stuck)', () => {
      const planId = 'gap_plan_test_rejected';
      const rejectedRecord: ProjectVerificationRecord = {
        milestone_id: 'm_2',
        project_title: 'Test Project',
        status: 'REJECTED_NEEDS_MORE_EVIDENCE',
        history: [{ from_status: 'SUBMITTED_FOR_VERIFICATION', to_status: 'REJECTED_NEEDS_MORE_EVIDENCE', changed_at: new Date().toISOString(), notes: 'Missing GitHub link' }],
        updated_at: new Date().toISOString()
      };
      // A rejected submission is never treated as verified or lost -- it folds back
      // into an active, resumable stage.
      expect(deriveLearningPlanStage(planId, rejectedRecord, false)).toBe('PROJECT_IN_PROGRESS');
      expect(rejectedRecord.history[rejectedRecord.history.length - 1].notes).toBe('Missing GitHub link');
    });
  });

  describe('13. Personalization: different candidates receive different plans', () => {
    it('TEST 13: A candidate with more verified prerequisites gets a further-along starting point and lower effort', async () => {
      const lessExperiencedCandidate: CandidateProfile = {
        ...CANDIDATE,
        skills: CANDIDATE.skills.filter(s => s.name === 'Python') // only Python verified
      };

      const r1 = await generateGapActionPlan({
        profile: lessExperiencedCandidate,
        targetCareerTitle: 'Python Backend Developer',
        gapCapabilityKey: 'PySpark / Data Pipelines',
        opportunities: SEED_OPPORTUNITIES
      });
      const r2 = await generateGapActionPlan({
        profile: CANDIDATE, // has Python, SQL, Pandas, PostgreSQL verified
        targetCareerTitle: 'Python Backend Developer',
        gapCapabilityKey: 'PySpark / Data Pipelines',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(r1.kind).toBe('PLAN');
      expect(r2.kind).toBe('PLAN');
      const p1 = (r1 as { kind: 'PLAN'; plan: GapActionPlan }).plan;
      const p2 = (r2 as { kind: 'PLAN'; plan: GapActionPlan }).plan;

      const startLabel1 = p1.prerequisite_chain.find(s => s.is_starting_point)?.label;
      const startLabel2 = p2.prerequisite_chain.find(s => s.is_starting_point)?.label;
      expect(startLabel1).not.toBe(startLabel2);
      // The candidate with fewer verified prerequisites starts earlier in the chain
      // and therefore has a strictly higher learning-hours estimate.
      expect(p1.effort_estimate.learning_hours).toBeGreaterThan(p2.effort_estimate.learning_hours);
    });
  });

  describe('14. Resource recommendations', () => {
    it('TEST 14: Provides structured, categorized resources with no fabricated URLs', async () => {
      const result = await generateGapActionPlan({
        profile: CANDIDATE,
        targetCareerTitle: 'Python Backend Developer',
        gapCapabilityKey: 'PySpark / Data Pipelines',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(result.kind).toBe('PLAN');
      const plan = (result as { kind: 'PLAN'; plan: GapActionPlan }).plan;

      expect(plan.resource_recommendations.length).toBeGreaterThan(0);
      for (const resource of plan.resource_recommendations) {
        expect(['OFFICIAL_DOCUMENTATION', 'COURSE', 'TUTORIAL', 'PRACTICE_PLATFORM', 'DATASET', 'REFERENCE']).toContain(resource.resource_type);
        expect(resource.description).not.toMatch(/https?:\/\//i);
      }
    });
  });

  describe('15. "Already verified" personalization proof', () => {
    it('TEST 15: already_verified_skills reflects real candidate skills and excludes the gap itself', async () => {
      const result = await generateGapActionPlan({
        profile: CANDIDATE,
        targetCareerTitle: 'Python Backend Developer',
        gapCapabilityKey: 'PySpark / Data Pipelines',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(result.kind).toBe('PLAN');
      const plan = (result as { kind: 'PLAN'; plan: GapActionPlan }).plan;

      expect(plan.already_verified_skills).toEqual(expect.arrayContaining(['Python', 'SQL', 'Pandas', 'PostgreSQL']));
      expect(plan.already_verified_skills).not.toContain(plan.gap_capability_name);
    });
  });
});
