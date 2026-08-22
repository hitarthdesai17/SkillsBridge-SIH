import { CandidateProfile, CandidateExperience, ExperienceSummary, ExperienceType, CanonicalExperienceItem } from '../types';

/**
 * Classify raw role title and description into canonical ExperienceType
 */
export function classifyExperienceType(roleTitle: string, organization: string, description: string = ''): ExperienceType {
  const text = `${roleTitle} ${organization} ${description}`.toLowerCase();

  if (/\b(?:intern|internship|trainee|apprentice)\b/i.test(text)) {
    return 'INTERNSHIP';
  }
  if (/\b(?:freelance|contract|contractor|consultant|consulting)\b/i.test(text)) {
    return 'FREELANCE_CONTRACT';
  }
  if (/\b(?:academic|capstone|thesis|university project|college project|coursework)\b/i.test(text)) {
    return 'ACADEMIC_PROJECT';
  }
  if (/\b(?:part-time|part time|hourly)\b/i.test(text)) {
    return 'PART_TIME_EMPLOYMENT';
  }
  if (/\b(?:volunteer|pro bono|community)\b/i.test(text)) {
    return 'VOLUNTEER';
  }
  if (/\b(?:founder|lead|director|manager|head|captain|president)\b/i.test(text)) {
    return 'LEADERSHIP';
  }

  // Default professional employment
  return 'FULL_TIME_EMPLOYMENT';
}

/**
 * Canonical Experience Engine
 * Single unified source of truth for duration, classification, and workplace eligibility.
 */
export function calculateCandidateExperienceSummary(profile: CandidateProfile): ExperienceSummary {
  const items: CanonicalExperienceItem[] = [];
  const rawExperiences = profile.experiences || profile.experience || [];

  const breakdownByType: Record<ExperienceType, number> = {
    FULL_TIME_EMPLOYMENT: 0,
    PART_TIME_EMPLOYMENT: 0,
    INTERNSHIP: 0,
    FREELANCE_CONTRACT: 0,
    ACADEMIC_PROJECT: 0,
    PERSONAL_PROJECT: 0,
    VOLUNTEER: 0,
    LEADERSHIP: 0,
    OTHER: 0
  };

  let totalMonths = 0;
  let workplaceMonths = 0;

  // 1. Process explicit work experiences
  for (let i = 0; i < rawExperiences.length; i++) {
    const exp = rawExperiences[i];
    const duration = Math.max(0, exp.duration_months || 0);
    const expType = exp.experience_type || classifyExperienceType(exp.role_title || '', exp.organization || '', exp.description || '');

    breakdownByType[expType] += duration;
    totalMonths += duration;

    // Workplace duration counts professional employment, internships, contracts, and leadership
    if (['FULL_TIME_EMPLOYMENT', 'PART_TIME_EMPLOYMENT', 'INTERNSHIP', 'FREELANCE_CONTRACT', 'LEADERSHIP'].includes(expType)) {
      workplaceMonths += duration;
    }

    items.push({
      id: exp.id || `exp_item_${i}`,
      organization: exp.organization || 'Workplace Experience',
      role_title: exp.role_title || 'Professional Role',
      experience_type: expType,
      duration_months: duration,
      duration_years: Number((duration / 12).toFixed(1)),
      is_current: exp.is_current || false,
      description: exp.description || '',
      evidence_quotes: exp.description ? [exp.description] : [`Worked as ${exp.role_title} at ${exp.organization} for ${duration} months.`]
    });
  }

  // 2. If candidate has project evidence without explicit experiences, record academic/personal projects
  if (rawExperiences.length === 0 && profile.projects && profile.projects.length > 0) {
    for (let j = 0; j < profile.projects.length; j++) {
      const proj = profile.projects[j];
      const projDuration = 3; // Estimated average milestone duration in months
      breakdownByType.PERSONAL_PROJECT += projDuration;
      totalMonths += projDuration;

      items.push({
        id: proj.id || `proj_item_${j}`,
        organization: 'Portfolio Project',
        role_title: proj.title,
        experience_type: 'PERSONAL_PROJECT',
        duration_months: projDuration,
        duration_years: Number((projDuration / 12).toFixed(1)),
        is_current: false,
        description: proj.description,
        evidence_quotes: [proj.description || `Built ${proj.title} utilizing ${proj.tech_stack.join(', ')}`]
      });
    }
  }

  return {
    total_duration_months: totalMonths,
    total_duration_years: Number((totalMonths / 12).toFixed(2)),
    workplace_duration_months: workplaceMonths,
    workplace_duration_years: Number((workplaceMonths / 12).toFixed(2)),
    breakdown_by_type: breakdownByType,
    items
  };
}

/**
 * Evaluate if candidate satisfies an opportunity's minimum experience requirement according to role rules.
 */
export function evaluateWorkplaceExperienceEligibility(
  candidateSummary: ExperienceSummary,
  requiredYears: number,
  allowInternships: boolean = true
): {
  isSatisfied: boolean;
  actualYears: number;
  actualMonths: number;
  explanation: string;
} {
  if (requiredYears <= 0) {
    return {
      isSatisfied: true,
      actualYears: candidateSummary.workplace_duration_years,
      actualMonths: candidateSummary.workplace_duration_months,
      explanation: 'No minimum workplace experience required (entry-level / fresher friendly).'
    };
  }

  const effectiveMonths = allowInternships 
    ? candidateSummary.workplace_duration_months 
    : (candidateSummary.workplace_duration_months - candidateSummary.breakdown_by_type.INTERNSHIP);

  const effectiveYears = Number((effectiveMonths / 12).toFixed(2));
  const isSatisfied = effectiveYears >= requiredYears;

  let explanation = '';
  if (isSatisfied) {
    explanation = `Candidate demonstrates ${effectiveYears} year(s) (${effectiveMonths} months) of verified workplace experience, meeting the required ${requiredYears} year(s).`;
  } else {
    explanation = `Requires ${requiredYears} year(s) of workplace experience. Candidate demonstrates ${effectiveYears} year(s) (${effectiveMonths} months) of verified workplace experience.`;
  }

  return {
    isSatisfied,
    actualYears: effectiveYears,
    actualMonths: effectiveMonths,
    explanation
  };
}
