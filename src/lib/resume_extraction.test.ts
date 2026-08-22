import { describe, it, expect } from 'vitest';
import { fallbackResumeParser, ParsedResumeData } from './resume_parser';
import {
  extractResumeEvidence,
  segmentResume,
  splitListingTerms,
  splitLevelQualifier,
  isPlausibleSkillTerm
} from './resume_extraction';
import { calculateOpportunityReadiness } from './readiness_engine';
import { normalizeToCandidateProfile } from './candidate_service';
import { Opportunity } from '../types';

// ============================================================
// FIXTURES -- deliberately spread across industries, career
// levels, and formatting conventions. None of them is a
// software resume unless labelled as one.
// ============================================================

const BUSINESS_OPS_RESUME = `Priya Nair
priya.nair@example.com | +91 98765 43210 | Pune, India
Operations & Marketing Executive

PROFESSIONAL SUMMARY
Operations and marketing professional with 4 years of experience running customer
success and campaign reporting for a mid-market SaaS business.

WORK EXPERIENCE
Operations Executive - BrightWave Solutions (Mar 2022 - Present)
- Managed customer accounts across 3 regions and prepared weekly KPI reports for leadership.
- Coordinated sales teams during quarterly pushes and tracked campaign performance in HubSpot.
- Redesigned the onboarding workflow, reducing average setup time by 30%.

Marketing Associate - Nexa Retail (Jun 2020 - Feb 2022)
- Planned and scheduled content across social media channels.
- Ran email marketing campaigns to a 40,000 subscriber list.

PROJECTS
Customer Retention Dashboard
- Built an Excel dashboard segmenting customers by repeat purchase behaviour.
- Tracked retention cohorts monthly and presented findings to the leadership team.

SKILLS
Business: Operations Management, Process Improvement, Customer Success, Sales Coordination, Stakeholder Management
Analytics: Microsoft Excel, Google Sheets, KPI Reporting, Data Cleaning, Basic Business Analytics
Marketing: Digital Marketing, Content Planning, Email Marketing, Social Media, Campaign Tracking, SEO Fundamentals
Tools: HubSpot CRM, Google Analytics, Canva, Microsoft PowerPoint, Notion, Trello
Soft Skills: Communication, Problem Solving, Team Collaboration, Time Management, Presentation

EDUCATION
Bachelor of Business Administration in Marketing, Symbiosis University, 2017-2020

CERTIFICATIONS
Google Analytics Individual Qualification - Google, 2023
HubSpot Inbound Marketing Certified - HubSpot Academy, 2022
`;

const DATA_ANALYST_RESUME = `Rahul Verma
rahul.verma@example.com
Data Analyst

TECHNICAL SKILLS
Languages: Python, SQL, R
Libraries: Pandas, NumPy, Matplotlib
BI Tools: Power BI, Tableau, Looker Studio
Databases: PostgreSQL, MySQL
Concepts: Data Cleaning, Statistical Analysis, Forecasting, ETL

EXPERIENCE
Data Analyst | FinEdge Analytics | Jan 2023 - Present
- Built ETL pipelines in Python to consolidate transaction data from 6 sources.
- Developed Power BI dashboards tracking monthly revenue and churn.

EDUCATION
M.Sc in Statistics, Delhi University, 2020-2022
`;

const SOFTWARE_DEV_RESUME = `Ananya Iyer
ananya.iyer@example.com
Full Stack Developer

SKILLS
JavaScript, TypeScript, React.js, Node.js, Express.js, MongoDB, PostgreSQL, Docker, Git, GitHub, REST APIs

PROFESSIONAL EXPERIENCE
Software Engineer - CloudNine Labs - Aug 2021 - Present
- Developed microservices with Node.js and Express.js backed by MongoDB.
- Containerized services with Docker and deployed to AWS.

PROJECTS
TaskFlow: Built a React.js and Node.js task manager with PostgreSQL persistence.

EDUCATION
B.Tech in Computer Science, VIT, 2017-2021
`;

const SALES_RESUME = `Vikram Singh
vikram.singh@example.com
Senior Sales Professional

CORE COMPETENCIES
B2B Sales, Lead Generation, Negotiation, Account Management, Territory Planning, Salesforce, Cold Calling

EXPERIENCE
Regional Sales Manager at Orion Industrial (2019 - 2024)
- Managed a territory of 60 accounts and exceeded quota for 4 consecutive years.
- Negotiated annual supply contracts with distributors.

EDUCATION
MBA in Marketing, IIM Indore, 2017-2019
`;

