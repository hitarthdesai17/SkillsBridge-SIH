'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader, GlassPanel } from '@/components/ui/GlassPanel';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ReadinessBadge, StatPill } from '@/components/ui/Badges';
import GapAnalysisView from '@/components/GapAnalysisView';
import ProjectRecommendationCard from '@/components/ProjectRecommendationCard';
import ReassessmentSimulator from '@/components/ReassessmentSimulator';
import { Opportunity, ReadinessDiagnosis, GapAnalysisResult, ProjectRecommendation } from '@/types';
import {
  ArrowLeft,
  Building,
  MapPin,
  Calendar,
  Wallet,
  Zap,
  Sparkles,
  Loader2,
  AlertCircle,
  FileCheck
} from 'lucide-react';

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [diagnosis, setDiagnosis] = useState<ReadinessDiagnosis | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResult | null>(null);
  const [project, setProject] = useState<ProjectRecommendation | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch Opportunity
      const resOpp = await fetch('/api/opportunities');
      const dataOpp = await resOpp.json();
      if (!resOpp.ok || !dataOpp.success) {
        throw new Error(dataOpp.error || 'Failed to fetch opportunities');
      }

      const opp: Opportunity | undefined = (dataOpp.opportunities || []).find((o: Opportunity) => o.id === id);
      if (!opp) {
        throw new Error(`Opportunity with ID '${id}' not found`);
      }
      setOpportunity(opp);

      // Read active candidate profile from localStorage for instant client session fidelity
      let clientProfile: any = null;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('candidate_profile_data');
        if (stored) {
          try {
            clientProfile = JSON.parse(stored);
          } catch (e) {}
        }
      }

      // 2. Fetch Readiness Diagnosis
      const resDiag = await fetch('/api/readiness/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: id, candidate_profile: clientProfile })
      });
      if (resDiag.ok) {
        const dataDiag = await resDiag.json();
        if (dataDiag.success) {
          setDiagnosis(dataDiag.diagnosis || dataDiag.assessment);
        }
      }

      // 3. Fetch Gap Analysis
      const resGap = await fetch('/api/gaps/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: id, candidate_profile: clientProfile })
      });
      if (resGap.ok) {
        const dataGap = await resGap.json();
        if (dataGap.success) {
          setGapAnalysis(dataGap.gap_analysis);
        }
      }

      // 4. Fetch Targeted Project Recommendation
      const resProj = await fetch('/api/projects/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: id, candidate_profile: clientProfile })
      });
      if (resProj.ok) {
        const dataProj = await resProj.json();
        if (dataProj.success && dataProj.project_recommendation) {
          setProject(dataProj.project_recommendation);
        }
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load opportunity diagnostic details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const readinessScore = diagnosis?.readiness_score || 0;
  const readinessState = diagnosis?.readiness_state || 'NOT_READY';

  return (
    <AppShell>
      {/* Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            textDecoration: 'none',
            color: 'var(--muted-foreground)',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={14} /> <span>Back to Opportunity Marketplace</span>
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <GlassPanel style={{ padding: '4rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
            <Loader2 size={36} className="animate-spin" />
          </div>
          <p style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '1.1rem', margin: '0 0 0.35rem 0' }}>
            Evaluating Diagnostic &amp; Gap Blueprint
          </p>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>
            Running Gemini readiness breakdown, gap analysis, and targeted project generator...
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
            <AlertCircle size={18} /> <span>Unable to load diagnostic details</span>
          </div>
          <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>{error}</p>
          <button onClick={loadData} className="btn-secondary">
            Retry Loading Diagnostic
          </button>
        </div>
      )}

      {/* Diagnostic View */}
      {!isLoading && !error && opportunity && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Header Hero Card with ProgressRing */}
          <GlassPanel style={{ padding: '2.5rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '2rem',
                alignItems: 'center'
              }}
              className="diagnostic-hero-grid"
            >
              <style jsx>{`
                @media (min-width: 840px) {
                  .diagnostic-hero-grid {
                    grid-template-columns: 1fr auto !important;
                  }
                }
              `}</style>

              {/* Left Opportunity Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <span
                    style={{
                      borderRadius: '9999px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--muted-foreground)'
                    }}
                  >
                    {opportunity.opportunity_type}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={13} style={{ color: 'var(--primary)' }} /> {opportunity.location || 'Remote'}
                  </span>
                </div>

                <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '2.2rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
                  {opportunity.title}
                </h1>

                <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building size={16} /> {opportunity.organization}
                </p>

                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', maxWidth: '640px', margin: '0 0 1.5rem 0' }}>
                  {opportunity.description}
                </p>

                {/* Stat Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <StatPill
                    label="Formula Score"
                    value={`${readinessScore.toFixed(1)}%`}
                    icon={<FileCheck size={16} />}
                  />
                  {opportunity.stipend_salary_range && (
                    <StatPill
                      label="Compensation"
                      value={opportunity.stipend_salary_range}
                      icon={<Wallet size={16} />}
                    />
                  )}
                  {opportunity.deadline && (
                    <StatPill
                      label="Application Deadline"
                      value={new Date(opportunity.deadline).toLocaleDateString()}
                      icon={<Calendar size={16} />}
                    />
                  )}
                </div>
              </div>

              {/* Right Score Progress Ring */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <ProgressRing
                  value={Math.round(readinessScore)}
                  size={150}
                  stroke={12}
                  label="READINESS SCORE"
                  sublabel={readinessState}
                />
                <div style={{ marginTop: '1rem' }}>
                  <ReadinessBadge state={readinessState} score={readinessScore} />
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Gap Breakdown Component */}
          {gapAnalysis && (
            <GapAnalysisView gapAnalysis={gapAnalysis} />
          )}

          {/* Targeted Project Blueprint */}
          {project && (
            <ProjectRecommendationCard
              project={project}
              onSimulateCompletion={() => {
                // Scroll to simulator
                const simEl = document.getElementById('reassessment-simulator-section');
                if (simEl) simEl.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          )}

          {/* Interactive Reassessment Simulator */}
          <div id="reassessment-simulator-section">
            <ReassessmentSimulator
              opportunityId={opportunity.id}
              opportunityTitle={opportunity.title}
              targetSkills={project ? project.skills_learned : ['Target Skills']}
              projectTitle={project ? project.title : 'Targeted Portfolio Project'}
              initialScore={readinessScore}
              initialState={readinessState}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
