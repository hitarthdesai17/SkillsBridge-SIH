import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SEED_OPPORTUNITIES } from '@/lib/seed_data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({
      status: 'CONNECTION FAILED',
      error: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.',
      env_check: {
        has_url: Boolean(supabaseUrl),
        has_anon_key: Boolean(anonKey)
      }
    }, { status: 500 });
  }

  try {
    // 1. Initial query against live Supabase opportunities table
    const { data: initialData, error: readError } = await supabase
      .from('opportunities')
      .select('*');

    if (readError) {
      return NextResponse.json({
        status: 'CONNECTION SUCCESSFUL BUT QUERY FAILED',
        message: 'Reachable Supabase instance, but opportunities table query failed.',
        error: readError.message,
        details: readError.details || readError.hint || 'Table might not exist yet in Supabase schema cache.',
        supabase_url: supabaseUrl
      }, { status: 400 });
    }

    const recordsBeforeSeed = initialData ? initialData.length : 0;
    const seedErrors: string[] = [];
    let seedAttempted = false;

    // 2. Perform idempotent seeding if record count is less than expected 16
    if (recordsBeforeSeed < SEED_OPPORTUNITIES.length) {
      seedAttempted = true;

      for (const opp of SEED_OPPORTUNITIES) {
        const { error: oppInsertError } = await supabase
          .from('opportunities')
          .upsert({
            id: opp.id,
            title: opp.title,
            organization: opp.organization,
            opportunity_type: opp.opportunity_type,
            description: opp.description,
            source: opp.source,
            source_url: opp.source_url,
            deadline: opp.deadline,
            location: opp.location,
            education_level_required: opp.education_level_required,
            min_experience_years: opp.min_experience_years,
            stipend_salary_range: opp.stipend_salary_range,
            verification_status: opp.verification_status,
            explicit_eligibility: opp.explicit_eligibility
          }, { onConflict: 'id' });

        if (oppInsertError) {
          seedErrors.push(`Opportunity '${opp.id}' insert failed: ${oppInsertError.message}`);
        } else {
          // Insert requirements
          for (const req of opp.requirements) {
            const { error: reqInsertError } = await supabase
              .from('opportunity_requirements')
              .upsert({
                id: req.id,
                opportunity_id: opp.id,
                requirement_type: req.requirement_type,
                name: req.name,
                normalized_name: req.normalized_name,
                is_mandatory: req.is_mandatory,
                min_years: req.min_years
              }, { onConflict: 'id' });

            if (reqInsertError) {
              seedErrors.push(`Requirement '${req.id}' insert failed: ${reqInsertError.message}`);
            }
          }
        }
      }
    }

    // 3. Final count query after seeding
    const { data: finalData } = await supabase
      .from('opportunities')
      .select('*');

    const recordsAfterSeed = finalData ? finalData.length : 0;
    const isSeedSuccessful = recordsAfterSeed >= SEED_OPPORTUNITIES.length;

    return NextResponse.json({
      status: isSeedSuccessful ? 'CONNECTION + QUERY + SEED SUCCESSFUL' : 'CONNECTION SUCCESSFUL BUT SEED FAILED',
      message: isSeedSuccessful 
        ? 'Successfully connected to live Supabase project and verified 16 seed opportunities in PostgreSQL.' 
        : `Connected to Supabase, but opportunities table contains ${recordsAfterSeed} records instead of ${SEED_OPPORTUNITIES.length}.`,
      supabase_url: supabaseUrl,
      records_before_seed: recordsBeforeSeed,
      records_after_seed: recordsAfterSeed,
      actual_records_count: recordsAfterSeed,
      expected_records_count: SEED_OPPORTUNITIES.length,
      seed_attempted: seedAttempted,
      seed_succeeded: isSeedSuccessful && seedErrors.length === 0,
      seed_errors: seedErrors,
      sample_record: finalData && finalData.length > 0 ? finalData[0] : null
    }, { status: isSeedSuccessful ? 200 : 400 });

  } catch (err: any) {
    return NextResponse.json({
      status: 'CONNECTION FAILED',
      error: err.message || 'Network error reaching Supabase',
      supabase_url: supabaseUrl
    }, { status: 500 });
  }
}