const HR_RESUME = `Meera Joshi
meera.joshi@example.com
HR Generalist

KEY SKILLS
Recruitment, Talent Acquisition, Employee Onboarding, HR Operations, Performance Management, Employee Engagement, Payroll, Applicant Tracking System

WORK EXPERIENCE
HR Executive | Talentra Consulting | Feb 2021 - Present
- Handled end-to-end recruitment for engineering and sales roles.
- Administered payroll for 180 employees and maintained employee records.

EDUCATION
MBA in Human Resources, Pune University, 2019-2021
`;

const ACCOUNTANT_RESUME = `Suresh Menon
suresh.menon@example.com
Accountant

TECHNICAL SKILLS
Tally ERP, QuickBooks, Microsoft Excel, GST Filing, TDS, Accounts Payable, Accounts Receivable, Bank Reconciliation, Financial Reporting

EXPERIENCE
Senior Accountant - Menon & Associates - Apr 2018 - Present
- Prepared monthly financial statements and managed statutory audit support.
- Filed GST returns for 25 client entities.

EDUCATION
B.Com in Accounting, Kerala University, 2014-2017

CERTIFICATIONS
Tally Certified Professional - Tally Education, 2019
`;

const HEALTHCARE_RESUME = `Sister Anjali Thomas
anjali.thomas@example.com
Registered Nurse

CLINICAL SKILLS
Patient Care, Vital Signs Monitoring, Medication Administration, Phlebotomy, Infection Control, Electronic Health Records, Triage

PROFESSIONAL EXPERIENCE
Staff Nurse | Apollo Hospital | Jun 2019 - Present
- Provided bedside care for a 24-bed medical ward.
- Administered medication and maintained clinical documentation for all admissions.

EDUCATION
B.Sc in Nursing, Manipal University, 2015-2019

CERTIFICATIONS
Basic Life Support (BLS) Certified - American Heart Association, 2022
`;

const DESIGNER_RESUME = `Kabir Sharma
kabir.sharma@example.com
Product Designer

SKILLS
Tools: Figma, Adobe Photoshop, Adobe Illustrator, Canva
Design: UI/UX Design, Wireframing, Prototyping, User Research, Typography
Soft Skills: Communication, Creativity, Team Collaboration

EXPERIENCE
Product Designer - Loom Studio - Sep 2020 - Present
- Designed end-to-end user flows and prototyped them in Figma.
- Ran usability testing sessions with 40 participants.

EDUCATION
Bachelor of Design in Communication Design, NID, 2016-2020
`;

const UPSC_RESUME = `Aditya Rao
aditya.rao@example.com
Civil Services Aspirant

AREAS OF PREPARATION
Indian Polity, Current Affairs, Public Policy, CSAT, Answer Writing, Essay Writing

EDUCATION
B.A in Political Science, Delhi University, 2018-2021

ACHIEVEMENTS
Cleared UPSC Civil Services Prelims 2023

INTERESTS
Interested in Machine Learning and Data Science
`;

const FRESHER_RESUME = `Nikhil Gupta
nikhil.gupta@example.com
B.Tech Student

TECHNICAL SKILLS
Python, SQL, HTML, CSS, Git, GitHub

PROJECTS
Expense Tracker
- Built a Python application for recording and categorizing expenses.
- Used CSV files for data storage.

Student Performance Analysis
- Analyzed student exam score datasets using Python and Pandas.

EDUCATION
B.Tech in Information Technology, NIT Trichy, 2021-2025
`;

// Skills exist ONLY inside the experience prose -- no skills section at all.
const SKILLS_IN_EXPERIENCE_RESUME = `Fatima Khan
fatima.khan@example.com
Operations Lead

WORK EXPERIENCE
Operations Lead - Harbour Logistics - Jan 2017 - Present
- Led warehouse management and inventory control for a 40,000 sq ft facility.
- Implemented process improvement initiatives that cut dispatch errors by 22%.
- Prepared weekly KPI reports and managed vendor management relationships.
- Built forecasting models in Microsoft Excel to plan seasonal staffing.

EDUCATION
Bachelor of Commerce, Mumbai University, 2012-2015
`;

