'use client';

import React from 'react';
import { ParsedSkill, EvidenceStrength, SkillKind } from '@/types';

// ============================================================
// SKILL PRESENTATION
// ============================================================
// The old card showed one flat list where every chip read "HIGH", which made
// a skill merely listed in a Skills section look identical to one demonstrated
// across four years of employment. Two things changed:
//
//  1. Skills are grouped by KIND (skill / tool / domain / soft), because a
//     candidate reads "Tools & Platforms" very differently from "Soft Skills".
//  2. The badge shows EVIDENCE STRENGTH, not extraction confidence. Extraction
//     confidence is a parser-internal signal and is HIGH for almost everything
//     by design; showing it to the candidate was the misleading part.

export const SKILL_GROUPS: Array<{ key: string; title: string; kinds: SkillKind[] }> = [
  { key: 'technical', title: 'Technical & Professional Skills', kinds: ['SKILL'] },
  { key: 'tools', title: 'Tools & Platforms', kinds: ['TOOL', 'PLATFORM'] },
  { key: 'business', title: 'Business & Domain Capabilities', kinds: ['DOMAIN_KNOWLEDGE', 'METHODOLOGY'] },
  { key: 'soft', title: 'Soft Skills', kinds: ['SOFT_SKILL'] },
  { key: 'languages', title: 'Languages', kinds: ['LANGUAGE'] },
  { key: 'review', title: 'Unmapped / Needs Review', kinds: ['UNKNOWN'] }
];

const STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  VERIFIED_HIGH: 'VERIFIED · WORK',
  VERIFIED_MEDIUM: 'VERIFIED · PROJECT',
  VERIFIED_BASIC: 'BASIC',
  MENTIONED: 'MENTIONED',
  PARTIAL: 'PARTIAL',
  INFERRED: 'INFERRED'
};

const STRENGTH_COLOR: Record<EvidenceStrength, { fg: string; bg: string; border: string }> = {
  VERIFIED_HIGH: { fg: 'var(--success)', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
  VERIFIED_MEDIUM: { fg: 'var(--success)', bg: 'rgba(16, 185, 129, 0.10)', border: 'rgba(16, 185, 129, 0.25)' },
  VERIFIED_BASIC: { fg: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.13)', border: 'rgba(245, 158, 11, 0.28)' },
  MENTIONED: { fg: 'var(--muted-foreground)', bg: 'rgba(148, 163, 184, 0.14)', border: 'var(--border)' },
  PARTIAL: { fg: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.22)' },
  INFERRED: { fg: 'var(--muted-foreground)', bg: 'rgba(148, 163, 184, 0.10)', border: 'var(--border)' }
};

export function groupSkills(skills: ParsedSkill[]) {
  const assigned = new Set<number>();
  const groups = SKILL_GROUPS.map(group => {
    const items = skills.filter((s, i) => {
      const kind = (s.skill_kind || 'UNKNOWN') as SkillKind;
      if (assigned.has(i)) return false;
      if (!group.kinds.includes(kind)) return false;
      assigned.add(i);
      return true;
    });
    return { ...group, items };
  });

  // Anything with an unrecognised kind still gets shown -- never dropped.
  const leftovers = skills.filter((_, i) => !assigned.has(i));
  if (leftovers.length > 0) {
    const review = groups.find(g => g.key === 'review');
    if (review) review.items = [...review.items, ...leftovers];
  }

  return groups.filter(g => g.items.length > 0);
}

export function SkillEvidenceCard({
  skill,
  onRemove
}: {
  skill: ParsedSkill;
  onRemove?: (skill: ParsedSkill) => void;
}) {
  const strength = (skill.evidence_strength || 'MENTIONED') as EvidenceStrength;
  const color = STRENGTH_COLOR[strength] || STRENGTH_COLOR.MENTIONED;
  const isUserAdded = skill.evidence_origin === 'USER_ADDED';

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <strong style={{ fontSize: '0.95rem', color: 'var(--foreground)' }}>{skill.name}</strong>
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '0.15rem 0.5rem',
            borderRadius: '9999px',
            whiteSpace: 'nowrap',
            background: color.bg,
            color: color.fg,
            border: `1px solid ${color.border}`
          }}
        >
          {STRENGTH_LABEL[strength]}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {skill.level_qualifier && (
          <Tag>Level as stated: {skill.level_qualifier}</Tag>
        )}
        {skill.is_unmapped && <Tag tone="warn">UNMAPPED · review</Tag>}
        {isUserAdded && <Tag tone="info">USER ADDED · not resume evidence</Tag>}
        {skill.parent_skill && <Tag>Part of {skill.parent_skill}</Tag>}
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>
        <strong>Source:</strong>{' '}
        {isUserAdded ? 'Added by you (not extracted from the resume)' : skill.provenance_source}
      </p>

      {skill.original_term && skill.original_term !== skill.name && (
        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>
          <strong>Resume wording:</strong> &ldquo;{skill.original_term}&rdquo;
        </p>
      )}

      {skill.provenance_context && !isUserAdded && (
        <p
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            margin: 0,
            lineHeight: 1.45,
            borderLeft: '2px solid var(--border)',
            paddingLeft: '0.5rem'
          }}
        >
          &ldquo;{skill.provenance_context}&rdquo;
        </p>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(skill)}
          style={{
            alignSelf: 'flex-start',
            marginTop: '0.15rem',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--muted-foreground)',
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '0.2rem 0.55rem',
            cursor: 'pointer'
          }}
        >
          Remove
        </button>
      )}
    </div>
  );
}

function Tag({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'warn' | 'info' }) {
  const palette = {
    neutral: { fg: 'var(--muted-foreground)', bg: 'var(--surface-2)', border: 'var(--border)' },
    warn: { fg: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.28)' },
    info: { fg: 'var(--primary)', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.28)' }
  }[tone];

  return (
    <span
      style={{
        fontSize: '0.66rem',
        fontWeight: 600,
        padding: '0.12rem 0.45rem',
        borderRadius: '6px',
        background: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.border}`
      }}
    >
      {children}
    </span>
  );
}
