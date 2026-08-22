export type ReadinessState = 
  | 'READY' 
  | 'ALMOST_READY' 
  | 'NOT_READY'
  | 'FOUNDATION'
  | 'PREPARING'
  | 'EXAM_READY';

export type GapType = 
  | 'SKILL_GAP'
  | 'EVIDENCE_GAP'
  | 'EXPERIENCE_GAP'
  | 'HARD_ELIGIBILITY_GAP'
  | 'EDUCATION_GAP'
  | 'CERTIFICATION_GAP'
  | 'ELIGIBILITY_GAP'
  | 'EXAM_PREPARATION_GAP'
  | 'DOMAIN_GAP'
  | 'PROJECT_GAP';

export type ExtractionConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type OpportunityType = 
  | 'private_job' 
  | 'internship' 
  | 'government' 
  | 'competitive_exam'
  | 'career_pathway'
  | 'apprenticeship';

export type PathwayCategory = 
  | 'JOB' 
  | 'GOVERNMENT_JOB' 
  | 'COMPETITIVE_EXAM' 
  | 'CAREER_PATHWAY' 
  | 'CERTIFICATION_PATHWAY' 
  | 'EDUCATION_PATHWAY';

export type CareerDomainType = 
  | 'SOFTWARE_ENGINEERING'
  | 'DATA_ANALYTICS'
  | 'AI_ML'
  | 'CYBERSECURITY'
  | 'CLOUD_DEVOPS'
  | 'IT_NETWORKING'
  | 'FINANCE_BANKING'
  | 'BUSINESS_SALES'
  | 'HEALTHCARE_MEDICINE'
  | 'FITNESS_WELLNESS'
  | 'CIVIL_GOVERNMENT'
  | 'LAW_PUBLIC_POLICY'
  | 'ENGINEERING_TRADES'
  | 'EDUCATION_RESEARCH'
  | 'CREATIVE_DESIGN'
  | 'GENERAL';

export type VerificationStatus = 'OFFICIAL' | 'VERIFIED' | 'DEMO';

export type RequirementType = 
  | 'hard_eligibility' 
  | 'required_skill' 
  | 'preferred_skill' 
  | 'experience' 
  | 'education'
  | 'exam_stage';

export type MatchTier = 
  | 'EXACT_MATCH' 
  | 'STRONG_RELATED' 
  | 'PARTIAL_MATCH' 
  | 'WEAK_RELATED' 
  | 'NO_MATCH';

export type MatchStatus = 'MATCHED' | 'PARTIAL' | 'MISSING' | 'BLOCKED';

export type MatchType = 'EXACT' | 'CANONICAL' | 'HIERARCHICAL' | 'SEMANTIC' | 'PARTIAL' | 'NONE';

export type ExperienceType = 
  | 'FULL_TIME_EMPLOYMENT' 
  | 'PART_TIME_EMPLOYMENT' 
  | 'INTERNSHIP' 
  | 'FREELANCE_CONTRACT' 
  | 'ACADEMIC_PROJECT' 
  | 'PERSONAL_PROJECT' 
  | 'VOLUNTEER' 
  | 'LEADERSHIP' 
  | 'OTHER';

export interface CanonicalExperienceItem {
  id: string;
  organization: string;
  role_title: string;
  experience_type: ExperienceType;
  duration_months: number;
  duration_years: number;
  is_current: boolean;
  description?: string;
  evidence_quotes: string[];
}

export interface ExperienceSummary {
  total_duration_months: number;
  total_duration_years: number;
  workplace_duration_months: number; // Full-time + Part-time + Internship + Contract
  workplace_duration_years: number;
  breakdown_by_type: Record<ExperienceType, number>;
  items: CanonicalExperienceItem[];
}

// ============================================================
// CANONICAL EVIDENCE LAYER (additive -- see SkillEvidence below)
// ============================================================
// `extraction_confidence` answers "how sure are we that we read this term
// off the resume correctly?" -- it is a *parsing* confidence and is HIGH
// whenever a verbatim quote backs the term. It is deliberately NOT a
// proficiency signal (readiness/gap engines already consume it that way).
//
// `evidence_strength` is the new, orthogonal axis: "how deeply did the
// candidate actually demonstrate this?". A skill can be extracted with
// HIGH confidence and still only be MENTIONED.

