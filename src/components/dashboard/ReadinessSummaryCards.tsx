'use client';

import React from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { ReadinessBadge } from '@/components/ui/Badges';

interface ReadinessSummaryCardsProps {
  countReady: number;
  countAlmost: number;
  countNotReady: number;
}

export function ReadinessSummaryCards({
  countReady,
  countAlmost,
  countNotReady
}: ReadinessSummaryCardsProps) {
  return (
    <div className="readiness-summary-grid">
      <style jsx>{`
        .readiness-summary-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          margin-bottom: 2rem;
          width: 100%;
        }

        @media (min-width: 680px) {
          .readiness-summary-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .summary-card-content {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          gap: 1rem;
          width: 100%;
        }

        .card-label {
          font-size: 0.725rem;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin: 0 0 0.35rem 0;
        }

        .card-count {
          font-family: 'Sora', system-ui, sans-serif;
          font-size: clamp(1.85rem, 3vw, 2.35rem);
          font-weight: 800;
          color: var(--foreground);
          line-height: 1.1;
          margin: 0 0 0.35rem 0;
        }

        .card-subtext {
          font-size: 0.75rem;
          color: var(--muted-foreground);
          margin: 0;
          line-height: 1.4;
        }
      `}</style>

      {/* Ready Roles */}
      <GlassPanel style={{ padding: '1.35rem 1.5rem' }}>
        <div className="summary-card-content">
          <div>
            <p className="card-label" style={{ color: 'var(--success)' }}>
              READY ROLES
            </p>
            <h2 className="card-count">{countReady}</h2>
            <p className="card-subtext">≥ 80% Match &amp; Passed Hard Gates</p>
          </div>
          <ReadinessBadge state="READY" />
        </div>
      </GlassPanel>

      {/* Almost Ready */}
      <GlassPanel style={{ padding: '1.35rem 1.5rem' }}>
        <div className="summary-card-content">
          <div>
            <p className="card-label" style={{ color: 'var(--warning)' }}>
              ALMOST READY
            </p>
            <h2 className="card-count">{countAlmost}</h2>
            <p className="card-subtext">60% – 79% · Bridge with 1 project</p>
          </div>
          <ReadinessBadge state="ALMOST_READY" />
        </div>
      </GlassPanel>

      {/* Gaps to Bridge */}
      <GlassPanel style={{ padding: '1.35rem 1.5rem' }}>
        <div className="summary-card-content">
          <div>
            <p className="card-label" style={{ color: '#f87171' }}>
              GAPS TO BRIDGE
            </p>
            <h2 className="card-count">{countNotReady}</h2>
            <p className="card-subtext">&lt; 60% or Hard Gates not satisfied</p>
          </div>
          <ReadinessBadge state="NOT_READY" />
        </div>
      </GlassPanel>
    </div>
  );
}
export default ReadinessSummaryCards;
