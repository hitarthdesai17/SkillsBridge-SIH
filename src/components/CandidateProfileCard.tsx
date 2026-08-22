'use client';

import React, { useState } from 'react';
import { ParsedResumeData } from '@/lib/resume_parser';
import { ParsedSkill } from '@/types';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { groupSkills, SkillEvidenceCard } from '@/components/ExtractedSkillGroups';
import {
  Mail,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Award,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Plus
} from 'lucide-react';

interface CandidateProfileCardProps {
  profile: ParsedResumeData;
  onProfileChange?: (updated: ParsedResumeData) => void;
}

export default function CandidateProfileCard({ profile, onProfileChange }: CandidateProfileCardProps) {
  const userInitials = profile.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'C';

  const coverage = profile.extraction_coverage;
  const groups = groupSkills(profile.skills as ParsedSkill[]);
  const editable = !!onProfileChange;

  const [draftSkill, setDraftSkill] = useState('');
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  // A user correction is stored as evidence, but tagged USER_ADDED so it can
  // never be read back as something the resume proved.
  const addSkill = () => {
    const term = draftSkill.trim();
    if (!term || !onProfileChange) return;
    const addition: ParsedSkill = {
      name: term,
      normalized_name: term.toLowerCase().replace(/\s+/g, '_'),
      proficiency_level: 'intermediate',
      provenance_source: 'User Added',
      provenance_context: '',
      extraction_confidence: 'UNKNOWN',
      source_evidence: 'Declared by the candidate during profile review.',
      original_term: term,
      canonical_term: term,
      skill_kind: 'UNKNOWN',
      evidence_strength: 'INFERRED',
      evidence_origin: 'USER_ADDED',
      is_unmapped: true
    };
    onProfileChange({ ...profile, skills: [...profile.skills, addition] });
    setDraftSkill('');
  };

  const removeSkill = (target: ParsedSkill) => {
    if (!onProfileChange) return;
    onProfileChange({
      ...profile,
      skills: profile.skills.filter(
        (s) => !(s.name === target.name && s.provenance_context === target.provenance_context)
      )
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Profile Card */}
      <GlassPanel style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: 'var(--gradient-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#ffffff',
                boxShadow: 'var(--shadow-lift)',
                flexShrink: 0
              }}
            >
              {userInitials}
            </div>
            <div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.25rem 0' }}>
                {profile.full_name}
              </h2>
              <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.25rem 0' }}>
                {profile.desired_role_title || 'Career Candidate'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--muted-foreground)' }}>
                <Mail size={14} />
                <span>{profile.email || 'Email not extracted'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: '9999px',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--success)',
                padding: '0.3rem 0.85rem',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <ShieldCheck size={14} /> VERIFIED EVIDENCE
            </span>
          </div>
        </div>

        {profile.summary && (
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.925rem', margin: 0, borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            {profile.summary}
          </p>
        )}
      </GlassPanel>

      {/* Extraction coverage -- honest reporting of what we did and did not recover */}
      {coverage && (
        <GlassPanel style={{ padding: '1.5rem 2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  fontFamily: 'Sora, sans-serif',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: coverage.is_low_coverage ? 'var(--warning)' : 'var(--success)'
                }}
              >
                {coverage.coverage_percentage}%
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)' }}>
                  Resume Extraction Coverage
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  How much structured information we recovered — not an accuracy score.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[
                ['Skills', coverage.skills_detected],
                ['Tools', coverage.tools_detected],
                ['Soft skills', coverage.soft_skills_detected],
                ['Projects', coverage.projects_detected],
                ['Experience', coverage.experience_entries_detected],
                ['Education', coverage.education_detected],
                ['Certifications', coverage.certifications_detected],
                ['Unmapped', coverage.unmapped_terms_detected]
              ].map(([label, value]) => (
                <span
                  key={String(label)}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '8px',
                    background: 'var(--surface-2)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {label}: {value}
                </span>
              ))}
            </div>
          </div>

          {coverage.warnings.length > 0 && (
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              {coverage.warnings.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.78rem', color: 'var(--warning)' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      )}

      {/* Extracted skills, grouped by kind, graded by evidence strength */}
      <GlassPanel style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
              Extracted Skills &amp; Evidence Provenance
            </h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
            {profile.skills.length} capabilities across {groups.length} categories
          </span>
        </div>

        {groups.map((group) => (
          <div key={group.key} style={{ marginBottom: '1.75rem' }}>
            <h4
              style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--muted-foreground)',
                margin: '0 0 0.75rem 0'
              }}
            >
              {group.title} <span style={{ opacity: 0.6 }}>({group.items.length})</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {group.items.map((skill, idx) => (
                <SkillEvidenceCard
                  key={`${group.key}_${idx}`}
                  skill={skill}
                  onRemove={editable ? removeSkill : undefined}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Review & correction. User additions stay separated from resume evidence. */}
        {editable && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--foreground)', marginBottom: '0.35rem' }}>
              Did SkillBridge extract your resume correctly?
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', margin: '0 0 0.85rem 0', lineHeight: 1.5 }}>
              Remove anything we got wrong, or add something we missed. Anything you add is
              labelled <strong>USER ADDED</strong> and is never counted as evidence verified from your resume.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
              <input
                value={draftSkill}
                onChange={(e) => setDraftSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addSkill();
                }}
                placeholder="Add a missing skill…"
                style={{
                  flex: '1 1 240px',
                  minWidth: '200px',
                  padding: '0.55rem 0.8rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--foreground)',
                  fontSize: '0.85rem'
                }}
              />
              <button type="button" onClick={addSkill} className="btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem' }}>
                <Plus size={14} /> <span>Add</span>
              </button>
              <button
                type="button"
                onClick={() => setReviewConfirmed(true)}
                className="btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              >
                {reviewConfirmed ? 'Confirmed' : 'Looks correct'}
              </button>
            </div>
          </div>
        )}
      </GlassPanel>

      {/* Portfolio Projects */}
      {profile.projects && profile.projects.length > 0 && (
        <GlassPanel style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <FolderGit2 size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
              Projects Extracted From Your Resume
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', margin: '-0.75rem 0 1.25rem 0' }}>
            These are projects your resume actually describes. Projects SkillBridge suggests you
            build appear separately in your roadmap as recommended future actions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {profile.projects.map((proj, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                      {proj.title}
                    </h4>
                    <span
                      style={{
                        borderRadius: '9999px',
                        border: `1px solid ${proj.origin === 'USER_ADDED' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        background: proj.origin === 'USER_ADDED' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: proj.origin === 'USER_ADDED' ? 'var(--primary)' : 'var(--success)',
                        padding: '0.15rem 0.5rem',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {proj.origin === 'USER_ADDED' ? 'USER ADDED' : 'FROM RESUME'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                    {proj.description}
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  {proj.tech_stack.map((t, tidx) => (
                    <span
                      key={tidx}
                      style={{
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: 'var(--surface-2)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Education */}
      {profile.education && profile.education.length > 0 && (
        <GlassPanel style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <GraduationCap size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
              Education
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {profile.education.map((edu, idx) => (
              <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--foreground)' }}>
                    {edu.degree}
                    {edu.field ? <span style={{ color: 'var(--primary)' }}> · {edu.field}</span> : null}
                  </strong>
                  {(edu.start_year || edu.end_year) && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                      {edu.start_year ? `${edu.start_year} – ` : ''}{edu.end_year || ''}
                    </span>
                  )}
                </div>
                {edu.institution && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', margin: '0.25rem 0 0 0' }}>{edu.institution}</p>
                )}
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Certifications & coursework */}
      {profile.certifications && profile.certifications.length > 0 && (
        <GlassPanel style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Award size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
              Certifications &amp; Coursework
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {profile.certifications.map((cert, idx) => (
              <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1rem' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>{cert.name}</strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', margin: '0.25rem 0 0 0' }}>
                  {cert.issuer || 'Issuer not stated'}
                  {cert.issued_on ? ` · ${cert.issued_on}` : ''}
                </p>
                {cert.associated_skills && cert.associated_skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.6rem' }}>
                    {cert.associated_skills.map((s, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          background: 'var(--surface-2)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Experience Timeline */}
      {profile.experiences && profile.experiences.length > 0 && (
        <GlassPanel style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                Work Experience &amp; Roles
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(99, 102, 241, 0.25)'
                }}
              >
                Total: {profile.experiences.reduce((acc, e) => acc + (e.duration_months || 0), 0)} Months ({Number((profile.experiences.reduce((acc, e) => acc + (e.duration_months || 0), 0) / 12).toFixed(1))} yrs)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {profile.experiences.map((exp, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                  <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                    {exp.role_title} · <span style={{ color: 'var(--primary)' }}>{exp.organization}</span>
                  </h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} /> {exp.duration_months} Months {exp.is_current ? '(Current)' : ''}
                  </span>
                </div>
                {exp.description && (
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--muted-foreground)', margin: 0 }}>
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
