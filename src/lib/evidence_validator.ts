import { ParsedResumeData, ParsedSkill, EvidenceStrength } from '../types';
import { SKILL_ONTOLOGY, ontologyKind } from './skill_ontology';

export interface CanonicalSkillDef {
  canonicalName: string;
  normalizedName: string;
  category: 'Programming Language' | 'Database' | 'Frontend' | 'Backend' | 'DevOps / Cloud' | 'Tool / Platform' | 'Data / AI' | 'Domain / General';
  aliases: string[];
}

// Legacy canonical set. Kept verbatim (and first in the lookup order) so the
// exact normalized_name values that readiness / gap matching and the seeded
// opportunity requirements already depend on cannot drift.
const LEGACY_SKILL_TAXONOMY: CanonicalSkillDef[] = [
  // Programming Languages
  { canonicalName: 'Python', normalizedName: 'python', category: 'Programming Language', aliases: ['python', 'python3'] },
  { canonicalName: 'Java', normalizedName: 'java', category: 'Programming Language', aliases: ['java', 'core java'] },
  { canonicalName: 'JavaScript', normalizedName: 'javascript', category: 'Programming Language', aliases: ['javascript', 'js', 'es6'] },
  { canonicalName: 'TypeScript', normalizedName: 'typescript', category: 'Programming Language', aliases: ['typescript', 'ts'] },
  { canonicalName: 'C Programming', normalizedName: 'c', category: 'Programming Language', aliases: ['c language', 'c programming'] },
  { canonicalName: 'C++', normalizedName: 'c++', category: 'Programming Language', aliases: ['c++', 'cpp'] },
  { canonicalName: 'C#', normalizedName: 'c#', category: 'Programming Language', aliases: ['c#', 'csharp'] },
  { canonicalName: 'Go', normalizedName: 'go', category: 'Programming Language', aliases: ['golang', 'go language'] },
  { canonicalName: 'Rust', normalizedName: 'rust', category: 'Programming Language', aliases: ['rust'] },

  // Databases & Storage
  { canonicalName: 'MySQL', normalizedName: 'mysql', category: 'Database', aliases: ['mysql', 'my sql'] },
  { canonicalName: 'PostgreSQL', normalizedName: 'postgresql', category: 'Database', aliases: ['postgresql', 'postgres', 'psql'] },
  { canonicalName: 'MongoDB', normalizedName: 'mongodb', category: 'Database', aliases: ['mongodb', 'mongo'] },
  { canonicalName: 'SQLite', normalizedName: 'sqlite', category: 'Database', aliases: ['sqlite', 'sqlite3'] },
  { canonicalName: 'Redis', normalizedName: 'redis', category: 'Database', aliases: ['redis'] },
  { canonicalName: 'Oracle Database', normalizedName: 'oracle', category: 'Database', aliases: ['oracle db', 'oracle database', 'oracle sql'] },
  { canonicalName: 'Database Management Systems', normalizedName: 'database_management_systems', category: 'Database', aliases: ['database management systems', 'dbms', 'rdbms', 'relational databases'] },
  { canonicalName: 'JDBC', normalizedName: 'jdbc', category: 'Database', aliases: ['jdbc', 'java database connectivity'] },
  { canonicalName: 'SQL', normalizedName: 'sql', category: 'Database', aliases: ['sql', 'structured query language'] },

  // Web & Backend Frameworks
  { canonicalName: 'Node.js', normalizedName: 'node.js', category: 'Backend', aliases: ['node.js', 'nodejs', 'node'] },
  { canonicalName: 'Express.js', normalizedName: 'express.js', category: 'Backend', aliases: ['express.js', 'expressjs', 'express'] },
  { canonicalName: 'Django', normalizedName: 'django', category: 'Backend', aliases: ['django'] },
  { canonicalName: 'Django REST Framework', normalizedName: 'django_rest_framework', category: 'Backend', aliases: ['django rest framework', 'drf'] },
  { canonicalName: 'FastAPI', normalizedName: 'fastapi', category: 'Backend', aliases: ['fastapi'] },
  { canonicalName: 'Flask', normalizedName: 'flask', category: 'Backend', aliases: ['flask'] },
  { canonicalName: 'Spring Boot', normalizedName: 'spring_boot', category: 'Backend', aliases: ['spring boot', 'spring framework'] },

  // Frontend
  { canonicalName: 'React.js', normalizedName: 'react', category: 'Frontend', aliases: ['react.js', 'reactjs', 'react'] },
  { canonicalName: 'HTML', normalizedName: 'html', category: 'Frontend', aliases: ['html', 'html5'] },
  { canonicalName: 'CSS', normalizedName: 'css', category: 'Frontend', aliases: ['css', 'css3'] },
  { canonicalName: 'Next.js', normalizedName: 'next.js', category: 'Frontend', aliases: ['next.js', 'nextjs'] },
  { canonicalName: 'Angular', normalizedName: 'angular', category: 'Frontend', aliases: ['angular', 'angularjs'] },
  { canonicalName: 'Vue.js', normalizedName: 'vue.js', category: 'Frontend', aliases: ['vue.js', 'vuejs', 'vue'] },

  // Tools & Platforms
  { canonicalName: 'GitHub', normalizedName: 'github', category: 'Tool / Platform', aliases: ['github'] },
  { canonicalName: 'Git', normalizedName: 'git', category: 'Tool / Platform', aliases: ['git', 'version control'] },
  { canonicalName: 'VS Code', normalizedName: 'vs_code', category: 'Tool / Platform', aliases: ['vs code', 'vscode', 'visual studio code'] },
  { canonicalName: 'Docker', normalizedName: 'docker', category: 'DevOps / Cloud', aliases: ['docker', 'containerization'] },
  { canonicalName: 'Kubernetes', normalizedName: 'kubernetes', category: 'DevOps / Cloud', aliases: ['kubernetes', 'k8s'] },
  { canonicalName: 'AWS', normalizedName: 'aws', category: 'DevOps / Cloud', aliases: ['aws', 'amazon web services'] },

  // Data / AI
  { canonicalName: 'Pandas', normalizedName: 'pandas', category: 'Data / AI', aliases: ['pandas'] },
  { canonicalName: 'NumPy', normalizedName: 'numpy', category: 'Data / AI', aliases: ['numpy'] },
  { canonicalName: 'Power BI', normalizedName: 'power_bi', category: 'Data / AI', aliases: ['power bi', 'powerbi'] },
  { canonicalName: 'Tableau', normalizedName: 'tableau', category: 'Data / AI', aliases: ['tableau'] },
  { canonicalName: 'Machine Learning', normalizedName: 'machine_learning', category: 'Data / AI', aliases: ['machine learning', 'ml', 'ai/ml', 'scikit-learn', 'deep learning'] },

  // Domain & Vocational Skills
  { canonicalName: 'Personal Training', normalizedName: 'personal_training', category: 'Domain / General', aliases: ['personal trainer', 'personal training', 'fitness coaching'] },
  { canonicalName: 'Nutrition', normalizedName: 'nutrition', category: 'Domain / General', aliases: ['nutrition', 'diet planning'] },
  { canonicalName: 'CPR & First Aid', normalizedName: 'cpr_first_aid', category: 'Domain / General', aliases: ['cpr', 'first aid'] },
  { canonicalName: 'Sales & Client Relations', normalizedName: 'sales', category: 'Domain / General', aliases: ['sales', 'b2b sales', 'client relations'] },
  { canonicalName: 'Communication', normalizedName: 'communication', category: 'Domain / General', aliases: ['communication', 'public speaking'] }
];