export type EvidenceStrength =
  | 'VERIFIED_HIGH'    // demonstrated in paid work / employment context
  | 'VERIFIED_MEDIUM'  // demonstrated in a project / internship deliverable
  | 'VERIFIED_BASIC'   // certification, coursework, or self-declared basic level
  | 'MENTIONED'        // listed in a skills section, no depth evidence
  | 'PARTIAL'          // only part of the capability is evidenced
  | 'INFERRED';        // derived from surrounding prose, never explicitly listed

export type SkillKind =
  | 'SKILL'
  | 'TOOL'
  | 'PLATFORM'
  | 'METHODOLOGY'
  | 'DOMAIN_KNOWLEDGE'
  | 'SOFT_SKILL'
  | 'LANGUAGE'
  | 'UNKNOWN';

export type EvidenceSourceType =
  | 'TECHNICAL_SKILLS_LISTING'
  | 'WORK_EXPERIENCE'
  | 'PROJECT_IMPLEMENTATION'
  | 'CERTIFICATION'
  | 'EDUCATION'
  | 'COURSEWORK'
  | 'TRAINING'
  | 'ACHIEVEMENT'
  | 'PROFESSIONAL_SUMMARY'
  | 'INTERNSHIP'
  | 'VOLUNTEER'
  | 'RESEARCH'
  | 'PORTFOLIO'
  | 'PUBLICATION'
  | 'LANGUAGES'
  | 'INTEREST_ASPIRATION'
  | 'USER_DECLARED'
  | 'UNKNOWN';

// Where a piece of profile data came from. USER_ADDED must never be
// presented as resume-derived evidence.
export type EvidenceOrigin = 'RESUME' | 'USER_ADDED';

// Depth qualifier lifted verbatim-ish from the resume wording
// ("SEO Fundamentals" -> SEO @ FUNDAMENTALS, not "Advanced SEO").
export type LevelQualifier = 'FUNDAMENTALS' | 'BASIC' | 'WORKING' | 'ADVANCED' | 'EXPERT';

export interface SkillEvidence {
  source_type: EvidenceSourceType;
  section_label: string;      // the resume's own header text, e.g. "TOOLS"
  quote: string;              // verbatim line from the resume
  strength: EvidenceStrength;
}

export interface CandidateSkill {
  id: string;
  profile_id: string;
  name: string;
  normalized_name: string;
  embedding?: number[];
  proficiency_level: 'beginner' | 'intermediate' | 'advanced';
  provenance_source: string;
  provenance_context?: string;
  extraction_confidence: ExtractionConfidence;
  source_evidence?: string;
  is_transferable?: boolean;
  transferable_to?: string[];

  // --- canonical evidence layer (all optional / backward compatible) ---
  original_term?: string;          // exact resume wording, never overwritten
  canonical_term?: string;
  normalization_reason?: string;
  skill_kind?: SkillKind;
  category?: string;
  subcategory?: string;
  domain?: CareerDomainType;
  parent_skill?: string;
  evidence_strength?: EvidenceStrength;
  level_qualifier?: LevelQualifier;
  evidence?: SkillEvidence[];
  is_unmapped?: boolean;           // legitimate term with no ontology entry yet
  suggested_category?: string;     // best guess for an UNMAPPED_SKILL
  evidence_origin?: EvidenceOrigin;
}

// A project read OFF the resume is RESUME_DERIVED. A project SkillBridge
// suggests the candidate should build is a RECOMMENDED_FUTURE_ACTION and
// lives in ProjectRecommendation -- the two must never be merged.
export type ProjectOrigin = 'RESUME_DERIVED' | 'USER_ADDED';

export interface CandidateProject {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  tech_stack: string[];
  github_url?: string;
  live_url?: string;
  origin?: ProjectOrigin;
  evidence_quote?: string;
  domain?: CareerDomainType;
  skills_demonstrated?: string[];
  evidence_source?: EvidenceSourceType;
}

export interface CandidateEducation {
  id?: string;
  profile_id?: string;
  degree: string;
  field?: string;
  institution?: string;
  start_year?: number;
  end_year?: number;
  level?: 'DOCTORATE' | 'MASTERS' | 'BACHELORS' | 'DIPLOMA' | 'HIGHER_SECONDARY' | 'SECONDARY' | 'OTHER';
  evidence_quote?: string;
  evidence_origin?: EvidenceOrigin;
}

