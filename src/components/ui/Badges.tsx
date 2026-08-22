'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SkillChip({
  children,
  tone = 'default',
  className
}: {
  children: ReactNode;
  tone?: 'default' | 'missing' | 'strong';
  className?: string;
}) {
  const getStyle = () => {
    if (tone === 'strong') {
      return {
        background: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        color: 'var(--success)'
      };
    }
    if (tone === 'missing') {
      return {
        background: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        color: 'var(--destructive)'
      };
    }
    return {
      background: 'var(--surface)',
      borderColor: 'var(--border)',
      color: 'var(--foreground)'
    };
  };

  return (
    <span
      className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium', className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '9999px',
        borderWidth: '1px',
        borderStyle: 'solid',
        padding: '0.2rem 0.65rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        ...getStyle()
      }}
    >
      {children}
    </span>
  );
}

export function ReadinessBadge({
  score,
  state,
  className
}: {
  score?: number;
  state?: string;
  className?: string;
}) {
  let displayState = state;
  if (!displayState && typeof score === 'number') {
    displayState = score >= 80 ? 'READY' : score >= 50 ? 'ALMOST_READY' : 'NOT_READY';
  }

  const isExamReady = displayState === 'EXAM_READY';
  const isReady = displayState === 'READY' || isExamReady;
  const isPreparing = displayState === 'PREPARING';
  const isAlmost = displayState === 'ALMOST_READY' || displayState === 'ALMOST READY' || isPreparing;
  const isFoundation = displayState === 'FOUNDATION';

  let toneStyle = {
    background: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    color: '#f87171',
    label: isFoundation ? 'Foundation' : 'Not Ready'
  };

  if (isReady) {
    toneStyle = {
      background: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      color: '#34d399',
      label: isExamReady ? 'Exam Ready' : 'Ready'
    };
  } else if (isAlmost) {
    toneStyle = {
      background: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.35)',
      color: '#fbbf24',
      label: isPreparing ? 'Preparing' : 'Almost Ready'
    };
  }

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        borderRadius: '9999px',
        border: `1px solid ${toneStyle.borderColor}`,
        background: toneStyle.background,
        color: toneStyle.color,
        padding: '0.2rem 0.65rem',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.02em'
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'currentColor'
        }}
      />
      {typeof score === 'number' ? `${score}% · ` : ''}{toneStyle.label}
    </span>
  );
}

export function StatPill({
  icon,
  label,
  value
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '0.75rem 1rem'
      }}
    >
      {icon && <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>{label}</p>
        <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}
