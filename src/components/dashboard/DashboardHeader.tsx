'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCcw, Upload, Sparkles } from 'lucide-react';

interface DashboardHeaderProps {
  title?: string;
  description?: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function DashboardHeader({
  title = 'Opportunity Readiness Marketplace',
  description = 'SkillBridge scores and ranks roles based on your verified resume evidence, prioritizing opportunities you can win without hiding unready ones.',
  onRefresh,
  isRefreshing = false
}: DashboardHeaderProps) {
  return (
    <div className="dashboard-header-root">
      <style jsx>{`
        .dashboard-header-root {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding-bottom: 1.75rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border);
        }

        @media (min-width: 880px) {
          .dashboard-header-root {
            flex-direction: row;
            align-items: flex-end;
            justify-content: space-between;
            gap: 2rem;
          }
        }

        .header-text-block {
          flex: 1;
          min-width: 0;
          max-width: 720px;
        }

        .header-title {
          font-family: 'Sora', system-ui, sans-serif;
          font-size: clamp(1.6rem, 3.5vw, 2.25rem);
          font-weight: 800;
          color: var(--foreground);
          letter-spacing: -0.025em;
          line-height: 1.2;
          margin: 0 0 0.5rem 0;
        }

        .header-desc {
          font-size: 0.925rem;
          line-height: 1.55;
          color: var(--muted-foreground);
          margin: 0;
        }

        .header-actions-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        @media (max-width: 540px) {
          .header-actions-group {
            width: 100%;
          }
          .header-action-btn {
            flex: 1;
            justify-content: center;
          }
        }

        .header-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          height: 40px;
          padding: 0 1.15rem;
          border-radius: 12px;
          font-family: 'Sora', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          white-space: nowrap;
        }

        .header-action-btn:hover {
          transform: translateY(-1px);
        }
      `}</style>

      {/* Title & Description */}
      <div className="header-text-block">
        <h1 className="header-title">{title}</h1>
        <p className="header-desc">{description}</p>
      </div>

      {/* Action Buttons Group */}
      <div className="header-actions-group">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="header-action-btn btn-secondary"
          title="Refresh opportunity readiness data"
        >
          <RefreshCcw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          <span>Refresh Feed</span>
        </button>

        <Link
          href="/upload"
          className="header-action-btn btn-primary"
          title="Upload resume to recalculate readiness"
        >
          <Upload size={15} />
          <span>Upload Resume</span>
        </Link>
      </div>
    </div>
  );
}
export default DashboardHeader;
