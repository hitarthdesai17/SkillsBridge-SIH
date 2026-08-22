'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { ShieldCheck, Target, RefreshCcw, ArrowRight } from 'lucide-react';

const highlights = [
  { icon: ShieldCheck, title: 'Readiness scoring traced to real evidence', desc: 'No vague keyword matches — every score is backed by extracted proof.' },
  { icon: Target, title: 'Gap diagnosis before you apply', desc: 'Know which skills and eligibility criteria stand between you and the offer.' },
  { icon: RefreshCcw, title: 'Gap-targeted portfolio project blueprints', desc: 'Simulate skill gains and track your score jump from Almost Ready to Ready.' }
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        display: 'grid',
        gridTemplateColumns: '1fr'
      }}
      className="auth-grid"
    >
      <style jsx>{`
        @media (min-width: 1024px) {
          .auth-grid {
            grid-template-columns: 1.05fr 1fr !important;
          }
          .auth-right-hero {
            display: flex !important;
          }
        }
      `}</style>

      {/* Left Form Area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem 1.5rem',
          maxWidth: '520px',
          width: '100%',
          margin: '0 auto',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <Logo />
          <ThemeToggle />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', margin: '1rem 0' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: '0 0 0.5rem 0' }}>
              {title}
            </h1>
            <p style={{ fontSize: '0.925rem', color: 'var(--muted-foreground)', margin: 0 }}>
              {subtitle}
            </p>
          </div>

          <div>{children}</div>

          {footer && (
            <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              {footer}
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2rem', textAlign: 'center' }}>
          SkillBridge AI · Evidence-based career readiness intelligence platform.
        </p>
      </div>

      {/* Right Branding Showcase (Desktop) */}
      <div
        className="auth-right-hero"
        style={{
          display: 'none',
          position: 'relative',
          overflow: 'hidden',
          borderLeft: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '4rem 3.5rem'
        }}
      >
        <div className="bg-halo" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <div className="grid-fade" style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '460px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              background: 'var(--background)',
              padding: '0.25rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--primary)',
              marginBottom: '1.25rem'
            }}
          >
            INTELLIGENT CAREER ENGINE
          </span>

          <h2
            style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: '2.5rem',
              fontWeight: 700,
              lineHeight: 1.15,
              color: 'var(--foreground)',
              letterSpacing: '-0.025em',
              marginBottom: '2rem'
            }}
          >
            Your career readiness, <span className="text-gradient">measured</span> — not guessed.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 0.2rem 0' }}>
                      {h.title}
                    </h3>
                    <p style={{ fontSize: '0.825rem', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>
                      {h.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/dashboard"
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '9999px',
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem'
            }}
          >
            <span>Explore Opportunities</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
export default AuthLayout;
