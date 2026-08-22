import { describe, it, expect } from 'vitest';
import { 
  isSkillEvidencePresent, 
  classifySkillMentionContext, 
  validateCandidateEvidence 
} from './evidence_validator';
import { fallbackResumeParser } from './resume_parser';
import { ParsedResumeData } from '../types';

describe('Evidence Grounding & Context-Aware Skill Extraction Suite (NO EVIDENCE = NO CLAIM)', () => {

  it('TEST A: "Interested in Machine Learning." -> Machine Learning is NOT a verified skill', () => {
    const text = 'Aarav Mehta\nSummary: Passionate student. Interested in Machine Learning.\nEducation: B.Tech in CSE';
    const classification = classifySkillMentionContext('Machine Learning', text);

    expect(classification).toBe('INTEREST_ASPIRATION');
    expect(isSkillEvidencePresent('Machine Learning', text)).toBe(false);
  });

  it('TEST B: "Interested in AI/ML." -> Machine Learning is NOT a verified skill', () => {
    const text = 'Aarav Mehta\nSummary: Interested in Data Analytics, Software Development, and AI/ML.\nEducation: B.Tech in CSE';
    const classification = classifySkillMentionContext('Machine Learning', text);

    expect(classification).toBe('INTEREST_ASPIRATION');
    expect(isSkillEvidencePresent('Machine Learning', text)).toBe(false);

    const mockData: ParsedResumeData = {
      full_name: 'Aarav Mehta',
      email: 'aarav@example.com',
      summary: 'Interested in Data Analytics, Software Development, and AI/ML',
      desired_role_title: 'Student',
      skills: [
        {
          name: 'Machine Learning',
          normalized_name: 'machine_learning',
          proficiency_level: 'intermediate',
          provenance_source: 'Summary',
          provenance_context: 'Mentioned in summary section',
          extraction_confidence: 'HIGH',
          source_evidence: 'Interested in AI/ML'
        }
      ],
      projects: [],
      experiences: []
    };

    const valResult = validateCandidateEvidence(mockData, text);
    expect(valResult.validated_skills.map(s => s.name)).not.toContain('Machine Learning');
    expect(valResult.rejected_claims.some(r => r.skill_name === 'Machine Learning')).toBe(true);
  });

  it('TEST C: "Currently learning Machine Learning." -> Machine Learning is NOT treated as demonstrated skill evidence', () => {
    const text = 'Aarav Mehta\nNotes: Currently learning Machine Learning and Cloud Computing.';
    const classification = classifySkillMentionContext('Machine Learning', text);

    expect(classification).toBe('INTEREST_ASPIRATION');
    expect(isSkillEvidencePresent('Machine Learning', text)).toBe(false);
  });

  it('TEST D: "Seeking a career in Machine Learning." -> Machine Learning is NOT a verified skill', () => {
    const text = 'Aarav Mehta\nCareer Goal: Seeking a career in Machine Learning and Data Science.';
    const classification = classifySkillMentionContext('Machine Learning', text);

    expect(classification).toBe('INTEREST_ASPIRATION');
    expect(isSkillEvidencePresent('Machine Learning', text)).toBe(false);
  });

  it('TEST E: "Skills: Python, SQL" -> Python & SQL detected as explicit claims with provenance', () => {
    const text = 'Aarav Mehta\nTechnical Skills: Python, SQL, HTML, CSS\nEducation: B.Tech';
    
    expect(isSkillEvidencePresent('Python', text)).toBe(true);
    expect(isSkillEvidencePresent('SQL', text)).toBe(true);

    const parsed = fallbackResumeParser(text);
    const pythonSkill = parsed.skills.find(s => s.name === 'Python');
    const sqlSkill = parsed.skills.find(s => s.name === 'SQL');

    expect(pythonSkill).toBeDefined();
    expect(sqlSkill).toBeDefined();
    expect(pythonSkill?.provenance_source).toContain('Skills');
    expect(pythonSkill?.extraction_confidence).toBeDefined();
  });

  it('TEST F: "Built a machine learning model using Python and scikit-learn." -> Project demonstrated evidence with HIGH confidence', () => {
    const text = 'Aarav Mehta\nProjects:\nAI Predictor: Built a machine learning model using Python and scikit-learn for dataset classification.';
    const classification = classifySkillMentionContext('Machine Learning', text);

    expect(classification).toBe('PROJECT_DEMONSTRATED');
    expect(isSkillEvidencePresent('Machine Learning', text)).toBe(true);

    const mockData: ParsedResumeData = {
      full_name: 'Aarav Mehta',
      email: 'aarav@example.com',
      summary: 'Data enthusiast',
      desired_role_title: 'Developer',
      skills: [
        {
          name: 'Machine Learning',
          normalized_name: 'machine_learning',
          proficiency_level: 'intermediate',
          provenance_source: 'Project',
          provenance_context: 'Mentioned in project section',
          extraction_confidence: 'HIGH',
          source_evidence: 'Built a machine learning model'
        }
      ],
      projects: [],
      experiences: []
    };

    const valResult = validateCandidateEvidence(mockData, text);
    const mlSkill = valResult.validated_skills.find(s => s.name === 'Machine Learning');
    expect(mlSkill).toBeDefined();
    expect(mlSkill?.extraction_confidence).toBe('HIGH');
    expect(mlSkill?.provenance_source).toBe('Project Implementation');
  });

  it('TEST G: "Worked as a Machine Learning Engineer for 2 years." -> Workplace experience evidence with advanced proficiency', () => {
    const text = 'Aarav Mehta\nExperience:\nTech Solutions - Machine Learning Engineer (2024-Present)\nDeveloped production ML pipelines.';
    const classification = classifySkillMentionContext('Machine Learning', text);

    expect(classification).toBe('EXPERIENCE_DEMONSTRATED');

    const mockData: ParsedResumeData = {
      full_name: 'Aarav Mehta',
      email: 'aarav@example.com',
      summary: 'Engineer',
      desired_role_title: 'ML Engineer',
      skills: [
        {
          name: 'Machine Learning',
          normalized_name: 'machine_learning',
          proficiency_level: 'intermediate',
          provenance_source: 'Workplace Experience',
          provenance_context: 'Listed in experience section',
          extraction_confidence: 'HIGH',
          source_evidence: 'Worked as ML Engineer'
        }
      ],
      projects: [],
      experiences: []
    };

    const valResult = validateCandidateEvidence(mockData, text);
    const mlSkill = valResult.validated_skills.find(s => s.name === 'Machine Learning');
    expect(mlSkill).toBeDefined();
    expect(mlSkill?.extraction_confidence).toBe('HIGH');
    expect(mlSkill?.proficiency_level).toBe('advanced');
    expect(mlSkill?.provenance_source).toBe('Workplace Experience');
  });

  it('TEST H: Project extraction strictly preserves grounded description without invented features', () => {
    const aaravResumeText = `Aarav Mehta
Email: aarav@example.com
Education: Bachelor of Technology in Computer Science
Skills: Python, SQL, Git, GitHub
Interested in Data Analytics, Software Development, and AI/ML.

Projects:
Expense Tracker
Built a Python application for recording and categorizing expenses.
Used CSV files for data storage.
Implemented basic filtering and summary calculations.`;

    const parsed = fallbackResumeParser(aaravResumeText);

    // 1. Check verified skills: Python, SQL, Git, GitHub are present
    const skillNames = parsed.skills.map(s => s.name);
    expect(skillNames).toContain('Python');
    expect(skillNames).toContain('SQL');
    expect(skillNames).toContain('Git');
    expect(skillNames).toContain('GitHub');

    // 2. Machine Learning MUST NOT be present because it was only an interest
    expect(skillNames).not.toContain('Machine Learning');

    // 3. Project description must be grounded in text
    const expenseProject = parsed.projects.find(p => p.title.toLowerCase().includes('expense tracker'));
    expect(expenseProject).toBeDefined();
    expect(expenseProject?.description).toContain('Used CSV files for data storage');
    expect(expenseProject?.description).not.toContain('budget alerts');
    expect(expenseProject?.description).not.toContain('terminal-based');
    expect(expenseProject?.tech_stack).not.toContain('Docker');
    expect(expenseProject?.tech_stack).toContain('Python');
    expect(expenseProject?.tech_stack).toContain('CSV');
  });

  it('TEST I: Multi-project extraction extracts ALL 3 projects for Aarav Mehta demo resume', () => {
    const multiProjectText = `Aarav Mehta
Email: aarav@example.com
Education: B.Tech in Computer Science
Skills: Python, SQL, HTML, CSS, Git, GitHub, Pandas
Interested in Data Analytics, Software Development, and AI/ML.

Projects:
Expense Tracker
- Built a Python application for recording and categorizing expenses.
- Used CSV files for data storage.
- Implemented basic filtering and summary calculations.

Student Performance Analysis
- Analyzed student exam score datasets using Python and Pandas.
- Computed subject-wise averages and attendance correlations.
- Exported summary findings to structured CSV reports.

Personal Portfolio Website
- Developed a responsive personal portfolio using HTML and CSS.
- Hosted on GitHub Pages with project showcase links.`;

    const parsed = fallbackResumeParser(multiProjectText);

    // All 3 projects must be extracted
    expect(parsed.projects.length).toBe(3);

    const p1 = parsed.projects.find(p => p.title.toLowerCase().includes('expense tracker'));
    const p2 = parsed.projects.find(p => p.title.toLowerCase().includes('student performance'));
    const p3 = parsed.projects.find(p => p.title.toLowerCase().includes('personal portfolio') || p.title.toLowerCase().includes('portfolio'));

    expect(p1).toBeDefined();
    expect(p2).toBeDefined();
    expect(p3).toBeDefined();

    expect(p1?.tech_stack).toContain('Python');
    expect(p1?.tech_stack).toContain('CSV');

    expect(p2?.tech_stack).toContain('Python');
    expect(p2?.tech_stack).toContain('Pandas');

    expect(p3?.tech_stack).toContain('HTML');
    expect(p3?.tech_stack).toContain('CSS');
    expect(p3?.tech_stack).toContain('GitHub');
  });

  it('TEST J: Extracts projects with inline colon format and custom header (e.g. ACADEMIC PROJECTS)', () => {
    const customHeaderText = `Candidate Name
Email: candidate@test.com
ACADEMIC PROJECTS
Student Performance Analysis: Analyzed student exam score datasets using Python and Pandas to extract grade distributions.
Expense Tracker: Developed a Python expense tracking tool storing data in CSV and SQLite.
EDUCATION
B.Tech in Information Technology`;

    const parsed = fallbackResumeParser(customHeaderText);
    expect(parsed.projects.length).toBe(2);

    const spa = parsed.projects.find(p => p.title.toLowerCase().includes('student performance'));
    expect(spa).toBeDefined();
    expect(spa?.description).toContain('Analyzed student exam score datasets');
    expect(spa?.tech_stack).toContain('Python');
    expect(spa?.tech_stack).toContain('Pandas');
  });

  it('TEST K: Global project scanner fallback when resume lacks standard header', () => {
    const unformattedText = `John Doe
Summary: Software developer with portfolio work.
Student Performance Analysis - Analyzed student performance scores and exam metrics with Python, Pandas, and Matplotlib.
Expense Tracker - Built a personal expense tracker application in Python.`;

    const parsed = fallbackResumeParser(unformattedText);
    expect(parsed.projects.length).toBeGreaterThanOrEqual(1);
    const spa = parsed.projects.find(p => p.title.toLowerCase().includes('student performance'));
    expect(spa).toBeDefined();
  });

});
