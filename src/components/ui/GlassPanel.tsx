'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GlassPanel({
  children,
  className,
  hover = false,
  style
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn('glass rounded-2xl', hover && 'hover-lift', className)}
      style={{
        borderRadius: '16px',
        padding: '1.5rem',
        ...style
      }}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: 'center' | 'left';
  className?: string;
}) {
  return (
    <div
      className={cn(
        align === 'center' ? 'text-center mx-auto' : 'text-left',
        className
      )}
      style={{
        maxWidth: '42rem',
        margin: align === 'center' ? '0 auto' : undefined,
        textAlign: align === 'center' ? 'center' : 'left'
      }}
    >
      {eyebrow && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '9999px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            padding: '0.25rem 0.85rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--primary)',
            marginBottom: '0.75rem'
          }}
        >
          {eyebrow}
        </span>
      )}
      <h2
        style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: '2.25rem',
          fontWeight: 700,
          color: 'var(--foreground)',
          letterSpacing: '-0.025em',
          lineHeight: 1.2
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            marginTop: '0.75rem',
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--muted-foreground)'
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('page-header-container', className)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '1.75rem',
        marginBottom: '2rem'
      }}
    >
      <style jsx>{`
        @media (min-width: 768px) {
          .page-header-container {
            flex-direction: row !important;
            align-items: flex-end !important;
            justify-content: space-between !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
      <div style={{ flex: 1, minWidth: 0, maxWidth: '720px' }}>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.4rem 0', lineHeight: 1.2 }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--muted-foreground)', margin: 0 }}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