// Non-standard layout: no recognisable section headers, pipe-delimited.
const UNUSUAL_FORMAT_RESUME = `DANIEL OKAFOR // daniel.okafor@example.com // Lagos

Profile: Logistics coordinator, six years moving freight across West Africa.

Capabilities: Supply Chain Management | Route Planning | Customs Clearance | Inventory Management | Microsoft Excel

Where I've worked: Logistics Coordinator at TransAfrica Freight (2018 - 2024)
Handled customs clearance documentation and coordinated route planning for 30 vehicles.

Schooling: Higher National Diploma in Transport Management, Lagos Polytechnic, 2014-2017
`;

// Tools that intentionally do NOT exist in the ontology.
const UNKNOWN_TOOLS_RESUME = `Lena Fischer
lena.fischer@example.com
Support Operations Specialist

SKILLS
Tools: Zendesk Sunshine, Odoo ERP, Plutio, Gorgias, Microsoft Excel
Business: Customer Service, Process Improvement

EXPERIENCE
Support Lead - Vermont Goods - Mar 2020 - Present
- Managed the support queue and reduced first response time by 40%.

EDUCATION
Bachelor of Arts in Communication, Free University Berlin, 2015-2018
`;

const MARKETING_EXEC_RESUME = `Carla Mendes
carla.mendes@example.com
Marketing Executive

SKILLS
SEO, Search Engine Marketing, Google Ads, Email Marketing, Brand Management, Market Research, Mailchimp, Canva

EXPERIENCE
Marketing Executive | Verde Foods | May 2021 - Present
- Launched paid search campaigns and tracked campaign performance weekly.
- Managed brand identity refresh across packaging and social channels.

EDUCATION
Bachelor of Arts in Advertising, University of Lisbon, 2017-2021
`;

const OPS_MANAGER_RESUME = `Thomas Reed
thomas.reed@example.com
Operations Manager

AREAS OF EXPERTISE
Operations Management, Lean Six Sigma, Production Planning, Preventive Maintenance, Quality Assurance, Vendor Management, Budgeting

PROFESSIONAL EXPERIENCE
Operations Manager - Redwood Manufacturing - 2015 - Present
- Led lean six sigma projects that reduced scrap rate by 18%.
- Owned the annual operating budget of $4.2M.

EDUCATION
Bachelor of Engineering in Mechanical Engineering, Purdue University, 2009-2013
`;

function names(p: ParsedResumeData): string[] {
  return p.skills.map(s => s.name);
}
function originals(p: ParsedResumeData): string[] {
  return p.skills.map(s => s.original_term || s.name);
}

// ============================================================
// REGRESSION: the resume that collapsed to two skills
// ============================================================

