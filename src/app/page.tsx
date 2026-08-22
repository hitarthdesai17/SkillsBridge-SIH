'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiteNavbar } from '@/components/layout/SiteNavbar';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { GlassPanel, SectionHeading } from '@/components/ui/GlassPanel';
import { ProgressRing } from '@/components/ui/ProgressRing';
import {
  ArrowRight,
  BrainCircuit,
  Compass,
  FileSearch,
  Gauge,
  GraduationCap,
  LineChart,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  ChevronDown,
  Cpu,
  CheckCircle2
} from 'lucide-react';

const features = [
  { icon: Compass, title: 'AI Career Navigator', text: 'Ranked career directions across 12+ domains (Tech, Data/AI, Healthcare, Fitness, Government Exams) mapped to your evidence.' },
  { icon: FileSearch, title: 'Resume Parsing & ATS', text: 'Extracts skills, projects, and work experience with verified evidence provenance and extraction confidence tags.' },
  { icon: Gauge, title: 'Deterministic Readiness Engine', text: 'Traceable readiness scoring (50% Skill + 30% Evidence + 20% Experience) gated by binary Hard Eligibility.' },
  { icon: Target, title: '4-Tier Gap Analysis', text: 'Distinguishes between Skill Gaps, Evidence Gaps, Experience Gaps, and un-bypassable Hard Eligibility Gaps.' },
  { icon: Rocket, title: 'Targeted Project Blueprints', text: 'Generates scoped portfolio projects designed specifically to bridge your identified missing capabilities.' },
  { icon: RefreshCcw, title: 'Reassessment Simulator', text: 'Simulate completing your portfolio project and watch your score transition dynamically from Almost Ready to Ready.' },
  { icon: ShieldCheck, title: 'NO EVIDENCE = NO CLAIM', text: 'Strict truthfulness guarantee — SkillBridge never hallucinates unstated credentials or fake profile links.' },
  { icon: Cpu, title: 'Government & Public Pathways', text: 'Track official notifications for UPSC Civil Services, SSC CGL, and competitive exams with verified source provenance.' }
];

const steps = [
  { icon: Upload, step: '01', title: 'Upload your resume', text: 'Upload any standard or scanned PDF resume. Ingestion pipeline extracts grounded candidate claims.' },
  { icon: BrainCircuit, step: '02', title: 'Get analyzed', text: 'The readiness engine evaluates your evidence against real role requirements with zero LLM hallucinations.' },
  { icon: Target, step: '03', title: 'Expose the gaps', text: 'See exactly what capabilities, missing evidence, or hard eligibility criteria stand between you and the role.' },
  { icon: GraduationCap, step: '04', title: 'Bridge & reassess', text: 'Follow the targeted portfolio project blueprint, simulate completion, and watch your readiness score jump.' }
];

const journey = [
  'Resume upload & OCR extraction',
  'Candidate profile with evidence provenance tags',
  'Opportunity matching across 12+ career domains',
  'Binary hard eligibility gate validation',
  '4-tier gap classification & blocking impact analysis',
  'Gap-targeted portfolio project generation',
  'Interactive reassessment simulation',
  'Score jump: ALMOST READY → READY'
];

const principles = [
  { icon: ShieldCheck, title: 'Evidence, not adjectives', text: 'Every claim on your profile is backed by parsed text quotes and confidence ratings that employers can verify.' },
  { icon: Sparkles, title: 'Direction over volume', text: 'Stop spray-and-pray applications. Targeted applications with closed skill gaps beat thirty hopeful ones.' },
  { icon: Target, title: 'Transparent marketplace', text: 'Unready opportunities remain visible with clear visual badges so you always know what skills to build next.' }
];

