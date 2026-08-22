'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Compass, ArrowRight, LayoutDashboard, UploadCloud } from 'lucide-react';

export default function NotFound() {
  return (
    <AppShell>
      <div
        style={{
          minHeight: '65vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        <GlassPanel
          style={{
            maxWidth: '540px',
            width: '100%',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
          >
            <Compass size={32} />
          </div>

          <div>
            <h1
              style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--foreground)',
                margin: '0 0 0.5rem 0'
              }}
            >
              Page Not Found (404)
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--muted-foreground)',
                lineHeight: 1.6,
                margin: 0
              }}
            >
              The page you are looking for does not exist or your local development bundle was updated. Choose a destination below to continue.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'center',
              width: '100%',
              marginTop: '0.5rem'
            }}
          >
            <Link
              href="/dashboard"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 700
              }}
            >
              <LayoutDashboard size={16} /> Go to Dashboard
            </Link>

            <Link
              href="/upload"
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 700
              }}
            >
              <UploadCloud size={16} /> Upload Resume
            </Link>
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
