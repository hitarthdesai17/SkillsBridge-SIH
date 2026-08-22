import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCandidateProfile, normalizeToCandidateProfile } from '@/lib/candidate_service';
import { generateCareerRoadmap } from '@/lib/roadmap_engine';

export const dynamic = 'force-dynamic';

const RoadmapRequestSchema = z.object({
  target_career: z.string().optional(),
  candidate_profile: z.any().optional()
});

async function getAuthUserId(): Promise<string> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user.id;
  } catch (e) {}
  return '00000000-0000-0000-0000-000000000000';
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const validation = RoadmapRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { target_career, candidate_profile } = validation.data;
    const userId = await getAuthUserId();

    const rawProfile = candidate_profile || await getCandidateProfile(userId);
    const profile = normalizeToCandidateProfile(rawProfile);

    const targetCareerTitle = target_career?.trim() || '';

    const { getOpportunities } = await import('@/lib/opportunity_service');
    const opportunities = await getOpportunities();

    const roadmap = await generateCareerRoadmap({
      profile,
      targetCareerTitle,
      opportunities
    });

    return NextResponse.json({
      success: true,
      roadmap
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate career roadmap' },
      { status: 500 }
    );
  }
}
