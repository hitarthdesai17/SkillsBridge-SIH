import { describe, it, expect } from 'vitest';
import { generateCareerRoadmap, filterTargetOpportunities, prioritizeCareerSkillGaps } from './roadmap_engine';
import { calculateOpportunityReadiness } from './readiness_engine';
import { isValidStageTransition, createApplicationTrackingItem, transitionApplicationStage } from './application_tracking_engine';
import { CandidateProfile, Opportunity } from '../types';
import { SEED_OPPORTUNITIES } from './seed_data';

// Aarav Mehta Demo Candidate (Python, SQL, HTML, CSS, Git, GitHub, Pandas)
const AARAV_MEHTA_PROFILE: CandidateProfile = {
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
    { id: 's3', profile_id: 'cand_aarav_mehta_01', name: 'HTML', normalized_name: 'html', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' },
    { id: 's4', profile_id: 'cand_aarav_mehta_01', name: 'CSS', normalized_name: 'css', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' },
    { id: 's5', profile_id: 'cand_aarav_mehta_01', name: 'Git', normalized_name: 'git', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' },
    { id: 's6', profile_id: 'cand_aarav_mehta_01', name: 'GitHub', normalized_name: 'github', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' },
    { id: 's7', profile_id: 'cand_aarav_mehta_01', name: 'Pandas', normalized_name: 'pandas', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' }
  ],
  projects: [
    { id: 'p1', profile_id: 'cand_aarav_mehta_01', title: 'Expense Tracker', description: 'Built a Python application for recording and categorizing expenses with CSV storage.', tech_stack: ['Python', 'CSV'] },
    { id: 'p2', profile_id: 'cand_aarav_mehta_01', title: 'Student Performance Analysis', description: 'Analyzed student exam scores using Python and Pandas to compute subject averages.', tech_stack: ['Python', 'Pandas'] },
    { id: 'p3', profile_id: 'cand_aarav_mehta_01', title: 'Personal Portfolio Website', description: 'Developed responsive personal portfolio hosted on GitHub Pages.', tech_stack: ['HTML', 'CSS', 'GitHub'] }
  ],
  experience: [],
  created_at: new Date().toISOString()
};

// Candidate B: React & TypeScript Frontend Developer
const PRIYA_SHARMA_PROFILE: CandidateProfile = {
  id: 'cand_priya_sharma_02',
  user_id: 'usr_priya_sharma',
  full_name: 'Priya Sharma',
  email: 'priya.sharma@example.com',
  education_level: "Bachelor's Degree",
  education_field: 'Information Technology',
  graduation_year: 2025,
  career_domain: 'SOFTWARE_ENGINEERING',
  skills: [
    { id: 'ps1', profile_id: 'cand_priya_sharma_02', name: 'React.js', normalized_name: 'react', proficiency_level: 'advanced', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' },
    { id: 'ps2', profile_id: 'cand_priya_sharma_02', name: 'TypeScript', normalized_name: 'typescript', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' },
    { id: 'ps3', profile_id: 'cand_priya_sharma_02', name: 'CSS', normalized_name: 'css', proficiency_level: 'advanced', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' }
  ],
  projects: [
    { id: 'pp1', profile_id: 'cand_priya_sharma_02', title: 'E-commerce UI Component Library', description: 'React design system with accessibility support.', tech_stack: ['React.js', 'TypeScript', 'CSS'] }
  ],
  experience: [],
  created_at: new Date().toISOString()
};

describe('Phase 7: Presentation Readiness & Product Differentiation Suite', () => {

  describe('1. Candidate-Specific Personalization & Differentiation', () => {
    it('TEST 1.1: Generates completely distinct roadmaps for two candidates with different verified skills', async () => {
      const aaravRoadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: SEED_OPPORTUNITIES
      });

      const priyaRoadmap = await generateCareerRoadmap({
        profile: PRIYA_SHARMA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: SEED_OPPORTUNITIES
      });

      // Aarav has verified Python + Pandas + SQL, so his readiness is higher and his gap is Data Visualization / BI.
      // Priya has only React + TypeScript + CSS, so her readiness is lower and her top P0 gap is Python / SQL.
      expect(aaravRoadmap.current_readiness_score).toBeGreaterThan(priyaRoadmap.current_readiness_score);
      expect(aaravRoadmap.milestones[0].target_skill).not.toEqual(priyaRoadmap.milestones[0].target_skill);
      expect(priyaRoadmap.milestones[0].target_skill.toLowerCase()).toContain('python');
      expect(aaravRoadmap.milestones[0].target_skill.toLowerCase()).not.toContain('python');
    });

    it('TEST 1.2: Market demand percentage is calculated from actual target opportunities, not hardcoded', () => {
      const dataOpps = SEED_OPPORTUNITIES.filter(o => o.title.toLowerCase().includes('data') && !o.title.toLowerCase().includes('closed'));
      const prioritized = prioritizeCareerSkillGaps(AARAV_MEHTA_PROFILE, dataOpps);

      for (const gap of prioritized) {
        expect(gap.total_target_opportunities_count).toBe(dataOpps.length);
        expect(gap.opportunities_requiring_count).toBeGreaterThan(0);
        expect(gap.opportunities_requiring_count).toBeLessThanOrEqual(dataOpps.length);
        
        const expectedDemand = Math.round(((gap.opportunities_requiring_count || 0) / dataOpps.length) * 100);
        expect(gap.demand_percentage).toBe(expectedDemand);
      }
    });

    it('TEST 1.3: Requirement explanations reference actual opportunity IDs and titles', async () => {
      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(roadmap.critical_gaps_summary).toBeDefined();
      expect(roadmap.critical_gaps_summary!.length).toBeGreaterThan(0);

      const topGap = roadmap.critical_gaps_summary![0];
      expect(topGap.related_opportunity_ids?.length).toBeGreaterThan(0);

      for (const oppId of topGap.related_opportunity_ids!) {
        const found = SEED_OPPORTUNITIES.some(o => o.id === oppId);
        expect(found).toBe(true);
      }
    });
  });

  describe('2. Eligibility vs Skill Gap Strict Separation', () => {
    it('TEST 2.1: Master\'s degree blocker is classified as ELIGIBILITY_BLOCKER and NOT_ELIGIBLE, never a learnable 2-week skill gap', () => {
      const mlOpp: Opportunity = {
        id: 'opp_ml_masters_req',
        title: 'Senior ML Scientist',
        organization: 'Research AI Corp',
        opportunity_type: 'private_job',
        description: 'Requires Master\'s degree in Computer Science.',
        source: 'Portal',
        min_experience_years: 0,
        education_level_required: "Master's Degree",
        verification_status: 'VERIFIED',
        requirements: [
          { id: 'req_m1', opportunity_id: 'opp_ml_masters_req', requirement_type: 'hard_eligibility', name: "Master's Degree in CS/AI", normalized_name: 'masters', is_mandatory: true },
          { id: 'req_m2', opportunity_id: 'opp_ml_masters_req', requirement_type: 'required_skill', name: 'PyTorch Deep Learning', normalized_name: 'pytorch', is_mandatory: true }
        ]
      };

      const prioritized = prioritizeCareerSkillGaps(AARAV_MEHTA_PROFILE, [mlOpp]);
      const degreeGap = prioritized.find(g => g.is_eligibility_blocker);

      expect(degreeGap).toBeDefined();
      expect(degreeGap?.market_requirement_level).toBe('ELIGIBILITY_BLOCKER');
      expect(degreeGap?.gap_action_classification).toBe('NOT_ELIGIBLE');
      expect(degreeGap?.eligibility_guidance).toContain('binary prerequisite');
    });

    it('TEST 2.2: Generates Milestone 1 targeting learnable skill gap, skipping un-learnable hard eligibility blockers', async () => {
      const mlOpp: Opportunity = {
        id: 'opp_ml_masters_req',
        title: 'Machine Learning Engineer',
        organization: 'Research AI Corp',
        opportunity_type: 'private_job',
        description: 'Requires Master\'s degree in CS.',
        source: 'Portal',
        min_experience_years: 0,
        education_level_required: "Master's Degree",
        verification_status: 'VERIFIED',
        requirements: [
          { id: 'req_m1', opportunity_id: 'opp_ml_masters_req', requirement_type: 'hard_eligibility', name: "Master's Degree in CS/AI", normalized_name: 'masters', is_mandatory: true },
          { id: 'req_m2', opportunity_id: 'opp_ml_masters_req', requirement_type: 'required_skill', name: 'PyTorch Deep Learning', normalized_name: 'pytorch', is_mandatory: true }
        ]
      };

      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Machine Learning Engineer',
        opportunities: [mlOpp]
      });

      // Milestone 1 must focus on PyTorch (the learnable skill), not "Master's Degree"
      const m1 = roadmap.milestones[0];
      expect(m1.target_skill.toLowerCase()).toContain('pytorch');
      expect(m1.target_skill.toLowerCase()).not.toContain('degree');
    });
  });

  describe('3. Profile Immutability & Reassessment Integrity', () => {
    it('TEST 3.1: Recommended project does not mutate candidate profile or verified skills', async () => {
      const skillsBefore = JSON.stringify(AARAV_MEHTA_PROFILE.skills);
      const projectsBefore = JSON.stringify(AARAV_MEHTA_PROFILE.projects);

      await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(JSON.stringify(AARAV_MEHTA_PROFILE.skills)).toBe(skillsBefore);
      expect(JSON.stringify(AARAV_MEHTA_PROFILE.projects)).toBe(projectsBefore);
    });

    it('TEST 3.2: Reassessment uses authoritative readiness engine and distinguishes projected vs verified impact', async () => {
      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(roadmap.readiness_breakdown).toBeDefined();
      expect(roadmap.readiness_breakdown?.skill_match_score).toBeGreaterThan(0);
      expect(roadmap.readiness_breakdown?.evidence_proof_score).toBeGreaterThan(0);

      // Verify Milestone 3 explicitly labels projected impact
      const reassessMilestone = roadmap.milestones.find(m => m.title.toLowerCase().includes('reassess'));
      expect(reassessMilestone).toBeDefined();
      expect(reassessMilestone?.deliverable_description).toContain('Projected / estimated impact');
    });
  });

  describe('4. Opportunity Freshness & Traceability', () => {
    it('TEST 4.1: Excludes expired and archived opportunities from active roadmap target summaries', async () => {
      const activeOpp: Opportunity = {
        ...SEED_OPPORTUNITIES[0],
        id: 'opp_active_target',
        title: 'Junior Data Analyst',
        deadline: '2026-12-31T23:59:59Z'
      };

      const expiredOpp: Opportunity = {
        ...SEED_OPPORTUNITIES[0],
        id: 'opp_expired_target',
        title: 'Junior Data Analyst (Expired)',
        deadline: '2020-01-01T00:00:00Z',
        is_archived: true
      };

      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: [activeOpp, expiredOpp]
      });

      const summaryIds = (roadmap.target_opportunities_summary || []).map(s => s.id);
      expect(summaryIds).toContain('opp_active_target');
      expect(summaryIds).not.toContain('opp_expired_target');
    });

    it('TEST 4.2: Deadline displayed in roadmap matches source opportunity deadline', async () => {
      const testDeadline = '2026-11-30T23:59:59Z';
      const oppWithDeadline: Opportunity = {
        ...SEED_OPPORTUNITIES[0],
        id: 'opp_deadline_test',
        title: 'Data Analyst Intern',
        deadline: testDeadline
      };

      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: [oppWithDeadline]
      });

      const matchedSummary = roadmap.target_opportunities_summary?.find(s => s.id === 'opp_deadline_test');
      expect(matchedSummary?.deadline).toBe(testDeadline);
    });
  });

  describe('5. Application Tracking Integration', () => {
    it('TEST 5.1: Allows valid transitions SAVED -> PREPARING -> APPLIED and rejects invalid transition SAVED -> INTERVIEWING', () => {
      expect(isValidStageTransition('SAVED', 'PREPARING')).toBe(true);
      expect(isValidStageTransition('PREPARING', 'APPLIED')).toBe(true);
      expect(isValidStageTransition('SAVED', 'INTERVIEWING')).toBe(false);
      expect(isValidStageTransition('SAVED', 'OFFER')).toBe(false);
    });

    it('TEST 5.2: Transitioning application records audit history without mutating source opportunity', () => {
      const opp = SEED_OPPORTUNITIES[0];
      const trackingItem = createApplicationTrackingItem({
        user_id: 'usr_aarav_mehta',
        opportunity: opp,
        stage: 'SAVED'
      });

      expect(trackingItem.stage).toBe('SAVED');
      expect(trackingItem.status_history?.length).toBe(1);

      const result = transitionApplicationStage(trackingItem, 'PREPARING', {
        notes: 'Finalized custom portfolio repository link'
      });

      expect(result.success).toBe(true);
      expect(result.item.stage).toBe('PREPARING');
      expect(result.item.status_history?.length).toBe(2);
      expect(result.item.status_history?.[1].to_stage).toBe('PREPARING');
    });
  });

  describe('6. Non-CS and Competitive Exam Pathways', () => {
    it('TEST 6.1: Generates grounded roadmap for non-CS career (Financial Accountant) without hardcoded software assumptions', async () => {
      const accountantOpp: Opportunity = {
        id: 'opp_accountant_p7',
        title: 'Junior Financial Accountant',
        organization: 'National Audit Firm',
        opportunity_type: 'private_job',
        description: 'Tally Prime, GST filing, and financial audit reconciliation.',
        source: 'Finance Jobs',
        career_domain: 'FINANCE_BANKING',
        min_experience_years: 0,
        verification_status: 'VERIFIED',
        requirements: [
          { id: 'r_acc1', opportunity_id: 'opp_accountant_p7', requirement_type: 'required_skill', name: 'Tally Prime Financial Accounting', normalized_name: 'tally', is_mandatory: true },
          { id: 'r_acc2', opportunity_id: 'opp_accountant_p7', requirement_type: 'required_skill', name: 'GST & Corporate Taxation', normalized_name: 'gst', is_mandatory: true }
        ]
      };

      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Financial Accountant',
        opportunities: [accountantOpp]
      });

      expect(roadmap.target_career_title).toBe('Financial Accountant');
      expect(roadmap.milestones[0].target_skill.toLowerCase()).toContain('tally');
    });

    it('TEST 6.2: Supports Competitive Exam / Government Pathways (UPSC CSE) with official sources and exam stages', async () => {
      const upscOpp = SEED_OPPORTUNITIES.find(o => o.id === 'opp_upsc_cse_04');
      expect(upscOpp).toBeDefined();

      if (upscOpp) {
        const assessment = calculateOpportunityReadiness(AARAV_MEHTA_PROFILE, upscOpp);
        expect(assessment.official_source_metadata).toBeDefined();
        expect(assessment.official_source_metadata?.source_name).toContain('UPSC');
        expect(assessment.gaps.some(g => g.missing_capability.toLowerCase().includes('prelims') || g.missing_capability.toLowerCase().includes('general studies'))).toBe(true);
      }
    });
  });

  describe('7. Career Relevance & Clean Architecture (Part 20 Requirements)', () => {
    it('TEST 7.1: Data Analyst target excludes Cybersecurity and ML Engineer opportunities', () => {
      const filtered = filterTargetOpportunities(SEED_OPPORTUNITIES, 'Data Analyst');
      
      const hasCybersecurity = filtered.some(o => o.title.toLowerCase().includes('cybersecurity'));
      const hasMl = filtered.some(o => o.title.toLowerCase().includes('machine learning'));
      const hasDevOps = filtered.some(o => o.title.toLowerCase().includes('devops'));
      
      expect(hasCybersecurity).toBe(false);
      expect(hasMl).toBe(false);
      expect(hasDevOps).toBe(false);

      // Verify that analytics roles ARE included
      const hasDataAnalystIntern = filtered.some(o => o.id === 'opp_data_analyst_intern_01');
      const hasBiIntern = filtered.some(o => o.id === 'opp_bi_intern_02');
      expect(hasDataAnalystIntern).toBe(true);
      expect(hasBiIntern).toBe(true);
    });

    it('TEST 7.2: Data Analyst roadmap market demand is computed strictly over relevant analytics openings', async () => {
      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: SEED_OPPORTUNITIES
      });

      // No cybersecurity requirements or PyTorch should exist in critical gaps
      const hasSecurityGap = (roadmap.critical_gaps_summary || []).some(g => g.skill_gap.missing_capability.toLowerCase().includes('security'));
      const hasPytorchGap = (roadmap.critical_gaps_summary || []).some(g => g.skill_gap.missing_capability.toLowerCase().includes('pytorch'));
      
      expect(hasSecurityGap).toBe(false);
      expect(hasPytorchGap).toBe(false);
    });

    it('TEST 7.3: Project recommendation title does NOT contain "Missing <skill>"', async () => {
      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: SEED_OPPORTUNITIES
      });

      const projectMilestone = roadmap.milestones.find(m => m.project_recommendation);
      if (projectMilestone && projectMilestone.project_recommendation) {
        expect(projectMilestone.project_recommendation.title).not.toMatch(/missing/i);
        expect(projectMilestone.title).not.toMatch(/missing/i);
      }
    });

    it('TEST 7.4: Readiness percentage and readiness state always agree', async () => {
      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: SEED_OPPORTUNITIES
      });

      if (roadmap.current_readiness_score >= 80) {
        expect(['READY', 'EXAM_READY']).toContain(roadmap.readiness_state);
      } else if (roadmap.current_readiness_score >= 50) {
        expect(['ALMOST_READY', 'PREPARING']).toContain(roadmap.readiness_state);
      } else {
        expect(['NOT_READY', 'FOUNDATION', 'NOT_ELIGIBLE']).toContain(roadmap.readiness_state);
      }
    });

    it('TEST 7.5: Empty career selection does not invent a career or roadmap', async () => {
      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: '',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(roadmap.is_empty_selection).toBe(true);
      expect(roadmap.milestones.length).toBe(0);
      expect(roadmap.critical_gaps_summary?.length).toBe(0);
    });

    it('TEST 7.6: Uncataloged career with 0 matching opportunities handles gracefully without inventing data', async () => {
      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Deep Sea Submarine Pilot',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(roadmap.milestones.length).toBe(0);
      expect(roadmap.active_opportunities_count).toBe(0);
      expect(roadmap.selection_prompt_message).toContain('Insufficient structured opportunity data');
    });
  });

});
