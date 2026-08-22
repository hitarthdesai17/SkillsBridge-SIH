import pdfParse from 'pdf-parse';
import { z } from 'zod';
import { RESUME_PARSER_SYSTEM_PROMPT } from './ai/prompts/resume_parser_prompt';
import { supabase, getServiceRoleSupabase } from './supabase';
import { validateCandidateEvidence, isSkillEvidencePresent, SKILL_TAXONOMY } from './evidence_validator';
import { setCandidateProfileStore } from './candidate_service';
import {
  computeExtractionCoverage,
  extractResumeEvidence,
  toParsedSkill
} from './resume_extraction';
import type {
  ParsedSkill as ParsedSkillType,
  ParsedResumeData as CanonicalParsedResumeData
} from '../types';

export const ParsedSkillSchema = z.object({
  name: z.string(),
  normalized_name: z.string(),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  provenance_source: z.string().default('Resume PDF'),
  provenance_context: z.string().default('Extracted from resume text'),
  extraction_confidence: z.enum(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']).default('HIGH'),
  source_evidence: z.string().default('Listed in resume'),

  // Canonical evidence layer -- optional so an LLM response that omits them
  // still validates, and so older stored payloads keep parsing.
  original_term: z.string().optional(),
  canonical_term: z.string().optional(),
  normalization_reason: z.string().optional(),
  skill_kind: z.enum(['SKILL', 'TOOL', 'PLATFORM', 'METHODOLOGY', 'DOMAIN_KNOWLEDGE', 'SOFT_SKILL', 'LANGUAGE', 'UNKNOWN']).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  parent_skill: z.string().optional(),
  evidence_strength: z.enum(['VERIFIED_HIGH', 'VERIFIED_MEDIUM', 'VERIFIED_BASIC', 'MENTIONED', 'PARTIAL', 'INFERRED']).optional(),
  level_qualifier: z.enum(['FUNDAMENTALS', 'BASIC', 'WORKING', 'ADVANCED', 'EXPERT']).optional(),
  is_unmapped: z.boolean().optional(),
  suggested_category: z.string().optional(),
  evidence_origin: z.enum(['RESUME', 'USER_ADDED']).optional()
});

export const ParsedProjectSchema = z.object({
  title: z.string(),
  description: z.string(),
  tech_stack: z.array(z.string()).default([]),
  github_url: z.string().nullable().optional(),
  live_url: z.string().nullable().optional(),
  origin: z.enum(['RESUME_DERIVED', 'USER_ADDED']).optional(),
  evidence_quote: z.string().optional(),
  skills_demonstrated: z.array(z.string()).optional()
});

export const ParsedExperienceSchema = z.object({
  organization: z.string(),
  role_title: z.string(),
  duration_months: z.number().default(0),
  description: z.string().default(''),
  is_current: z.boolean().default(false)
});

export const ParsedEducationSchema = z.object({
  degree: z.string(),
  field: z.string().optional(),
  institution: z.string().optional(),
  start_year: z.number().optional(),
  end_year: z.number().optional(),
  level: z.enum(['DOCTORATE', 'MASTERS', 'BACHELORS', 'DIPLOMA', 'HIGHER_SECONDARY', 'SECONDARY', 'OTHER']).optional(),
  evidence_quote: z.string().optional(),
  evidence_origin: z.enum(['RESUME', 'USER_ADDED']).optional()
});

export const ParsedCertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().optional(),
  issued_on: z.string().optional(),
  associated_skills: z.array(z.string()).optional(),
  evidence_quote: z.string().optional(),
  evidence_origin: z.enum(['RESUME', 'USER_ADDED']).optional()
});

export const ParsedResumeSchema = z.object({
  full_name: z.string(),
  email: z.string(),
  summary: z.string(),
  desired_role_title: z.string(),
  skills: z.array(ParsedSkillSchema),
  projects: z.array(ParsedProjectSchema),
  experiences: z.array(ParsedExperienceSchema),
  education: z.array(ParsedEducationSchema).optional(),
  certifications: z.array(ParsedCertificationSchema).optional()
});

/**
 * SINGLE SOURCE OF TRUTH.
 *
 * This used to be `z.infer<typeof ParsedResumeSchema>`, which created a second,
 * structurally different `ParsedResumeData` alongside the interface in
 * ../types. The two drifted (zod `.default()` makes a field required on the
 * output type while the interface kept it optional), so values legal for one
 * were rejected by the other and callers papered over it with casts.
 *
 * The zod schema is now used ONLY to validate untrusted LLM JSON at runtime.
 * The exported type is the canonical interface, re-exported here so existing
 * `import { ParsedResumeData } from '@/lib/resume_parser'` call sites keep
 * working.
 */
export type ParsedResumeData = CanonicalParsedResumeData;

/** Runtime-only shape of a successfully validated LLM response. */
export type ValidatedLlmResume = z.infer<typeof ParsedResumeSchema>;

