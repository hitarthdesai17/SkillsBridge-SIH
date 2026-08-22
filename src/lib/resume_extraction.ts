import {
  CareerDomainType,
  CandidateCertification,
  CandidateEducation,
  EvidenceSourceType,
  EvidenceStrength,
  ExtractionCoverage,
  LevelQualifier,
  ParsedSkill,
  SkillEvidence,
  SkillKind
} from '../types';
import {
  OntologyNode,
  SKILL_ONTOLOGY,
  findOntologyNodeExact,
  getScannableAliases,
  normalizeTermKey,
  ontologyKind
} from './skill_ontology';

// ============================================================
// RESUME INFORMATION EXTRACTION CORE
// ============================================================
//
// WHY THIS EXISTS
// ---------------
// The previous extractor walked a fixed 50-entry skill list and kept whatever
// matched. That is closed-world: a term the list had never heard of could not
// be extracted, no matter how explicitly the resume stated it. A business /
// marketing / operations resume therefore collapsed to whatever handful of
// CS-centric aliases happened to collide with it.
//
// This module inverts that. The RESUME defines the vocabulary:
//
//   1. Segment the document into its own sections.
//   2. Harvest terms from listing-shaped content (skills sections and
//      "Label: a, b, c" lines) WITHOUT consulting any dictionary.
//   3. Scan prose (experience / projects) for terms we already know, so job
//      descriptions contribute evidence too -- conservatively.
//   4. Canonicalise against the ontology where possible; keep everything else
//      as UNMAPPED_SKILL with full provenance instead of dropping it.
//
// Nothing is invented. Every emitted skill carries the verbatim resume line
// it came from.

// ------------------------------------------------------------
// 1. SECTION SEGMENTATION
// ------------------------------------------------------------

export type SectionKind =
  | 'HEADER'
  | 'SUMMARY'
  | 'SKILLS'
  | 'EXPERIENCE'
  | 'INTERNSHIP'
  | 'PROJECTS'
  | 'EDUCATION'
  | 'CERTIFICATIONS'
  | 'TRAINING'
  | 'ACHIEVEMENTS'
  | 'PUBLICATIONS'
  | 'VOLUNTEER'
  | 'LANGUAGES'
  | 'INTERESTS'
  | 'OTHER';

interface SectionHeaderRule {
  kind: SectionKind;
  pattern: RegExp;
}

// Ordered: earlier rules win. Patterns are anchored so they only fire on a
// line that IS a header, never on a line that merely mentions the word.
const SECTION_HEADER_RULES: SectionHeaderRule[] = [
  { kind: 'INTERESTS', pattern: /^(?:areas?\s+of\s+interest|interests?|hobbies|extra[\s-]?curricular(?:\s+activities)?)$/i },
  { kind: 'SKILLS', pattern: /^(?:technical\s+skills?|core\s+(?:skills?|competenc(?:y|ies))|key\s+skills?|professional\s+skills?|skills?(?:\s*(?:&|and|\/)\s*(?:tools?|technologies|competencies|abilities))?|skills?\s+summary|areas?\s+of\s+expertise|expertise|competencies|tools?(?:\s*(?:&|and|\/)\s*(?:technologies|platforms?|software))?|technologies|tech\s*stack|technical\s+proficienc(?:y|ies)|software\s+(?:skills?|proficiency)|it\s+skills?|core\s+knowledge|domain\s+(?:skills?|knowledge|expertise)|functional\s+skills?)$/i },
  { kind: 'EXPERIENCE', pattern: /^(?:work\s+experience|professional\s+experience|employment(?:\s+history)?|work\s+history|experience|career\s+history|professional\s+background|relevant\s+experience)$/i },
  { kind: 'INTERNSHIP', pattern: /^(?:internships?|internship\s+experience|industrial\s+training)$/i },
  { kind: 'PROJECTS', pattern: /^(?:(?:academic|personal|technical|side|selected|key|notable|major|mini|capstone|freelance|client)\s+)?projects?(?:\s*(?:&|and|\/)\s*[\w\s]+)?$|^project\s+(?:work|experience|portfolio)$|^portfolio$/i },
  { kind: 'EDUCATION', pattern: /^(?:education(?:al\s+(?:background|qualifications?))?|academic(?:s|\s+(?:background|qualifications?|record))?|qualifications?|educational\s+details)$/i },
  { kind: 'CERTIFICATIONS', pattern: /^(?:certifications?|certificates?|licenses?(?:\s*(?:&|and)\s*certifications?)?|professional\s+certifications?|certifications?\s*(?:&|and|\/)\s*(?:courses?|training|licenses?))$/i },
  { kind: 'TRAINING', pattern: /^(?:trainings?|courses?|coursework|relevant\s+coursework|online\s+courses?|workshops?|professional\s+development|continuing\s+education)$/i },
  { kind: 'ACHIEVEMENTS', pattern: /^(?:achievements?|accomplishments?|awards?(?:\s*(?:&|and)\s*(?:achievements?|honors?|recognitions?))?|honors?|recognitions?|key\s+achievements?)$/i },
  { kind: 'PUBLICATIONS', pattern: /^(?:publications?|research(?:\s+(?:papers?|work|publications?))?|papers?|patents?)$/i },
  { kind: 'VOLUNTEER', pattern: /^(?:volunteer(?:ing|\s+experience|\s+work)?|community\s+(?:service|involvement)|social\s+work|ncc|nss)$/i },
  { kind: 'LANGUAGES', pattern: /^(?:languages?(?:\s+known)?|linguistic\s+skills?)$/i },
  { kind: 'SUMMARY', pattern: /^(?:summary|professional\s+summary|career\s+summary|profile(?:\s+summary)?|about(?:\s+me)?|objective|career\s+objective|overview|executive\s+summary)$/i },
  { kind: 'OTHER', pattern: /^(?:references?|declarations?|personal\s+details|contact(?:\s+(?:details|information))?|strengths|references\s+available)$/i }
];

export interface ResumeLine {
  index: number;
  text: string;      // trimmed, bullet symbol preserved
  content: string;   // bullet symbol stripped
}

export interface ResumeSection {
  kind: SectionKind;
  label: string;     // the resume's own header text (or a synthetic one)
  lines: ResumeLine[];
}

const BULLET_PREFIX = /^[-•*▪▸→o●–—•●▪▸→+~>]\s*/;
const NUMBER_PREFIX = /^\(?\d{1,2}[.)]\s+/;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripBullet(line: string): string {
  return line.replace(BULLET_PREFIX, '').replace(NUMBER_PREFIX, '').trim();
}