const faqs = [
  {
    q: 'How does SkillBridge calculate my readiness score?',
    a: 'SkillBridge uses a deterministic, verified formula: 50% Skill Match + 30% Evidence Proof + 20% Experience Alignment. If a mandatory Hard Eligibility rule (degree, age, experience, deadline) is failed, the readiness score is gated by a 0.0 multiplier.'
  },
  {
    q: 'What is the NO EVIDENCE = NO CLAIM guarantee?',
    a: 'SkillBridge strictly rejects AI keyword hallucination. If a skill, project, or certification cannot be found and proven with evidence from your uploaded resume, it is never attributed to your profile.'
  },
  {
    q: 'Can SkillBridge evaluate non-computer science careers?',
    a: 'Yes! SkillBridge is career-agnostic and supports 12+ domains including Technology, Data/AI, Healthcare, Fitness & Wellness, Business, and Government Competitive Exams (UPSC, SSC).'
  },
  {
    q: 'How does the Reassessment Simulator work?',
    a: 'When you complete a recommended project, the simulator passes the updated evidence through our production backend readiness engine in memory to recalculate your new readiness score and state transition.'
  }
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
      <SiteNavbar />

      {/* Hero Section */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '5rem 1.5rem 6rem 1.5rem' }}>
        <div className="bg-halo" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <div className="grid-fade" style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }} />

        <div
          style={{
            position: 'relative',
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '3.5rem',
            alignItems: 'center'
          }}
          className="hero-grid"
        >
          <style jsx>{`
            @media (min-width: 1024px) {
              .hero-grid {
                grid-template-columns: 1.05fr 1fr !important;
              }
            }
          `}</style>

          {/* Left Hero Content */}
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: '9999px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                padding: '0.35rem 0.95rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: 'var(--primary)',
                marginBottom: '1.5rem'
              }}
            >
              <Sparkles size={14} /> AI Career Operating System · not a job portal
            </span>

            <h1
              style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: 'clamp(2.4rem, 5vw, 3.75rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: 'var(--foreground)',
                marginBottom: '1.25rem'
              }}
            >
              Bridge your skills to your <span className="text-gradient">dream career</span>
            </h1>

            <p
              style={{
                fontSize: '1.1rem',
                lineHeight: 1.65,
                color: 'var(--muted-foreground)',
                maxWidth: '34rem',
                marginBottom: '2rem'
              }}
            >
              SkillBridge AI reads your resume, scores your readiness for real opportunities, exposes the exact gap, and generates the targeted project blueprint to close it.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '2.5rem' }}>
              <Link href="/upload" className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
                <span>Analyze my resume</span>
                <ArrowRight size={18} />
              </Link>
              <Link href="/dashboard" className="btn-secondary" style={{ padding: '0.85rem 1.5rem', fontSize: '0.95rem' }}>
                <span>Explore Opportunities</span>
              </Link>
            </div>

            {/* Value Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.75rem' }}>
              <div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                  100%
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>Deterministic Scoring</p>
              </div>
              <div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                  12+
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>Career Domains</p>
              </div>
              <div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                  4-Tier
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>Gap Classification</p>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Card */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lift)'
              }}
            >
              <img
                src="/assets/hero-visual.jpg"
                alt="SkillBridge AI readiness visual"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />

              {/* Floating Glass Badges */}
              <div
                className="glass floating-badge-1"
                style={{
                  position: 'absolute',
                  bottom: '1.25rem',
                  left: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-lift)'
                }}
              >
                <ProgressRing value={85} size={64} stroke={7} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Readiness Score</p>
                  <p style={{ fontSize: '0.75rem', color: '#34d399', margin: 0, fontWeight: 600 }}>READY · Verified Proof</p>
                </div>
              </div>

              <div
                className="glass floating-badge-2"
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '14px'
                }}
              >
                <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>Targeted Project</p>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--foreground)', margin: '0.15rem 0' }}>Power BI & DAX Blueprint</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, margin: 0 }}>+17.5% Score Jump</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        <SectionHeading
          eyebrow="Platform Engines"
          title="One system for your whole career journey"
          description="Deterministic engines that talk to each other. Upload once and your readiness scores, gap diagnoses, and portfolio project blueprints all update."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            marginTop: '3.5rem'
          }}
        >
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <GlassPanel key={f.title} hover style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem'
                  }}
                >
                  <Icon size={20} />
                </div>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--muted-foreground)', margin: 0 }}>
                  {f.text}
                </p>
              </GlassPanel>
            );
          })}
        </div>
      </section>

      {/* How It Works (4 Steps) */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <SectionHeading eyebrow="How It Works" title="Four steps from confusion to offer" />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
              marginTop: '3.5rem'
            }}
          >
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  style={{
                    borderRadius: '18px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    padding: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {s.step}
                  </span>
                  <div style={{ color: 'var(--primary)', margin: '1rem 0 0.5rem 0' }}>
                    <Icon size={24} />
                  </div>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.4rem' }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.55, color: 'var(--muted-foreground)', margin: 0 }}>
                    {s.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Career Journey Loop */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <SectionHeading
          eyebrow="The Career Pathway Loop"
          title="The system that continuously improves you"
          description="Traditional portals end at 'apply'. SkillBridge turns identified gaps and simulations into actionable portfolio blueprints."
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', marginTop: '3.5rem' }}>
          {journey.map((item, idx) => (
            <div
              key={item}
              className="glass hover-lift"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderRadius: '14px'
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'var(--gradient-brand)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {idx + 1}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Core Principles */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '5rem 1.5rem' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '3rem',
            alignItems: 'center'
          }}
          className="principles-grid"
        >
          <style jsx>{`
            @media (min-width: 1024px) {
              .principles-grid {
                grid-template-columns: 0.9fr 1.1fr !important;
              }
            }
          `}</style>
          <div>
            <SectionHeading
              align="left"
              eyebrow="Why It's Different"
              title="Engineered for outcomes, not mass listings"
              description="Students don't miss out on opportunities because they can't find job listings. They miss out because nobody showed them what specific evidence was missing."
            />
            <div style={{ marginTop: '2rem' }}>
              <Link href="/upload" className="btn-primary" style={{ padding: '0.85rem 1.75rem' }}>
                <span>Upload & Test Your Resume</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {principles.map((p) => {
              const Icon = p.icon;
              return (
                <GlassPanel key={p.title} hover style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1.25rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.25rem 0' }}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--muted-foreground)', margin: 0 }}>
                      {p.text}
                    </p>
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <SectionHeading eyebrow="FAQ" title="Questions candidates ask first" />

        <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {faqs.map((faq, idx) => (
            <div
              key={faq.q}
              style={{
                borderRadius: '14px',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.15rem 1.5rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--foreground)',
                  fontFamily: 'Sora, sans-serif',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={18}
                  style={{
                    transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                    color: 'var(--muted-foreground)'
                  }}
                />
              </button>
              {openFaq === idx && (
                <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--muted-foreground)' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section style={{ padding: '0 1.5rem 5rem 1.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '28px',
            background: 'var(--gradient-brand)',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lift)'
          }}
        >
          <div className="grid-fade" style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }} />
          <h2
            style={{
              position: 'relative',
              fontFamily: 'Sora, sans-serif',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 1rem 0'
            }}
          >
            Know exactly where you stand. Today.
          </h2>
          <p
            style={{
              position: 'relative',
              maxWidth: '36rem',
              margin: '0 auto 2rem auto',
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.6
            }}
          >
            Upload your resume and get a traceable readiness score, 4-tier gap diagnosis, and targeted portfolio project in seconds.
          </p>
          <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            <Link
              href="/upload"
              style={{
                borderRadius: '9999px',
                padding: '0.85rem 1.85rem',
                backgroundColor: '#ffffff',
                color: '#4f46e5',
                fontFamily: 'Sora, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
              }}
            >
              Upload resume
            </Link>
            <Link
              href="/signup"
              style={{
                borderRadius: '9999px',
                padding: '0.85rem 1.85rem',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontFamily: 'Sora, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none'
              }}
            >
              Create free account
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