/**
 * Extraction Quality Check
 * Deterministic threshold: Text length >= 50 characters AND word count >= 10 words.
 */
export function isExtractionQualitySufficient(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 50) return false;
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  return words.length >= 10;
}

/**
 * Resume Document Validity Check
 * Evaluates whether extracted text contains standard resume indicators.
 * Rejects random documents (e.g. invoices, articles, receipts) that lack core resume sections.
 */
export function isValidResumeContent(text: string): { isValid: boolean; reason?: string } {
  if (!text || text.trim().length < 20) {
    return {
      isValid: false,
      reason: 'Please upload a valid resume. The uploaded file contains insufficient text.'
    };
  }

  const lower = text.toLowerCase();

  // 1. Explicit resume/CV declaration
  if (/\b(?:resume|curriculum\s+vitae|c\.?v\.?|biodata|bio-data|profile|portfolio)\b/i.test(lower)) {
    return { isValid: true };
  }

  // 2. Contains matching skills from our broad taxonomy
  const hasSkill = SKILL_TAXONOMY.some(def => isSkillEvidencePresent(def.canonicalName, text));
  if (hasSkill) {
    return { isValid: true };
  }

  // 3. Section keyword matching
  const sectionIndicators = [
    /(?:skills?|technologies|technical\s+skills?|core\s+competencies|programming|tools|frameworks|expertise)/i,
    /(?:education|degree|academic|university|college|bachelor|master|b\.tech|b\.e|b\.sc|bca|mca|m\.tech|school|cgpa|gpa|diploma|graduate)/i,
    /(?:experience|employment|work\s+history|professional|intern(?:ship)?|worked\s+at|responsibilities|position|job)/i,
    /(?:projects?|capstone|portfolio|github|repository|hackathon)/i,
    /(?:certifications?|achievements?|awards?|summary|objective|contact|phone|email|linkedin|address)/i,
    /(?:developer|engineer|analyst|designer|trainer|specialist|consultant|manager|intern|student)/i
  ];

  const matchedCount = sectionIndicators.filter(pattern => pattern.test(lower)).length;
  if (matchedCount >= 1) {
    return { isValid: true };
  }

  // If none matched (e.g. pure electricity bill, grocery list, invoice without any resume terms)
  return {
    isValid: false,
    reason: 'Please upload a valid resume. The uploaded document does not appear to contain standard resume sections (such as skills, education, or work experience).'
  };
}

export interface PDFExtractionResult {
  text: string;
  is_ocr_triggered: boolean;
  extraction_method: 'pdf-parse' | 'gemini-vision-ocr' | 'ground-truth-fallback';
}

/**
 * Extract raw text from PDF buffer using pdf-parse with Gemini Vision OCR fallback.
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  const result = await extractTextFromPDFDetailed(pdfBuffer);
  return result.text;
}

export async function extractTextFromPDFDetailed(pdfBuffer: Buffer): Promise<PDFExtractionResult> {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('Invalid PDF: Uploaded buffer is empty');
  }

  // 1. Primary Attempt: Deterministic pdf-parse
  let rawText = '';
  try {
    const data = await pdfParse(pdfBuffer);
    rawText = data.text ? data.text.trim() : '';
  } catch (error: any) {
    rawText = '';
  }

  // Check extraction quality
  if (isExtractionQualitySufficient(rawText)) {
    return {
      text: rawText,
      is_ocr_triggered: false,
      extraction_method: 'pdf-parse'
    };
  }

  // 2. Trigger OCR Fallback: Gemini 2.5 Flash base64 PDF inlineData OCR
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim().length > 10 && !apiKey.includes('your-gemini-api-key')) {
    try {
      const base64Pdf = pdfBuffer.toString('base64');
      const ocrRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: 'Perform OCR text extraction on this PDF document. Extract all candidate resume text, contact info, skills, education, and projects.' },
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: base64Pdf
                    }
                  }
                ]
              }
            ]
          })
        }
      );

      if (ocrRes.ok) {
        const ocrJson = await ocrRes.json();
        const ocrText = ocrJson?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (ocrText && isExtractionQualitySufficient(ocrText)) {
          return {
            text: ocrText.trim(),
            is_ocr_triggered: true,
            extraction_method: 'gemini-vision-ocr'
          };
        }
      }
    } catch (ocrErr) {
      // Fall through to ground truth fallback
    }
  }

  // 3. No text and no OCR provider available.
  //
  // This branch previously returned a hardcoded sample candidate, which meant
  // an unreadable upload silently produced a complete profile for a person who
  // had never been parsed. That is fabricated evidence, so it now returns an
  // explicit diagnostic instead. Callers MUST check extraction_method and
  // refuse to build a profile from 'ground-truth-fallback' -- see
  // isUnreadableExtraction() and /api/resume/parse.
  return {
    text: UNREADABLE_PDF_NOTICE,
    is_ocr_triggered: true,
    extraction_method: 'ground-truth-fallback'
  };
}

export const UNREADABLE_PDF_NOTICE =
  'RESUME TEXT COULD NOT BE EXTRACTED. This PDF appears to be a scanned image or has no embedded text layer, and no OCR provider is configured for this deployment. No candidate information was recovered from this document.';

/** True when the extraction produced no real resume text. */
export function isUnreadableExtraction(result: PDFExtractionResult): boolean {
  return result.extraction_method === 'ground-truth-fallback';
}

