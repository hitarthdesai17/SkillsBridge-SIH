import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCandidateProfile, normalizeToCandidateProfile } from '@/lib/candidate_service';
import { getOpportunityById } from '@/lib/opportunity_service';
import { calculateOpportunityReadiness } from '@/lib/readiness_engine';
import { evaluateHardEligibility } from '@/lib/hard_rules_engine';
import { CandidateProfile } from '@/types';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SimulateSchema = z.object({
  opportunity_id: z.string().min(1, 'opportunity_id is required'),
  completed_skills: z.array(z.string()).default([]),
  completed_project_title: z.string().optional(),
  candidate_profile: z.any().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = SimulateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { opportunity_id, completed_skills, completed_project_title, candidate_profile } = validation.data;
    const opportunity = await getOpportunityById(opportunity_id);

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: `Opportunity with ID '${opportunity_id}' not found` },
        { status: 404 }
      );
    }

    let userId: string | undefined;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch (e) {}

    const rawProfile = candidate_profile || await getCandidateProfile(userId);
    const baseProfile = normalizeToCandidateProfile(rawProfile);

    // 1. Calculate Initial Readiness
    const initialEligibility = evaluateHardEligibility(baseProfile, opportunity);
    const initialReadiness = calculateOpportunityReadiness(baseProfile, opportunity);

    // 2. Clone profile in memory & append simulated skills / projects
    const simulatedSkills = [...(baseProfile.skills || [])];
    
    for (const skillName of completed_skills) {
      const normName = skillName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (!simulatedSkills.some(s => s.normalized_name === normName || s.name.toLowerCase() === skillName.toLowerCase())) {
        simulatedSkills.push({
          id: `sim_skill_${Math.random().toString(36).substring(2, 7)}`,
          profile_id: baseProfile.id,
          name: skillName,
          normalized_name: normName,
          proficiency_level: 'intermediate',
          provenance_source: 'Simulated Project Completion',
          provenance_context: `Acquired via completed project: "${completed_project_title || 'Targeted Portfolio Project'}"`,
          extraction_confidence: 'HIGH',
          source_evidence: `Simulated evidence verified through project completion.`
        });
      }
    }

    const simulatedProjects = [...(baseProfile.projects || [])];
    if (completed_project_title) {
      simulatedProjects.push({
        id: `sim_proj_${Math.random().toString(36).substring(2, 7)}`,
        profile_id: baseProfile.id,
        title: completed_project_title,
        description: 'Simulated project completion addressing candidate readiness gaps.',
        tech_stack: completed_skills,
        github_url: 'https://github.com/candidate/simulated-project',
        live_url: undefined
      });
    }

    const simulatedProfile: CandidateProfile = {
      ...baseProfile,
      skills: simulatedSkills,
      projects: simulatedProjects
    };

    // 3. Calculate Simulated Readiness using backend engines
    const simulatedEligibility = evaluateHardEligibility(simulatedProfile, opportunity);
    const simulatedReadiness = calculateOpportunityReadiness(simulatedProfile, opportunity);

    const scoreDelta = parseFloat((simulatedReadiness.readiness_score - initialReadiness.readiness_score).toFixed(1));

    return NextResponse.json({
      success: true,
      opportunity_id,
      opportunity_title: opportunity.title,
      before: {
        score: initialReadiness.readiness_score,
        state: initialReadiness.readiness_state,
        hard_eligible: initialEligibility.eligible
      },
      after: {
        score: simulatedReadiness.readiness_score,
        state: simulatedReadiness.readiness_state,
        hard_eligible: simulatedEligibility.eligible
      },
      delta: scoreDelta,
      state_changed: initialReadiness.readiness_state !== simulatedReadiness.readiness_state,
      added_skills: completed_skills
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Simulation failed' },
      { status: 500 }
    );
  }
}
