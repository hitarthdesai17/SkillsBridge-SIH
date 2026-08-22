'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function ProgressRing({
  value,
  size = 140,
  stroke = 10,
  label,
  sublabel,
  className
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (c * Math.min(100, Math.max(0, value))) / 100;
  const gid = `ring-${Math.round(value)}-${size}`;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          pointerEvents: 'none'
        }}
      >
        <span style={{ fontFamily: 'Sora, sans-serif', fontSize: size >= 120 ? '1.75rem' : '1.15rem', fontWeight: 700, color: 'var(--foreground)' }}>
          {value}%
        </span>
        {label && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
            {label}
          </span>
        )}
        {sublabel && (
          <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

export function SkillBar({
  name,
  level,
  target
}: {
  name: string;
  level: number;
  target?: number;
}) {
  return (
    <div style={{ width: '100%', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
        <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{name}</span>
        <span style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>
          {level}%{target ? <span style={{ opacity: 0.7 }}> / {target}%</span> : null}
        </span>
      </div>
      <div style={{ height: '7px', width: '100%', borderRadius: '9999px', background: 'var(--surface-2)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, level))}%`,
            borderRadius: '9999px',
            background: 'var(--gradient-brand)',
            transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        />
      </div>
    </div>
  );
}