describe('REGRESSION: rich business/marketing resume must not collapse', () => {
  const parsed = fallbackResumeParser(BUSINESS_OPS_RESUME);

  it('extracts evidence for every explicitly listed capability', () => {
    const expected = [
      'Operations Management',
      'Process Improvement',
      'Customer Success',
      'Sales Coordination',
      'Stakeholder Management',
      'Microsoft Excel',
      'Google Sheets',
      'KPI Reporting',
      'Data Cleaning',
      'Business Analytics',
      'Digital Marketing',
      'Content Planning',
      'Email Marketing',
      'Social Media Marketing',
      'Campaign Tracking',
      'Search Engine Optimization',
      'HubSpot CRM',
      'Google Analytics',
      'Canva',
      'Microsoft PowerPoint',
      'Notion',
      'Trello',
      'Communication',
      'Problem Solving',
      'Team Collaboration',
      'Time Management',
      'Presentation'
    ];

    const extracted = names(parsed);
    const missing = expected.filter(e => !extracted.includes(e));
    expect(missing).toEqual([]);
    // The old pipeline produced exactly 2. Anything near that is a regression.
    expect(parsed.skills.length).toBeGreaterThanOrEqual(27);
  });

  it('preserves the exact resume wording alongside the canonical name', () => {
    const seo = parsed.skills.find(s => s.name === 'Search Engine Optimization');
    expect(seo?.original_term).toBe('SEO Fundamentals');
    expect(seo?.level_qualifier).toBe('FUNDAMENTALS');

    const analytics = parsed.skills.find(s => s.name === 'Business Analytics');
    expect(analytics?.original_term).toBe('Basic Business Analytics');
    expect(analytics?.level_qualifier).toBe('BASIC');

    // Every skill keeps a verbatim quote from the resume.
    for (const skill of parsed.skills) {
      expect(skill.provenance_context.length).toBeGreaterThan(0);
      expect(BUSINESS_OPS_RESUME).toContain(skill.provenance_context);
    }
  });

  it('does not flatten specific skills into broad ones', () => {
    // Excel must stay Excel, not become "Data Analytics".
    expect(names(parsed)).toContain('Microsoft Excel');
    // HubSpot must stay HubSpot, not become "Sales & Client Relations".
    expect(names(parsed)).toContain('HubSpot CRM');
    expect(names(parsed)).not.toContain('Sales & Client Relations');
    // SEO Fundamentals must not be reported as advanced SEO.
    const seo = parsed.skills.find(s => s.name === 'Search Engine Optimization');
    expect(seo?.proficiency_level).toBe('beginner');
  });

  it('classifies tools, platforms, domain capabilities and soft skills separately', () => {
    const kind = (n: string) => parsed.skills.find(s => s.name === n)?.skill_kind;
    expect(kind('Microsoft Excel')).toBe('TOOL');
    expect(kind('HubSpot CRM')).toBe('PLATFORM');
    expect(kind('Process Improvement')).toBe('METHODOLOGY');
    expect(kind('Customer Success')).toBe('DOMAIN_KNOWLEDGE');
    expect(kind('Communication')).toBe('SOFT_SKILL');
  });

  it('grades evidence strength rather than marking everything HIGH', () => {
    const strength = (n: string) => parsed.skills.find(s => s.name === n)?.evidence_strength;
    // Demonstrated in employment.
    expect(strength('Sales Coordination')).toBe('VERIFIED_HIGH');
    expect(strength('Campaign Tracking')).toBe('VERIFIED_HIGH');
    // Demonstrated in a project.
    expect(strength('Microsoft Excel')).toBe('VERIFIED_MEDIUM');
    // Listed only.
    expect(strength('Notion')).toBe('MENTIONED');
    expect(strength('Communication')).toBe('MENTIONED');
    // A meaningful spread exists -- not one flat bucket.
    expect(new Set(parsed.skills.map(s => s.evidence_strength)).size).toBeGreaterThanOrEqual(3);
  });

  it('extracts work history, project, education and certifications', () => {
    expect(parsed.experiences.length).toBe(2);
    expect(parsed.experiences[0].organization).toBe('BrightWave Solutions');
    expect(parsed.experiences[0].role_title).toBe('Operations Executive');
    expect(parsed.experiences[0].is_current).toBe(true);
    expect(parsed.experiences[0].duration_months).toBeGreaterThan(12);

    expect(parsed.projects.length).toBeGreaterThanOrEqual(1);
    expect(parsed.projects[0].title).toBe('Customer Retention Dashboard');
    expect(parsed.projects[0].origin).toBe('RESUME_DERIVED');

    expect(parsed.education?.[0].degree).toBe('Bachelor of Business Administration');
    expect(parsed.education?.[0].field).toBe('Marketing');
    expect(parsed.education?.[0].level).toBe('BACHELORS');

    expect(parsed.certifications?.map(c => c.name)).toContain('Google Analytics Individual Qualification');
    expect(parsed.certifications?.find(c => c.name.startsWith('HubSpot'))?.issuer).toBe('HubSpot Academy');
  });

  it('reports healthy extraction coverage', () => {
    expect(parsed.extraction_coverage?.coverage_percentage).toBeGreaterThanOrEqual(80);
    expect(parsed.extraction_coverage?.is_low_coverage).toBe(false);
    expect(parsed.extraction_coverage?.tools_detected).toBeGreaterThanOrEqual(5);
    expect(parsed.extraction_coverage?.soft_skills_detected).toBeGreaterThanOrEqual(5);
  });
});

// ============================================================
// CROSS-DOMAIN COVERAGE
// ============================================================