/**
 * Fold an LLM extraction into the deterministic one.
 *
 * The deterministic extractor is the FLOOR, never the ceiling: an LLM that
 * forgets half the skills section can no longer shrink the profile, and an
 * LLM that hallucinates a skill still has to clear the evidence validator.
 * Union, never replace -- that is what stops a rich resume collapsing.
 */
export function mergeExtraction(llm: ParsedResumeData, rawText: string): ParsedResumeData {
  const deterministic = fallbackResumeParser(rawText);

  // LLM skills are hallucination-checked before they may join the union.
  const validatedLlmSkills = validateCandidateEvidence(llm, rawText).validated_skills;

  const skills: ParsedSkillType[] = [...deterministic.skills];
  const seen = new Set(skills.map(s => s.normalized_name));
  for (const s of validatedLlmSkills) {
    const key = s.normalized_name || s.name.toLowerCase().replace(/\s+/g, '_');
    if (seen.has(key)) continue;
    seen.add(key);
    skills.push({ ...s, evidence_origin: 'RESUME' });
  }

  const projects = (llm.projects && llm.projects.length > 0 ? llm.projects : deterministic.projects).map(p => ({
    ...p,
    origin: 'RESUME_DERIVED' as const
  }));

  const experiences =
    llm.experiences && llm.experiences.length > 0 ? llm.experiences : deterministic.experiences;

  const education = dedupeBy(
    [...(deterministic.education || []), ...(llm.education || [])],
    e => `${e.degree}|${e.field || ''}`.toLowerCase()
  );
  const certifications = dedupeBy(
    [...(deterministic.certifications || []), ...(llm.certifications || [])],
    c => c.name.toLowerCase()
  );

  const merged: ParsedResumeData = {
    full_name: llm.full_name?.trim() || deterministic.full_name,
    email: llm.email?.trim() || deterministic.email,
    summary: llm.summary?.trim() || deterministic.summary,
    desired_role_title: llm.desired_role_title?.trim() || deterministic.desired_role_title,
    skills,
    projects,
    experiences,
    education,
    certifications
  };

  merged.extraction_coverage = computeExtractionCoverage({
    skills,
    projects,
    experiences,
    education,
    certifications,
    sections: extractResumeEvidence(rawText).section_kinds,
    rawText
  });

  return merged;
}

function dedupeBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

/**
 * Parse raw resume text into structured candidate data using Gemini 1.5/2.0 Flash or OpenAI / Zod validation.
 */
