'use client';

import React from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Search, X, Filter } from 'lucide-react';

interface OpportunityFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  stateFilter: string;
  onStateFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
}

export function OpportunityFilterToolbar({
  searchQuery,
  onSearchChange,
  stateFilter,
  onStateFilterChange,
  typeFilter,
  onTypeFilterChange,
  filteredCount,
  totalCount
}: OpportunityFilterToolbarProps) {
  return (
    <GlassPanel style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
      <style jsx>{`
        .toolbar-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          width: 100%;
        }

        @media (min-width: 1100px) {
          .toolbar-container {
            flex-direction: row;
            align-items: center;
            justifyContent: space-between;
            gap: 1.5rem;
          }
        }

        .search-field-wrapper {
          position: relative;
          flex: 1;
          min-width: 0;
          max-width: 100%;
        }

        @media (min-width: 1100px) {
          .search-field-wrapper {
            max-width: 380px;
          }
        }

        .search-input {
          width: 100%;
          height: 42px;
          padding-left: 2.5rem;
          padding-right: 2rem;
          border-radius: 12px;
          font-size: 0.875rem;
          background: var(--surface);
          color: var(--foreground);
          border: 1px solid var(--border);
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }

        .search-input:focus {
          border-color: var(--primary);
          outline: none;
        }

        .filter-controls-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.85rem;
          align-items: center;
        }

        @media (min-width: 600px) and (max-width: 1099px) {
          .filter-controls-group {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
          }
        }

        @media (min-width: 1100px) {
          .filter-controls-group {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        @media (min-width: 768px) {
          .filter-item {
            flex-direction: row;
            align-items: center;
            gap: 0.5rem;
          }
        }

        .filter-label {
          font-size: 0.775rem;
          font-weight: 700;
          color: var(--muted-foreground);
          white-space: nowrap;
        }

        .filter-select {
          height: 38px;
          padding: 0 0.85rem;
          border-radius: 10px;
          font-size: 0.825rem;
          font-weight: 500;
          background: var(--surface);
          color: var(--foreground);
          border: 1px solid var(--border);
          box-sizing: border-box;
          cursor: pointer;
        }

        .filter-select:focus {
          border-color: var(--primary);
          outline: none;
        }

        .result-count-badge {
          font-size: 0.825rem;
          color: var(--muted-foreground);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        @media (max-width: 1099px) {
          .result-count-badge {
            padding-top: 0.5rem;
            border-top: 1px solid var(--border);
          }
        }
      `}</style>

      <div className="toolbar-container">
        {/* Search Input Box */}
        <div className="search-field-wrapper">
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.9rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted-foreground)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Search by role, company, or skill..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Selectors */}
        <div className="filter-controls-group">
          {/* Readiness Status Filter */}
          <div className="filter-item">
            <label className="filter-label">Readiness:</label>
            <select
              value={stateFilter}
              onChange={(e) => onStateFilterChange(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Roles</option>
              <option value="READY">Ready Only (≥80%)</option>
              <option value="ALMOST_READY">Almost Ready (60-79%)</option>
              <option value="NOT_READY">Not Ready (&lt;60%)</option>
            </select>
          </div>

          {/* Opportunity Type Filter */}
          <div className="filter-item">
            <label className="filter-label">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Types</option>
              <option value="job">Private Jobs</option>
              <option value="internship">Internships</option>
              <option value="government">Government / Public Exams</option>
              <option value="hackathon">Hackathons</option>
              <option value="apprenticeship">Apprenticeships</option>
            </select>
          </div>
        </div>

        {/* Result Count */}
        <div className="result-count-badge">
          <span>Showing</span>
          <strong style={{ color: 'var(--foreground)' }}>{filteredCount}</strong>
          <span>of {totalCount} opportunities</span>
        </div>
      </div>
    </GlassPanel>
  );
}
export default OpportunityFilterToolbar;
