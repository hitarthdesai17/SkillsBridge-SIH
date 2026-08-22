'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import ResumeUploader from '@/components/ResumeUploader';
import { PageHeader } from '@/components/ui/GlassPanel';

export default function UploadPage() {
  return (
    <AppShell>
      <PageHeader
        title="Upload Candidate Resume"
        description="Upload your resume PDF to trigger automated Gemini extraction, verified evidence provenance analysis, and deterministic readiness scoring."
      />
      <div style={{ marginTop: '2rem' }}>
        <ResumeUploader />
      </div>
    </AppShell>
  );
}
