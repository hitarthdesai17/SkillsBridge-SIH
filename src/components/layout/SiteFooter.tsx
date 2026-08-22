'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Sparkles, Shield, Cpu, ExternalLink } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '4rem 1.5rem 2.5rem 1.5rem',
        marginTop: 'auto'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem'
          }}
        >
          {/* Brand Col */}
          <div>
            <Logo />
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--muted-foreground)' }}>
              AI Career Operating System. Traceable readiness scoring, verified evidence provenance, and gap-targeted portfolio projects.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#34d399'
                }}
              >
                <Cpu size={12} /> DETERMINISTIC AI ENGINES
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem' }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li><Link href="/upload" style={{ textDecoration: 'none', color: 'var(--muted-foreground)' }}>Upload & ATS Parsing</Link></li>
              <li><Link href="/dashboard" style={{ textDecoration: 'none', color: 'var(--muted-foreground)' }}>Opportunity Marketplace</Link></li>
              <li><Link href="/profile" style={{ textDecoration: 'none', color: 'var(--muted-foreground)' }}>Evidence Profile</Link></li>
              <li><Link href="/dashboard" style={{ textDecoration: 'none', color: 'var(--muted-foreground)' }}>Reassessment Simulator</Link></li>
            </ul>
          </div>

          {/* Pillars */}
          <div>
            <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem' }}>
              Trust & Principles
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li style={{ color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shield size={14} style={{ color: 'var(--primary)' }} /> NO EVIDENCE = NO CLAIM
              </li>
              <li style={{ color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shield size={14} style={{ color: 'var(--primary)' }} /> Zero Keyword Hallucination
              </li>
              <li style={{ color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shield size={14} style={{ color: 'var(--primary)' }} /> Hard Eligibility Gating
              </li>
              <li style={{ color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shield size={14} style={{ color: 'var(--primary)' }} /> Multi-Tenant Row Level Security
              </li>
            </ul>
          </div>

          {/* Career Domains */}
          <div>
            <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem' }}>
              Career Domains
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {['Tech & Software', 'Data & AI', 'Business & Sales', 'Healthcare', 'Fitness & Wellness', 'Civil & Govt Exams'].map((d) => (
                <span
                  key={d}
                  style={{
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    padding: '0.15rem 0.5rem',
                    fontSize: '0.725rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8rem',
            color: 'var(--muted-foreground)'
          }}
        >
          <p style={{ margin: 0 }}>
            © 2026 SkillBridge AI. Engineered for Smart India Hackathon.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Built with Next.js 14, Supabase & Gemini</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default SiteFooter;