/**
 * A header candidate is short, unpunctuated, and not a sentence.
 * Handles both standalone headers ("TECHNICAL SKILLS") and headers that share
 * their line with content ("Technical Skills: Python, SQL"), which is the most
 * common single-column resume layout.
 */
function matchSectionHeader(rawLine: string): { kind: SectionKind; label: string; inlineRest: string } | null {
  const line = stripBullet(rawLine)
    .replace(/^[#_*\s]+/, '')
    .replace(/[#_*\s]+$/, '')
    .trim();

  if (!line || line.length > 200) return null;

  const colonAt = line.search(/[:：]/);
  const candidates: Array<{ text: string; rest: string }> = [];
  if (colonAt !== -1) {
    candidates.push({ text: line.slice(0, colonAt).trim(), rest: line.slice(colonAt + 1).trim() });
  }
  candidates.push({ text: line, rest: '' });

  for (const { text, rest } of candidates) {
    if (!text || text.length > 55) continue;
    if (/[.!?]$/.test(text)) continue;
    for (const rule of SECTION_HEADER_RULES) {
      if (rule.pattern.test(text)) {
        return { kind: rule.kind, label: text.toUpperCase(), inlineRest: rest };
      }
    }
  }
  return null;
}

/**
 * Split raw resume text into the sections the document itself declares.
 * Format-agnostic: works for bullet resumes, block resumes, ALL-CAPS headers,
 * "Header:" headers, and markdown-ish headers.
 */
export function segmentResume(text: string): ResumeSection[] {
  const rawLines = text.split(/\r?\n/);
  const sections: ResumeSection[] = [];
  let current: ResumeSection = { kind: 'HEADER', label: 'HEADER', lines: [] };

  rawLines.forEach((raw, index) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const header = matchSectionHeader(trimmed);
    if (header) {
      if (current.lines.length > 0 || current.kind !== 'HEADER') sections.push(current);
      current = { kind: header.kind, label: header.label, lines: [] };
      // "Skills: Python, SQL" -- header and content share a line.
      if (header.inlineRest) {
        current.lines.push({ index, text: header.inlineRest, content: stripBullet(header.inlineRest) });
      }
      return;
    }

    current.lines.push({ index, text: trimmed, content: stripBullet(trimmed) });
  });

  sections.push(current);
  return sections.filter(s => s.lines.length > 0 || s.kind !== 'HEADER');
}

// ------------------------------------------------------------
// 2. OPEN-WORLD TERM HARVESTING
// ------------------------------------------------------------

// A "Label: a, b, c" line is a listing regardless of which section it sits in.
// This is what rescues resumes that group skills under their own headings
// ("Business:", "Analytics:", "Tools:") instead of one flat Skills block.
const INLINE_LABEL = /^([A-Za-z][A-Za-z0-9 &/'()+.-]{1,40})\s*[:：]\s*(.+)$/;

// Labels that introduce a list of capabilities rather than a fact about the person.
const SKILL_LABEL_HINT = /(?:skills?|tools?|technolog|tech\s*stack|platforms?|software|competenc|expertise|proficien|languages?|frameworks?|librar|databases?|analytics?|marketing|business|operations?|finance|design|management|domain|functional|technical|soft|interpersonal|core|others?|misc|productivity|methodolog|certifications?|specialit|specialt|strengths?|knowledge|systems?|applications?|packages?|equipment|machinery|clinical|laboratory|subjects?)/i;

// Labels that clearly introduce a non-skill fact -- never harvested as terms.
const NON_SKILL_LABEL = /^(?:name|email|e-mail|phone|mobile|contact|address|location|linkedin|github|portfolio|website|dob|date\s+of\s+birth|nationality|gender|marital\s+status|father|mother|languages\s+spoken|references?|objective|summary|profile|role|title|designation|company|organization|organisation|institution|university|college|school|duration|period|year|cgpa|gpa|percentage|marks|grade|salary|ctc|notice\s+period|passport|aadhaar|pan)$/i;

const DATE_LIKE = /\b(?:19|20)\d{2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{0,4}\b/i;
const CONTACT_LIKE = /@|https?:\/\/|www\.|\+\d{2}|\b\d{6,}\b/;

/**
 * Split a listing string into individual terms.
 * Handles commas, pipes, bullets, semicolons, slashes and parentheticals:
 *   "Python (Pandas, NumPy) | SQL / PostgreSQL"
 *     -> Python, Pandas, NumPy, SQL, PostgreSQL
 */
export function splitListingTerms(listing: string): string[] {
  // Promote parenthetical contents to first-class list members.
  const flattened = listing.replace(/\(([^)]{2,60})\)/g, ', $1');

  return flattened
    .split(/[,;|•·‧–—]|\s+•\s+|\s{3,}/)
    .flatMap(part => {
      // Only split on "/" when both halves look like real terms ("React/Node"),
      // never for compact idioms ("AI/ML", "CI/CD", "UI/UX", "AP/AR").
      const slashParts = part.split('/');
      if (slashParts.length > 1 && slashParts.every(p => p.trim().length >= 4)) return slashParts;
      return [part];
    })
    .map(t => t.replace(/^[\s\-–—*•]+/, '').replace(/[\s.]+$/, '').trim())
    .filter(Boolean);
}

/** Would a human reading this string call it a skill/tool name? */
export function isPlausibleSkillTerm(term: string): boolean {
  const t = term.trim();
  if (t.length < 2 || t.length > 60) return false;
  if (!/[a-zA-Z]/.test(t)) return false;
  if (CONTACT_LIKE.test(t)) return false;
  if (DATE_LIKE.test(t)) return false;
  // A term is a name, not a sentence.
  const words = t.split(/\s+/);
  if (words.length > 6) return false;
  if (/[.!?]$/.test(t) && words.length > 3) return false;
  // Reject connective/verb-led fragments ("and managed the team").
  if (/^(?:and|or|the|a|an|with|using|for|to|in|on|of|by|as|at|from|which|that|who|this|these|it|we|i|my|he|she|they)\b/i.test(t)) return false;
  if (/^(?:responsible|worked|managed|handled|assisted|supported|led|built|developed|created|designed|implemented|achieved|increased|reduced|improved)\b/i.test(t)) return false;
  if (NON_SKILL_LABEL.test(t)) return false;
  return true;
}

// Depth qualifiers the resume itself supplies. "SEO Fundamentals" must be
// recorded as SEO @ FUNDAMENTALS -- never as advanced SEO, never discarded.
const LEVEL_QUALIFIERS: Array<{ pattern: RegExp; level: LevelQualifier }> = [
  { pattern: /\b(?:expert|expertise\s+in|mastery\s+of|specialist\s+in)\b/i, level: 'EXPERT' },
  { pattern: /\b(?:advanced|proficient(?:\s+in)?|strong|extensive)\b/i, level: 'ADVANCED' },
  { pattern: /\b(?:working\s+knowledge|hands[\s-]?on|intermediate|good\s+(?:knowledge|command))\b/i, level: 'WORKING' },
  { pattern: /\b(?:fundamentals?|foundational?|essentials?|introduction\s+to|intro\s+to)\b/i, level: 'FUNDAMENTALS' },
  { pattern: /\b(?:basic|basics|beginner|elementary|familiar(?:\s+with)?|exposure\s+to|awareness\s+of|working\s+towards)\b/i, level: 'BASIC' }
];

export interface QualifierSplit {
  core: string;
  qualifier?: LevelQualifier;
  qualifierWord?: string;
}

/** Peel a depth qualifier off a term, keeping both halves. */
export function splitLevelQualifier(term: string): QualifierSplit {
  for (const { pattern, level } of LEVEL_QUALIFIERS) {
    const match = term.match(pattern);
    if (!match) continue;
    const core = term.replace(pattern, ' ').replace(/\s{2,}/g, ' ').replace(/^[\s-]+|[\s-]+$/g, '').trim();
    // Only peel if something meaningful survives ("Basic" alone is not a skill).
    if (core.length >= 2 && /[a-zA-Z]{2}/.test(core)) {
      return { core, qualifier: level, qualifierWord: match[0] };
    }
  }
  return { core: term.trim() };
}

// ------------------------------------------------------------
// 3. EVIDENCE MODEL
// ------------------------------------------------------------

const SECTION_EVIDENCE: Record<SectionKind, { source: EvidenceSourceType; strength: EvidenceStrength }> = {
  HEADER: { source: 'UNKNOWN', strength: 'MENTIONED' },
  SUMMARY: { source: 'PROFESSIONAL_SUMMARY', strength: 'MENTIONED' },
  SKILLS: { source: 'TECHNICAL_SKILLS_LISTING', strength: 'MENTIONED' },
  EXPERIENCE: { source: 'WORK_EXPERIENCE', strength: 'VERIFIED_HIGH' },
  INTERNSHIP: { source: 'INTERNSHIP', strength: 'VERIFIED_MEDIUM' },
  PROJECTS: { source: 'PROJECT_IMPLEMENTATION', strength: 'VERIFIED_MEDIUM' },
  EDUCATION: { source: 'EDUCATION', strength: 'VERIFIED_BASIC' },
  CERTIFICATIONS: { source: 'CERTIFICATION', strength: 'VERIFIED_BASIC' },
  TRAINING: { source: 'TRAINING', strength: 'VERIFIED_BASIC' },
  ACHIEVEMENTS: { source: 'ACHIEVEMENT', strength: 'VERIFIED_MEDIUM' },
  PUBLICATIONS: { source: 'PUBLICATION', strength: 'VERIFIED_MEDIUM' },
  VOLUNTEER: { source: 'VOLUNTEER', strength: 'VERIFIED_BASIC' },
  LANGUAGES: { source: 'LANGUAGES', strength: 'MENTIONED' },
  INTERESTS: { source: 'INTEREST_ASPIRATION', strength: 'INFERRED' },
  OTHER: { source: 'UNKNOWN', strength: 'MENTIONED' }
};

const STRENGTH_RANK: Record<EvidenceStrength, number> = {
  VERIFIED_HIGH: 6,
  VERIFIED_MEDIUM: 5,
  VERIFIED_BASIC: 4,
  PARTIAL: 3,
  MENTIONED: 2,
  INFERRED: 1
};

// Interest / aspiration wording never becomes verified evidence.
const INTEREST_SENTENCE = /(?:interested\s+in|areas?\s+of\s+interest|keen\s+to\s+learn|curious\s+about|aspiring\s+to|seeking\s+(?:a\s+)?(?:career|role)s?\s+in|passion(?:ate)?\s+(?:for|about)|would\s+like\s+to\s+learn)/i;
const LEARNING_SENTENCE = /(?:currently\s+learning|learning\s+(?:the\s+)?basics\s+of|studying\s+fundamentals\s+of|planning\s+to\s+learn|yet\s+to\s+learn|beginner\s+in\s+learning)/i;

const ACHIEVEMENT_VERB = /\b(?:managed|led|built|developed|created|implemented|designed|delivered|launched|automated|optimi[sz]ed|reduced|increased|improved|coordinated|prepared|analy[sz]ed|handled|supervised|executed|maintained|migrated|deployed|trained|owned|drove|streamlined|tracked|monitored|conducted|administered|processed|resolved|negotiated|presented)\b/i;

export interface ExtractedSkillRecord {
  original_term: string;
  canonical_term: string;
  normalized_name: string;
  normalization_reason: string;
  skill_kind: SkillKind;
  category: string;
  subcategory?: string;
  domain?: CareerDomainType;
  parent_skill?: string;
  level_qualifier?: LevelQualifier;
  evidence: SkillEvidence[];
  evidence_strength: EvidenceStrength;
  is_unmapped: boolean;
  suggested_category?: string;
}

// ------------------------------------------------------------
// 4. UNMAPPED TERM CLASSIFICATION
// ------------------------------------------------------------

// When a term has no ontology node we still classify it, using the resume's
// own grouping label plus surface cues. The term is NEVER discarded.
const UNMAPPED_KIND_CUES: Array<{ pattern: RegExp; kind: SkillKind; category: string }> = [
  { pattern: /\b(?:crm|erp|cms|saas|platform|suite|cloud|portal|hub|studio|workspace)\b/i, kind: 'PLATFORM', category: 'Platform' },
  { pattern: /\b(?:software|tool|app|application|editor|ide|dashboard|tracker|scanner|machine|instrument|equipment)\b/i, kind: 'TOOL', category: 'Tool' },
  { pattern: /\b(?:management|planning|coordination|operations|administration|strategy|governance|compliance|handling|supervision)\b/i, kind: 'DOMAIN_KNOWLEDGE', category: 'Business & Domain' },
  { pattern: /\b(?:methodology|framework|process|practices?|standards?|principles?|approach|model)\b/i, kind: 'METHODOLOGY', category: 'Methodology' },
  { pattern: /\b(?:communication|teamwork|collaboration|leadership|interpersonal|attitude|mindset|ethic|thinking|patience|empathy|discipline)\b/i, kind: 'SOFT_SKILL', category: 'Soft Skill' },
  { pattern: /\b(?:analysis|analytics|reporting|research|modelling|modeling|forecasting|testing|design|development|engineering|writing|editing|training|teaching|marketing|sales|accounting|auditing|nursing|care)\b/i, kind: 'SKILL', category: 'Professional Skill' }
];

// The resume's own group label is the strongest hint we have for an unknown term.
const LABEL_KIND_CUES: Array<{ pattern: RegExp; kind: SkillKind; category: string }> = [
  { pattern: /\b(?:tools?|software|platforms?|applications?|packages?|systems?|technolog|tech\s*stack|equipment|machinery)\b/i, kind: 'TOOL', category: 'Tool' },
  { pattern: /\b(?:soft|interpersonal|personal|behavioural|behavioral)\b/i, kind: 'SOFT_SKILL', category: 'Soft Skill' },
  { pattern: /\b(?:methodolog|process|framework)\b/i, kind: 'METHODOLOGY', category: 'Methodology' },
  { pattern: /\b(?:business|domain|functional|operations?|industry|commercial|clinical|legal|finance|marketing|sales|hr)\b/i, kind: 'DOMAIN_KNOWLEDGE', category: 'Business & Domain' },
  { pattern: /\b(?:languages?)\b/i, kind: 'LANGUAGE', category: 'Language' }
];

function classifyUnmappedTerm(term: string, groupLabel: string, section: SectionKind): { kind: SkillKind; category: string } {
  if (section === 'LANGUAGES') return { kind: 'LANGUAGE', category: 'Language' };

  // The term's own wording outranks the group label when it is decisive.
  for (const cue of UNMAPPED_KIND_CUES) {
    if (cue.pattern.test(term)) return { kind: cue.kind, category: cue.category };
  }
  for (const cue of LABEL_KIND_CUES) {
    if (groupLabel && cue.pattern.test(groupLabel)) return { kind: cue.kind, category: cue.category };
  }
  // A single capitalised proper noun in a skills listing is almost always a
  // product name (Zoho, Odoo, Figma) rather than an abstract capability.
  if (/^[A-Z][A-Za-z0-9.+#-]*(?:\s[A-Z][A-Za-z0-9.+#-]*)?$/.test(term.trim()) && term.trim().split(/\s+/).length <= 2) {
    return { kind: 'TOOL', category: 'Tool' };
  }
  return { kind: 'UNKNOWN', category: 'Unclassified' };
}

// ------------------------------------------------------------
// 5. THE EXTRACTOR
// ------------------------------------------------------------

class SkillAccumulator {
  private byKey = new Map<string, ExtractedSkillRecord>();

  add(record: Omit<ExtractedSkillRecord, 'evidence_strength'> & { evidence: SkillEvidence[] }): void {
    const key = record.normalized_name;
    const strongest = record.evidence.reduce<EvidenceStrength>(
      (best, e) => (STRENGTH_RANK[e.strength] > STRENGTH_RANK[best] ? e.strength : best),
      'INFERRED'
    );

    const existing = this.byKey.get(key);
    if (!existing) {
      this.byKey.set(key, { ...record, evidence_strength: strongest });
      return;
    }

    // Merge: evidence accumulates, the strongest wins, and an explicitly
    // listed original term always beats a prose-inferred one.
    for (const e of record.evidence) {
      if (!existing.evidence.some(x => x.quote === e.quote && x.source_type === e.source_type)) {
        existing.evidence.push(e);
      }
    }
    if (STRENGTH_RANK[strongest] > STRENGTH_RANK[existing.evidence_strength]) {
      existing.evidence_strength = strongest;
    }
    if (existing.evidence_strength === 'INFERRED' && strongest !== 'INFERRED') {
      existing.evidence_strength = strongest;
    }
    // A listing-sourced term is the authoritative original wording.
    const listingEvidence = record.evidence.find(e => e.source_type === 'TECHNICAL_SKILLS_LISTING');
    if (listingEvidence && !existing.evidence.some(e => e.source_type === 'TECHNICAL_SKILLS_LISTING' && e.quote !== listingEvidence.quote)) {
      existing.original_term = record.original_term;
    }
    if (record.level_qualifier && !existing.level_qualifier) {
      existing.level_qualifier = record.level_qualifier;
    }
    if (!record.is_unmapped) existing.is_unmapped = false;
  }

  values(): ExtractedSkillRecord[] {
    return Array.from(this.byKey.values());
  }
}

function buildRecord(
  originalTerm: string,
  node: OntologyNode | undefined,
  qualifier: LevelQualifier | undefined,
  evidence: SkillEvidence[],
  groupLabel: string,
  section: SectionKind
): Omit<ExtractedSkillRecord, 'evidence_strength'> & { evidence: SkillEvidence[] } {
  if (node) {
    const parent = node.parents.length > 0 ? SKILL_ONTOLOGY[node.parents[0]] : undefined;
    const canonical = node.canonicalName;
    return {
      original_term: originalTerm,
      canonical_term: canonical,
      normalized_name: node.id,
      normalization_reason:
        normalizeTermKey(originalTerm) === normalizeTermKey(canonical)
          ? 'Exact canonical match'
          : `Alias of canonical skill '${canonical}'`,
      skill_kind: ontologyKind(node),
      category: node.subcategory || node.category,
      subcategory: node.subcategory,
      domain: node.domain,
      parent_skill: parent?.canonicalName,
      level_qualifier: qualifier,
      evidence,
      is_unmapped: false
    };
  }

  const guess = classifyUnmappedTerm(originalTerm, groupLabel, section);
  return {
    original_term: originalTerm,
    canonical_term: originalTerm,
    normalized_name: normalizeTermKey(originalTerm).replace(/\s+/g, '_'),
    normalization_reason: 'No ontology entry -- preserved verbatim as UNMAPPED_SKILL',
    skill_kind: guess.kind,
    category: guess.category,
    subcategory: groupLabel || undefined,
    level_qualifier: qualifier,
    evidence,
    is_unmapped: true,
    suggested_category: groupLabel ? `${guess.category} (resume group: ${groupLabel})` : guess.category
  };
}

export interface ResumeExtractionResult {
  skills: ExtractedSkillRecord[];
  education: CandidateEducation[];
  certifications: CandidateCertification[];
  experiences: ExtractedExperience[];
  sections: ResumeSection[];
  section_kinds: SectionKind[];
}

/**
 * Main entry point. Career-agnostic by construction: it takes only the resume
 * text and never a target role, so the same evidence graph serves whatever
 * career the candidate picks later.
 */
export function extractResumeEvidence(rawText: string): ResumeExtractionResult {
  const sections = segmentResume(rawText || '');
  const acc = new SkillAccumulator();

  // ---- Pass A: open-world harvest from listing-shaped content ----
  for (const section of sections) {
    if (section.kind === 'INTERESTS') continue; // aspirations are not evidence

    const sectionEvidence = SECTION_EVIDENCE[section.kind];

    for (const line of section.lines) {
      const labelMatch = line.content.match(INLINE_LABEL);
      const hasLabel = !!labelMatch && !NON_SKILL_LABEL.test(labelMatch[1].trim());

      let groupLabel = '';
      let listing = '';

      if (hasLabel && labelMatch) {
        const label = labelMatch[1].trim();
        const rest = labelMatch[2].trim();
        // "Tools: Canva, Notion" anywhere in the document is a listing.
        // "PantryPal: Built a full stack app..." is prose, not a listing.
        const restTerms = splitListingTerms(rest);
        const looksLikeList =
          restTerms.length >= 2 && restTerms.every(t => t.split(/\s+/).length <= 6 && !/[.!?]$/.test(t));
        if (SKILL_LABEL_HINT.test(label) || (section.kind === 'SKILLS' && looksLikeList) || looksLikeList) {
          groupLabel = label;
          listing = rest;
        }
      }

      if (!listing && section.kind === 'SKILLS') {
        listing = line.content;
        groupLabel = section.label;
      }

      if (!listing) continue;

      // Guard: a long prose sentence inside a skills section is a summary,
      // not a listing. Harvesting it would fabricate skills.
      const terms = splitListingTerms(listing);
      if (terms.length === 1 && terms[0].split(/\s+/).length > 6) continue;

      // A labelled listing IS a skills listing, whichever section it sits in.
      const isSkillListing = section.kind === 'SKILLS' || (!!groupLabel && SKILL_LABEL_HINT.test(groupLabel));

      for (const rawTerm of terms) {
        const { core, qualifier } = splitLevelQualifier(rawTerm);
        const node = findOntologyNodeExact(core) || findOntologyNodeExact(rawTerm);

        // A term we recognise is admissible even when it is too short for the
        // generic plausibility heuristic ("C", "R", "Go" in a language list).
        if (!node && (!isPlausibleSkillTerm(rawTerm) || !isPlausibleSkillTerm(core))) continue;

        // Explicitly listed -> the listing is the evidence, at MENTIONED
        // strength unless the section itself carries more weight.
        const strength: EvidenceStrength =
          qualifier === 'BASIC' || qualifier === 'FUNDAMENTALS'
            ? 'VERIFIED_BASIC'
            : isSkillListing || section.kind === 'HEADER' || section.kind === 'SUMMARY'
            ? 'MENTIONED'
            : sectionEvidence.strength;

        acc.add(
          buildRecord(
            rawTerm,
            node,
            qualifier,
            [
              {
                source_type: isSkillListing ? 'TECHNICAL_SKILLS_LISTING' : sectionEvidence.source,
                section_label: groupLabel || section.label,
                quote: line.text,
                strength
              }
            ],
            groupLabel || section.label,
            section.kind
          )
        );
      }
    }
  }

  // ---- Pass B: conservative ontology scan over prose ----
  // Only terms we already understand may be lifted out of free text. This is
  // what lets "coordinated sales teams, tracked campaign performance" produce
  // evidence, without letting arbitrary sentence fragments become skills.
  // Soft skills are excluded from prose scanning entirely. Words like
  // "leadership", "communication" and "collaboration" occur constantly in
  // ordinary job-description prose ("reports for leadership") where they are
  // not a claim about the candidate. Soft skills are only credited when the
  // resume lists them or a review step adds them.
  const aliases = getScannableAliases().filter(a => ontologyKind(a.node) !== 'SOFT_SKILL');

  for (const section of sections) {
    if (section.kind === 'INTERESTS' || section.kind === 'SKILLS') continue;

    const sectionEvidence = SECTION_EVIDENCE[section.kind];

    for (const line of section.lines) {
      if (INTEREST_SENTENCE.test(line.content) || LEARNING_SENTENCE.test(line.content)) continue;

      // Longest alias wins and CONSUMES its span, so "Google Analytics" cannot
      // also register the generic "analytics", and "MySQL" cannot register "SQL".
      let haystack = ' ' + normalizeTermKey(line.content) + ' ';
      const matchedNodes = new Set<string>();

      for (const { alias, node } of aliases) {
        if (matchedNodes.has(node.id)) continue;
        const at = haystack.indexOf(' ' + alias + ' ');
        const atPunct = at === -1 ? haystack.search(new RegExp(`\\s${escapeRegex(alias)}(?=[,.;:)]|\\s|$)`)) : at;
        if (atPunct === -1) continue;
        matchedNodes.add(node.id);
        haystack =
          haystack.slice(0, atPunct + 1) + ' '.repeat(alias.length) + haystack.slice(atPunct + 1 + alias.length);

        // In a certification / education / achievement section the mention IS
        // the evidence. In experience / project prose we want an action verb,
        // except for project titles, which are deliverables in their own right.
        const selfEvidencing =
          section.kind === 'CERTIFICATIONS' ||
          section.kind === 'TRAINING' ||
          section.kind === 'EDUCATION' ||
          section.kind === 'ACHIEVEMENTS' ||
          section.kind === 'PUBLICATIONS' ||
          section.kind === 'PROJECTS';
        const demonstrated = selfEvidencing || ACHIEVEMENT_VERB.test(line.content);

        const strength: EvidenceStrength = demonstrated
          ? sectionEvidence.strength
          : section.kind === 'SUMMARY' || section.kind === 'HEADER'
          ? 'INFERRED'
          : STRENGTH_RANK[sectionEvidence.strength] > STRENGTH_RANK['MENTIONED']
          ? 'PARTIAL'
          : 'INFERRED';

        acc.add(
          buildRecord(
            node.canonicalName,
            node,
            undefined,
            [
              {
                source_type: sectionEvidence.source,
                section_label: section.label,
                quote: line.text,
                strength
              }
            ],
            section.label,
            section.kind
          )
        );
      }
    }
  }

  return {
    skills: acc.values(),
    education: extractEducation(sections),
    certifications: extractCertifications(sections),
    experiences: extractExperiences(sections),
    sections,
    section_kinds: Array.from(new Set(sections.map(s => s.kind)))
  };
}

// ------------------------------------------------------------
// 6. EDUCATION / CERTIFICATION EXTRACTION
// ------------------------------------------------------------

const DEGREE_PATTERNS: Array<{ pattern: RegExp; level: NonNullable<CandidateEducation['level']> }> = [
  { pattern: /\b(?:ph\.?\s?d\.?|doctorate|doctoral)\b/i, level: 'DOCTORATE' },
  { pattern: /\b(?:m\.?\s?tech|m\.?\s?e\.?\b|m\.?\s?sc|m\.?\s?com|m\.?\s?a\.?\b|mba|mca|mbbs|md\b|ll\.?m|master(?:'?s)?(?:\s+of|\s+in)?|post\s?graduat)/i, level: 'MASTERS' },
  { pattern: /\b(?:b\.?\s?tech|b\.?\s?e\.?\b|b\.?\s?sc|b\.?\s?com|b\.?\s?a\.?\b|bba|bca|b\.?\s?pharm|ll\.?b|bachelor(?:'?s)?(?:\s+of|\s+in)?|under\s?graduat)/i, level: 'BACHELORS' },
  { pattern: /\b(?:diploma|polytechnic|iti\b|advanced\s+diploma|pg\s?diploma)\b/i, level: 'DIPLOMA' },
  { pattern: /\b(?:higher\s+secondary|12th|hsc|intermediate|senior\s+secondary|a[\s-]levels?)\b/i, level: 'HIGHER_SECONDARY' },
  { pattern: /\b(?:secondary|10th|ssc|matriculation|o[\s-]levels?)\b/i, level: 'SECONDARY' }
];

const INSTITUTION_HINT = /\b(?:university|college|institute|institution|school|academy|polytechnic|iit|nit|iiit|iim)\b/i;

export function extractEducation(sections: ResumeSection[]): CandidateEducation[] {
  const results: CandidateEducation[] = [];
  const seen = new Set<string>();

  for (const section of sections) {
    if (section.kind !== 'EDUCATION') continue;

    for (const line of section.lines) {
      const text = line.content;
      const degreeMatch = DEGREE_PATTERNS.find(d => d.pattern.test(text));
      if (!degreeMatch) continue;

      const key = normalizeTermKey(text);
      if (seen.has(key)) continue;
      seen.add(key);

      // "Bachelor of Business Administration in Marketing, Symbiosis University, 2017-2020"
      //  -> degree "Bachelor of Business Administration", field "Marketing"
      // "B.Tech in Computer Science, XYZ University, 2021-2025"
      //  -> degree "B.Tech", field "Computer Science"
      const degreePhrase = text.split(/[,|(]/)[0].trim();
      const inSplit = degreePhrase.split(/\s+\bin\b\s+/i);
      const degreeLabel = inSplit[0].trim();
      const field = inSplit.length > 1 ? inSplit.slice(1).join(' in ').trim() : undefined;

      const institutionPart = text
        .split(/[,|]/)
        .map(p => p.trim())
        .find(p => INSTITUTION_HINT.test(p));
      const years = Array.from(text.matchAll(/\b(19|20)\d{2}\b/g)).map(m => parseInt(m[0], 10));

      results.push({
        degree: degreeLabel || (text.match(degreeMatch.pattern) || [''])[0].trim() || text.slice(0, 60),
        field: field ? field.replace(/[.,]$/, '').trim() : undefined,
        institution: institutionPart,
        start_year: years.length > 1 ? Math.min(...years) : undefined,
        end_year: years.length > 0 ? Math.max(...years) : undefined,
        level: degreeMatch.level,
        evidence_quote: line.text,
        evidence_origin: 'RESUME'
      });
    }
  }

  return results;
}

const ISSUER_HINT = /(?:\bby\b|\bfrom\b|\bissued\s+by\b|–|—|\s-\s|\|)\s*([A-Z][A-Za-z0-9&.'\s]{2,50})$/;
const CERT_INLINE = /\b(?:certified|certificate|certification|credential|licensed?|qualification)\b/i;

export function extractCertifications(sections: ResumeSection[]): CandidateCertification[] {
  const results: CandidateCertification[] = [];
  const seen = new Set<string>();

  for (const section of sections) {
    const isCertSection = section.kind === 'CERTIFICATIONS' || section.kind === 'TRAINING';
    for (const line of section.lines) {
      const text = line.content;
      if (!isCertSection && !CERT_INLINE.test(text)) continue;
      if (text.length < 4 || text.split(/\s+/).length > 18) continue;
      if (!/[a-zA-Z]/.test(text)) continue;

      const key = normalizeTermKey(text);
      if (seen.has(key)) continue;
      seen.add(key);

      // Peel the date first so the issuer regex can anchor at end-of-string:
      // "Google Analytics IQ - Google, 2023" -> name / issuer / date.
      const dateMatch = text.match(/\b(?:19|20)\d{2}\b/);
      const withoutDate = text.replace(/[,\s(–—-]*\b(?:19|20)\d{2}\b\)?\s*$/, '').trim();
      const issuerMatch = withoutDate.match(ISSUER_HINT);
      const name = issuerMatch ? withoutDate.slice(0, withoutDate.length - issuerMatch[0].length).trim() : withoutDate;

      // Certifications carry skill evidence: link any canonical skill named in them.
      const associated = Array.from(
        new Set(
          getScannableAliases()
            .filter(a => new RegExp(`(?:^|\\s)${escapeRegex(a.alias)}(?=\\s|$|[,.;:)])`, 'i').test(normalizeTermKey(text)))
            .map(a => a.node.canonicalName)
        )
      ).slice(0, 6);

      results.push({
        name: name.replace(/[,\-–—|]\s*$/, '').trim() || text,
        issuer: issuerMatch ? issuerMatch[1].trim() : undefined,
        issued_on: dateMatch ? dateMatch[0] : undefined,
        associated_skills: associated,
        evidence_quote: line.text,
        evidence_origin: 'RESUME'
      });
    }
  }

  return results;
}

// ------------------------------------------------------------
// 6b. EXPERIENCE EXTRACTION
// ------------------------------------------------------------
// Previously there was none: the parser hardcoded a single employer and
// dropped every real work history. Experience entries are the strongest
// evidence a resume carries, so losing them starved the readiness engine.

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

const DATE_RANGE = new RegExp(
  String.raw`((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?((?:19|20)\d{2})` +
    String.raw`\s*(?:-|–|—|to|until|through)\s*` +
    String.raw`((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?((?:19|20)\d{2}|present|current|till\s*date|ongoing)`,
  'i'
);

const ROLE_WORD = /\b(?:intern|trainee|apprentice|engineer|developer|programmer|analyst|scientist|architect|administrator|manager|executive|coordinator|associate|assistant|specialist|consultant|advisor|officer|lead|head|director|supervisor|president|founder|partner|designer|writer|editor|journalist|teacher|tutor|lecturer|professor|instructor|trainer|coach|nurse|doctor|physician|therapist|pharmacist|technician|accountant|auditor|bookkeeper|cashier|clerk|receptionist|representative|agent|recruiter|strategist|planner|operator|machinist|electrician|supervisor|chef|steward|paralegal|attorney|advocate|volunteer|freelancer|apprentice)\b/i;

function monthsBetween(
  startMonth: string | undefined, startYear: string,
  endMonth: string | undefined, endYear: string
): { months: number; isCurrent: boolean } {
  const isCurrent = /present|current|till\s*date|ongoing/i.test(endYear);
  const sm = startMonth ? MONTHS[startMonth.trim().slice(0, 3).toLowerCase()] ?? 0 : 0;
  const sy = parseInt(startYear, 10);
  const now = new Date();
  const ey = isCurrent ? now.getFullYear() : parseInt(endYear, 10);
  const em = isCurrent ? now.getMonth() : endMonth ? MONTHS[endMonth.trim().slice(0, 3).toLowerCase()] ?? 11 : 11;

  const months = (ey - sy) * 12 + (em - sm) + 1;
  return { months: months > 0 ? months : 0, isCurrent };
}

export interface ExtractedExperience {
  organization: string;
  role_title: string;
  duration_months: number;
  description: string;
  is_current: boolean;
  evidence_quote: string;
}

const ENTRY_SEPARATOR = /\s+(?:[|·•]|–|—|\s-\s|,\s*)\s*|\s+\bat\b\s+/;

function splitEntryHeader(header: string): { role: string; organization: string } {
  const cleaned = header.replace(DATE_RANGE, '').replace(/\(\s*\)|\[\s*\]/g, '').replace(/[(),|·•–—-]\s*$/, '').trim();
  const parts = cleaned
    .split(/\s*(?:[|·•]|–|—|\s-\s)\s*|\s+\bat\b\s+|,\s+/)
    .map(p => p.trim())
    .filter(p => p.length > 1);

  if (parts.length === 0) return { role: cleaned || 'Role', organization: '' };
  if (parts.length === 1) {
    return ROLE_WORD.test(parts[0])
      ? { role: parts[0], organization: '' }
      : { role: '', organization: parts[0] };
  }

  const roleIdx = parts.findIndex(p => ROLE_WORD.test(p));
  if (roleIdx === -1) return { role: parts[0], organization: parts[1] };

  const role = parts[roleIdx];
  const organization = parts.find((p, i) => i !== roleIdx) || '';
  return { role, organization };
}

/**
 * Extract work-history entries from EXPERIENCE / INTERNSHIP / VOLUNTEER
 * sections. Nothing is invented: an entry is emitted only when the resume
 * supplies a header line, and duration is 0 when no dates are stated.
 */
export function extractExperiences(sections: ResumeSection[]): ExtractedExperience[] {
  const results: ExtractedExperience[] = [];

  for (const section of sections) {
    if (section.kind !== 'EXPERIENCE' && section.kind !== 'INTERNSHIP' && section.kind !== 'VOLUNTEER') continue;

    let current: ExtractedExperience | null = null;
    const descriptionLines: string[] = [];
    let pendingHeader: string | null = null;

    const flush = () => {
      if (current) {
        current.description = descriptionLines.join(' ').trim();
        if (current.role_title || current.organization) {
          if (!current.role_title) current.role_title = section.kind === 'INTERNSHIP' ? 'Intern' : 'Role (not stated)';
          if (!current.organization) current.organization = 'Organization (not stated)';
          results.push(current);
        }
      }
      current = null;
      descriptionLines.length = 0;
    };

    for (const line of section.lines) {
      const text = line.content;
      const isBullet = BULLET_PREFIX.test(line.text);
      const dateMatch = text.match(DATE_RANGE);

      // A header line: not a bullet, reasonably short, and either dated or
      // structured like "Role - Organization".
      const looksStructured = /\s(?:[|·•]|–|—|\s-\s)\s|\bat\b/.test(text) || ROLE_WORD.test(text);
      const isHeader =
        !isBullet && text.length <= 120 && (!!dateMatch || (looksStructured && text.split(/\s+/).length <= 14 && !/[.!?]$/.test(text)));

      if (isHeader) {
        // Two consecutive header-ish lines = "Organization" then "Role, dates".
        if (current && descriptionLines.length === 0 && pendingHeader && !dateMatch) {
          // keep the richer of the two as the header
        }
        flush();
        pendingHeader = text;

        const { role, organization } = splitEntryHeader(text);
        const duration = dateMatch
          ? monthsBetween(dateMatch[1], dateMatch[2], dateMatch[3], dateMatch[4])
          : { months: 0, isCurrent: /present|current|ongoing/i.test(text) };

        current = {
          organization,
          role_title: role,
          duration_months: duration.months,
          description: '',
          is_current: duration.isCurrent,
          evidence_quote: line.text
        };
        continue;
      }

      if (current) {
        descriptionLines.push(text);
      } else if (text.length > 2) {
        // Content before any recognisable header: treat the first line as one.
        pendingHeader = text;
        const { role, organization } = splitEntryHeader(text);
        current = {
          organization,
          role_title: role,
          duration_months: 0,
          description: '',
          is_current: false,
          evidence_quote: line.text
        };
      }
    }
    flush();
  }

  return results;
}

// ------------------------------------------------------------
// 7. MAPPING TO THE PARSED-SKILL CONTRACT
// ------------------------------------------------------------

const STRENGTH_TO_PROFICIENCY: Record<EvidenceStrength, 'beginner' | 'intermediate' | 'advanced'> = {
  VERIFIED_HIGH: 'advanced',
  VERIFIED_MEDIUM: 'intermediate',
  VERIFIED_BASIC: 'beginner',
  PARTIAL: 'beginner',
  MENTIONED: 'intermediate',
  INFERRED: 'beginner'
};

const SOURCE_LABEL: Record<EvidenceSourceType, string> = {
  TECHNICAL_SKILLS_LISTING: 'Technical Skills Listing',
  WORK_EXPERIENCE: 'Workplace Experience',
  PROJECT_IMPLEMENTATION: 'Project Implementation',
  CERTIFICATION: 'Certification & Coursework',
  EDUCATION: 'Education',
  COURSEWORK: 'Certification & Coursework',
  TRAINING: 'Training',
  ACHIEVEMENT: 'Achievement',
  PROFESSIONAL_SUMMARY: 'Professional Summary',
  INTERNSHIP: 'Internship',
  VOLUNTEER: 'Volunteer Experience',
  RESEARCH: 'Research',
  PORTFOLIO: 'Portfolio',
  PUBLICATION: 'Publication',
  LANGUAGES: 'Languages',
  INTEREST_ASPIRATION: 'Interest / Aspiration',
  USER_DECLARED: 'User Added',
  UNKNOWN: 'Resume Document'
};

/** Strongest evidence item, used for the legacy single-provenance fields. */
function primaryEvidence(record: ExtractedSkillRecord): SkillEvidence {
  return record.evidence.reduce((best, e) =>
    STRENGTH_RANK[e.strength] > STRENGTH_RANK[best.strength] ? e : best
  );
}

export function toParsedSkill(record: ExtractedSkillRecord): ParsedSkill {
  const primary = primaryEvidence(record);
  const qualifierNote = record.level_qualifier ? ` (level as stated: ${record.level_qualifier})` : '';

  const proficiency =
    record.level_qualifier === 'BASIC' || record.level_qualifier === 'FUNDAMENTALS'
      ? 'beginner'
      : record.level_qualifier === 'EXPERT' || record.level_qualifier === 'ADVANCED'
      ? 'advanced'
      : STRENGTH_TO_PROFICIENCY[record.evidence_strength];

  return {
    name: record.canonical_term,
    normalized_name: record.normalized_name,
    proficiency_level: proficiency,
    provenance_source: SOURCE_LABEL[primary.source_type],
    provenance_context: primary.quote,
    // Parsing confidence: a verbatim quote backs every record we emit.
    // Depth of proof lives in evidence_strength, not here.
    extraction_confidence: 'HIGH',
    source_evidence: `"${record.original_term}" found under ${primary.section_label}${qualifierNote}.`,
    original_term: record.original_term,
    canonical_term: record.canonical_term,
    normalization_reason: record.normalization_reason,
    skill_kind: record.skill_kind,
    category: record.category,
    subcategory: record.subcategory,
    domain: record.domain,
    parent_skill: record.parent_skill,
    evidence_strength: record.evidence_strength,
    level_qualifier: record.level_qualifier,
    evidence: record.evidence,
    is_unmapped: record.is_unmapped,
    suggested_category: record.suggested_category,
    evidence_origin: 'RESUME'
  };
}

// ------------------------------------------------------------
// 8. EXTRACTION COVERAGE
// ------------------------------------------------------------

/**
 * How much structured information did we recover from this document?
 * NOT an accuracy score. It answers "does the extracted profile look
 * suspiciously thin next to the raw resume?" -- the exact failure mode that
 * produced two-skill profiles from rich resumes.
 */
export function computeExtractionCoverage(input: {
  skills: ParsedSkill[];
  projects: unknown[];
  experiences: unknown[];
  education: unknown[];
  certifications: unknown[];
  sections: SectionKind[];
  rawText: string;
}): ExtractionCoverage {
  const { skills, projects, experiences, education, certifications, sections, rawText } = input;

  const tools = skills.filter(s => s.skill_kind === 'TOOL' || s.skill_kind === 'PLATFORM').length;
  const soft = skills.filter(s => s.skill_kind === 'SOFT_SKILL').length;
  const unmapped = skills.filter(s => s.is_unmapped).length;

  // Score each section the resume declares against whether we got data out of it.
  const checks: Array<{ present: boolean; recovered: boolean }> = [
    { present: sections.includes('SKILLS'), recovered: skills.length > 0 },
    { present: sections.includes('PROJECTS'), recovered: projects.length > 0 },
    { present: sections.includes('EXPERIENCE') || sections.includes('INTERNSHIP'), recovered: experiences.length > 0 },
    { present: sections.includes('EDUCATION'), recovered: education.length > 0 },
    { present: sections.includes('CERTIFICATIONS') || sections.includes('TRAINING'), recovered: certifications.length > 0 }
  ];

  const declared = checks.filter(c => c.present);
  const sectionScore = declared.length > 0 ? declared.filter(c => c.recovered).length / declared.length : skills.length > 0 ? 1 : 0;

  // Density check: a long resume that yields almost nothing is a red flag.
  const words = rawText.trim().split(/\s+/).filter(Boolean).length;
  const expectedSkills = Math.min(25, Math.max(3, Math.round(words / 45)));
  const densityScore = Math.min(1, skills.length / expectedSkills);

  const coverage = Math.round((sectionScore * 0.65 + densityScore * 0.35) * 100);

  const warnings: string[] = [];
  for (const [label, check] of [
    ['skills', checks[0]],
    ['projects', checks[1]],
    ['work experience', checks[2]],
    ['education', checks[3]],
    ['certifications', checks[4]]
  ] as Array<[string, { present: boolean; recovered: boolean }]>) {
    if (check.present && !check.recovered) {
      warnings.push(`Resume declares a ${label} section but nothing was extracted from it.`);
    }
  }
  const isLowCoverage = coverage < 60 || (words > 150 && skills.length < 5);
  if (isLowCoverage) {
    warnings.push('Low extraction coverage detected. Review extracted profile.');
  }
  if (unmapped > 0) {
    warnings.push(`${unmapped} term(s) preserved as UNMAPPED_SKILL and flagged for ontology review.`);
  }

  return {
    coverage_percentage: coverage,
    skills_detected: skills.length,
    tools_detected: tools,
    soft_skills_detected: soft,
    projects_detected: projects.length,
    experience_entries_detected: experiences.length,
    education_detected: education.length,
    certifications_detected: certifications.length,
    unmapped_terms_detected: unmapped,
    sections_detected: sections,
    is_low_coverage: isLowCoverage,
    warnings
  };
}