const ONTOLOGY_CATEGORY_LABEL: Record<string, CanonicalSkillDef['category']> = {
  programming_language: 'Programming Language',
  database: 'Database',
  frontend: 'Frontend',
  backend: 'Backend',
  devops_cloud: 'DevOps / Cloud',
  tools: 'Tool / Platform',
  data_ai: 'Data / AI',
  domain_skill: 'Domain / General',
  soft_skill: 'Domain / General',
  general: 'Domain / General'
};

/**
 * The full canonical vocabulary: the frozen legacy set plus every ontology
 * node it does not already cover.
 *
 * IMPORTANT: this list is a *canonicalisation* vocabulary, not an extraction
 * gate. Extraction (resume_extraction.ts) is open-world and preserves terms
 * that appear nowhere in here as UNMAPPED_SKILL.
 */
export const SKILL_TAXONOMY: CanonicalSkillDef[] = (() => {
  const out = [...LEGACY_SKILL_TAXONOMY];
  const taken = new Set(out.map(d => d.normalizedName));
  const takenNames = new Set(out.map(d => d.canonicalName.toLowerCase()));

  for (const node of Object.values(SKILL_ONTOLOGY)) {
    if (taken.has(node.id) || takenNames.has(node.canonicalName.toLowerCase())) continue;
    taken.add(node.id);
    takenNames.add(node.canonicalName.toLowerCase());
    out.push({
      canonicalName: node.canonicalName,
      normalizedName: node.id,
      category: ONTOLOGY_CATEGORY_LABEL[node.category] || 'Domain / General',
      aliases: node.aliases
    });
  }
  return out;
})();