export interface CandidateCertification {
  id?: string;
  profile_id?: string;
  name: string;
  issuer?: string;
  issued_on?: string;
  associated_skills?: string[];
  evidence_quote?: string;
  evidence_origin?: EvidenceOrigin;
}

// Measures how much *structured* information we recovered from the resume.
// This is NOT an accuracy score -- it flags "this resume clearly contains
// more than we managed to parse", which is the failure mode that produced
// two-skill profiles.
export interface ExtractionCoverage {
  coverage_percentage: number;
  skills_detected: number;
  tools_detected: number;
  soft_skills_detected: number;
  projects_detected: number;
  experience_entries_detected: number;
  education_detected: number;
  certifications_detected: number;
  unmapped_terms_detected: number;
  sections_detected: string[];
  is_low_coverage: boolean;
  warnings: string[];
}

export interface CandidateExperience {
  id: string;
  profile_id: string;
  organization: string;
  role_title: string;
  duration_months: number;
  description?: string;
  is_current?: boolean;
  experience_type?: ExperienceType;
}

export interface CandidateProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  summary?: string;
  desired_role_title?: string;
  education_level?: string;
  education_field?: string;
  graduation_year?: number;
  skills: CandidateSkill[];
  projects: CandidateProject[];
  experience: CandidateExperience[];
  experiences?: CandidateExperience[];
  experience_summary?: ExperienceSummary;
  raw_resume_text?: string;
  career_domain?: CareerDomainType;
  education?: CandidateEducation[];
  certifications?: CandidateCertification[];
  extraction_coverage?: ExtractionCoverage;
  created_at?: string;
}

export interface ParsedSkill {
  name: string;
  normalized_name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced';
  provenance_source: string;
  provenance_context: string;
  extraction_confidence: ExtractionConfidence;
  source_evidence: string;

  // --- canonical evidence layer (all optional / backward compatible) ---
  original_term?: string;
  canonical_term?: string;
  normalization_reason?: string;
  skill_kind?: SkillKind;
  category?: string;
  subcategory?: string;
  domain?: CareerDomainType;
  parent_skill?: string;
  evidence_strength?: EvidenceStrength;
  level_qualifier?: LevelQualifier;
  evidence?: SkillEvidence[];
  is_unmapped?: boolean;
  suggested_category?: string;
  evidence_origin?: EvidenceOrigin;
}

export interface ParsedProject {
  title: string;
  description: string;
  tech_stack: string[];
  github_url?: string | null;
  live_url?: string | null;
  origin?: ProjectOrigin;
  evidence_quote?: string;
  skills_demonstrated?: string[];
  evidence_source?: EvidenceSourceType;
}

export interface ParsedExperience {
  organization: string;
  role_title: string;
  duration_months?: number;
  description?: string;
  is_current?: boolean;
}

export interface ParsedResumeData {
  full_name: string;
  email: string;
  summary: string;
  desired_role_title: string;
  skills: ParsedSkill[];
  projects: ParsedProject[];
  experiences: ParsedExperience[];
  education?: CandidateEducation[];
  certifications?: CandidateCertification[];
  extraction_coverage?: ExtractionCoverage;
}

export interface OpportunityRequirement {
  id: string;
  opportunity_id: string;
  requirement_type: RequirementType;
  name: string;
  normalized_name: string;
  embedding?: number[];
  is_mandatory: boolean;
  min_years?: number;
  provenance_context?: string;
}

export interface ExplicitEligibility {
  min_age?: number;
  max_age?: number;
  required_degree?: string;
  required_field?: string;
  nationality?: string;
  location_restriction?: string;
  attempts_allowed?: number;
}

export interface OfficialSourceMetadata {
  official_source_url: string;
  source_name: string;
  last_verified_at: string;
  requires_notification_verification: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  opportunity_type: OpportunityType;
  pathway_category?: PathwayCategory;
  career_domain?: CareerDomainType;
  description: string;
  source: string;
  source_url?: string;
  deadline?: string; // ISO string
  location?: string;
  education_level_required?: string;
  min_experience_years: number;
  stipend_salary_range?: string;
  verification_status: VerificationStatus;
  source_trust_level?: SourceTrustLevel;
  published_at?: string;
  last_verified_at?: string;
  is_archived?: boolean;
  freshness_info?: OpportunityFreshnessInfo;
  explicit_eligibility?: ExplicitEligibility;
  official_source_metadata?: OfficialSourceMetadata;
  requirements: OpportunityRequirement[];
  created_at?: string;
}

