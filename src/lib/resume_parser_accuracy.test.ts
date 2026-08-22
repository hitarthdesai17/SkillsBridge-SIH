import { describe, it, expect } from 'vitest';
import { fallbackResumeParser, isValidResumeContent } from './resume_parser';
import { validateCandidateEvidence, isSkillEvidencePresent } from './evidence_validator';

describe('Phase 5: Precision Resume Skill Extraction & Accuracy Engine', () => {

  describe('Jenisha FullStack Developer Resume Ground-Truth Verification', () => {
    const jenishaResumeText = `
Jenisha
Full Stack Developer
Email: jenisha@example.com

SKILLS:
Node.js, Express.js, React.js, JavaScript, HTML, CSS, Django, Django REST Framework, Java, Python, MongoDB, MySQL, PostgreSQL, GitHub, VS Code

CORE KNOWLEDGE:
Database Management Systems, Object Oriented Programming, RESTful APIs

PROJECTS:
1. PantryPal - Smart Pantry & Recipe Manager
Built full-stack application using React.js, Django REST Framework, and Python.
Designed relational database schemas in PostgreSQL.

2. Inventory Pro - Retail Management System
Integrated JDBC with a MySQL database and Java backend.
Managed relational queries and automated daily reporting.

3. HealthPulse - Patient Record Tracking
Developed microservices with Node.js and Express.js using MongoDB for document storage.
`;

    it('TEST-ACC-01: Extracts all explicitly listed technologies for Jenisha resume', () => {
      const parsed = fallbackResumeParser(jenishaResumeText);
      const skillNames = parsed.skills.map(s => s.name);

      // Databases
      expect(skillNames).toContain('MySQL');
      expect(skillNames).toContain('PostgreSQL');
      expect(skillNames).toContain('MongoDB');
      expect(skillNames).toContain('Database Management Systems');
      expect(skillNames).toContain('JDBC');

      // Programming Languages
      expect(skillNames).toContain('Java');
      expect(skillNames).toContain('Python');
      expect(skillNames).toContain('JavaScript');

      // Frameworks & Web
      expect(skillNames).toContain('Node.js');
      expect(skillNames).toContain('Express.js');
      expect(skillNames).toContain('React.js');
      expect(skillNames).toContain('Django');
      expect(skillNames).toContain('Django REST Framework');
      expect(skillNames).toContain('HTML');
      expect(skillNames).toContain('CSS');

      // Tools
      expect(skillNames).toContain('GitHub');
      expect(skillNames).toContain('VS Code');
    });

    it('TEST-ACC-02: CRITICAL - Ensures "C" programming language is NOT extracted', () => {
      const parsed = fallbackResumeParser(jenishaResumeText);
      const skillNames = parsed.skills.map(s => s.name);
      const normalizedNames = parsed.skills.map(s => s.normalized_name);

      expect(skillNames).not.toContain('C');
      expect(skillNames).not.toContain('C Programming');
      expect(normalizedNames).not.toContain('c');
    });

    it('TEST-ACC-03: Every extracted skill contains valid provenance evidence', () => {
      const parsed = fallbackResumeParser(jenishaResumeText);
      for (const skill of parsed.skills) {
        expect(skill.source_evidence).toBeTruthy();
        expect(skill.provenance_source).toBeTruthy();
        expect(skill.extraction_confidence).toBe('HIGH');
      }
    });
  });

  describe('Isolated Test Cases for Inference Prevention', () => {

    it('CASE 1: "Python developer with experience in Django." -> Only Python & Django', () => {
      const text = 'Python developer with experience in Django.';
      const parsed = fallbackResumeParser(text);
      const names = parsed.skills.map(s => s.name);

      expect(names).toContain('Python');
      expect(names).toContain('Django');
      expect(names).not.toContain('Java');
      expect(names).not.toContain('C');
      expect(names).not.toContain('C++');
      expect(names).not.toContain('Flask');
      expect(names).not.toContain('FastAPI');
    });

    it('CASE 2: "Built application using Java and MySQL." -> Only Java & MySQL', () => {
      const text = 'Built application using Java and MySQL.';
      const parsed = fallbackResumeParser(text);
      const names = parsed.skills.map(s => s.name);

      expect(names).toContain('Java');
      expect(names).toContain('MySQL');
      expect(names).not.toContain('C');
      expect(names).not.toContain('PostgreSQL');
      expect(names).not.toContain('Oracle Database');
    });

    it('CASE 3: "Computer Science Engineering student." -> Does NOT extract C programming', () => {
      const text = 'Computer Science Engineering student at Institute of Technology.';
      const parsed = fallbackResumeParser(text);
      const names = parsed.skills.map(s => s.name);

      expect(names).not.toContain('C');
      expect(names).not.toContain('C Programming');
    });

    it('CASE 4: "Programming Languages: C, C++, Python." -> Accurately extracts C, C++, and Python', () => {
      const text = 'Programming Languages: C, C++, Python.';
      const parsed = fallbackResumeParser(text);
      const names = parsed.skills.map(s => s.name);

      expect(names).toContain('C Programming');
      expect(names).toContain('C++');
      expect(names).toContain('Python');
    });

    it('CASE 5: "Database: MySQL, PostgreSQL, MongoDB." -> Extracts all 3 databases', () => {
      const text = 'Database: MySQL, PostgreSQL, MongoDB.';
      const parsed = fallbackResumeParser(text);
      const names = parsed.skills.map(s => s.name);

      expect(names).toContain('MySQL');
      expect(names).toContain('PostgreSQL');
      expect(names).toContain('MongoDB');
    });

    it('CASE 6: "Used JDBC to connect Java application with MySQL." -> Extracts Java, JDBC, MySQL without unsupported databases', () => {
      const text = 'Used JDBC to connect Java application with MySQL.';
      const parsed = fallbackResumeParser(text);
      const names = parsed.skills.map(s => s.name);

      expect(names).toContain('Java');
      expect(names).toContain('JDBC');
      expect(names).toContain('MySQL');
      expect(names).not.toContain('PostgreSQL');
      expect(names).not.toContain('Oracle Database');
      expect(names).not.toContain('C++');
    });

  });

  describe('Single-Character Skill Protection Function (isSkillEvidencePresent)', () => {
    it('Rejects "C" from words containing letter C or initials', () => {
      expect(isSkillEvidencePresent('C', 'Jenisha C. - Software Engineer')).toBe(false);
      expect(isSkillEvidencePresent('C', 'Bachelor of Computer Science (CSE)')).toBe(false);
      expect(isSkillEvidencePresent('C', 'Grade C in Chemistry')).toBe(false);
      expect(isSkillEvidencePresent('C', 'Section C, Building 4')).toBe(false);
    });

    it('Accepts "C" when explicitly listed as a programming language', () => {
      expect(isSkillEvidencePresent('C', 'Languages: C, C++, Java')).toBe(true);
      expect(isSkillEvidencePresent('C', 'Technical Skills: Python, C, Java')).toBe(true);
      expect(isSkillEvidencePresent('C', 'Proficient in C programming and data structures')).toBe(true);
      expect(isSkillEvidencePresent('C', 'C/C++ developer')).toBe(true);
    });
  });

  describe('Non-Resume Document Rejection (isValidResumeContent)', () => {
    it('Accepts valid candidate resumes with skills, education, or experience', () => {
      const validResume = `
Alex Rivers
alex@example.com
Education: Bachelor of Computer Science
Skills: Python, SQL, PostgreSQL
Experience: Software Developer Intern at Apex Labs (6 months)
Projects: Built full-stack sales analytics dashboard
`;
      const res = isValidResumeContent(validResume);
      expect(res.isValid).toBe(true);
    });

    it('Rejects non-resume documents such as invoices, stories, and receipts', () => {
      const invoiceText = `
INVOICE #INV-2026-0899
Date: 2026-08-19
Billed to: Acme Corporation, 100 Main Street
Items:
1. Cloud Server Hosting (August) - $150.00
2. Domain Name Renewal - $25.00
Total Amount Due: $175.00
Payment due within 30 days via wire transfer.
`;
      const resInvoice = isValidResumeContent(invoiceText);
      expect(resInvoice.isValid).toBe(false);
      expect(resInvoice.reason).toContain('Please upload a valid resume');

      const randomStory = `
Once upon a time in a small village surrounded by mountains, there lived an old clockmaker.
He spent his days repairing antique watches and clocks of all shapes and sizes.
The villagers often visited his shop to hear stories about far-off lands and mysterious adventures.
`;
      const resStory = isValidResumeContent(randomStory);
      expect(resStory.isValid).toBe(false);
      expect(resStory.reason).toContain('Please upload a valid resume');
    });
  });

});
