'use client';

import React from 'react';
import Link from 'next/link';
import { Opportunity, ReadinessDiagnosis } from '@/types';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { ReadinessBadge, SkillChip } from '@/components/ui/Badges';
import { MapPin, Calendar, Building, Wallet, ArrowRight, Sparkles } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: Opportunity;
  diagnosis?: ReadinessDiagnosis;
}

export default function OpportunityCard({ opportunity, diagnosis }: OpportunityCardProps) {
  const readinessState = diagnosis?.readiness_state || 'NOT_READY';
  const readinessScore = diagnosis?.readiness_score;

  const orgInitial = opportunity.organization
    ? opportunity.organization.charAt(0).toUpperCase()
    : 'O';

  // Extract skills array from requirements
  let requiredSkills: string[] = [];
  if (Array.isArray(opportunity.requirements)) {
    requiredSkills = opportunity.requirements
      .filter((r) => r.requirement_type === 'required_skill' || r.requirement_type === 'preferred_skill')
      .map((r) => r.name);
  }
  if (requiredSkills.length === 0 && (opportunity as any).required_skills) {
    const raw = (opportunity as any).required_skills;
    if (Array.isArray(raw)) {
      requiredSkills = raw;
    } else if (typeof raw === 'string') {
      try {
        requiredSkills = JSON.parse(raw);
      } catch {
        requiredSkills = [raw];
      }
    }
  }

  return (
    <GlassPanel hover style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem' }}>
      <div>
        {/* Top Header: Organization Avatar + Title & Type */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span
              style={{
                display: 'flex',
                width: '44px',
                height: '44px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                fontFamily: 'Sora, sans-serif',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--primary)',
                flexShrink: 0
              }}
            >
              {orgInitial}
            </span>
            <div>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.15rem 0', lineHeight: 1.3 }}>
                {opportunity.title}
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--muted-foreground)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Building size={12} /> {opportunity.organization}
              </p>
            </div>
          </div>
          <ReadinessBadge state={readinessState} score={readinessScore} />
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: '0.85rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            margin: '0 0 1rem 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {opportunity.description}
        </p>

        {/* Location & Salary/Deadline Metadata */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.775rem', color: 'var(--muted-foreground)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <MapPin size={12} style={{ color: 'var(--primary)' }} /> {opportunity.location || 'Remote'}
          </span>
          {opportunity.stipend_salary_range && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Wallet size={12} style={{ color: 'var(--success)' }} /> {opportunity.stipend_salary_range}
            </span>
          )}
          {opportunity.deadline && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={12} /> {new Date(opportunity.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Required Skills Chips */}
        {requiredSkills && requiredSkills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
            {requiredSkills.slice(0, 4).map((s) => (
              <SkillChip key={s}>{s}</SkillChip>
            ))}
            {requiredSkills.length > 4 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', alignSelf: 'center' }}>
                +{requiredSkills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer with CTA */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span
          style={{
            borderRadius: '9999px',
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            padding: '0.2rem 0.6rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)'
          }}
        >
          {opportunity.opportunity_type}
        </span>

        <Link
          href={`/opportunity/${opportunity.id}`}
          className="btn-primary"
          style={{
            padding: '0.45rem 1rem',
            fontSize: '0.825rem',
            textDecoration: 'none'
          }}
        >
          {readinessState === 'ALMOST_READY' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={13} /> Bridge Gap
            </span>
          ) : readinessState === 'NOT_READY' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              View Gaps <ArrowRight size={13} />
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              View Diagnostic <ArrowRight size={13} />
            </span>
          )}
        </Link>
      </div>
    </GlassPanel>
  );
}
