import { NextResponse } from 'next/server';
import { getOpportunities } from '@/lib/opportunity_service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type') || undefined;
    const opportunities = await getOpportunities(typeFilter);
    return NextResponse.json({ success: true, count: opportunities.length, opportunities });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}
