'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn('group flex items-center gap-2.5 text-decoration-none', className)} style={{ textDecoration: 'none' }}>
      <span
        style={{
          display: 'flex',
          width: '36px',
          height: '36px',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          background: 'var(--gradient-brand)',
          boxShadow: 'var(--shadow-lift)',
          flexShrink: 0
        }}
      >
        <svg
          viewBox="0 0 24 24"
          style={{ width: '20px', height: '20px' }}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 17V9" />
          <path d="M20 17V9" />
          <path d="M4 12h16" />
          <path d="M9 12l3-4 3 4" />
        </svg>
      </span>
      {!compact && (
        <span
          style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: '1.1rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--foreground)'
          }}
        >
          SkillBridge
          <span className="text-gradient"> AI</span>
        </span>
      )}
    </Link>
  );
}
export default Logo;