export interface HardRequirementReason {
  requirement_name: string;
  status: 'PASSED' | 'FAILED';
  explanation: string;
}

export interface HardEligibilityResult {
  eligible: boolean;
  reasons: HardRequirementReason[];
}

export interface SkillMatchResult {
  requirement_name: string;
  matched_candidate_skill?: string;
  matched_skills?: string[];
  match_tier: MatchTier;
  match_type: MatchType;
  status: MatchStatus;
  match_score: number; // 0.0 to 1.0
  confidence: ExtractionConfidence;
  explanation: string;
  evidence_quotes: string[];
  is_transferable?: boolean;
}

export interface RequirementEvaluation {
  requirement_id: string;
  requirement_name: string;
  requirement_type: RequirementType;
  is_mandatory: boolean;
  status: MatchStatus;
  match_type: MatchType;
  match_score: number; // 0.0 to 1.0
  explanation: string;
  evidence_sources: string[];
  missing_aspects?: string;
}

export interface SkillGap {
  id: string;
  assessment_id?: string;
  requirement_id?: string;
  gap_type: GapType;
  missing_capability: string;
  severity: 'critical' | 'moderate' | 'minor';
  suggested_action?: string;
}

export interface ProjectRecommendation {
  id: string;
  assessment_id?: string;
  title: string;
  objective: string;
  why_recommended: string;
  skills_demonstrated: string[];
  skills_learned: string[];
  existing_strengths_leveraged: string[];
  suggested_tech_stack: string[];
  scope_deliverables: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  feasibility_score: number;
  estimated_effort_hours: number;
  expected_readiness_delta: number;
}

export interface ReadinessAssessment {
  id: string;
  profile_id: string;
  opportunity_id: string;
  readiness_state: ReadinessState;
  readiness_score: number; // 0.0 to 100.0
  hard_eligibility_passed: boolean;
  skill_match_score: number; // 0.0 to 100.0
  evidence_proof_score: number; // 0.0 to 100.0
  experience_alignment_score: number; // 0.0 to 100.0
  strengths_summary: string[];
  weaknesses_summary: string[];
  why_recommended: string;
  gaps: SkillGap[];
  requirement_evaluations?: RequirementEvaluation[];
  experience_summary?: ExperienceSummary;
  project_recommendation?: ProjectRecommendation;
  official_source_metadata?: OfficialSourceMetadata;
  created_at?: string;
}

export type ReadinessDiagnosis = ReadinessAssessment;

export interface GapAnalysisResult {
  hard_eligibility_passed: boolean;
  hard_eligibility_reasons?: HardRequirementReason[];
  gaps: SkillGap[];
  requirement_evaluations?: RequirementEvaluation[];
  strengths_summary?: string[];
  weaknesses_summary?: string[];
}

// ============================================================
// PHASE 6: ACTION, PERSONALIZATION & REAL OPPORTUNITY INTELLIGENCE
// ============================================================

export type SourceTrustLevel = 'AUTHORITATIVE' | 'TRUSTED_SECONDARY' | 'UNVERIFIED';

export type OpportunityFreshnessState = 
  | 'ACTIVE' 
  | 'EXPIRING_SOON' 
  | 'EXPIRED' 
  | 'ARCHIVED' 
  | 'UNVERIFIED_SOURCE';

export interface OpportunityFreshnessInfo {
  state: OpportunityFreshnessState;
  days_until_deadline?: number;
  is_expired: boolean;
  is_expiring_soon: boolean;
  last_verified_at?: string;
  published_at?: string;
  source_trust_level: SourceTrustLevel;
  badge_label: string;
  explanation: string;
}

export interface CandidatePreferences {
  target_career_title?: string;
  preferred_domains?: CareerDomainType[];
  preferred_opportunity_types?: OpportunityType[];
  preferred_locations?: string[];
  is_remote_only?: boolean;
  weekly_learning_hours?: number;
}

