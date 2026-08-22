import { CareerDomainType } from '../types';

export interface DomainClassification {
  domain: CareerDomainType;
  domain_label: string;
  confidence: number;
  evidence_keywords: string[];
}

export const CAREER_DOMAIN_DEFINITIONS: Record<CareerDomainType, { label: string; keywords: string[] }> = {
  CIVIL_GOVERNMENT: {
    label: 'Government & Public Administration',
    keywords: ['upsc', 'ssc', 'psc', 'civil services', 'government', 'public administration', 'ias', 'ips', 'ifs', 'railways', 'defence', 'banking exam']
  },
  FITNESS_WELLNESS: {
    label: 'Fitness & Health Wellness',
    keywords: ['personal trainer', 'fitness', 'nutrition', 'kinesiology', 'cpr', 'first aid', 'ace certified', 'group fitness', 'exercise', 'gym', 'workout', 'wellness', 'coaching', 'client training']
  },
  HEALTHCARE_MEDICINE: {
    label: 'Healthcare & Medicine',
    keywords: ['nurse', 'nursing', 'medical', 'patient care', 'clinic', 'hospital', 'doctor', 'pharmacy', 'physiotherapy', 'health administration']
  },
  FINANCE_BANKING: {
    label: 'Finance, Banking & Accounting',
    keywords: ['finance', 'banking', 'accounting', 'auditing', 'investment', 'chartered accountant', 'ca', 'financial analysis', 'taxation', 'wealth management']
  },
  BUSINESS_SALES: {
    label: 'Business & Sales Operations',
    keywords: ['sales', 'business development', 'marketing', 'human resources', 'hr', 'operations', 'management', 'client relations', 'b2b sales']
  },
  DATA_ANALYTICS: {
    label: 'Data Science & Analytics',
    keywords: ['data analyst', 'data science', 'sql', 'python', 'pandas', 'numpy', 'tableau', 'power bi', 'etl', 'analytics', 'statistics', 'bi intern', 'business intelligence']
  },
  SOFTWARE_ENGINEERING: {
    label: 'Software Engineering',
    keywords: ['software engineer', 'developer', 'react', 'javascript', 'typescript', 'java', 'c++', 'docker', 'full stack', 'backend', 'frontend', 'git', 'api']
  },
  AI_ML: {
    label: 'Artificial Intelligence & Machine Learning',
    keywords: ['ai', 'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch', 'scikit-learn', 'llm', 'generative ai']
  },
  CYBERSECURITY: {
    label: 'Cybersecurity & InfoSec',
    keywords: ['cybersecurity', 'penetration testing', 'ethical hacking', 'network security', 'ceh', 'cissp', 'infosec', 'firewall']
  },
  CLOUD_DEVOPS: {
    label: 'Cloud & DevOps Engineering',
    keywords: ['devops', 'aws', 'azure', 'gcp', 'kubernetes', 'terraform', 'ci/cd', 'cloud infrastructure']
  },
  IT_NETWORKING: {
    label: 'IT Support & Networking',
    keywords: ['it support', 'system administrator', 'ccna', 'networking', 'helpdesk', 'hardware', 'sysadmin']
  },
  LAW_PUBLIC_POLICY: {
    label: 'Law & Public Policy',
    keywords: ['law', 'legal', 'lawyer', 'advocate', 'llb', 'public policy', 'paralegal', 'compliance', 'corporate law']
  },
  ENGINEERING_TRADES: {
    label: 'Engineering & Skilled Trades',
    keywords: ['civil engineering', 'mechanical engineering', 'electrical engineering', 'autocad', 'technician', 'electrician', 'construction', 'manufacturing']
  },
  EDUCATION_RESEARCH: {
    label: 'Education & Academic Research',
    keywords: ['teacher', 'teaching', 'lecturer', 'professor', 'research assistant', 'phd', 'curriculum', 'pedagogy', 'tutoring']
  },
  CREATIVE_DESIGN: {
    label: 'Creative & UI/UX Design',
    keywords: ['ui/ux', 'graphic design', 'figma', 'adobe illustrator', 'photoshop', 'animation', 'video editing', 'content creation']
  },
  GENERAL: {
    label: 'General Professional',
    keywords: []
  }
};

/**
 * Classify candidate's dominant career domain based on evidence.
 */
export function classifyCandidateDomain(resumeText: string, skills: string[] = []): DomainClassification {
  const text = (resumeText + ' ' + skills.join(' ')).toLowerCase();

  let maxScore = 0;
  let bestDomain: CareerDomainType = 'GENERAL';
  let matchedKeywords: string[] = [];

  for (const [domKey, def] of Object.entries(CAREER_DOMAIN_DEFINITIONS) as [CareerDomainType, { label: string; keywords: string[] }][]) {
    if (domKey === 'GENERAL') continue;

    let currentScore = 0;
    const currentMatched: string[] = [];

    for (const kw of def.keywords) {
      if (text.includes(kw)) {
        currentScore++;
        currentMatched.push(kw);
      }
    }

    if (currentScore > maxScore && currentScore >= 2) {
      maxScore = currentScore;
      bestDomain = domKey;
      matchedKeywords = currentMatched;
    }
  }

  return {
    domain: bestDomain,
    domain_label: CAREER_DOMAIN_DEFINITIONS[bestDomain].label,
    confidence: Math.min(1.0, maxScore / 4),
    evidence_keywords: matchedKeywords
  };
}
