'use client';

import React from 'react';
import OpportunityCard from '@/components/OpportunityCard';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Opportunity, ReadinessDiagnosis } from '@/types';
import { Loader2, AlertCircle, Sparkles, FilterX } from 'lucide-react';

interface OpportunityResultsGridProps {
  opportunities: Opportunity[];
  diagnoses: Record<string, ReadinessDiagnosis>;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onResetFilters: () => void;
}

export function OpportunityResultsGrid({
  opportunities,
  diagnoses,
  isLoading,
  error,
  onRetry,
  onResetFilters
}: OpportunityResultsGridProps) {
  // Loading State: Contained inside the results region
  if (isLoading) {
    return (
      <GlassPanel style={{ padding: '4.5rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--primary)' }}>
          <Loader2 size={40} className="animate-spin" />
        </div>
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
          Querying Opportunity Landscape
        </h3>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
          Executing parallel deterministic readiness diagnosis across live opportunities...
        </p>
      </GlassPanel>
    );
  }

  // Error State: Contained inside the results region
  if (error) {
    return (
      <div
        style={{
          padding: '2rem',
          borderRadius: '16px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <AlertCircle size={28} />
        </div>
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
          Unable to Load Opportunities
        </h3>
        <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem', maxWidth: '480px', margin: '0 auto 1.25rem auto' }}>
          {error}
        </p>
        <button onClick={onRetry} className="btn-secondary" style={{ display: 'inline-flex', padding: '0.5rem 1.25rem' }}>
          Retry Loading Feed
        </button>
      </div>
    );
  }

  // Empty State
  if (opportunities.length === 0) {
    return (
      <GlassPanel style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--muted-foreground)' }}>
          <FilterX size={36} />
        </div>
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
          No Opportunities Match Selected Filters
        </h3>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.5rem auto' }}>
          Try clearing your search query or broadening the readiness / opportunity type filters.
        </p>
        <button onClick={onResetFilters} className="btn-secondary" style={{ display: 'inline-flex', padding: '0.55rem 1.35rem' }}>
          Reset All Filters
        </button>
      </GlassPanel>
    );
  }

  // Active Grid
  return (
    <div className="opportunities-card-grid">
      <style jsx>{`
        .opportunities-card-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          width: 100%;
        }

        @media (min-width: 680px) {
          .opportunities-card-grid {
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          }
        }
      `}</style>

      {opportunities.map((opp) => (
        <OpportunityCard
          key={opp.id}
          opportunity={opp}
          diagnosis={diagnoses[opp.id]}
        />
      ))}
    </div>
  );
}
export default OpportunityResultsGrid;