export type RankingStatus = 
  | 'HIGHLY_RECOMMENDED' 
  | 'RECOMMENDED' 
  | 'CONSIDER_PREPARING' 
  | 'NOT_RECOMMENDED' 
  | 'INELIGIBLE';

export interface PersonalizedRankingScoreBreakdown {
  readiness_component: number; // 0.0 to 100.0 (50% weight)
  preference_component: number; // 0.0 to 100.0 (25% weight)
  urgency_component: number; // 0.0 to 100.0 (15% weight)
  freshness_component: number; // 0.0 to 100.0 (10% weight)
}

export interface PersonalizedOpportunityScore {
  opportunity_id: string;
  personalized_rank_score: number; // 0.0 to 100.0
  is_recommendable: boolean; // INVARIANT: FALSE if hard eligibility fails!
  ranking_status: RankingStatus;
  readiness_assessment: ReadinessAssessment;
  freshness_info: OpportunityFreshnessInfo;
  score_breakdown: PersonalizedRankingScoreBreakdown;
  explanation: string;
  key_recommendation_reasons: string[];
}

export type GapPriorityTier = 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_OPTIONAL';
export type GapActionClassification = 'CLOSE_GAP' | 'BUILD_EVIDENCE' | 'NOT_ELIGIBLE' | 'LOW_PRIORITY';
export type MarketRequirementLevel = 'MANDATORY' | 'PREFERRED' | 'OPTIONAL' | 'ELIGIBILITY_BLOCKER';
export type CandidateRequirementStatus = 'YES' | 'PARTIAL' | 'NO';

export interface OpportunityTraceDetail {
  id: string;
  title: string;
  organization: string;
  is_mandatory: boolean;
  deadline?: string | null;
  freshness_state?: string;
  source_trust?: string;
  readiness_score?: number;
  is_eligible?: boolean;
}

export interface PrioritizedSkillGap {
  priority_tier: GapPriorityTier;
  skill_gap: SkillGap;
  frequency_in_target_domain_ratio: number; // 0.0 to 1.0
  is_mandatory: boolean;
  proximity_to_candidate: 'ADJACENT' | 'TRANSFERABLE' | 'NEW_DOMAIN';
  estimated_effort_hours: number;
  rationale: string;
  total_target_opportunities_count?: number;
  opportunities_requiring_count?: number;
  demand_percentage?: number;
  candidate_status?: CandidateRequirementStatus;
  market_requirement_level?: MarketRequirementLevel;
  gap_action_classification?: GapActionClassification;
  candidate_evidence_summary?: string;
  is_eligibility_blocker?: boolean;
  eligibility_guidance?: string;
  related_opportunity_ids?: string[];
  related_opportunity_titles?: string[];
  related_opportunity_details?: OpportunityTraceDetail[];
}

export interface LearningMilestone {
  id: string;
  milestone_index: number;
  title: string;
  target_skill: string;
  target_skill_category?: string;
  priority_tier?: GapPriorityTier;
  why_recommended?: string;
  action_steps?: string[];
  expected_outcome?: string;
  estimated_duration_weeks: number;
  learning_objectives: string[];
  deliverable_title: string;
  deliverable_description: string;
  project_recommendation?: ProjectRecommendation;
  related_opportunity_ids?: string[];
  related_opportunity_titles?: string[];
  is_completed?: boolean;
}

export interface RoadmapReadinessBreakdown {
  matched_count: number;
  missing_count: number;
  evidence_gap_count: number;
  eligibility_blocker_count: number;
  skill_match_score: number;
  evidence_proof_score: number;
  experience_score: number;
  coverage_percentage: number;
  hard_eligibility_passed: boolean;
}

// Aggregated, real (non-invented) hard-eligibility gate reasons across all target
// opportunities for the current roadmap. Built by calling the existing, protected
// hard_rules_engine.evaluateHardEligibility() per target opportunity and folding
// the results by requirement_name -- never hardcoded/static UI copy.
export interface HardEligibilitySummaryItem {
  requirement_name: string;
  status: 'PASSED' | 'FAILED';
  explanation: string;
  affected_opportunity_count: number;
  total_opportunity_count: number;
}