describe('Cross-domain extraction (15 resume profiles)', () => {
  const cases: Array<{ label: string; text: string; mustInclude: string[]; minSkills: number }> = [
    {
      label: '1. Data Analyst',
      text: DATA_ANALYST_RESUME,
      mustInclude: ['Python', 'SQL', 'Power BI', 'Tableau', 'PostgreSQL', 'Data Cleaning', 'Statistical Analysis', 'Looker Studio'],
      minSkills: 12
    },
    {
      label: '2. Software Developer',
      text: SOFTWARE_DEV_RESUME,
      mustInclude: ['JavaScript', 'TypeScript', 'React.js', 'Node.js', 'MongoDB', 'Docker', 'REST APIs'],
      minSkills: 10
    },
    {
      label: '3. Marketing Executive',
      text: MARKETING_EXEC_RESUME,
      mustInclude: ['Search Engine Optimization', 'Search Engine Marketing', 'Email Marketing', 'Brand Management', 'Market Research', 'Mailchimp', 'Canva'],
      minSkills: 7
    },
    {
      label: '4. Sales Professional',
      text: SALES_RESUME,
      mustInclude: ['Lead Generation', 'Negotiation', 'Account Management', 'Salesforce'],
      minSkills: 6
    },
    {
      label: '5. HR Professional',
      text: HR_RESUME,
      mustInclude: ['Recruitment', 'Employee Onboarding', 'HR Operations', 'Performance Management', 'Payroll', 'Applicant Tracking System'],
      minSkills: 7
    },
    {
      label: '6. Accountant',
      text: ACCOUNTANT_RESUME,
      mustInclude: ['Tally', 'QuickBooks', 'Microsoft Excel', 'Taxation', 'Accounts Payable & Receivable', 'Financial Reporting'],
      minSkills: 7
    },
    {
      label: '7. Operations Manager',
      text: OPS_MANAGER_RESUME,
      mustInclude: ['Operations Management', 'Lean Six Sigma', 'Production Planning', 'Preventive Maintenance', 'Quality Assurance', 'Vendor Management', 'Budgeting'],
      minSkills: 7
    },
    {
      label: '8. Healthcare Professional',
      text: HEALTHCARE_RESUME,
      mustInclude: ['Patient Care', 'Patient Monitoring', 'Pharmacology', 'Phlebotomy', 'Infection Control', 'Clinical Documentation'],
      minSkills: 6
    },
    {
      label: '9. Designer',
      text: DESIGNER_RESUME,
      mustInclude: ['Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Canva', 'UI/UX Design', 'Wireframing', 'Prototyping', 'User Research'],
      minSkills: 10
    },
    {
      label: '10. Government / UPSC candidate',
      text: UPSC_RESUME,
      mustInclude: ['Indian Polity', 'Current Affairs', 'Public Policy', 'CSAT & Aptitude', 'Answer & Essay Writing'],
      minSkills: 5
    },
    {
      label: '11. Fresher with projects, no work experience',
      text: FRESHER_RESUME,
      mustInclude: ['Python', 'SQL', 'HTML', 'CSS', 'Git', 'GitHub'],
      minSkills: 6
    },
    {
      label: '12/14. Skills only inside experience prose',
      text: SKILLS_IN_EXPERIENCE_RESUME,
      mustInclude: ['Supply Chain Management', 'Inventory Management', 'Process Improvement', 'KPI Reporting', 'Vendor Management', 'Microsoft Excel'],
      minSkills: 5
    },
    {
      label: '13. Unusual formatting, no standard headers',
      text: UNUSUAL_FORMAT_RESUME,
      mustInclude: ['Supply Chain Management', 'Route & Dispatch Planning', 'Export & Import Documentation', 'Inventory Management', 'Microsoft Excel'],
      minSkills: 5
    },
    {
      label: '15. Unknown / unmapped tools',
      text: UNKNOWN_TOOLS_RESUME,
      mustInclude: ['Microsoft Excel', 'Customer Service', 'Process Improvement'],
      minSkills: 6
    }
  ];

  for (const c of cases) {
    it(`${c.label}: extracts a meaningful, grounded profile`, () => {
      const parsed = fallbackResumeParser(c.text);
      const extracted = names(parsed);

      const missing = c.mustInclude.filter(m => !extracted.includes(m));
      expect(missing, `${c.label} missing: ${missing.join(', ')}`).toEqual([]);
      expect(parsed.skills.length).toBeGreaterThanOrEqual(c.minSkills);

      // NO HALLUCINATION: every skill traces to a verbatim line of this resume.
      for (const skill of parsed.skills) {
        expect(c.text, `${c.label}: ${skill.name} quote not in resume`).toContain(skill.provenance_context);
        expect(skill.evidence_origin).toBe('RESUME');
      }

      // Contact facts are read, not guessed.
      expect(parsed.email).toMatch(/@/);
      expect(c.text).toContain(parsed.email);
    });
  }

  it('never leaks skills across resumes (a nurse resume has no Python)', () => {
    const nurse = names(fallbackResumeParser(HEALTHCARE_RESUME));
    expect(nurse).not.toContain('Python');
    expect(nurse).not.toContain('React.js');
    expect(nurse).not.toContain('Docker');

    const accountant = names(fallbackResumeParser(ACCOUNTANT_RESUME));
    expect(accountant).not.toContain('Python');
    expect(accountant).not.toContain('Kubernetes');
  });
});

