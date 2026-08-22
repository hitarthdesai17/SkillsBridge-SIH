import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCandidateProfile, normalizeToCandidateProfile } from '@/lib/candidate_service';
import { getOpportunityById } from '@/lib/opportunity_service';
import { analyzeCandidateGaps } from '@/lib/gap_analysis_engine';
import { generateTargetedProjectRecommendation } from '@/lib/project_recommendation_engine';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ProjectRecommendSchema = z.object({
  opportunity_id: z.string().min(1, 'opportunity_id is required'),
  candidate_profile: z.any().optional()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const opportunity_id = searchParams.get('opportunity_id') || 'opp_bi_intern_02';
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

    const profile = await getCandidateProfile(userId);
    const gapResult = analyzeCandidateGaps(profile, opportunity);
    const recommendation = await generateTargetedProjectRecommendation(profile, opportunity, gapResult.gaps);

    return NextResponse.json({
      success: true,
      message: 'Project Recommendation API Endpoint. Query with POST or pass ?opportunity_id=opp_id via GET.',
      opportunity_id,
      opportunity_title: opportunity.title,
      target_gaps_addressed: gapResult.gaps.map(g => g.missing_capability),
      project_recommendation: recommendation
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Project recommendation failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = ProjectRecommendSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { opportunity_id, candidate_profile } = validation.data;
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
    const profile = normalizeToCandidateProfile(rawProfile);
    const gapResult = analyzeCandidateGaps(profile, opportunity);
    const recommendation = await generateTargetedProjectRecommendation(profile, opportunity, gapResult.gaps);

    return NextResponse.json({
      success: true,
      opportunity_id,
      opportunity_title: opportunity.title,
      target_gaps_addressed: gapResult.gaps.map(g => g.missing_capability),
      project_recommendation: recommendation
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Project recommendation failed' },
      { status: 500 }
    );
  }
}
