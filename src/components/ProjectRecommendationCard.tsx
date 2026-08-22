'use client';

import React from 'react';
import { ProjectRecommendation } from '@/types';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Rocket, Sparkles, Clock, CheckCircle2, Award, Zap, ArrowRight } from 'lucide-react';

interface ProjectRecommendationCardProps {
  project: ProjectRecommendation;
  onSimulateCompletion?: () => void;
  isSimulating?: boolean;
}

export default function ProjectRecommendationCard({
  project,
  onSimulateCompletion,
  isSimulating = false
}: ProjectRecommendationCardProps) {
  return (
    <GlassPanel style={{ padding: '2rem', border: '1px solid rgba(99, 102, 241, 0.4)', boxShadow: 'var(--shadow-lift)' }}>
      {/* Badge Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '0.3rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Rocket size={13} /> GAP-TARGETED PORTFOLIO PROJECT
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.825rem' }}>
          <span style={{ color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Award size={14} /> Feasibility: {project.feasibility_score.toFixed(0)}%
          </span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ color: 'var(--warning)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={14} /> ~{project.estimated_effort_hours}h Effort
          </span>
        </div>
      </div>

      {/* Title & Rationale */}
      <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
        {project.title}
      </h3>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
        💡 <strong style={{ color: 'var(--foreground)' }}>Why Recommended:</strong> {project.why_recommended}
      </p>

      {/* Objective */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '14px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          marginBottom: '1.5rem'
        }}
      >
        <h4 style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 0.35rem 0' }}>
          Project Objective
        </h4>
        <p style={{ fontSize: '0.9rem', color: 'var(--foreground)', margin: 0, lineHeight: 1.5 }}>
          {project.objective}
        </p>
      </div>

      {/* Skills Learned & Demonstrated */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--success)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={13} /> Skills You Will Bridge
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {project.skills_learned.map((s, idx) => (
              <span key={idx} style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontWeight: 600 }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Zap size={13} /> Strengths Leveraged
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {project.existing_strengths_leveraged.map((s, idx) => (
              <span key={idx} style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontWeight: 600 }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scope & Deliverables */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h4 style={{ fontSize: '0.85rem', color: 'var(--foreground)', fontWeight: 700, marginBottom: '0.65rem' }}>
          📋 Scope &amp; Implementation Checklist
        </h4>
        <ul style={{ paddingLeft: '1.25rem', color: 'var(--muted-foreground)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0 }}>
          {project.scope_deliverables.map((del, idx) => (
            <li key={idx} style={{ lineHeight: 1.5 }}>{del}</li>
          ))}
        </ul>
      </div>

      {/* Action Simulation Trigger */}
      {onSimulateCompletion && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Expected Readiness Score Jump:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)', marginLeft: '0.5rem' }}>
              +{project.expected_readiness_delta.toFixed(1)}%
            </span>
          </div>

          <button
            onClick={onSimulateCompletion}
            disabled={isSimulating}
            className="btn-primary"
            style={{
              padding: '0.65rem 1.35rem',
              fontSize: '0.875rem'
            }}
          >
            {isSimulating ? (
              <span>Recalculating Backend Engine...</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={15} /> Simulate Project Completion
              </span>
            )}
          </button>
        </div>
      )}
    </GlassPanel>
  );
}