export async function parseResumeText(rawText: string): Promise<ParsedResumeData> {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("We couldn't read text from this PDF. Please try a clearer PDF or a text-based resume.");
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  // 1. Try Gemini Generative AI with multi-model resilience
  if (geminiKey && geminiKey.trim().length > 10 && !geminiKey.includes('your-gemini-api-key')) {
    const candidateModels = [
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-2.5-flash',
      'gemini-flash-latest'
    ];

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${RESUME_PARSER_SYSTEM_PROMPT}\n\nDeeply analyze and extract all projects, verified skills, and experience from this resume text:\n\n${rawText}`
                    }
                  ]
                }
              ],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.0 }
            })
          }
        );

        if (response.ok) {
          const json = await response.json();
          const rawJsonText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawJsonText) {
            const parsedContent = JSON.parse(rawJsonText);
            const validated = ParsedResumeSchema.safeParse(parsedContent);
            if (validated.success && validated.data) {
              return mergeExtraction(validated.data as ParsedResumeData, rawText);
            }
          }
        }
      } catch (err) {
        // Try next model
      }
    }
  }

  // 2. Try OpenAI gpt-4o-mini if configured
  if (openAiKey && openAiKey.startsWith('sk-') && !openAiKey.includes('your-openai-api-key')) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: RESUME_PARSER_SYSTEM_PROMPT },
            { role: 'user', content: `Extract all candidate details, verified skills, projects, and experiences from this resume text:\n\n${rawText}` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.0
        })
      });

      if (response.ok) {
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsedContent = JSON.parse(content);
          const validated = ParsedResumeSchema.safeParse(parsedContent);
          if (validated.success && validated.data) {
            return mergeExtraction(validated.data as ParsedResumeData, rawText);
          }
        }
      }
    } catch (err) {
      // Fall through
    }
  }

  // 3. Fallback grounded parser
  return fallbackResumeParser(rawText);
}

// Comprehensive technology tokens for grounded tech_stack extraction from project descriptions
const KNOWN_TECH_TOKENS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /\bpython\b/i, name: 'Python' },
  { pattern: /\bsql\b/i, name: 'SQL' },
  { pattern: /\bmysql\b/i, name: 'MySQL' },
  { pattern: /\bpostgres(?:ql)?\b/i, name: 'PostgreSQL' },
  { pattern: /\bmongodb?\b/i, name: 'MongoDB' },
  { pattern: /\bsqlite\b/i, name: 'SQLite' },
  { pattern: /\bredis\b/i, name: 'Redis' },
  { pattern: /\boracle\b/i, name: 'Oracle' },
  { pattern: /\bfirebase\b/i, name: 'Firebase' },
  { pattern: /\bsupabase\b/i, name: 'Supabase' },
  { pattern: /\breact(?:\.js|js)?\b/i, name: 'React.js' },
  { pattern: /\bnode(?:\.js|js)?\b/i, name: 'Node.js' },
  { pattern: /\bexpress(?:\.js|js)?\b/i, name: 'Express.js' },
  { pattern: /\bnext(?:\.js|js)\b/i, name: 'Next.js' },
  { pattern: /\bvue(?:\.js|js)?\b/i, name: 'Vue.js' },
  { pattern: /\bangular\b/i, name: 'Angular' },
  { pattern: /\bdjango\b/i, name: 'Django' },
  { pattern: /\bdjango rest framework\b/i, name: 'Django REST Framework' },
  { pattern: /\bflask\b/i, name: 'Flask' },
  { pattern: /\bfastapi\b/i, name: 'FastAPI' },
  { pattern: /\bspring(?:\s*boot)?\b/i, name: 'Spring Boot' },
  { pattern: /\bhtml5?\b/i, name: 'HTML' },
  { pattern: /\bcss3?\b/i, name: 'CSS' },
  { pattern: /\bjavascript\b/i, name: 'JavaScript' },
  { pattern: /\btypescript\b/i, name: 'TypeScript' },
  { pattern: /\bjava\b/i, name: 'Java' },
  { pattern: /\bc\+\+\b/i, name: 'C++' },
  { pattern: /\bc#\b/i, name: 'C#' },
  { pattern: /\bgit\b/i, name: 'Git' },
  { pattern: /\bgithub\b/i, name: 'GitHub' },
  { pattern: /\bgitlab\b/i, name: 'GitLab' },
  { pattern: /\bdocker\b/i, name: 'Docker' },
  { pattern: /\bkubernetes\b/i, name: 'Kubernetes' },
  { pattern: /\baws\b/i, name: 'AWS' },
  { pattern: /\bazure\b/i, name: 'Azure' },
  { pattern: /\bgcp|google cloud\b/i, name: 'GCP' },
  { pattern: /\bpandas\b/i, name: 'Pandas' },
  { pattern: /\bnumpy\b/i, name: 'NumPy' },
  { pattern: /\bscipy\b/i, name: 'SciPy' },
  { pattern: /\bscikit[- ]learn\b/i, name: 'scikit-learn' },
  { pattern: /\btensorflow\b/i, name: 'TensorFlow' },
  { pattern: /\bpytorch\b/i, name: 'PyTorch' },
  { pattern: /\bopencv\b/i, name: 'OpenCV' },
  { pattern: /\bpower\s*bi\b/i, name: 'Power BI' },
  { pattern: /\btableau\b/i, name: 'Tableau' },
  { pattern: /\bexcel\b/i, name: 'Excel' },
  { pattern: /\bcsv\b/i, name: 'CSV' },
  { pattern: /\bmatplotlib\b/i, name: 'Matplotlib' },
  { pattern: /\bseaborn\b/i, name: 'Seaborn' },
  { pattern: /\bplotly\b/i, name: 'Plotly' },
  { pattern: /\bjupyter\b/i, name: 'Jupyter' },
  { pattern: /\brest\s*api\b/i, name: 'REST API' },
  { pattern: /\bgraphql\b/i, name: 'GraphQL' },
  { pattern: /\bheroku\b/i, name: 'Heroku' },
  { pattern: /\bvercel\b/i, name: 'Vercel' },
  { pattern: /\bnetlify\b/i, name: 'Netlify' },
  { pattern: /\bbootstrap\b/i, name: 'Bootstrap' },
  { pattern: /\btailwind(?:\s*css)?\b/i, name: 'Tailwind CSS' },
  { pattern: /\blinux\b/i, name: 'Linux' },
];

/**
 * Extract tech stack from text using grounded pattern matching.
 */
function extractTechStackFromText(text: string): string[] {
  const found = new Set<string>();
  for (const tok of KNOWN_TECH_TOKENS) {
    if (tok.pattern.test(text)) {
      found.add(tok.name);
    }
  }
  return Array.from(found);
}

// Action verb list for identifying project description sentences
const ACTION_VERBS_REGEX = /^(?:analyzed|built|developed|created|implemented|designed|used|utilized|integrated|deployed|managed|configured|automated|performed|applied|conducted|established|executed|generated|handled|led|maintained|optimized|organized|prepared|processed|reduced|resolved|secured|streamlined|tested|trained|updated|upgraded|wrote|visualized|cleaned|aggregated|investigated|modeled|evaluated|engineered|crafted|delivered|architected|collected|mined|extracted|plotted|programmed|scripted|computed|parsed|scraped|crawled|stored|hosted|containerized|published|debugged|refactored|monitored|migrated|calculated|collaborated|contributed|devised|formulated|installed|launched|oversaw|produced|researched|solved|synthesized|transformed|spearheaded|orchestrated|constructed|assisted|facilitated|improved|spearhead|build|develop|design|create|implement|analyze|use|integrate|deploy|manage|configure|automate|test|train|write|clean)\b/i;

const SECTION_HEADER_REGEX = /^[#*_\s-]*(?:education|experience|work\s*history|employment(?:\s*history)?|skills|technical\s+skills|core\s+competencies|certifications?|courses?|achievements?|awards?|honors?|interests?|hobbies|summary|professional\s+summary|profile|objective|career\s+objective|references?|contact|languages?|volunteering|publications?|extracurricular|declarations?)[\s:*_#-]*$/i;

const PROJECT_HEADER_REGEX = /^[#*_\s-]*(?:projects?|academic\s+projects?|personal\s+projects?|side\s+projects?|technical\s+projects?|project\s+work|selected\s+projects?|project\s+experience|key\s+projects?|notable\s+projects?|major\s+projects?|mini\s+projects?|capstone\s+projects?|coursework\s+projects?|hands-on\s+projects?|project\s+portfolio|portfolio\s*(?:&|\/|\band\b)?\s*projects?|projects?\s*(?:&|\/|\band\b)\s*[\w\s]+)[\s:*_#-]*$/i;

/**
 * Intelligent Section-Aware Project Extraction Engine
 * Performs multi-pass extraction to capture all projects from any resume format,
 * whether structured as bullet points, multi-line blocks, inline titles, or paragraphs.
 */
export function extractProjectsFromText(text: string): Array<{
  title: string;
  description: string;
  tech_stack: string[];
  github_url: string | null;
  live_url: string | null;
}> {
  const results: Array<{
    title: string;
    description: string;
    tech_stack: string[];
    github_url: string | null;
    live_url: string | null;
  }> = [];

  const lines = text.split(/\r?\n/);

  // -------------------------------------------------------------
  // PASS 1: Locate explicit Projects Section
  // -------------------------------------------------------------
  let projectSectionStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (PROJECT_HEADER_REGEX.test(trimmed)) {
      projectSectionStart = i + 1;
      break;
    }
  }

  if (projectSectionStart !== -1) {
    // Find section end
    let projectSectionEnd = lines.length;
    for (let i = projectSectionStart; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.length > 2 && trimmed.length <= 40 && SECTION_HEADER_REGEX.test(trimmed)) {
        projectSectionEnd = i;
        break;
      }
    }

    let currentTitle = '';
    let currentDescLines: string[] = [];

    const flushProject = () => {
      if (currentTitle) {
        let descText = currentDescLines.join(' ').trim();
        // If description is empty, check if title itself has inline description
        if (!descText && currentTitle.includes(':')) {
          const parts = currentTitle.split(/:\s*/);
          if (parts.length > 1 && parts[1].length > 10) {
            currentTitle = parts[0].trim();
            descText = parts.slice(1).join(': ').trim();
          }
        }

        if (descText.length > 5 || currentTitle.length > 3) {
          const combinedForTech = `${currentTitle} ${descText}`;
          const techStack = extractTechStackFromText(combinedForTech);
          const githubMatch = combinedForTech.match(/(?:https?:\/\/)?github\.com\/[^\s,)]+/i);
          const liveMatch = combinedForTech.match(/(?:https?:\/\/)[^\s,)]+\.(?:app|com|io|dev|net|org)\/[^\s,)]+/i);

          results.push({
            title: cleanProjectTitle(currentTitle),
            description: descText || currentTitle,
            tech_stack: techStack,
            github_url: githubMatch ? githubMatch[0] : null,
            live_url: liveMatch ? liveMatch[0] : null
          });
        }
      }
      currentTitle = '';
      currentDescLines = [];
    };

    for (let i = projectSectionStart; i < projectSectionEnd; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check for inline project title + description on single line (e.g. "Student Performance Analysis: Built...")
      const inlineColonMatch = trimmed.match(/^([A-Za-z0-9\s/&'-]{3,60})\s*:\s*([A-Za-z].{15,})$/);
      if (inlineColonMatch && !inlineColonMatch[1].toLowerCase().includes('github') && !inlineColonMatch[1].toLowerCase().includes('tools')) {
        flushProject();
        currentTitle = inlineColonMatch[1].trim();
        currentDescLines.push(inlineColonMatch[2].trim());
        continue;
      }

      // Check if this line is a bullet or description
      const hasBulletSymbol = /^[-•*▪▸→o–—\u2022\u25cf\u25aa\u25b8\u2192+~>]\s*/.test(trimmed);
      const cleanContent = trimmed.replace(/^[-•*▪▸→o–—\u2022\u25cf\u25aa\u25b8\u2192+~>]\s*/, '').trim();
      const startsWithActionVerb = ACTION_VERBS_REGEX.test(cleanContent);
      const isContinuation = /^[a-z]/.test(cleanContent) || /^(?:and|with|using|to|by|in|for|on|which|that|key\s+features?|tools?|tech\s*stack)\b/i.test(cleanContent);

      const isDescriptionLine = hasBulletSymbol || startsWithActionVerb || isContinuation || (currentTitle && trimmed.length > 70);

      if (currentTitle && isDescriptionLine) {
        if (cleanContent.length > 3) {
          currentDescLines.push(cleanContent);
        }
      } else if (!isDescriptionLine && trimmed.length >= 3 && trimmed.length < 120) {
        // Potential new project title
        flushProject();
        currentTitle = trimmed;
      }
    }
    flushProject();
  }

  // -------------------------------------------------------------
  // PASS 2: If 0 projects found in explicit section, search globally for known project patterns
  // -------------------------------------------------------------
  if (results.length === 0) {
    const projectPattern = /(?:^|\n)(?:(?:Project|Capstone)\s*\d*[:\-]\s*)?([A-Z][A-Za-z0-9\s/&'-]{2,50})\s*(?:\([A-Za-z0-9\s,._-]+\)|\|[A-Za-z0-9\s,._-]+\|)?\s*[:\-]\s*([A-Za-z0-9].{20,})/gm;
    let match;
    while ((match = projectPattern.exec(text)) !== null) {
      const pTitle = match[1].trim();
      const pDesc = match[2].trim();
      if (!/^(?:email|phone|address|education|experience|skills|summary)/i.test(pTitle)) {
        const combined = `${pTitle} ${pDesc}`;
        results.push({
          title: cleanProjectTitle(pTitle),
          description: pDesc,
          tech_stack: extractTechStackFromText(combined),
          github_url: null,
          live_url: null
        });
      }
    }
  }

  return results;
}

function cleanProjectTitle(title: string): string {
  return title
    .replace(/^[-•*▪▸→o–—\d.)\s]+/, '')
    .replace(/\s*[-–—:|]\s*$/, '')
    .replace(/\s*\([A-Za-z0-9\s,._-]+\)$/, '')
    .replace(/\s*\|\s*[A-Za-z0-9\s,._-]+$/, '')
    .trim();
}

/** Best-effort name detection. Never falls back to a hardcoded person. */
function detectFullName(text: string): string {
  const explicit = text.match(/(?:full\s*name|name)\s*[:\-]\s*([A-Za-z][A-Za-z.\s]{1,50})/i);
  if (explicit) return explicit[1].trim();

  // The name is almost always one of the first non-empty lines, before the
  // contact block, and is not a section header.
  const firstLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 5);
  for (const line of firstLines) {
    if (line.length > 60 || /@|https?:|\d{4}/.test(line)) continue;
    const m = line.match(/^([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){0,3})$/);
    if (m) return m[1].trim();
  }

  const general = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m) || text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
  return general ? general[1].trim() : 'Candidate';
}

/**
 * Deterministic, career-agnostic resume parser.
 *
 * This is the primary extraction path whenever no LLM provider is configured,
 * and the safety net underneath the LLM path. It is open-world: the resume's
 * own listings define the vocabulary, so a marketing, nursing, legal or trades
 * resume extracts just as completely as a software one.
 */
export function fallbackResumeParser(text: string): ParsedResumeData {
  const evidence = extractResumeEvidence(text);

  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

  const skills = evidence.skills.map(toParsedSkill);

  // Section-aware project extraction, grounded strictly in the resume text.
  const projects: z.infer<typeof ParsedProjectSchema>[] = extractProjectsFromText(text).map(gp => ({
    title: gp.title,
    description: gp.description,
    tech_stack: gp.tech_stack,
    github_url: gp.github_url || null,
    live_url: gp.live_url || null,
    origin: 'RESUME_DERIVED' as const,
    evidence_quote: gp.description || gp.title,
    skills_demonstrated: gp.tech_stack
  }));

  const experiences: z.infer<typeof ParsedExperienceSchema>[] = evidence.experiences.map(e => ({
    organization: e.organization,
    role_title: e.role_title,
    duration_months: e.duration_months,
    description: e.description,
    is_current: e.is_current
  }));

  // Desired role: taken from the resume's own wording, never guessed from a
  // target career (extraction stays career-agnostic -- see report §17).
  const desiredRole = detectDesiredRole(text, experiences);

  const summarySection = evidence.sections.find(s => s.kind === 'SUMMARY');
  const summary = summarySection
    ? summarySection.lines.map(l => l.content).join(' ').slice(0, 600)
    : '';

  const result: ParsedResumeData = {
    full_name: detectFullName(text),
    email: emailMatch ? emailMatch[1] : '',
    summary,
    desired_role_title: desiredRole,
    skills,
    projects,
    experiences,
    education: evidence.education,
    certifications: evidence.certifications
  };

  result.extraction_coverage = computeExtractionCoverage({
    skills,
    projects,
    experiences,
    education: evidence.education,
    certifications: evidence.certifications,
    sections: evidence.section_kinds,
    rawText: text
  });

  return result;
}

/** Role title stated by the resume itself: header line, or most recent role. */
function detectDesiredRole(text: string, experiences: Array<{ role_title: string; is_current: boolean }>): string {
  const explicit = text.match(/(?:desired\s+role|target\s+role|objective|applying\s+for)\s*[:\-]\s*([A-Za-z][A-Za-z\s/&-]{2,50})/i);
  if (explicit) return explicit[1].trim();

  const current = experiences.find(e => e.is_current) || experiences[0];
  if (current && current.role_title && !/not stated/i.test(current.role_title)) return current.role_title;

  // A tagline directly under the name ("Data Analyst & Python Developer").
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 6);
  for (const line of lines) {
    if (line.length > 70 || /@|https?:/.test(line)) continue;
    if (/\b(?:engineer|developer|analyst|designer|manager|executive|coordinator|specialist|consultant|intern|student|trainer|nurse|teacher|accountant|associate|officer|marketer|writer|architect|technician)\b/i.test(line)) {
      return line.replace(/\s*[|·].*$/, '').trim();
    }
  }
  return 'Candidate Profile';
}

export async function parseResume(pdfBuffer: Buffer): Promise<{ parsed_resume: ParsedResumeData; profile_id: string }> {
  const extraction = await extractTextFromPDFDetailed(pdfBuffer);
  const parsedData = await parseResumeText(extraction.text);

  const profileId = await saveCandidateProfileToDatabase(parsedData, extraction.text);
  return { parsed_resume: parsedData, profile_id: profileId };
}

export async function saveCandidateProfileToDatabase(data: ParsedResumeData, rawText: string, customUserId?: string): Promise<string> {
  const targetUserId = customUserId || '00000000-0000-0000-0000-000000000000';
  let profileId: string = 'cand_demo_01';

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (isSupabaseConfigured) {
    try {
      const client = getServiceRoleSupabase() || supabase;
      const { data: existingProfiles } = await client
        .from('candidate_profiles')
        .select('id')
        .eq('user_id', targetUserId)
        .limit(1);

      if (existingProfiles && existingProfiles.length > 0) {
        profileId = existingProfiles[0].id;
        await client
          .from('candidate_profiles')
          .update({
            full_name: data.full_name,
            email: data.email,
            summary: data.summary,
            desired_role_title: data.desired_role_title,
            raw_resume_text: rawText,
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId);

        // Clean existing child records for fresh sync
        await client.from('candidate_skills').delete().eq('profile_id', profileId);
        await client.from('candidate_projects').delete().eq('profile_id', profileId);
        await client.from('candidate_experiences').delete().eq('profile_id', profileId);
        await client.from('candidate_education').delete().eq('profile_id', profileId);
        await client.from('candidate_certifications').delete().eq('profile_id', profileId);
      } else {
        const { data: newProfile, error: insertError } = await client
          .from('candidate_profiles')
          .insert({
            user_id: targetUserId,
            full_name: data.full_name,
            email: data.email,
            summary: data.summary,
            desired_role_title: data.desired_role_title,
            raw_resume_text: rawText
          })
          .select('id')
          .single();

        if (!insertError && newProfile) {
          profileId = newProfile.id;
        }
      }

      // Extraction coverage lives on the profile row. Written separately and
      // allowed to fail so an un-migrated database still saves the profile.
      if (profileId && profileId !== 'cand_demo_01' && data.extraction_coverage) {
        await client
          .from('candidate_profiles')
          .update({ extraction_coverage: data.extraction_coverage })
          .eq('id', profileId);
      }

      // Persist child skills if profileId is a valid UUID
      if (profileId && profileId !== 'cand_demo_01') {
        if (data.skills && data.skills.length > 0) {
          const baseSkills = data.skills.map((s) => ({
            profile_id: profileId,
            name: s.name,
            normalized_name: s.normalized_name,
            proficiency_level: s.proficiency_level || 'intermediate',
            provenance_source: s.provenance_source || 'Resume PDF',
            provenance_context: s.provenance_context || 'Extracted from resume',
            extraction_confidence: s.extraction_confidence || 'HIGH',
            source_evidence: s.source_evidence || 'Listed in resume'
          }));

          const richSkills = baseSkills.map((base, i) => {
            const s = data.skills[i];
            return {
              ...base,
              original_term: s.original_term || s.name,
              canonical_term: s.canonical_term || s.name,
              normalization_reason: s.normalization_reason || null,
              skill_kind: s.skill_kind || null,
              skill_category: s.category || null,
              parent_skill: s.parent_skill || null,
              evidence_strength: s.evidence_strength || null,
              level_qualifier: s.level_qualifier || null,
              is_unmapped: s.is_unmapped ?? false,
              suggested_category: s.suggested_category || null,
              evidence_origin: s.evidence_origin || 'RESUME',
              evidence_json: s.evidence || null
            };
          });

          // Degrade gracefully when 20260822_canonical_evidence_layer.sql has
          // not been applied yet: the profile still saves, minus the new fields.
          const { error: richErr } = await client.from('candidate_skills').insert(richSkills);
          if (richErr) {
            await client.from('candidate_skills').insert(baseSkills);
          }
        }

        if (data.education && data.education.length > 0) {
          await client.from('candidate_education').insert(
            data.education.map((e) => ({
              profile_id: profileId,
              degree: e.degree,
              field: e.field || null,
              institution: e.institution || null,
              start_year: e.start_year || null,
              end_year: e.end_year || null,
              level: e.level || null,
              evidence_quote: e.evidence_quote || null,
              evidence_origin: e.evidence_origin || 'RESUME'
            }))
          );
        }

        if (data.certifications && data.certifications.length > 0) {
          await client.from('candidate_certifications').insert(
            data.certifications.map((c) => ({
              profile_id: profileId,
              name: c.name,
              issuer: c.issuer || null,
              issued_on: c.issued_on || null,
              associated_skills: c.associated_skills || [],
              evidence_quote: c.evidence_quote || null,
              evidence_origin: c.evidence_origin || 'RESUME'
            }))
          );
        }

        if (data.projects && data.projects.length > 0) {
          const projectsToInsert = data.projects.map((p) => ({
            profile_id: profileId,
            title: p.title,
            description: p.description || '',
            tech_stack: p.tech_stack || [],
            github_url: p.github_url || null,
            live_url: p.live_url || null
          }));
          await client.from('candidate_projects').insert(projectsToInsert);
        }

        if (data.experiences && data.experiences.length > 0) {
          const expToInsert = data.experiences.map((e) => ({
            profile_id: profileId,
            organization: e.organization,
            role_title: e.role_title,
            duration_months: e.duration_months || 0,
            description: e.description || '',
            is_current: e.is_current || false
          }));
          await client.from('candidate_experiences').insert(expToInsert);
        }
      }
    } catch (err) {
      profileId = 'cand_demo_01';
    }
  }

  // Synchronize candidateProfileStore with newly parsed candidate data
  setCandidateProfileStore({
    id: profileId,
    user_id: targetUserId,
    full_name: data.full_name,
    email: data.email,
    summary: data.summary,
    desired_role_title: data.desired_role_title,
    education_level: "Bachelor's Degree",
    raw_resume_text: rawText,
    skills: (data.skills || []).map((s, idx) => ({
      ...s,
      id: `sk_parsed_${idx}`,
      profile_id: profileId,
      name: s.name,
      normalized_name: s.normalized_name,
      proficiency_level: s.proficiency_level || 'intermediate',
      provenance_source: s.provenance_source || 'Resume PDF',
      provenance_context: s.provenance_context || 'Extracted from resume text',
      extraction_confidence: s.extraction_confidence || 'HIGH',
      source_evidence: s.source_evidence || 'Listed in resume'
    })),
    projects: (data.projects || []).map((proj, idx) => ({
      ...proj,
      id: `proj_parsed_${idx}`,
      profile_id: profileId,
      title: proj.title,
      description: proj.description || '',
      tech_stack: proj.tech_stack || [],
      github_url: proj.github_url || undefined,
      live_url: proj.live_url || undefined
    })),
    education: data.education || [],
    certifications: data.certifications || [],
    extraction_coverage: data.extraction_coverage,
    experience: (data.experiences || []).map((exp, idx) => ({
      id: `exp_parsed_${idx}`,
      profile_id: profileId,
      organization: exp.organization,
      role_title: exp.role_title,
      duration_months: exp.duration_months || 0,
      description: exp.description || '',
      is_current: exp.is_current || false
    })),
    created_at: new Date().toISOString()
  });

  return profileId;
}
