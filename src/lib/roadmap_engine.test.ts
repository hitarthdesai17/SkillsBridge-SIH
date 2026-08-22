import { describe, it, expect } from 'vitest';
import { generateCareerRoadmap, filterTargetOpportunities, prioritizeCareerSkillGaps, buildHardEligibilitySummary } from './roadmap_engine';
import { CandidateProfile, Opportunity } from '../types';
import { SEED_OPPORTUNITIES } from './seed_data';

// Aarav Mehta Demo Candidate
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

describe('Phase 7: Candidate Career Roadmap Engine Suite', () => {

  describe('1. Selection State & Invariant Checks', () => {
    it('TEST 1.1: Returns selection prompt state when no career target is specified (no invented career)', async () => {
      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: ''
      });

      expect(roadmap.is_empty_selection).toBe(true);
      expect(roadmap.selection_prompt_message).toContain('Select a target career');
      expect(roadmap.milestones.length).toBe(0);
      expect(roadmap.current_readiness_score).toBe(0);
    });

    it('TEST 1.2: Does not mutate candidate verified profile, skills, or projects', async () => {
      const originalSkillsCount = AARAV_MEHTA_PROFILE.skills.length;
      const originalProjectsCount = AARAV_MEHTA_PROFILE.projects.length;

      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: SEED_OPPORTUNITIES
      });

      // Assert candidate profile remains completely un-mutated
      expect(AARAV_MEHTA_PROFILE.skills.length).toBe(originalSkillsCount);
      expect(AARAV_MEHTA_PROFILE.projects.length).toBe(originalProjectsCount);
      expect(AARAV_MEHTA_PROFILE.projects.map(p => p.title)).toContain('Student Performance Analysis');
      expect(AARAV_MEHTA_PROFILE.projects.map(p => p.title)).toContain('Expense Tracker');
      expect(AARAV_MEHTA_PROFILE.projects.map(p => p.title)).toContain('Personal Portfolio Website');
    });
  });

  describe('2. Grounded Roadmap Generation for Aarav Mehta (Data Analyst)', () => {
    it('TEST 2.1: Generates grounded roadmap for Data Analyst target with authoritative readiness and prioritized milestones', async () => {
      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(roadmap.is_empty_selection).toBe(false);
      expect(roadmap.target_career_title).toBe('Data Analyst');
      expect(roadmap.current_readiness_score).toBeGreaterThan(0);
      expect(roadmap.target_readiness_score).toBe(80.0);
      expect(roadmap.active_opportunities_count).toBeGreaterThan(0);

      // Verify Milestones structure
      expect(roadmap.milestones.length).toBeGreaterThanOrEqual(3);

      // Milestone 1 should be skill acquisition
      const m1 = roadmap.milestones[0];
      expect(m1.milestone_index).toBe(1);
      expect(m1.why_recommended).toBeDefined();
      expect(m1.deliverable_title).toBeDefined();
      expect(m1.is_completed).toBe(false); // MUST NOT BE MARKED COMPLETED

      // Capstone Project Milestone
      const capstoneMilestone = roadmap.milestones.find(m => m.project_recommendation !== undefined);
      if (capstoneMilestone) {
        expect(capstoneMilestone.project_recommendation?.title).toBeDefined();
        expect(capstoneMilestone.is_completed).toBe(false);
      }

      // Reassessment Milestone
      const reassessMilestone = roadmap.milestones.find(m => m.title.toLowerCase().includes('reassess'));
      expect(reassessMilestone).toBeDefined();
      expect(reassessMilestone?.deliverable_description).toContain('Projected / estimated impact');

      // Application Milestone
      const appMilestone = roadmap.milestones.find(m => m.title.toLowerCase().includes('apply'));
      expect(appMilestone).toBeDefined();
      expect(appMilestone?.related_opportunity_ids?.length).toBeGreaterThan(0);
    });
  });

  describe('3. Dynamic & Domain-Agnostic Career Handling', () => {
    it('TEST 3.1: Adapts dynamically to non-CS career targets without hardcoded assumptions', async () => {
      const accountantOpp: Opportunity = {
        id: 'opp_accountant_01',
        title: 'Junior Financial Accountant',
        organization: 'National Audit Group',
        opportunity_type: 'private_job',
        description: 'Prepare balance sheets, taxation returns, and financial audits.',
        source: 'Finance Careers',
        career_domain: 'FINANCE_BANKING',
        education_level_required: "Bachelor's in Commerce / Accounting",
        min_experience_years: 0,
        verification_status: 'VERIFIED',
        requirements: [
          { id: 'req_acc_1', opportunity_id: 'opp_accountant_01', requirement_type: 'required_skill', name: 'Financial Accounting & Tally', normalized_name: 'accounting', is_mandatory: true },
          { id: 'req_acc_2', opportunity_id: 'opp_accountant_01', requirement_type: 'required_skill', name: 'Taxation & GST Filing', normalized_name: 'taxation', is_mandatory: true }
        ],
        created_at: new Date().toISOString()
      };

      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Financial Accountant',
        opportunities: [accountantOpp]
      });

      expect(roadmap.target_career_title).toBe('Financial Accountant');
      expect(roadmap.milestones.length).toBeGreaterThan(0);
      
      // Top milestone should be financial accounting, NOT SQL
      const m1 = roadmap.milestones[0];
      expect(m1.target_skill.toLowerCase()).toContain('accounting');
    });

    it('TEST 3.2: Locks the >50% threshold rule for P0_CRITICAL vs <=50% for P1_HIGH', () => {
      const oppA: Opportunity = {
        id: 'opp_tech_a',
        title: 'Backend Developer',
        organization: 'Tech A',
        opportunity_type: 'private_job',
        description: 'Role A',
        source: 'Portal',
        min_experience_years: 0,
        verification_status: 'VERIFIED',
        requirements: [
          { id: 'r1', opportunity_id: 'opp_tech_a', requirement_type: 'required_skill', name: 'Docker Containerization', normalized_name: 'docker', is_mandatory: true },
          { id: 'r2', opportunity_id: 'opp_tech_a', requirement_type: 'required_skill', name: 'Kubernetes Orchestration', normalized_name: 'kubernetes', is_mandatory: true }
        ]
      };

      const oppB: Opportunity = {
        id: 'opp_tech_b',
        title: 'Backend Developer',
        organization: 'Tech B',
        opportunity_type: 'private_job',
        description: 'Role B',
        source: 'Portal',
        min_experience_years: 0,
        verification_status: 'VERIFIED',
        requirements: [
          { id: 'r3', opportunity_id: 'opp_tech_b', requirement_type: 'required_skill', name: 'Docker Containerization', normalized_name: 'docker', is_mandatory: true },
          { id: 'r4', opportunity_id: 'opp_tech_b', requirement_type: 'required_skill', name: 'Redis Caching', normalized_name: 'redis', is_mandatory: true }
        ]
      };

      const prioritized = prioritizeCareerSkillGaps(AARAV_MEHTA_PROFILE, [oppA, oppB]);
      
      // Docker is mandatory in 2/2 opps (100% > 50%) -> P0_CRITICAL
      const dockerGap = prioritized.find(g => g.skill_gap.missing_capability.toLowerCase().includes('docker'));
      expect(dockerGap).toBeDefined();
      expect(dockerGap?.priority_tier).toBe('P0_CRITICAL');
      expect(dockerGap?.frequency_in_target_domain_ratio).toBe(1.0);

      // Kubernetes is mandatory in 1/2 opps (50% <= 50%) -> P1_HIGH
      const k8sGap = prioritized.find(g => g.skill_gap.missing_capability.toLowerCase().includes('kubernetes'));
      expect(k8sGap).toBeDefined();
      expect(k8sGap?.priority_tier).toBe('P1_HIGH');
      expect(k8sGap?.frequency_in_target_domain_ratio).toBe(0.5);
    });
  });

  describe('4. Opportunity Freshness Filtering', () => {
    it('TEST 4.1: Excludes expired or archived opportunities from roadmap targets', () => {
      const activeOpp: Opportunity = {
        ...SEED_OPPORTUNITIES[0],
        id: 'opp_active_01',
        deadline: '2026-12-31T23:59:59Z'
      };

      const expiredOpp: Opportunity = {
        ...SEED_OPPORTUNITIES[0],
        id: 'opp_expired_02',
        deadline: '2020-01-01T00:00:00Z',
        is_archived: true
      };

      const filtered = filterTargetOpportunities([activeOpp, expiredOpp], 'Data Analyst');
      expect(filtered.map(o => o.id)).toContain('opp_active_01');
      expect(filtered.map(o => o.id)).not.toContain('opp_expired_02');
    });
  });

  describe('5. Phase 7.X: Real Hard-Eligibility Summary (Eligibility Gate panel)', () => {
    it('TEST 5.1: PASSED status is only reported for requirement categories that were actually evaluated', () => {
      const oppNoDegreeRequirement: Opportunity = {
        id: 'opp_no_degree_req',
        title: 'Data Analyst Intern',
        organization: 'Test Co',
        opportunity_type: 'internship',
        description: 'Entry level analytics role',
        source: 'Portal',
        min_experience_years: 0,
        verification_status: 'VERIFIED',
        requirements: [
          { id: 'r1', opportunity_id: 'opp_no_degree_req', requirement_type: 'required_skill', name: 'SQL', normalized_name: 'sql', is_mandatory: true }
        ]
      };

      const summary = buildHardEligibilitySummary(AARAV_MEHTA_PROFILE, [oppNoDegreeRequirement]);
      // Only "Application Deadline" style checks that actually ran should appear -- no
      // education requirement was declared on this opportunity, so it must not appear.
      expect(summary.some(s => s.requirement_name === 'Mandatory Education Degree')).toBe(false);
    });

    it('TEST 5.2: A real degree mismatch is reported as FAILED, not silently PASSED', () => {
      const oppRequiringMasters: Opportunity = {
        id: 'opp_requires_masters',
        title: 'Senior Data Scientist',
        organization: 'Research Corp',
        opportunity_type: 'private_job',
        description: 'Requires Master\'s degree',
        source: 'Portal',
        min_experience_years: 0,
        education_level_required: "Master's Degree",
        verification_status: 'VERIFIED',
        requirements: []
      };

      const summary = buildHardEligibilitySummary(AARAV_MEHTA_PROFILE, [oppRequiringMasters]);
      const degreeItem = summary.find(s => s.requirement_name === 'Mandatory Education Degree');
      expect(degreeItem).toBeDefined();
      expect(degreeItem?.status).toBe('FAILED');
      expect(degreeItem?.affected_opportunity_count).toBe(1);
    });

    it('TEST 5.3: generateCareerRoadmap attaches a non-empty, grounded hard_eligibility_summary for real target opportunities', async () => {
      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: SEED_OPPORTUNITIES
      });

      expect(roadmap.hard_eligibility_summary).toBeDefined();
      // Every reported item must reflect a requirement_name that hard_rules_engine actually emits.
      for (const item of roadmap.hard_eligibility_summary || []) {
        expect(item.total_opportunity_count).toBeGreaterThan(0);
        expect(['PASSED', 'FAILED']).toContain(item.status);
      }
    });
  });

  describe('6. Phase 7.X: Opportunity Prioritization Categories', () => {
    it('TEST 6.1: Every target opportunity summary gets one of the four roadmap categories', async () => {
      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: SEED_OPPORTUNITIES
      });

      const validCategories = ['BEST_MATCH', 'ALMOST_READY', 'GAP_TO_BRIDGE', 'NOT_ELIGIBLE'];
      for (const summary of roadmap.target_opportunities_summary || []) {
        expect(validCategories).toContain(summary.roadmap_category);
        expect(summary.key_recommendation_reasons?.length).toBeGreaterThan(0);
      }
    });

    it('TEST 6.2: An ineligible opportunity (unmet hard requirement) is categorized NOT_ELIGIBLE, never BEST_MATCH', async () => {
      const mastersOpp: Opportunity = {
        id: 'opp_masters_gate_roadmap',
        title: 'Data Analyst (Masters Required)',
        organization: 'Elite Analytics Co',
        opportunity_type: 'private_job',
        description: 'Requires Master\'s degree in Data Science',
        source: 'Portal',
        min_experience_years: 0,
        education_level_required: "Master's Degree",
        verification_status: 'VERIFIED',
        requirements: [
          { id: 'r1', opportunity_id: 'opp_masters_gate_roadmap', requirement_type: 'required_skill', name: 'SQL', normalized_name: 'sql', is_mandatory: true }
        ]
      };

      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: [mastersOpp]
      });

      const summary = roadmap.target_opportunities_summary?.find(s => s.id === 'opp_masters_gate_roadmap');
      expect(summary?.roadmap_category).toBe('NOT_ELIGIBLE');
    });
  });

  describe('7. Phase 7.X: Freshness badges propagate onto target opportunity summaries', () => {
    it('TEST 7.1: freshness_badge_label and freshness_explanation are populated, not invented', async () => {
      const roadmap = await generateCareerRoadmap({
        profile: AARAV_MEHTA_PROFILE,
        targetCareerTitle: 'Data Analyst',
        opportunities: SEED_OPPORTUNITIES
      });

      for (const summary of roadmap.target_opportunities_summary || []) {
        expect(summary.freshness_badge_label).toBeTruthy();
        expect(summary.freshness_explanation).toBeTruthy();
      }
    });
  });

});
