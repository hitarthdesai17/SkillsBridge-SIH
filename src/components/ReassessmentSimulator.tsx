'use client';

import React, { useState } from 'react';
import { ReadinessState } from '@/types';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { ReadinessBadge } from '@/components/ui/Badges';
import { RefreshCcw, ArrowRight, Sparkles, CheckCircle2, Zap, Loader2 } from 'lucide-react';

interface ReassessmentSimulatorProps {
  opportunityId: string;
  opportunityTitle: string;
  targetSkills: string[];
  projectTitle: string;
  initialScore: number;
  initialState: ReadinessState;
}

export default function ReassessmentSimulator({
  opportunityId,
  opportunityTitle,
  targetSkills,
  projectTitle,
  initialScore,
  initialState
}: ReassessmentSimulatorProps) {
  const [isSimulated, setIsSimulated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [simulatedData, setSimulatedData] = useState<{
    score: number;
    state: ReadinessState;
    delta: number;
    hard_eligible: boolean;
  } | null>(null);

  const handleRunSimulation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let clientProfile: any = null;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('candidate_profile_data');
        if (stored) {
          try {
            clientProfile = JSON.parse(stored);
          } catch (e) {}
        }
      }

      const res = await fetch('/api/readiness/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: opportunityId,
          completed_skills: targetSkills,
          completed_project_title: projectTitle,
          candidate_profile: clientProfile
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Simulation failed');
      }

      setSimulatedData({
        score: data.after.score,
        state: data.after.state,
        delta: data.delta,
        hard_eligible: data.after.hard_eligible
      });
      setIsSimulated(true);

    } catch (err: any) {
      setError(err.message || 'Failed to simulate project completion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassPanel style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <RefreshCcw size={20} style={{ color: 'var(--primary)' }} />
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
          Interactive Reassessment Simulator
        </h3>
      </div>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
        Simulate completing this project and adding verified skill evidence to recalculate your real-time backend readiness score.
      </p>

      {/* Simulator Comparison Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}
        className="simulator-grid"
      >
        <style jsx>{`
          @media (max-width: 640px) {
            .simulator-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* BEFORE State */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 800 }}>
            CURRENT STATE
          </span>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>
            {initialScore.toFixed(0)}%
          </div>
          <ReadinessBadge state={initialState} score={initialScore} />
        </div>

        {/* Center Transition Arrow */}
        <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--primary)', padding: '0.5rem' }}>
          <ArrowRight size={24} />
        </div>

        {/* AFTER State */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: isSimulated ? 'rgba(16, 185, 129, 0.08)' : 'var(--surface)',
            border: `1px solid ${isSimulated ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: isSimulated ? 'var(--success)' : 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 800 }}>
            {isSimulated ? 'SIMULATED POST-PROJECT' : 'AFTER COMPLETION'}
          </span>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: isSimulated ? 'var(--success)' : 'var(--muted-foreground)' }}>
            {isSimulated && simulatedData ? `${simulatedData.score.toFixed(0)}%` : '--%'}
          </div>
          {isSimulated && simulatedData ? (
            <ReadinessBadge state={simulatedData.state} score={simulatedData.score} />
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Pending Simulation</span>
          )}
        </div>
      </div>

      {/* Delta Callout */}
      {isSimulated && simulatedData && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--success)',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <Sparkles size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Readiness Improvement Verified!</strong> Your score jumped by{' '}
            <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>+{simulatedData.delta}%</span> ({initialScore.toFixed(0)}% ➔ {simulatedData.score.toFixed(0)}%), transitioning your readiness state to{' '}
            <strong>{simulatedData.state}</strong>.
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={handleRunSimulation}
        disabled={isLoading}
        className="btn-primary"
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '0.85rem',
          fontSize: '0.95rem'
        }}
      >
        {isLoading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Loader2 size={18} className="animate-spin" /> Recalculating Production Engine...
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={18} />
            <span>{isSimulated ? 'Re-Run Readiness Simulation' : 'Simulate Completing Project'}</span>
          </span>
        )}
      </button>
    </GlassPanel>
  );
}