// Opportunity prioritization categories surfaced in the roadmap, derived from the
// existing personalized_ranking_engine ranking_status (reused, not duplicated).
export type RoadmapOpportunityCategory = 'BEST_MATCH' | 'ALMOST_READY' | 'GAP_TO_BRIDGE' | 'NOT_ELIGIBLE';

export interface RoadmapTargetOpportunitySummary {
  id: string;
  title: string;
  organization: string;
  opportunity_type: OpportunityType;
  location?: string;
  deadline?: string | null;
  verification_status: VerificationStatus;
  source_trust_level?: SourceTrustLevel;
  freshness_state?: OpportunityFreshnessState;
  freshness_badge_label?: string;
  freshness_explanation?: string;
  readiness_score: number;
  readiness_state: ReadinessState;
  is_eligible: boolean;
  ranking_status?: RankingStatus;
  roadmap_category?: RoadmapOpportunityCategory;
  key_recommendation_reasons?: string[];
}

export interface LearningRoadmap {
  id: string;
  profile_id: string;
  target_role: string;
  target_career_title?: string;
  target_domain: CareerDomainType;
  opportunity_id?: string;
  current_readiness_score: number;
  target_readiness_score: number;
  readiness_state?: ReadinessState;
  total_estimated_weeks: number;
  critical_gaps_summary?: PrioritizedSkillGap[];
  milestones: LearningMilestone[];
  active_opportunities_count?: number;
  is_empty_selection?: boolean;
  selection_prompt_message?: string;
  why_this_roadmap_narrative?: string;
  readiness_breakdown?: RoadmapReadinessBreakdown;
  hard_eligibility_summary?: HardEligibilitySummaryItem[];
  target_opportunities_summary?: RoadmapTargetOpportunitySummary[];
  created_at: string;
}

export type ApplicationStage = 
  | 'SAVED' 
  | 'PREPARING' 
  | 'APPLIED' 
  | 'INTERVIEWING' 
  | 'OFFER' 
  | 'REJECTED' 
  | 'WITHDRAWN' 
  | 'ARCHIVED';

export type ApplicationOverallState = 'READY_TO_APPLY' | 'ACTION_REQUIRED' | 'BLOCKED_INELIGIBLE';

export interface ApplicationReadiness {
  opportunity_id: string;
  tier1_eligibility_passed: boolean;
  tier2_requirement_readiness_score: number;
  tier3_evidence_readiness_score: number;
  tier4_application_package_ready: boolean;
  overall_application_state: ApplicationOverallState;
  next_recommended_action: string;
  checklist: Array<{ label: string; is_ready: boolean; reason: string }>;
}

export interface ApplicationStatusHistoryItem {
  from_stage: ApplicationStage | null;
  to_stage: ApplicationStage;
  changed_at: string;
  notes?: string;
  reason?: string;
}

export interface OpportunityTrackingItem {
  id: string;
  user_id: string;
  opportunity_id: string;
  stage: ApplicationStage;
  applied_at?: string | null;
  deadline?: string | null;
  target_submission_date?: string;
  notes?: string;
  next_action?: string;
  status_history?: ApplicationStatusHistoryItem[];
  opportunity?: Opportunity;
  readiness_summary?: { score: number; state: ReadinessState };
  updated_at: string;
  created_at: string;
}

// ============================================================
// PHASE 7.X: PROJECT VERIFICATION CHECKPOINT
// ============================================================
// Tracks a candidate's execution progress on a RECOMMENDED FUTURE ACTION project
// milestone. This state is local/UI-only (never mutates the candidate profile or
// readiness). VERIFIED can only be reached through the existing evidence
// verification path (adding the project to the candidate profile), never by a
// single "Complete" click -- see project_verification_engine.ts.
export type ProjectVerificationStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED_FOR_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED_NEEDS_MORE_EVIDENCE';

export interface ProjectVerificationHistoryItem {
  from_status: ProjectVerificationStatus | null;
  to_status: ProjectVerificationStatus;
  changed_at: string;
  notes?: string;
}

export interface ProjectVerificationRecord {
  milestone_id: string;
  project_title: string;
  status: ProjectVerificationStatus;
  history: ProjectVerificationHistoryItem[];
  updated_at: string;
}

