import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCandidateProfile, normalizeToCandidateProfile } from '@/lib/candidate_service';
import { getOpportunityById, getOpportunities } from '@/lib/opportunity_service';
import { calculateOpportunityReadiness } from '@/lib/readiness_engine';
import { createClient } from '@/lib/supabase/server';
import { CandidateProfile } from '@/types';

export const dynamic = 'force-dynamic';

const DiagnoseRequestSchema = z.object({
  opportunity_id: z.string().optional(),
  bulk: z.boolean().optional(),
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
    const assessment = calculateOpportunityReadiness(profile, opportunity);

    return NextResponse.json({
      success: true,
      message: 'Diagnostic Assessment',
      diagnosis: assessment,
      assessment
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Diagnostic execution failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const validation = DiagnoseRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    let userId: string | undefined;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch (e) {}

    let rawProfile = body.candidate_profile || await getCandidateProfile(userId);

    // Normalize raw parsed_resume objects from localStorage into CandidateProfile shape.
    // The dashboard sends `parsed_resume` from localStorage which uses `experiences` (not `experience`),
    // and lacks `id`/`user_id`/`profile_id` fields that CandidateProfile requires.
    const profile = normalizeToCandidateProfile(rawProfile);

    // Bulk diagnostic evaluation for ultra-fast single round-trip dashboard loading
    if (body.bulk || body.opportunity_id === 'all') {
      const allOpps = await getOpportunities();
      const diagnoses: Record<string, any> = {};
      for (const opp of allOpps) {
        diagnoses[opp.id] = calculateOpportunityReadiness(profile, opp);
      }
      return NextResponse.json({
        success: true,
        diagnoses
      });
    }

    const opportunity_id = body.opportunity_id || 'opp_bi_intern_02';
    const opportunity = await getOpportunityById(opportunity_id);

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: `Opportunity with ID '${opportunity_id}' not found` },
        { status: 404 }
      );
    }

    const assessment = calculateOpportunityReadiness(profile, opportunity);

    return NextResponse.json({
      success: true,
      diagnosis: assessment,
      assessment
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Diagnostic execution failed' },
      { status: 500 }
    );
  }
}