/** SKILL vs TOOL vs SOFT_SKILL etc. for a canonical name, when known. */
export function getSkillKind(normalizedOrCanonical: string) {
  const key = (normalizedOrCanonical || '').toLowerCase();
  const node =
    SKILL_ONTOLOGY[key] ||
    Object.values(SKILL_ONTOLOGY).find(n => n.canonicalName.toLowerCase() === key);
  return node ? ontologyKind(node) : 'UNKNOWN';
}

export type EvidenceClassification = 
  | 'PROJECT_DEMONSTRATED'
  | 'EXPERIENCE_DEMONSTRATED'
  | 'EXPLICIT_SKILL_LISTING'
  | 'EDUCATION_COURSEWORK'
  | 'CERTIFICATION'
  | 'INTEREST_ASPIRATION'
  | 'CURRENTLY_LEARNING'
  | 'NONE';

/**
 * Classifies the semantic context of a skill mention in the resume text.
 * Strictly guards against:
 * 1. Single-character false positives (e.g. 'C' inside 'CPR' or 'CSE').
 * 2. Interest / Aspiration statements (e.g. 'Interested in AI/ML').
 * 3. Learning statements (e.g. 'Currently learning Machine Learning').
 */
export function classifySkillMentionContext(skillName: string, rawText: string): EvidenceClassification {
  if (!rawText || rawText.trim().length === 0) return 'NONE';
  const lowerName = skillName.toLowerCase().trim();

  // Find all target terms for this skill
  const targetTerms = [lowerName];
  const taxItem = SKILL_TAXONOMY.find(t => 
    t.normalizedName === lowerName || 
    t.canonicalName.toLowerCase() === lowerName ||
    t.aliases.some(a => a.toLowerCase() === lowerName)
  );
  if (taxItem) {
    targetTerms.push(taxItem.canonicalName.toLowerCase());
    for (const a of taxItem.aliases) {
      if (!targetTerms.includes(a.toLowerCase())) {
        targetTerms.push(a.toLowerCase());
      }
    }
  }

  // Scan resume lines and track section state
  const lines = rawText.split(/\r?\n/);
  let hasProjectProof = false;
  let hasExperienceProof = false;
  let hasExplicitSkillsList = false;
  let hasCourseworkOrCert = false;
  let hasInterestOrLearning = false;

  let currentSection = 'GENERAL';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Detect section headers
    if (/^(?:technical\s+skills?|skills?|core\s+competencies|programming\s+languages?|tools\s*&?\s*technologies)\b/i.test(trimmedLine)) {
      currentSection = 'SKILLS';
    } else if (/^(?:projects?|academic\s+projects?|personal\s+projects?|key\s+projects)\b/i.test(trimmedLine)) {
      currentSection = 'PROJECTS';
    } else if (/^(?:experience|work\s+history|employment|professional\s+experience|internships?)\b/i.test(trimmedLine)) {
      currentSection = 'EXPERIENCE';
    } else if (/^(?:education|academic\s+background|qualifications?)\b/i.test(trimmedLine)) {
      currentSection = 'EDUCATION';
    } else if (/^(?:certifications?|courses?|training)\b/i.test(trimmedLine)) {
      currentSection = 'CERTIFICATIONS';
    } else if (/^(?:interests?|areas?\s+of\s+interest|hobbies)\b/i.test(trimmedLine)) {
      currentSection = 'INTERESTS';
    }

    // Check if line contains any target skill terms
    const lineContainsSkill = targetTerms.some(term => {
      if (term === 'c' || term === 'c programming' || term === 'c language') {
        return /\b(?:programming\s+languages?|languages?|technical\s+skills?|skills?|technologies)[^.\n]*\b(c)\b(?!\s*[\w#+])/i.test(trimmedLine) ||
               /\b(c)\s*,\s*(?:c\+\+|python|java|sql|javascript|html|c#)\b/i.test(trimmedLine) ||
               /\b(?:python|java|sql|javascript|c\+\+)\s*,\s*(c)\b/i.test(trimmedLine) ||
               /\b(?:c\s*programming|c\s*language|programmed\s+in\s+c)\b/i.test(trimmedLine) ||
               /\b(c)\s*\/\s*c\+\+/i.test(trimmedLine);
      }
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, 'i');
      return regex.test(trimmedLine);
    });

    if (lineContainsSkill) {
      // Check for interest or learning wording on this line
      const isInterestSentence = /(?:interested\s+in|interest\s*:\s*|interests\s*:\s*|areas?\s+of\s+interest|keen\s+to\s+learn|curious\s+about|aspiring\s+to|seeking\s+(?:a\s+)?career\s+in|seeking\s+roles\s+in|passion\s+for)\b/i.test(trimmedLine);
      const isLearningSentence = /(?:currently\s+learning|learning\s+basics\s+of|studying\s+fundamentals\s+of|beginner\s+in\s+learning|planning\s+to\s+learn)\b/i.test(trimmedLine);

      if (currentSection === 'INTERESTS' || isInterestSentence) {
        hasInterestOrLearning = true;
      } else if (isLearningSentence) {
        hasInterestOrLearning = true;
      } else if (currentSection === 'PROJECTS' || /(?:built|developed|implemented|designed|created|engineered|programmed|using|dataset|pipeline)\b/i.test(trimmedLine)) {
        hasProjectProof = true;
      } else if (currentSection === 'EXPERIENCE' || /(?:worked\s+as|employed\s+as|internship\s+at|role\s*:\s*|responsibilities)\b/i.test(trimmedLine)) {
        hasExperienceProof = true;
      } else if (currentSection === 'EDUCATION' || /(?:coursework|course|curriculum|major|degree)\b/i.test(trimmedLine)) {
        hasCourseworkOrCert = true;
      } else if (currentSection === 'CERTIFICATIONS' || /(?:certified|certification|certificate)\b/i.test(trimmedLine)) {
        hasCourseworkOrCert = true;
      } else if (currentSection === 'SKILLS' || /(?:skills?|technologies|languages?|tools)\s*[:\-]/i.test(trimmedLine)) {
        hasExplicitSkillsList = true;
      } else {
        // Line in general content that is not an interest statement
        hasExplicitSkillsList = true;
      }
    }
  }

  // Precedence of evidence: Experience > Project > Certification/Education > Explicit Skills Listing > Interest/Learning
  if (hasExperienceProof) return 'EXPERIENCE_DEMONSTRATED';
  if (hasProjectProof) return 'PROJECT_DEMONSTRATED';
  if (hasCourseworkOrCert) return 'CERTIFICATION';
  if (hasExplicitSkillsList) return 'EXPLICIT_SKILL_LISTING';
  if (hasInterestOrLearning) return 'INTEREST_ASPIRATION';

  return 'NONE';
}

/**
 * Verify whether a specific programming language or technology actually exists in the resume text
 * with verified technical evidence (not merely an interest or aspiration).
 */
export function isSkillEvidencePresent(skillName: string, rawText: string): boolean {
  if (!rawText || rawText.trim().length === 0) return false;
  const classification = classifySkillMentionContext(skillName, rawText);

  // Interest or learning alone does NOT constitute verified skill evidence
  if (
    classification === 'NONE' || 
    classification === 'INTEREST_ASPIRATION' || 
    classification === 'CURRENTLY_LEARNING'
  ) {
    return false;
  }

  return true;
}

export interface EvidenceValidationResult {
  valid: boolean;
  validated_skills: ParsedSkill[];
  rejected_claims: Array<{ skill_name: string; reason: string }>;
}

/**
 * Deterministic Evidence Validator Layer
 * Enforces NO EVIDENCE = NO CLAIM.
 * Verifies every skill against raw resume text and assigns grounded confidence & proficiency.
 */
export function validateCandidateEvidence(
  data: ParsedResumeData,
  rawResumeText: string
): EvidenceValidationResult {
  const validatedSkills: ParsedSkill[] = [];
  const rejectedClaims: Array<{ skill_name: string; reason: string }> = [];
  const seenSkills = new Set<string>();

  for (const skill of data.skills || []) {
    const rawSkillName = (skill.name || '').trim();
    if (!rawSkillName) continue;

    const classification = classifySkillMentionContext(rawSkillName, rawResumeText);

    if (
      classification === 'NONE' || 
      classification === 'INTEREST_ASPIRATION' || 
      classification === 'CURRENTLY_LEARNING'
    ) {
      rejectedClaims.push({
        skill_name: rawSkillName,
        reason: classification === 'INTEREST_ASPIRATION'
          ? `Skill '${rawSkillName}' is mentioned only as an interest or career aspiration ('Interested in ...'), which does not constitute verified technical skill proficiency.`
          : classification === 'CURRENTLY_LEARNING'
          ? `Skill '${rawSkillName}' is mentioned only as currently learning or aspiring, which is not verified proficiency.`
          : `Technical skill '${rawSkillName}' is not explicitly named in resume text.`
      });
      continue; // REJECT CLAIM
    }

    // Match to taxonomy for canonical display and normalization
    const taxMatch = SKILL_TAXONOMY.find(t => 
      t.aliases.some(a => a.toLowerCase() === rawSkillName.toLowerCase()) ||
      t.canonicalName.toLowerCase() === rawSkillName.toLowerCase() ||
      t.normalizedName === (skill.normalized_name || '').toLowerCase()
    );

    const canonicalName = taxMatch ? taxMatch.canonicalName : rawSkillName;
    const normalizedName = taxMatch ? taxMatch.normalizedName : rawSkillName.toLowerCase().replace(/\s+/g, '_');

    if (seenSkills.has(normalizedName)) {
      continue; // Prevent duplicates
    }
    seenSkills.add(normalizedName);

    // Context-Aware Confidence & Provenance
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    let provenanceSource = 'Explicit Skills Listing';
    let proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';

    if (classification === 'EXPERIENCE_DEMONSTRATED') {
      confidence = 'HIGH';
      provenanceSource = 'Workplace Experience';
      proficiencyLevel = 'advanced';
    } else if (classification === 'PROJECT_DEMONSTRATED') {
      confidence = 'HIGH';
      provenanceSource = 'Project Implementation';
      proficiencyLevel = 'intermediate';
    } else if (classification === 'CERTIFICATION' || classification === 'EDUCATION_COURSEWORK') {
      confidence = 'HIGH';
      provenanceSource = 'Certification & Coursework';
      proficiencyLevel = 'intermediate';
    } else if (classification === 'EXPLICIT_SKILL_LISTING') {
      // Explicitly listed in technical skills section
      confidence = 'HIGH';
      provenanceSource = 'Technical Skills Listing';
      proficiencyLevel = 'intermediate';
    }

    // Evidence DEPTH is a separate axis from extraction confidence: a skill can
    // be read off the resume with certainty and still only be MENTIONED.
    const evidenceStrength: EvidenceStrength =
      classification === 'EXPERIENCE_DEMONSTRATED' ? 'VERIFIED_HIGH'
      : classification === 'PROJECT_DEMONSTRATED' ? 'VERIFIED_MEDIUM'
      : classification === 'CERTIFICATION' || classification === 'EDUCATION_COURSEWORK' ? 'VERIFIED_BASIC'
      : 'MENTIONED';

    validatedSkills.push({
      name: canonicalName,
      normalized_name: normalizedName,
      proficiency_level: classification === 'EXPERIENCE_DEMONSTRATED' ? 'advanced' : (skill.proficiency_level || proficiencyLevel),
      provenance_source: provenanceSource,
      // Prefer the verbatim resume snippet the caller supplied over a generic
      // restatement -- original wording must stay traceable.
      provenance_context: skill.provenance_context || `Verified via ${provenanceSource.toLowerCase()} in resume.`,
      extraction_confidence: confidence,
      source_evidence: skill.source_evidence || `Explicitly evidenced under ${provenanceSource}.`,
      original_term: skill.original_term || rawSkillName,
      canonical_term: canonicalName,
      normalization_reason:
        canonicalName.toLowerCase() === rawSkillName.toLowerCase()
          ? 'Exact canonical match'
          : `Alias of canonical skill '${canonicalName}'`,
      skill_kind: skill.skill_kind || getSkillKind(normalizedName),
      evidence_strength: skill.evidence_strength || evidenceStrength,
      is_unmapped: !taxMatch,
      evidence_origin: 'RESUME'
    });
  }

  return {
    valid: rejectedClaims.length === 0,
    validated_skills: validatedSkills,
    rejected_claims: rejectedClaims
  };
}
