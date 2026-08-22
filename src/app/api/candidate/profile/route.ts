import { NextResponse } from 'next/server';
import { getCandidateProfile } from '@/lib/candidate_service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let userId: string | undefined;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch (authErr) {
      // Unauthenticated or test context
    }

    const profile = await getCandidateProfile(userId);
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch candidate profile' },
      { status: 500 }
    );
  }
}
