'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/ui/GlassPanel';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react';

export type ParsingStage = 
  | 'IDLE'
  | 'UPLOADING_PDF'
  | 'INSPECTING_PDF'
  | 'EXTRACTING_CONTENT'
  | 'OCR_FALLBACK'
  | 'UNDERSTANDING_SKILLS'
  | 'BUILDING_PROFILE'
  | 'MATCHING_OPPORTUNITIES'
  | 'PREPARING_DIAGNOSIS'
  | 'COMPLETE'
  | 'ERROR';

const STAGE_ORDER: Record<ParsingStage, number> = {
  IDLE: 0,
  UPLOADING_PDF: 1,
  INSPECTING_PDF: 2,
  EXTRACTING_CONTENT: 3,
  OCR_FALLBACK: 3,
  UNDERSTANDING_SKILLS: 4,
  BUILDING_PROFILE: 5,
  MATCHING_OPPORTUNITIES: 6,
  PREPARING_DIAGNOSIS: 7,
  COMPLETE: 8,
  ERROR: -1
};

export default function ResumeUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<ParsingStage>('IDLE');
  const [isOcrTriggered, setIsOcrTriggered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    setStage('IDLE');
    setIsOcrTriggered(false);

    // PDF format validation
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setError('PDF files only. Please select a valid PDF document.');
      return;
    }

    // 10MB file size validation
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Maximum file size is 10 MB. Please upload a smaller file.');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setError(null);
    setStage('UPLOADING_PDF');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      // Stage timeline progression
      const timer1 = setTimeout(() => setStage('INSPECTING_PDF'), 400);
      const timer2 = setTimeout(() => setStage('EXTRACTING_CONTENT'), 900);

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "We couldn't read text from this PDF. Please try a clearer PDF or a text-based resume.");
      }

      if (data.is_ocr_triggered) {
        setIsOcrTriggered(true);
        setStage('OCR_FALLBACK');
        await new Promise(r => setTimeout(r, 600));
      }

      setStage('UNDERSTANDING_SKILLS');
      await new Promise(r => setTimeout(r, 400));

      setStage('BUILDING_PROFILE');
      await new Promise(r => setTimeout(r, 400));

      setStage('MATCHING_OPPORTUNITIES');
      await new Promise(r => setTimeout(r, 400));

      setStage('PREPARING_DIAGNOSIS');

      // Store parsed result in localStorage for fast client session caching.
      // Normalize ParsedResumeData → CandidateProfile shape:
      // - Add `experience` key (CandidateProfile uses `experience` for readiness engine)
      // - Keep `experiences` key (profile page CandidateProfileCard reads `experiences`)
      // - Ensure skills have normalized_name
      // - Include profile_id and user_id for readiness engine compatibility
      if (typeof window !== 'undefined') {
        const parsed = data.parsed_resume;
        const expArray = parsed.experience || parsed.experiences || [];
        const normalizedProfile = {
          ...parsed,
          id: data.profile_id || parsed.id || 'cand_parsed_01',
          user_id: parsed.user_id || '00000000-0000-0000-0000-000000000000',
          education_level: parsed.education_level || "Bachelor's Degree",
          experience: expArray,
          experiences: expArray,
          skills: (parsed.skills || []).map((s: any, idx: number) => ({
            ...s,
            id: s.id || `sk_${idx}`,
            profile_id: s.profile_id || data.profile_id || 'cand_parsed_01',
            normalized_name: s.normalized_name || (s.name || '').toLowerCase().replace(/\s+/g, '_')
          })),
          projects: (parsed.projects || []).map((p: any, idx: number) => ({
            ...p,
            id: p.id || `proj_${idx}`,
            profile_id: p.profile_id || data.profile_id || 'cand_parsed_01'
          }))
        };
        localStorage.setItem('candidate_profile_data', JSON.stringify(normalizedProfile));
        localStorage.setItem('candidate_profile_id', data.profile_id);
      }

      setStage('COMPLETE');

      setTimeout(() => {
        router.push('/profile');
      }, 500);

    } catch (err: any) {
      setError(err.message || "We couldn't read text from this PDF. Please try a clearer PDF or a text-based resume.");
      setStage('ERROR');
    }
  };

  const isProcessing = stage !== 'IDLE' && stage !== 'COMPLETE' && stage !== 'ERROR';
  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : '0';
  const currentStep = STAGE_ORDER[stage];

  const renderStepItem = (stepNum: number, label: string) => {
    const isDone = currentStep > stepNum;
    const isActive = currentStep === stepNum;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          color: isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--muted-foreground)',
          fontWeight: isDone || isActive ? 600 : 400
        }}
      >
        {isDone ? (
          <CheckCircle2 size={15} />
        ) : isActive ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <span style={{ display: 'inline-block', width: '15px' }} />
        )}
        <span>{label}</span>
      </div>
    );
  };

  return (
    <GlassPanel style={{ padding: '2.5rem', maxWidth: '720px', width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}
        >
          <UploadCloud size={26} />
        </div>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
          Upload &amp; Ingest Resume
        </h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.925rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
          SkillBridge extracts verified evidence without hallucinating missing credentials or fake links.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: '18px',
          padding: '2.75rem 1.5rem',
          textAlign: 'center',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          background: isDragOver ? 'rgba(99, 102, 241, 0.08)' : 'var(--surface)',
          transition: 'all 0.2s ease',
          marginBottom: '1.75rem'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          disabled={isProcessing}
        />

        {file ? (
          <div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto'
              }}
            >
              <FileText size={24} />
            </div>
            <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: 'var(--foreground)', fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>
              {file.name}
            </p>
            <p style={{ fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 600, margin: 0 }}>
              {fileSizeMB} MB · Ready for Ingestion Pipeline
            </p>
          </div>
        ) : (
          <div>
            <div style={{ color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
              <UploadCloud size={36} />
            </div>
            <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: 'var(--foreground)', fontSize: '1.05rem', margin: '0 0 0.35rem 0' }}>
              Click or drag your PDF resume here
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0 }}>
              PDF documents only · Maximum file size 10 MB
            </p>
          </div>
        )}
      </div>

      {/* Stage-Based Timeline UI */}
      {isProcessing && (
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '14px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            marginBottom: '1.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>
              <Sparkles size={16} />
              <span>RESUME INTELLIGENCE PIPELINE</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{file?.name}</span>
          </div>

          {/* OCR Fallback Callout */}
          {isOcrTriggered && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                fontSize: '0.825rem',
                fontWeight: 600,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Search size={16} />
              <span>Image-based PDF detected. Switching to Gemini Vision OCR...</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
            {renderStepItem(1, `Resume uploaded (${fileSizeMB} MB)`)}
            {renderStepItem(2, 'PDF structure inspected')}
            {renderStepItem(3, isOcrTriggered ? 'Gemini Vision OCR extraction' : 'Extracting resume text content')}
            {renderStepItem(4, 'Understanding skills & evidence provenance')}
            {renderStepItem(5, 'Building candidate profile & child tables')}
            {renderStepItem(6, 'Matching opportunity catalog')}
            {renderStepItem(7, 'Preparing readiness diagnosis')}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <AlertCircle size={18} /> <span>Extraction Issue</span>
          </div>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{error}</p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button
              onClick={handleUpload}
              className="btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.825rem' }}
            >
              <RefreshCcw size={14} /> Try Again
            </button>
            <button
              onClick={() => { setFile(null); setError(null); setStage('IDLE'); }}
              className="btn-secondary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.825rem' }}
            >
              Choose Another Resume
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'flex-end' }}>
        {file && !isProcessing && (
          <button
            onClick={() => { setFile(null); setError(null); setStage('IDLE'); }}
            className="btn-secondary"
            style={{ padding: '0.65rem 1.25rem' }}
          >
            Clear File
          </button>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || isProcessing}
          className="btn-primary"
          style={{
            padding: '0.65rem 1.6rem',
            opacity: (!file || isProcessing) ? 0.6 : 1,
            cursor: (!file || isProcessing) ? 'not-allowed' : 'pointer'
          }}
        >
          {isProcessing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader2 size={16} className="animate-spin" /> Processing...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Analyze Resume</span>
              <ArrowRight size={16} />
            </span>
          )}
        </button>
      </div>
    </GlassPanel>
  );
}
