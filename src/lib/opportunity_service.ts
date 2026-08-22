import { Opportunity } from '../types';
import { SEED_OPPORTUNITIES } from './seed_data';
import { supabase } from './supabase';

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function getOpportunities(typeFilter?: string): Promise<Opportunity[]> {
  let dbOpps: Opportunity[] = [];
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('opportunities').select('*, requirements:opportunity_requirements(*)');
      if (typeFilter) {
        query = query.eq('opportunity_type', typeFilter);
      }
      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        dbOpps = data as Opportunity[];
      }
    } catch (err) {
      // Supabase query fallback
    }
  }

  // Merge seed opportunities with DB opportunities to guarantee all roles exist
  const mergedMap = new Map<string, Opportunity>();
  SEED_OPPORTUNITIES.forEach(o => mergedMap.set(o.id, o));
  dbOpps.forEach(o => mergedMap.set(o.id, o));

  let allOpps = Array.from(mergedMap.values());
  if (typeFilter) {
    allOpps = allOpps.filter(o => o.opportunity_type === typeFilter);
  }
  return allOpps;
}

export async function getOpportunityById(id: string): Promise<Opportunity | undefined> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*, requirements:opportunity_requirements(*)')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as Opportunity;
      }
    } catch (err) {
      // Supabase query fallback
    }
  }

  return SEED_OPPORTUNITIES.find(o => o.id === id);
}
