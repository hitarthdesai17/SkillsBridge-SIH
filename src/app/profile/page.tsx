'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import CandidateProfileCard from '@/components/CandidateProfileCard';
import { PageHeader, GlassPanel } from '@/components/ui/GlassPanel';
import { ParsedResumeData } from '@/lib/resume_parser';
import { Loader2, AlertCircle, ArrowRight, Upload } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<ParsedResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check localStorage first if user just uploaded a resume
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('candidate_profile_data');
        if (stored) {
          try {
            setProfile(JSON.parse(stored));
            setIsLoading(false);
            return;
          } catch (e) {
            // Fall through to API fetch
          }
        }
      }

      // Fetch demo candidate profile from backend API
      const res = await fetch('/api/candidate/profile');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch candidate profile');
      }

      const p = data.profile;
      const formatted: ParsedResumeData = {
        full_name: p.full_name,
        email: p.email,
        summary: p.summary || '',
        desired_role_title: p.desired_role_title || 'Candidate Profile',
        // Spread each record so the canonical evidence layer survives the hop.
        skills: (p.skills || []).map((s: any) => ({
          ...s,
          name: s.name,
          normalized_name: s.normalized_name,
          proficiency_level: s.proficiency_level || 'intermediate',
          provenance_source: s.provenance_source || 'Resume PDF',
          provenance_context: s.provenance_context || '',
          extraction_confidence: s.extraction_confidence || 'HIGH',
          source_evidence: s.source_evidence || 'Listed in resume',
          evidence_origin: s.evidence_origin || 'RESUME'
        })),
        projects: (p.projects || []).map((proj: any) => ({
          ...proj,
          title: proj.title,
          description: proj.description || '',
          tech_stack: proj.tech_stack || [],
          github_url: proj.github_url || null,
          live_url: proj.live_url || null,
          origin: proj.origin || 'RESUME_DERIVED'
        })),
        experiences: (p.experiences || p.experience || []).map((exp: any) => ({
          organization: exp.organization,
          role_title: exp.role_title,
          duration_months: exp.duration_months || 0,
          description: exp.description || '',
          is_current: exp.is_current || false
        })),
        education: p.education || [],
        certifications: p.certifications || [],
        extraction_coverage: p.extraction_coverage
      };

      setProfile(formatted);

    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  // User corrections are written back to the cached profile so the readiness
  // engines see them, but each edited record keeps its own evidence_origin --
  // USER_ADDED never masquerades as resume-derived evidence.
  const handleProfileChange = (updated: ParsedResumeData) => {
    setProfile(updated);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('candidate_profile_data');
        const base = stored ? JSON.parse(stored) : {};
        localStorage.setItem(
          'candidate_profile_data',
          JSON.stringify({
            ...base,
            ...updated,
            experience: updated.experiences,
            experiences: updated.experiences
          })
        );
      } catch {
        // Cache write is best-effort; the in-memory profile is authoritative.
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Extracted Candidate Profile"
        description="Ground-truth resume extraction results with verified skill evidence provenance."
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/upload" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.825rem' }}>
              <Upload size={14} /> <span>Upload New Resume</span>
            </Link>
            <Link href="/dashboard" className="btn-primary" style={{ padding: '0.5rem 1.15rem', fontSize: '0.825rem' }}>
              <span>View Marketplace</span> <ArrowRight size={14} />
            </Link>
          </div>
        }
      />

      {/* Loading State */}
      {isLoading && (
        <GlassPanel style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
            <Loader2 size={32} className="animate-spin" />
          </div>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.925rem' }}>
            Fetching candidate profile and evidence tags...
          </p>
        </GlassPanel>
      )}

      {/* Error State */}
      {error && (
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
            <AlertCircle size={18} /> <span>Unable to load candidate profile</span>
          </div>
          <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>{error}</p>
          <button onClick={fetchProfile} className="btn-secondary">
            Retry Loading Profile
          </button>
        </div>
      )}

      {/* Profile View */}
      {!isLoading && !error && profile && (
        <CandidateProfileCard profile={profile} onProfileChange={handleProfileChange} />
      )}
    </AppShell>
  );
}
