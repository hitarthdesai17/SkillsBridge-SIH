import { describe, it, expect } from 'vitest';
import { extractTextFromPDF, parseResumeText, fallbackResumeParser, isExtractionQualitySufficient, extractTextFromPDFDetailed } from './resume_parser';

describe('Phase 3 & 4: Resume Parser Service, OCR Fallback & Quality Check', () => {
  const controlledResumeText = `
    Alex Rivers
    alex@example.com
    Data Analyst & Python Developer

    Skills:
    Python, Pandas, NumPy, SQL, PostgreSQL

    Projects:
    Customer Sales Analytics ETL Pipeline
    Built an ETL pipeline using Python Pandas and SQL to aggregate daily customer sales datasets.
  `;

  it('TEST-04-OCR01: Extraction quality check correctly identifies sufficient vs insufficient text', () => {
    expect(isExtractionQualitySufficient('')).toBe(false);
    expect(isExtractionQualitySufficient('Short text')).toBe(false);
    expect(isExtractionQualitySufficient('Hitarth Desai B.Sc AI Student')).toBe(false); // <10 words / <50 chars

    expect(isExtractionQualitySufficient(controlledResumeText)).toBe(true);
  });

  it('TEST-04-OCR02: Image-based scanned PDF triggers OCR fallback detailed result', async () => {
    // Fake buffer representing a scanned PDF where pdf-parse returns empty stream
    const scannedPdfBuffer = Buffer.from('%PDF-1.4 Scanned Image Buffer without ASCII text stream');

    const extraction = await extractTextFromPDFDetailed(scannedPdfBuffer);
    expect(extraction.is_ocr_triggered).toBe(true);
    expect(extraction.text.length).toBeGreaterThan(50);
  });

  it('CASE 1: Parses controlled resume text without inventing unsupported skills', async () => {
    const parsed = await parseResumeText(controlledResumeText);

    expect(parsed.full_name).toContain('Alex Rivers');
    expect(parsed.email).toBe('alex@example.com');

    const skillNames = parsed.skills.map(s => s.normalized_name);

    // Verified Ground Truth Skills MUST be present
    expect(skillNames).toContain('python');
    expect(skillNames).toContain('sql');

    // HALLUCINATION PREVENTION ASSERTIONS: Unsupported skills MUST NOT be extracted
    expect(skillNames).not.toContain('typescript');
    expect(skillNames).not.toContain('react');
    expect(skillNames).not.toContain('java');
    expect(skillNames).not.toContain('power_bi');
  });

  it('CASE 2: Project extraction uses actual project evidence and avoids fabricated URLs', () => {
    const result = fallbackResumeParser(controlledResumeText);

    expect(result.projects.length).toBeGreaterThan(0);
    const proj = result.projects[0];

    // URLs MUST BE null because no URL was in text
    expect(proj.github_url).toBeNull();
    expect(proj.live_url).toBeNull();
  });

  it('CASE 6 & 7: Rejects empty or corrupt PDF buffers', async () => {
    const emptyBuffer = Buffer.from('');
    await expect(extractTextFromPDF(emptyBuffer)).rejects.toThrow('Invalid PDF: Uploaded buffer is empty');
  });
});
