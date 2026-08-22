import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getOpportunityById } from '@/lib/opportunity_service';
import { getCandidateProfile, normalizeToCandidateProfile } from '@/lib/candidate_service';
import { calculateOpportunityReadiness } from '@/lib/readiness_engine';
import { evaluateOpportunityFreshness } from '@/lib/opportunity_freshness';
import { 
  createApplicationTrackingItem, 
  transitionApplicationStage, 
  getMemoryTrackedApplications, 
  saveMemoryTrackedApplication,
  deleteMemoryTrackedApplication
} from '@/lib/application_tracking_engine';
import { ApplicationStage, OpportunityTrackingItem } from '@/types';

export const dynamic = 'force-dynamic';

const ApplicationActionSchema = z.object({
  action: z.enum(['CREATE', 'TRANSITION', 'UPDATE_NOTES', 'DELETE']).default('CREATE'),
  opportunity_id: z.string().optional(),
  tracking_id: z.string().optional(),
  stage: z.enum([
    'SAVED',
    'PREPARING',
    'APPLIED',
    'INTERVIEWING',
    'OFFER',
    'REJECTED',
    'WITHDRAWN',
    'ARCHIVED'
  ]).optional(),
  notes: z.string().optional(),
  reason: z.string().optional(),
  target_submission_date: z.string().optional(),
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stageFilter = searchParams.get('stage') || 'ALL';
    const searchQuery = (searchParams.get('search') || '').toLowerCase().trim();

    const userId = await getAuthUserId();
    let items = getMemoryTrackedApplications(userId);

    if (stageFilter !== 'ALL') {
      items = items.filter(item => item.stage === stageFilter);
    }

    if (searchQuery) {
      items = items.filter(item => {
        const titleMatch = item.opportunity?.title?.toLowerCase().includes(searchQuery);
        const orgMatch = item.opportunity?.organization?.toLowerCase().includes(searchQuery);
        const notesMatch = item.notes?.toLowerCase().includes(searchQuery);
        return Boolean(titleMatch || orgMatch || notesMatch);
      });
    }

    return NextResponse.json({
      success: true,
      count: items.length,
      applications: items
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch application tracking items' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const validation = ApplicationActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { action, opportunity_id, tracking_id, stage, notes, reason, target_submission_date, candidate_profile } = validation.data;

    const userId = await getAuthUserId();

    // 1. DELETE ACTION
    if (action === 'DELETE') {
      if (!tracking_id) {
        return NextResponse.json(
          { success: false, error: 'tracking_id is required for DELETE action' },
          { status: 400 }
        );
      }
      deleteMemoryTrackedApplication(tracking_id);
      return NextResponse.json({
        success: true,
        message: 'Application removed from tracker'
      });
    }

    // 2. CREATE ACTION
    if (action === 'CREATE') {
      if (!opportunity_id) {
        return NextResponse.json(
          { success: false, error: 'opportunity_id is required for CREATE action' },
          { status: 400 }
        );
      }

      const opportunity = await getOpportunityById(opportunity_id);
      if (!opportunity) {
        return NextResponse.json(
          { success: false, error: `Opportunity with ID '${opportunity_id}' not found` },
          { status: 404 }
        );
      }

      // Check if already tracked
      const existingItems = getMemoryTrackedApplications(userId);
      const alreadyTracked = existingItems.find(i => i.opportunity_id === opportunity_id);
      if (alreadyTracked) {
        return NextResponse.json({
          success: true,
          message: 'Opportunity is already being tracked',
          item: alreadyTracked
        });
      }

      // Calculate readiness and freshness for initial action guidance
      const rawProfile = candidate_profile || await getCandidateProfile(userId);
      const profile = normalizeToCandidateProfile(rawProfile);
      const readiness = calculateOpportunityReadiness(profile, opportunity);
      const freshness = evaluateOpportunityFreshness(opportunity);

      const newItem = createApplicationTrackingItem({
        user_id: userId,
        opportunity,
        stage: stage || 'SAVED',
        notes,
        target_submission_date,
        readiness_summary: { score: readiness.readiness_score, state: readiness.readiness_state },
        freshness
      });

      saveMemoryTrackedApplication(newItem);

      return NextResponse.json({
        success: true,
        message: `Opportunity '${opportunity.title}' added to tracker in ${newItem.stage} stage`,
        item: newItem
      });
    }

    // 3. TRANSITION ACTION
    if (action === 'TRANSITION') {
      if (!tracking_id) {
        return NextResponse.json(
          { success: false, error: 'tracking_id is required for TRANSITION action' },
          { status: 400 }
        );
      }
      if (!stage) {
        return NextResponse.json(
          { success: false, error: 'target stage is required for TRANSITION action' },
          { status: 400 }
        );
      }

      const existingItems = getMemoryTrackedApplications(userId);
      const currentItem = existingItems.find(i => i.id === tracking_id);
      if (!currentItem) {
        return NextResponse.json(
          { success: false, error: `Tracked application with ID '${tracking_id}' not found` },
          { status: 404 }
        );
      }

      const rawProfile = candidate_profile || await getCandidateProfile(userId);
      const profile = normalizeToCandidateProfile(rawProfile);
      let readinessSummary = currentItem.readiness_summary;
      let freshnessInfo = undefined;

      if (currentItem.opportunity) {
        const readiness = calculateOpportunityReadiness(profile, currentItem.opportunity);
        readinessSummary = { score: readiness.readiness_score, state: readiness.readiness_state };
        freshnessInfo = evaluateOpportunityFreshness(currentItem.opportunity);
      }

      const transitionResult = transitionApplicationStage(currentItem, stage as ApplicationStage, {
        notes,
        reason,
        readiness_summary: readinessSummary,
        freshness: freshnessInfo
      });

      if (!transitionResult.success) {
        return NextResponse.json(
          { success: false, error: transitionResult.error },
          { status: 400 }
        );
      }

      saveMemoryTrackedApplication(transitionResult.item);

      return NextResponse.json({
        success: true,
        message: `Application transitioned to ${stage}`,
        item: transitionResult.item
      });
    }

    // 4. UPDATE NOTES ACTION
    if (action === 'UPDATE_NOTES') {
      if (!tracking_id) {
        return NextResponse.json(
          { success: false, error: 'tracking_id is required for UPDATE_NOTES action' },
          { status: 400 }
        );
      }

      const existingItems = getMemoryTrackedApplications(userId);
      const currentItem = existingItems.find(i => i.id === tracking_id);
      if (!currentItem) {
        return NextResponse.json(
          { success: false, error: `Tracked application with ID '${tracking_id}' not found` },
          { status: 404 }
        );
      }

      const updated: OpportunityTrackingItem = {
        ...currentItem,
        notes: notes !== undefined ? notes : currentItem.notes,
        target_submission_date: target_submission_date !== undefined ? target_submission_date : currentItem.target_submission_date,
        updated_at: new Date().toISOString()
      };

      saveMemoryTrackedApplication(updated);

      return NextResponse.json({
        success: true,
        item: updated
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action '${action}'` },
      { status: 400 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process application action' },
      { status: 500 }
    );
  }
}
