'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ReadinessSummaryCards } from '@/components/dashboard/ReadinessSummaryCards';
import { OpportunityFilterToolbar } from '@/components/dashboard/OpportunityFilterToolbar';
import { OpportunityResultsGrid } from '@/components/dashboard/OpportunityResultsGrid';
import CareerRoadmapView from '@/components/CareerRoadmapView';
import { Opportunity, ReadinessDiagnosis } from '@/types';
import { Compass, LayoutGrid } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'ROADMAP'>('MARKETPLACE');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [diagnoses, setDiagnoses] = useState<Record<string, ReadinessDiagnosis>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch live opportunities from /api/opportunities
      const resOpp = await fetch('/api/opportunities');
      const dataOpp = await resOpp.json();

      if (!resOpp.ok || !dataOpp.success) {
        throw new Error(dataOpp.error || 'Failed to fetch opportunities from Supabase');
      }

      const fetchedOpps: Opportunity[] = dataOpp.opportunities || [];
      setOpportunities(fetchedOpps);

      // 2. Ultra-fast bulk readiness diagnosis using candidate profile
      let clientProfile: any = null;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('candidate_profile_data');
        if (stored) {
          try {
            clientProfile = JSON.parse(stored);
          } catch (e) {}
        }
      }

      const resDiag = await fetch('/api/readiness/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true, candidate_profile: clientProfile })
      });

      if (resDiag.ok) {
        const dataDiag = await resDiag.json();
        if (dataDiag.diagnoses) {
          setDiagnoses(dataDiag.diagnoses);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load opportunity dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Career Readiness Overview counters
  let countReady = 0;
  let countAlmost = 0;
  let countNotReady = 0;

  for (const opp of opportunities) {
    const diag = diagnoses[opp.id];
    const st = diag ? diag.readiness_state : 'NOT_READY';
    if (st === 'READY' || st === 'EXAM_READY') countReady++;
    else if (st === 'ALMOST_READY' || st === 'PREPARING') countAlmost++;
    else countNotReady++;
  }

  // Sort: Recommended (READY & ALMOST_READY) roles first in descending score order
  const sortedOpportunities = [...opportunities].sort((a, b) => {
    const diagA = diagnoses[a.id];
    const diagB = diagnoses[b.id];
    const scoreA = diagA ? diagA.readiness_score : 0;
    const scoreB = diagB ? diagB.readiness_score : 0;
    return scoreB - scoreA;
  });

  // Filter Opportunities
  const filteredOpportunities = sortedOpportunities.filter((opp) => {
    const diag = diagnoses[opp.id];
    const state = diag ? diag.readiness_state : 'NOT_READY';
    const isStateReady = state === 'READY' || state === 'EXAM_READY';
    const isStateAlmost = state === 'ALMOST_READY' || state === 'PREPARING';
    const isStateNotReady = state === 'NOT_READY' || state === 'FOUNDATION';

    if (stateFilter === 'READY' && !isStateReady) {
      return false;
    }
    if (stateFilter === 'ALMOST_READY' && !isStateAlmost) {
      return false;
    }
    if (stateFilter === 'NOT_READY' && !isStateNotReady) {
      return false;
    }
    if (stateFilter !== 'ALL' && stateFilter !== 'READY' && stateFilter !== 'ALMOST_READY' && stateFilter !== 'NOT_READY' && state !== stateFilter) {
      return false;
    }
    if (typeFilter !== 'ALL' && opp.opportunity_type.toLowerCase() !== typeFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchOrg = opp.organization.toLowerCase().includes(q);
      const matchDesc = opp.description.toLowerCase().includes(q);
      if (!matchTitle && !matchOrg && !matchDesc) return false;
    }
    return true;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setStateFilter('ALL');
    setTypeFilter('ALL');
  };

  return (
    <AppShell>
      {/* 1. Page Title & Action Buttons Group */}
      <DashboardHeader
        title="Opportunity Readiness & Career Intelligence"
        description="Score, rank, and track opportunities based on verified resume evidence, and execute your personalized career milestone roadmap."
        onRefresh={loadData}
        isRefreshing={isLoading}
      />

      {/* 2. Top Navigation View Selector (Marketplace vs Roadmap) */}
      <div className="view-selector-container">
        <style jsx>{`
          .view-selector-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.35rem;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            max-width: 420px;
            margin: 0.5rem 0 1.75rem 0;
          }
          .view-tab-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.6rem 1rem;
            border-radius: 9px;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
            border: none;
            transition: all 0.2s ease;
          }
          .view-tab-btn.active {
            background: var(--primary);
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
          }
          .view-tab-btn.inactive {
            background: transparent;
            color: var(--muted-foreground);
          }
          .view-tab-btn.inactive:hover {
            color: var(--foreground);
            background: var(--surface-2);
          }
        `}</style>
        <button
          type="button"
          onClick={() => setActiveTab('MARKETPLACE')}
          className={`view-tab-btn ${activeTab === 'MARKETPLACE' ? 'active' : 'inactive'}`}
        >
          <LayoutGrid style={{ width: '15px', height: '15px' }} />
          <span>Marketplace</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ROADMAP')}
          className={`view-tab-btn ${activeTab === 'ROADMAP' ? 'active' : 'inactive'}`}
        >
          <Compass style={{ width: '15px', height: '15px' }} />
          <span>Career Roadmap</span>
        </button>
      </div>

      {activeTab === 'ROADMAP' ? (
        <CareerRoadmapView />
      ) : (
        <>
          {/* 3. Readiness Summary Metric Cards */}
          <ReadinessSummaryCards
            countReady={countReady}
            countAlmost={countAlmost}
            countNotReady={countNotReady}
          />

          {/* 4. Responsive Search & Filter Toolbar */}
          <OpportunityFilterToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            stateFilter={stateFilter}
            onStateFilterChange={setStateFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            filteredCount={filteredOpportunities.length}
            totalCount={opportunities.length}
          />

          {/* 5. Opportunity Results Grid / Contained Loading State / Empty State */}
          <OpportunityResultsGrid
            opportunities={filteredOpportunities}
            diagnoses={diagnoses}
            isLoading={isLoading}
            error={error}
            onRetry={loadData}
            onResetFilters={handleResetFilters}
          />
        </>
      )}
    </AppShell>
  );
}
