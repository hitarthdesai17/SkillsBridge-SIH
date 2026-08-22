import {
  CandidateProfile,
  Opportunity,
  PrioritizedSkillGap,
  GapActionPlan,
  GapActionPlanResult,
  GapCurrentEvidenceItem,
  SkillDependencyStep,
  LearningPhase,
  LearningTask,
  ProjectBlueprint,
  GapActionPlanEffortEstimate,
  GapResourceRecommendation,
  ProjectRecommendation
} from '../types';
import { filterTargetOpportunities, prioritizeCareerSkillGaps } from './roadmap_engine';
import { generateTargetedProjectRecommendation } from './project_recommendation_engine';

/**
 * Deterministic skill-dependency graph used ONLY to sequence a learning plan
 * (which prerequisite comes before which). This is generic curriculum
 * structure, not candidate- or market-specific data, and is never presented
 * as evidence about any real candidate or opportunity.
 */
interface SkillDependencyNode {
  id: string;
  label: string;
  matchKeywords: string[];
  prerequisites: string[]; // node ids
}

const SKILL_DEPENDENCY_REGISTRY: Record<string, SkillDependencyNode> = {
  python: { id: 'python', label: 'Python', matchKeywords: ['python'], prerequisites: [] },
  sql: { id: 'sql', label: 'SQL', matchKeywords: ['sql'], prerequisites: [] },
  postgresql: { id: 'postgresql', label: 'PostgreSQL', matchKeywords: ['postgresql', 'postgres'], prerequisites: ['sql'] },
  pandas: { id: 'pandas', label: 'Pandas', matchKeywords: ['pandas'], prerequisites: ['python'] },
  data_processing: { id: 'data_processing', label: 'Data Processing & Wrangling', matchKeywords: ['data processing', 'data wrangling'], prerequisites: ['python', 'pandas'] },
  pyspark: { id: 'pyspark', label: 'PySpark', matchKeywords: ['pyspark', 'spark'], prerequisites: ['data_processing'] },
  spark_etl: { id: 'spark_etl', label: 'Spark ETL', matchKeywords: ['spark etl', 'etl'], prerequisites: ['pyspark'] },
  data_pipelines: { id: 'data_pipelines', label: 'PySpark / Data Pipelines', matchKeywords: ['data pipeline', 'pyspark / data pipeline', 'pyspark/data pipeline'], prerequisites: ['spark_etl', 'sql'] },
  javascript_typescript: { id: 'javascript_typescript', label: 'JavaScript / TypeScript', matchKeywords: ['javascript', 'typescript'], prerequisites: [] },
  node_rest_api: { id: 'node_rest_api', label: 'Node.js Express REST APIs', matchKeywords: ['node.js', 'express', 'rest api'], prerequisites: ['javascript_typescript'] },
  react: { id: 'react', label: 'React', matchKeywords: ['react'], prerequisites: ['javascript_typescript'] },
  docker: { id: 'docker', label: 'Docker', matchKeywords: ['docker', 'containeriz'], prerequisites: [] },
  software_testing: { id: 'software_testing', label: 'Software Testing Fundamentals', matchKeywords: ['software testing', 'qa automation', 'test automation'], prerequisites: [] },
  power_bi: { id: 'power_bi', label: 'Power BI Dashboarding & DAX', matchKeywords: ['power bi', 'dax'], prerequisites: ['sql'] },
  tableau: { id: 'tableau', label: 'Tableau', matchKeywords: ['tableau'], prerequisites: ['sql'] },
  figma: { id: 'figma', label: 'Figma UI Wireframing', matchKeywords: ['figma'], prerequisites: [] },
  machine_learning: { id: 'machine_learning', label: 'Machine Learning', matchKeywords: ['machine learning', 'ml engineer'], prerequisites: ['python', 'pandas'] }
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * Matches a real gap's capability name to a known dependency-graph node.
 * If no known node matches, synthesizes a single-node "chain" from the real
 * capability name itself -- never invents a fake skill.
 */
function resolveSkillNode(capabilityName: string): SkillDependencyNode {
  const lower = capabilityName.toLowerCase();
  let best: { node: SkillDependencyNode; matchLen: number } | undefined;

  for (const node of Object.values(SKILL_DEPENDENCY_REGISTRY)) {
    for (const keyword of node.matchKeywords) {
      if (lower.includes(keyword) && (!best || keyword.length > best.matchLen)) {
        best = { node, matchLen: keyword.length };
      }
    }
  }

  if (best) return best.node;
  return { id: slugify(capabilityName), label: capabilityName, matchKeywords: [], prerequisites: [] };
}

/**
 * Deterministic topological prerequisite chain (deepest prerequisite first,
 * target capability last). De-duplicates diamond dependencies.
 */
function buildDependencyChain(node: SkillDependencyNode): SkillDependencyNode[] {
  const visited = new Set<string>();
  const chain: SkillDependencyNode[] = [];

  function visit(n: SkillDependencyNode) {
    if (visited.has(n.id)) return;
    for (const prereqId of n.prerequisites) {
      const prereqNode = SKILL_DEPENDENCY_REGISTRY[prereqId];
      if (prereqNode) visit(prereqNode);
    }
    visited.add(n.id);
    chain.push(n);
  }

  visit(node);
  return chain;
}

/**
 * Determines whether the candidate already has verified evidence for a given
 * dependency-chain node, using the same real-profile skill/project matching
 * approach as roadmap_engine.prioritizeCareerSkillGaps -- never fabricated.
 */
function isNodeSatisfiedByCandidate(profile: CandidateProfile, node: SkillDependencyNode): boolean {
  const candSkillNames = (profile.skills || []).map(s => s.name.toLowerCase());
  const nodeLabelLower = node.label.toLowerCase();
  const keywords = node.matchKeywords.length > 0 ? node.matchKeywords : [nodeLabelLower];
  return candSkillNames.some(s => keywords.some(k => s.includes(k) || k.includes(s)));
}

// ============================================================
// Phase / Curriculum Templates
// ============================================================
// A rich, specific template exists for the capability explicitly called out
// in the Phase 7.X+ spec (PySpark / Data Pipelines) -- confirmed to be a real
// gap surfaced by this repo's own seed data (e.g. for a "Python Backend
// Developer" target career against the "Data Engineering Intern" opportunity).
// Any other capability falls back to a generic-but-skill-specific generator
// that still follows ACTION -> PRACTICE -> DELIVERABLE -> VERIFICATION and
// never says only "Learn <X>."

function pySparkDataPipelinePhases(existingSkillsStr: string): LearningPhase[] {
  return [
    {
      phase_index: 1,
      key: 'FOUNDATIONS',
      title: 'Foundations',
      day_range_label: 'Days 1-3',
      topics: ['Spark architecture', 'DataFrames', 'transformations', 'actions', 'lazy evaluation'],
      tasks: [
        {
          action: 'Learn Spark architecture, DataFrames, and the transformation/action model (lazy evaluation).',
          practice: 'Complete 5 realistic DataFrame exercises: filtering, grouping, joins, and aggregations.',
          deliverable: 'PySpark notebook containing the 5 exercises with commented output.',
          verification: 'Notebook committed to the project repository (implementation evidence).'
        }
      ]
    },
    {
      phase_index: 2,
      key: 'APPLIED_PRACTICE',
      title: 'Data Engineering',
      day_range_label: 'Days 4-7',
      topics: ['ETL', 'schema handling', 'data cleaning', 'joins', 'partitioning', 'CSV/Parquet'],
      tasks: [
        {
          action: 'Learn ETL patterns, schema handling, data cleaning, and partitioned CSV/Parquet I/O.',
          practice: 'Complete realistic data-processing exercises against a multi-file dataset (schema drift, nulls, duplicate keys).',
          deliverable: 'ETL script(s) that ingest raw files and emit a cleaned, partitioned dataset.',
          verification: 'Script(s) and sample output committed to the project repository.'
        }
      ]
    },
    {
      phase_index: 3,
      key: 'PROJECT',
      title: 'Applied Project',
      day_range_label: 'Days 8-12',
      topics: ['Retail Sales Data Pipeline', 'Raw CSV -> PySpark -> Cleaning -> Transformation -> PostgreSQL -> Analytics -> Dashboard'],
      tasks: [
        {
          action: `Build a Retail Sales Data Pipeline: Raw CSV -> PySpark -> Cleaning -> Transformation -> PostgreSQL -> Analytics -> Dashboard, leveraging your existing ${existingSkillsStr || 'programming'} experience.`,
          practice: 'Implement ingestion, cleaning, transformation, and load stages end-to-end.',
          deliverable: 'A working pipeline repository with a persisted PostgreSQL analytics table and a simple dashboard/report.',
          verification: 'Repository, run logs, and sample query results committed as evidence.'
        }
      ]
    },
    {
      phase_index: 4,
      key: 'EVIDENCE',
      title: 'Evidence',
      day_range_label: 'Days 13-14',
      topics: ['GitHub repository', 'README', 'architecture diagram', 'results', 'technical decisions'],
      tasks: [
        {
          action: 'Document the pipeline: architecture diagram, README, and an explanation of key technical decisions.',
          practice: 'Write up results (row counts processed, data quality issues found and fixed, performance notes).',
          deliverable: 'GitHub repository with README, source code, architecture diagram, and screenshots/results.',
          verification: 'Submit for verification via the Project Verification Checkpoint (does not auto-verify).'
        }
      ]
    }
  ];
}

function genericPhasesForCapability(capabilityLabel: string, existingSkillsStr: string): LearningPhase[] {
  return [
    {
      phase_index: 1,
      key: 'FOUNDATIONS',
      title: 'Foundations',
      day_range_label: 'Days 1-3',
      topics: [`Core concepts of ${capabilityLabel}`, 'Terminology and tooling', 'Reading authoritative documentation'],
      tasks: [
        {
          action: `Learn the core concepts and terminology of ${capabilityLabel}.`,
          practice: `Complete 5 introductory exercises applying ${capabilityLabel} to small, realistic tasks.`,
          deliverable: `Exercise notebook/script demonstrating baseline ${capabilityLabel} proficiency.`,
          verification: 'Notebook/script committed to the project repository (implementation evidence).'
        }
      ]
    },
    {
      phase_index: 2,
      key: 'APPLIED_PRACTICE',
      title: 'Applied Practice',
      day_range_label: 'Days 4-7',
      topics: [`Applied ${capabilityLabel} patterns`, 'Realistic data/edge cases', 'Integration with existing tools'],
      tasks: [
        {
          action: `Practice applying ${capabilityLabel} to realistic, multi-step problems${existingSkillsStr ? ` alongside your existing ${existingSkillsStr} experience` : ''}.`,
          practice: `Complete a set of intermediate exercises exercising ${capabilityLabel} in combination with at least one other tool you already use.`,
          deliverable: `Structured exercise set demonstrating applied ${capabilityLabel} usage.`,
          verification: 'Committed to the project repository as implementation evidence.'
        }
      ]
    },
    {
      phase_index: 3,
      key: 'PROJECT',
      title: 'Applied Project',
      day_range_label: 'Days 8-12',
      topics: [`Portfolio project integrating ${capabilityLabel}`],
      tasks: [
        {
          action: `Build a portfolio project whose primary purpose is to demonstrate ${capabilityLabel} in a realistic end-to-end scenario.`,
          practice: 'Implement the project scope end-to-end (see Project Blueprint below for exact tasks).',
          deliverable: 'A working project repository with a runnable implementation.',
          verification: 'Repository, run instructions, and results committed as evidence.'
        }
      ]
    },
    {
      phase_index: 4,
      key: 'EVIDENCE',
      title: 'Evidence',
      day_range_label: 'Days 13-14',
      topics: ['GitHub repository', 'README', 'architecture notes', 'results'],
      tasks: [
        {
          action: 'Document the project: README, architecture notes, and an explanation of key technical decisions.',
          practice: 'Capture screenshots/results demonstrating the working implementation.',
          deliverable: 'GitHub repository with README, source code, and screenshots/results.',
          verification: 'Submit for verification via the Project Verification Checkpoint (does not auto-verify).'
        }
      ]
    }
  ];
}

function buildLearningPhases(node: SkillDependencyNode, existingSkillsStr: string): LearningPhase[] {
  if (node.id === 'data_pipelines' || node.id === 'pyspark' || node.id === 'spark_etl') {
    return pySparkDataPipelinePhases(existingSkillsStr);
  }
  return genericPhasesForCapability(node.label, existingSkillsStr);
}

// ============================================================
// Resource Recommendations (Phase 7.Y Step 11) -- structured categories only,
// never a fabricated URL. A rich, specific set exists for the PySpark / Data
// Pipelines capability; anything else gets a generic-but-labeled set derived
// from the real capability name.
// ============================================================
function pySparkResourceRecommendations(): GapResourceRecommendation[] {
  return [
    { resource_type: 'OFFICIAL_DOCUMENTATION', description: 'Official Apache Spark documentation -- DataFrame and SQL APIs.' },
    { resource_type: 'COURSE', description: 'A structured PySpark / data engineering course covering ETL and distributed processing fundamentals.' },
    { resource_type: 'TUTORIAL', description: 'Hands-on tutorials on Spark DataFrame transformations, joins, and aggregations.' },
    { resource_type: 'PRACTICE_PLATFORM', description: 'A coding practice platform with Spark/PySpark exercises for filtering, grouping, and joins.' },
    { resource_type: 'DATASET', description: 'A realistic multi-file retail/sales dataset (CSV/Parquet) for the capstone pipeline project.' },
    { resource_type: 'REFERENCE', description: 'PostgreSQL documentation for the analytics-table load stage of the pipeline.' }
  ];
}

function genericResourceRecommendations(capabilityLabel: string): GapResourceRecommendation[] {
  return [
    { resource_type: 'OFFICIAL_DOCUMENTATION', description: `Official documentation for ${capabilityLabel}.` },
    { resource_type: 'TUTORIAL', description: `Hands-on tutorials covering core ${capabilityLabel} concepts.` },
    { resource_type: 'PRACTICE_PLATFORM', description: `A coding/practice platform with ${capabilityLabel} exercises.` },
    { resource_type: 'REFERENCE', description: `A reference guide for ${capabilityLabel} best practices.` }
  ];
}

function buildResourceRecommendations(node: SkillDependencyNode): GapResourceRecommendation[] {
  if (node.id === 'data_pipelines' || node.id === 'pyspark' || node.id === 'spark_etl') {
    return pySparkResourceRecommendations();
  }
  return genericResourceRecommendations(node.label);
}

// ============================================================
// Project Blueprint (Step 6/7) -- reuses project_recommendation_engine,
// never re-implements project generation.
// ============================================================
function buildProjectBlueprint(recommendation: ProjectRecommendation, capabilityLabel: string): ProjectBlueprint {
  const architectureFlow = recommendation.suggested_tech_stack.length > 0
    ? [...recommendation.suggested_tech_stack, 'Analytics / Results']
    : ['Raw Input', capabilityLabel, 'Processed Output'];

  const implementationTasks = [
    'Project setup & environment configuration',
    ...recommendation.scope_deliverables,
    'Testing & validation of implementation',
    'Documentation (README + architecture notes)',
    'Deployment / live demo (optional)'
  ];

  return {
    recommendation,
    closes_gap_capabilities: [capabilityLabel],
    closes_gap_count: 1,
    architecture_flow: architectureFlow,
    implementation_tasks: implementationTasks,
    expected_evidence: [
      'GitHub repository',
      'README',
      'source code',
      'notebooks/scripts',
      'screenshots',
      'architecture diagram',
      'results',
      'live demo if available'
    ]
  };
}

// ============================================================
// Effort Estimate (Step 8) -- deterministic, no fabricated precision.
// ============================================================
function estimateEffort(prerequisitesAlreadySatisfiedCount: number): GapActionPlanEffortEstimate {
  const baseLearning = 18;
  const basePractice = 10;
  const project = 14;
  const documentation = 3;
  const verification = 1;

  // Skipping already-verified prerequisites reduces (but never eliminates) the
  // learning-phase estimate, reflecting real prior evidence -- floor at 6 hours.
  const learning = Math.max(6, baseLearning - prerequisitesAlreadySatisfiedCount * 3);

  const total = learning + basePractice + project + documentation + verification;
  const hoursPerDay = 3.5;
  const days = Math.ceil(total / hoursPerDay);
  const weeks = Math.max(1, Math.ceil(days / 7));

  return {
    learning_hours: learning,
    practice_hours: basePractice,
    project_hours: project,
    documentation_hours: documentation,
    verification_hours: verification,
    total_hours: total,
    estimated_duration_label: `~${weeks} week${weeks === 1 ? '' : 's'} at 3-4 hours/day`
  };
}

export interface GenerateGapActionPlanOptions {
  profile: CandidateProfile;
  targetCareerTitle: string;
  gapCapabilityKey: string;
  opportunities?: Opportunity[];
}

/**
 * Finds the real PrioritizedSkillGap matching the requested capability key,
 * reusing roadmap_engine's own filtering/prioritization (never duplicated).
 */
export function findPrioritizedGap(
  prioritizedGaps: PrioritizedSkillGap[],
  gapCapabilityKey: string
): PrioritizedSkillGap | undefined {
  const keyLower = gapCapabilityKey.toLowerCase().trim();
  return prioritizedGaps.find(g => {
    const capLower = g.skill_gap.missing_capability.toLowerCase();
    return capLower === keyLower ||
      capLower.replace(/^missing\s+/i, '') === keyLower ||
      capLower.includes(keyLower) ||
      keyLower.includes(capLower.replace(/^missing\s+/i, ''));
  });
}

/**
 * Generates a complete, candidate-specific Gap Action Plan for ONE learnable
 * gap: Gap -> Action Plan -> Learning -> Practice -> Project -> Evidence ->
 * Verification -> Reassessment.
 *
 * CRITICAL INVARIANTS:
 * - Never called for (and never produces a learning plan for) an eligibility
 *   blocker gap -- callers must check `kind` on the returned result.
 * - Never mutates the candidate profile.
 * - Deterministic: identical inputs always produce an identical plan.
 */
export async function generateGapActionPlan(options: GenerateGapActionPlanOptions): Promise<GapActionPlanResult> {
  const { profile, targetCareerTitle, gapCapabilityKey } = options;

  const allOpps = options.opportunities || [];
  const targetOpps = filterTargetOpportunities(allOpps, targetCareerTitle);

  if (targetOpps.length === 0) {
    return { kind: 'NOT_FOUND', message: `Insufficient market data for target career "${targetCareerTitle}" -- no active opportunities to derive a gap action plan from.` };
  }

  const prioritizedGaps = prioritizeCareerSkillGaps(profile, targetOpps);
  const gap = findPrioritizedGap(prioritizedGaps, gapCapabilityKey);

  if (!gap) {
    return { kind: 'NOT_FOUND', message: `No gap matching "${gapCapabilityKey}" was found for target career "${targetCareerTitle}".` };
  }

  const capName = gap.skill_gap.missing_capability.replace(/^Missing\s+/i, '');

  // Step 11: Hard eligibility safety -- NEVER generate a learning plan for a
  // binary eligibility blocker.
  if (gap.is_eligibility_blocker) {
    return {
      kind: 'ELIGIBILITY_BLOCKER',
      blocker: {
        target_career_title: targetCareerTitle,
        gap_capability_name: capName,
        classification: 'ELIGIBILITY_BLOCKER',
        explanation: 'This requirement cannot be resolved through skill learning.',
        eligibility_guidance: gap.eligibility_guidance
      }
    };
  }

  // Step 4: Prerequisite / dependency sequencing -- skip already-verified skills.
  const node = resolveSkillNode(capName);
  const chainNodes = buildDependencyChain(node);
  const satisfiedFlags = chainNodes.map(n => isNodeSatisfiedByCandidate(profile, n));
  const firstUnsatisfiedIdx = satisfiedFlags.findIndex(s => !s);
  const startingIdx = firstUnsatisfiedIdx === -1 ? chainNodes.length - 1 : firstUnsatisfiedIdx;

  const prerequisiteChain: SkillDependencyStep[] = chainNodes.map((n, idx) => ({
    key: n.id,
    label: n.label,
    is_satisfied: satisfiedFlags[idx],
    is_starting_point: idx === startingIdx
  }));

  const prerequisitesAlreadySatisfiedCount = satisfiedFlags.slice(0, startingIdx).filter(Boolean).length;

  // Step 2/4: Current Evidence panel -- built directly from real candidate
  // skills, never invented.
  const candidateSkillNames = Array.from(new Set((profile.skills || []).map(s => s.name))).slice(0, 8);
  const currentEvidence: GapCurrentEvidenceItem[] = [
    ...candidateSkillNames.map(name => ({ skill_name: name, status: 'VERIFIED' as const, source: 'candidate_profile_skill' as const })),
    { skill_name: capName, status: 'NOT_VERIFIED' as const, source: 'target_capability' as const }
  ];

  // Step 3/10: Market evidence -- reuses roadmap_engine's own aggregation, never invented.
  const marketEvidence = {
    opportunities_requiring_count: gap.opportunities_requiring_count || 0,
    total_target_opportunities_count: gap.total_target_opportunities_count || targetOpps.length,
    demand_percentage: gap.demand_percentage || 0,
    related_opportunity_details: gap.related_opportunity_details || []
  };

  const existingSkillsStr = candidateSkillNames.slice(0, 4).join(', ');

  // Step 3: Personalized learning plan for the target capability itself (the
  // prerequisite_chain above already shows which earlier steps are skipped).
  const learningPhases = buildLearningPhases(node, existingSkillsStr);

  // Step 6/7: Project Blueprint -- reuses project_recommendation_engine.
  const recommendation = await generateTargetedProjectRecommendation(profile, targetOpps[0], [gap.skill_gap]);
  const projectBlueprint = buildProjectBlueprint(recommendation, capName);

  const effortEstimate = estimateEffort(prerequisitesAlreadySatisfiedCount);
  const resourceRecommendations = buildResourceRecommendations(node);
  const alreadyVerifiedSkills = currentEvidence.filter(e => e.status === 'VERIFIED').map(e => e.skill_name);

  const startingPointLabel = chainNodes.length > 1
    ? `${chainNodes.map(n => n.label).join(' -> ')} (start at: ${chainNodes[startingIdx]?.label || capName})`
    : `Start at: ${capName}`;

  const plan: GapActionPlan = {
    id: `gap_plan_${slugify(targetCareerTitle)}_${slugify(capName)}`,
    target_career_title: targetCareerTitle,
    gap_capability_name: capName,
    priority_tier: gap.priority_tier,
    classification: 'LEARNABLE_SKILL_GAP',
    market_evidence: marketEvidence,
    current_evidence: currentEvidence,
    already_verified_skills: alreadyVerifiedSkills,
    target_statement: `Verified evidence demonstrating ${capName} capability.`,
    prerequisite_chain: prerequisiteChain,
    starting_point_label: startingPointLabel,
    learning_phases: learningPhases,
    project_blueprint: projectBlueprint,
    effort_estimate: effortEstimate,
    resource_recommendations: resourceRecommendations,
    verification_requirements: [
      'Submit the completed project through the Project Verification Checkpoint (Start Project -> Submit Evidence).',
      'Add the project and any newly acquired skills to your Candidate Profile as verified evidence.',
      'Run the Readiness Reassessment simulator to confirm projected impact (simulation only -- does not change your verified profile until you update it yourself).'
    ],
    generated_at: new Date().toISOString()
  };

  return { kind: 'PLAN', plan };
}