// ============================================================
// UNMAPPED SKILL PRESERVATION
// ============================================================

describe('Unmapped terms are preserved, never discarded', () => {
  const parsed = fallbackResumeParser(UNKNOWN_TOOLS_RESUME);

  it('keeps tools that have no ontology entry', () => {
    const originalTerms = originals(parsed);
    for (const tool of ['Zendesk Sunshine', 'Odoo ERP', 'Plutio', 'Gorgias']) {
      expect(originalTerms, `lost unmapped tool: ${tool}`).toContain(tool);
    }
  });

  it('flags them as UNMAPPED_SKILL with a suggested category and evidence', () => {
    const odoo = parsed.skills.find(s => s.original_term === 'Odoo ERP');
    expect(odoo).toBeDefined();
    expect(odoo?.is_unmapped).toBe(true);
    expect(odoo?.suggested_category).toBeTruthy();
    expect(odoo?.skill_kind).toBe('PLATFORM');
    expect(odoo?.provenance_context).toContain('Odoo ERP');
    expect(odoo?.normalization_reason).toContain('UNMAPPED');
  });

  it('does not mark known tools as unmapped', () => {
    expect(parsed.skills.find(s => s.name === 'Microsoft Excel')?.is_unmapped).toBe(false);
  });

  it('surfaces the unmapped count in extraction coverage', () => {
    expect(parsed.extraction_coverage?.unmapped_terms_detected).toBeGreaterThanOrEqual(4);
    expect(parsed.extraction_coverage?.warnings.some(w => w.includes('UNMAPPED_SKILL'))).toBe(true);
  });
});

// ============================================================
// NO HALLUCINATION
// ============================================================

describe('Hallucination guards', () => {
  it('interest and aspiration statements never become verified skills', () => {
    const parsed = fallbackResumeParser(UPSC_RESUME);
    const extracted = names(parsed);
    expect(extracted).not.toContain('Machine Learning');
    expect(extracted).not.toContain('Data Analytics');
  });

  it('does not invent projects, experience, education or certifications', () => {
    const minimal = `Sam Wells
sam.wells@example.com

SKILLS
Customer Service, Microsoft Excel
`;
    const parsed = fallbackResumeParser(minimal);
    expect(parsed.projects).toEqual([]);
    expect(parsed.experiences).toEqual([]);
    expect(parsed.education).toEqual([]);
    expect(parsed.certifications).toEqual([]);
    expect(parsed.skills.length).toBeGreaterThanOrEqual(2);
  });

  it('does not fabricate a candidate identity for an unreadable document', () => {
    const parsed = fallbackResumeParser('');
    expect(parsed.skills).toEqual([]);
    expect(parsed.email).toBe('');
    expect(parsed.full_name).toBe('Candidate');
  });

  it('flags low coverage when a rich document yields almost nothing', () => {
    const opaque = `Marcus Bell
marcus.bell@example.com

PROFESSIONAL SUMMARY
${'A seasoned professional delivering outcomes across many contexts and settings. '.repeat(6)}
`;
    const parsed = fallbackResumeParser(opaque);
    expect(parsed.extraction_coverage?.is_low_coverage).toBe(true);
    expect(parsed.extraction_coverage?.warnings.join(' ')).toContain('Low extraction coverage');
  });
});

// ============================================================
// CAREER-AGNOSTIC EVIDENCE
// ============================================================

