'use client';

import React from 'react';
import { GapAnalysisResult, RequirementEvaluation } from '@/types';
import { GlassPanel } from '@/components/ui/GlassPanel';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Gauge,
  Sparkles,
  Layers,
  FileCheck,
  ArrowRight
} from 'lucide-react';

interface GapAnalysisViewProps {
  gapAnalysis: GapAnalysisResult;
}

export default function GapAnalysisView({ gapAnalysis }: GapAnalysisViewProps) {
  const isEligible = gapAnalysis.hard_eligibility_passed;
  const gaps = gapAnalysis.gaps || [];
  const reqEvals = gapAnalysis.requirement_evaluations || [];

  const matchedEvals = reqEvals.filter(r => r.status === 'MATCHED');
  const partialEvals = reqEvals.filter(r => r.status === 'PARTIAL');
  const missingEvals = reqEvals.filter(r => r.status === 'MISSING');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <GlassPanel style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <Gauge size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
            Diagnostic &amp; Requirement Intelligence
          </h3>
        </div>

        {/* 1. Binary Hard Eligibility Gate */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: '16px',
            background: isEligible ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${isEligible ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            marginBottom: '1.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
            {isEligible ? (
              <ShieldCheck size={20} style={{ color: 'var(--success)' }} />
            ) : (
              <ShieldAlert size={20} style={{ color: 'var(--destructive)' }} />
            )}
            <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: isEligible ? 'var(--success)' : 'var(--destructive)', margin: 0 }}>
              Binary Hard Eligibility Gate: {isEligible ? 'PASSED (Multiplier: 1.0x)' : 'FAILED (Gated: 0.0x)'}
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1.85rem' }}>
            {gapAnalysis.hard_eligibility_reasons?.map((reason, idx) => (
              <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--foreground)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: reason.status === 'PASSED' ? 'var(--success)' : 'var(--destructive)', fontWeight: 700 }}>
                  {reason.status === 'PASSED' ? '✓' : '✕'}
                </span>
                <span>
                  <strong style={{ color: 'var(--foreground)' }}>{reason.requirement_name}:</strong>{' '}
                  <span style={{ color: 'var(--muted-foreground)' }}>{reason.explanation}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Four-Tier Requirement Evaluations */}
        {reqEvals.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              Detailed Requirement Evaluation ({reqEvals.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {reqEvals.map((evalItem, idx) => {
                const isMatched = evalItem.status === 'MATCHED';
                const isPartial = evalItem.status === 'PARTIAL';
                const isMissing = evalItem.status === 'MISSING';

                const statusColor = isMatched ? 'var(--success)' : isPartial ? 'var(--warning)' : 'var(--destructive)';
                const statusBg = isMatched ? 'rgba(16, 185, 129, 0.08)' : isPartial ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)';
                const statusBorder = isMatched ? 'rgba(16, 185, 129, 0.25)' : isPartial ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)';

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '1.15rem 1.35rem',
                      borderRadius: '14px',
                      background: statusBg,
                      border: `1px solid ${statusBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isMatched ? (
                          <CheckCircle2 size={16} style={{ color: statusColor }} />
                        ) : isPartial ? (
                          <AlertTriangle size={16} style={{ color: statusColor }} />
                        ) : (
                          <XCircle size={16} style={{ color: statusColor }} />
                        )}
                        <strong style={{ fontSize: '0.95rem', color: 'var(--foreground)' }}>
                          {evalItem.requirement_name}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '9999px',
                            background: 'var(--surface-2)',
                            color: statusColor,
                            border: `1px solid ${statusBorder}`,
                            textTransform: 'uppercase'
                          }}
                        >
                          {evalItem.status} {evalItem.match_type !== 'NONE' ? `(${evalItem.match_type})` : ''}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', lineHeight: 1.5, margin: 0 }}>
                      {evalItem.explanation}
                    </p>

                    {evalItem.evidence_sources && evalItem.evidence_sources.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: 'var(--muted-foreground)' }}>
                        <FileCheck size={12} style={{ color: 'var(--primary)' }} />
                        <span>Evidence: <em>&ldquo;{evalItem.evidence_sources[0]}&rdquo;</em></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Identified Actionable Gaps */}
        <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} style={{ color: 'var(--primary)' }} />
          Identified Gaps &amp; Missing Capabilities ({gaps.length})
        </h4>

        {gaps.length === 0 ? (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: 'var(--success)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}
          >
            <CheckCircle2 size={18} />
            <span><strong>No Critical Gaps Found!</strong> You meet or exceed all evaluated requirements for this role.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {gaps.map((gap, idx) => {
              const isSkill = gap.gap_type === 'SKILL_GAP';
              const isEvidence = gap.gap_type === 'EVIDENCE_GAP';
              const isExp = gap.gap_type === 'EXPERIENCE_GAP';

              return (
                <div
                  key={idx}
                  style={{
                    padding: '1.15rem 1.35rem',
                    borderRadius: '12px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          background: isSkill ? 'rgba(239, 68, 68, 0.12)' : isEvidence ? 'rgba(245, 158, 11, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                          color: isSkill ? 'var(--destructive)' : isEvidence ? 'var(--warning)' : 'var(--primary)',
                          border: `1px solid ${isSkill ? 'rgba(239, 68, 68, 0.3)' : isEvidence ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`
                        }}
                      >
                        {gap.gap_type}
                      </span>
                      <strong style={{ fontSize: '0.925rem', color: 'var(--foreground)' }}>{gap.missing_capability}</strong>
                    </div>

                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: gap.severity === 'critical' ? 'var(--destructive)' : 'var(--warning)', textTransform: 'capitalize' }}>
                      {gap.severity} Impact
                    </span>
                  </div>

                  {gap.suggested_action && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: 'var(--muted-foreground)' }}>
                      <ArrowRight size={13} style={{ color: 'var(--primary)' }} />
                      <span>{gap.suggested_action}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