// ============================================================
// PHASE 7.X+: GAP -> ACTION PLAN -> LEARNING -> PRACTICE -> PROJECT ->
// EVIDENCE -> VERIFICATION -> REASSESSMENT
// ============================================================
// A GapActionPlan is generated on-demand for ONE specific learnable gap
// (never for an eligibility blocker -- see GapActionPlanEligibilityBlocker).
// Every field is derived from the real candidate profile, the real
// PrioritizedSkillGap produced by roadmap_engine.prioritizeCareerSkillGaps,
// and the real ProjectRecommendation produced by
// project_recommendation_engine.generateTargetedProjectRecommendation.
// Nothing here is candidate- or market-invented; the only "authored" content
// is generic curriculum/process scaffolding (phase names, deliverable types),
// not facts about the candidate or the market.

export interface GapMarketEvidenceRef {
  opportunities_requiring_count: number;
  total_target_opportunities_count: number;
  demand_percentage: number;
  related_opportunity_details: OpportunityTraceDetail[];
}

export interface GapCurrentEvidenceItem {
  skill_name: string;
  status: 'VERIFIED' | 'NOT_VERIFIED';
  source: 'candidate_profile_skill' | 'target_capability';
}

export interface SkillDependencyStep {
  key: string;
  label: string;
  is_satisfied: boolean;
  is_starting_point: boolean;
}

export interface LearningTask {
  action: string;
  practice: string;
  deliverable: string;
  verification: string;
}

export type LearningPhaseKey = 'FOUNDATIONS' | 'APPLIED_PRACTICE' | 'PROJECT' | 'EVIDENCE';

export interface LearningPhase {
  phase_index: number;
  key: LearningPhaseKey;
  title: string;
  day_range_label: string;
  topics: string[];
  tasks: LearningTask[];
}

export interface ProjectBlueprint {
  recommendation: ProjectRecommendation; // reused from project_recommendation_engine, never duplicated
  closes_gap_capabilities: string[];
  closes_gap_count: number;
  architecture_flow: string[];
  implementation_tasks: string[];
  expected_evidence: string[];
}

// Structured resource recommendation categories. Never carries a fabricated
// URL -- if a real link isn't known, only the category + generic guidance is
// shown, leaving room for real resources to be attached later.
export type GapResourceType =
  | 'OFFICIAL_DOCUMENTATION'
  | 'COURSE'
  | 'TUTORIAL'
  | 'PRACTICE_PLATFORM'
  | 'DATASET'
  | 'REFERENCE';

export interface GapResourceRecommendation {
  resource_type: GapResourceType;
  description: string;
}

export interface GapActionPlanEffortEstimate {
  learning_hours: number;
  practice_hours: number;
  project_hours: number;
  documentation_hours: number;
  verification_hours: number;
  total_hours: number;
  estimated_duration_label: string;
}

export type LearningPlanStage =
  | 'NOT_STARTED'
  | 'LEARNING'
  | 'PRACTICING'
  | 'PROJECT_IN_PROGRESS'
  | 'PROJECT_SUBMITTED'
  | 'VERIFICATION'
  | 'VERIFIED'
  | 'READINESS_REASSESSMENT';

export interface GapActionPlan {
  id: string;
  target_career_title: string;
  gap_capability_name: string;
  priority_tier: GapPriorityTier;
  classification: 'LEARNABLE_SKILL_GAP';
  market_evidence: GapMarketEvidenceRef;
  current_evidence: GapCurrentEvidenceItem[];
  already_verified_skills: string[];
  target_statement: string;
  prerequisite_chain: SkillDependencyStep[];
  starting_point_label: string;
  learning_phases: LearningPhase[];
  project_blueprint?: ProjectBlueprint;
  effort_estimate: GapActionPlanEffortEstimate;
  resource_recommendations: GapResourceRecommendation[];
  verification_requirements: string[];
  generated_at: string;
}

export interface GapActionPlanEligibilityBlocker {
  target_career_title: string;
  gap_capability_name: string;
  classification: 'ELIGIBILITY_BLOCKER';
  explanation: string;
  eligibility_guidance?: string;
}

export type GapActionPlanResult =
  | { kind: 'PLAN'; plan: GapActionPlan }
  | { kind: 'ELIGIBILITY_BLOCKER'; blocker: GapActionPlanEligibilityBlocker }
  | { kind: 'NOT_FOUND'; message: string };