describe('Extraction is career-agnostic', () => {
  it('produces identical evidence regardless of which career is targeted later', () => {
    const a = fallbackResumeParser(BUSINESS_OPS_RESUME);
    const b = fallbackResumeParser(BUSINESS_OPS_RESUME);
    expect(names(a)).toEqual(names(b));
  });

  it('keeps the full evidence graph when readiness is computed for an unrelated career', () => {
    const parsed = fallbackResumeParser(BUSINESS_OPS_RESUME);
    const before = names(parsed).length;

    const profile = normalizeToCandidateProfile({ ...parsed, experience: parsed.experiences });
    const unrelated: Opportunity = {
      id: 'opp_dev_01',
      title: 'Backend Developer',
      organization: 'Somewhere',
      opportunity_type: 'private_job',
      description: 'Python backend role',
      source: 'Test',
      min_experience_years: 0,
      verification_status: 'VERIFIED',
      requirements: [
        { id: 'r1', opportunity_id: 'opp_dev_01', requirement_type: 'required_skill', name: 'Python', normalized_name: 'python', is_mandatory: true }
      ]
    };

    calculateOpportunityReadiness(profile, unrelated);
    expect(names(parsed).length).toBe(before);
    expect(profile.skills.length).toBe(before);
  });
});

// ============================================================
// UNIT-LEVEL BEHAVIOUR
// ============================================================

describe('Extraction primitives', () => {
  it('segments a resume into its own declared sections', () => {
    const kinds = segmentResume(BUSINESS_OPS_RESUME).map(s => s.kind);
    expect(kinds).toContain('SUMMARY');
    expect(kinds).toContain('EXPERIENCE');
    expect(kinds).toContain('PROJECTS');
    expect(kinds).toContain('SKILLS');
    expect(kinds).toContain('EDUCATION');
    expect(kinds).toContain('CERTIFICATIONS');
  });

  it('splits listings on commas, pipes, parentheses and safe slashes', () => {
    expect(splitListingTerms('Python (Pandas, NumPy) | SQL')).toEqual(['Python', 'Pandas', 'NumPy', 'SQL']);
    expect(splitListingTerms('React/Node')).toEqual(['React', 'Node']);
    // Compact idioms stay intact.
    expect(splitListingTerms('AI/ML, CI/CD, UI/UX')).toEqual(['AI/ML', 'CI/CD', 'UI/UX']);
  });

  it('peels depth qualifiers without losing the skill', () => {
    expect(splitLevelQualifier('SEO Fundamentals')).toMatchObject({ core: 'SEO', qualifier: 'FUNDAMENTALS' });
    expect(splitLevelQualifier('Basic Business Analytics')).toMatchObject({ core: 'Business Analytics', qualifier: 'BASIC' });
    expect(splitLevelQualifier('Advanced Excel')).toMatchObject({ core: 'Excel', qualifier: 'ADVANCED' });
    // A bare qualifier is not a skill and must not be stripped to nothing.
    expect(splitLevelQualifier('Basic').core).toBe('Basic');
  });

  it('rejects sentences, dates and contact fragments as skill terms', () => {
    expect(isPlausibleSkillTerm('Microsoft Excel')).toBe(true);
    expect(isPlausibleSkillTerm('and coordinated the regional sales team')).toBe(false);
    expect(isPlausibleSkillTerm('Jan 2022 - Mar 2024')).toBe(false);
    expect(isPlausibleSkillTerm('priya.nair@example.com')).toBe(false);
    expect(isPlausibleSkillTerm('+91 98765 43210')).toBe(false);
  });

  it('records hierarchy so reasoning can move between levels', () => {
    const parsed = fallbackResumeParser(BUSINESS_OPS_RESUME);
    const seo = parsed.skills.find(s => s.name === 'Search Engine Optimization');
    expect(seo?.parent_skill).toBe('Digital Marketing');
    const hubspot = parsed.skills.find(s => s.name === 'HubSpot CRM');
    expect(hubspot?.parent_skill).toBe('Customer Relationship Management');
  });

  it('attaches multiple evidence items when a skill appears in several places', () => {
    const evidence = extractResumeEvidence(BUSINESS_OPS_RESUME);
    const excel = evidence.skills.find(s => s.canonical_term === 'Microsoft Excel');
    expect(excel!.evidence.length).toBeGreaterThanOrEqual(2);
    const sources = excel!.evidence.map(e => e.source_type);
    expect(sources).toContain('TECHNICAL_SKILLS_LISTING');
    expect(sources).toContain('PROJECT_IMPLEMENTATION');
  });
});
