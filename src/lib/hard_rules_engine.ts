import { CandidateProfile, Opportunity, HardEligibilityResult, HardRequirementReason } from '../types';
import { calculateCandidateExperienceSummary, evaluateWorkplaceExperienceEligibility } from './experience_engine';

/**
 * Deterministic Hard Eligibility Engine
 * NO LLM INVOLVEMENT. Evaluating binary pass/fail cutoff rules.
 */
export function evaluateHardEligibility(
  candidate: CandidateProfile,
  opportunity: Opportunity
): HardEligibilityResult {
  const reasons: HardRequirementReason[] = [];
  let isEligible = true;

  // 1. Application Deadline Check
  if (opportunity.deadline) {
    const deadlineDate = new Date(opportunity.deadline);
    const currentDate = new Date();
    if (currentDate > deadlineDate) {
      isEligible = false;
      reasons.push({
        requirement_name: 'Application Deadline',
        status: 'FAILED',
        explanation: `The application deadline (${deadlineDate.toLocaleDateString()}) has passed.`
      });
    } else {
      reasons.push({
        requirement_name: 'Application Deadline',
        status: 'PASSED',
        explanation: `Application is open until ${deadlineDate.toLocaleDateString()}.`
      });
    }
  }

  // 2. Mandatory Education Degree Requirement Check
  if (opportunity.education_level_required || opportunity.explicit_eligibility?.required_degree) {
    const reqDegree = (
      opportunity.explicit_eligibility?.required_degree || 
      opportunity.education_level_required || 
      ''
    ).toLowerCase();
    
    const candidateDegree = (candidate.education_level || '').toLowerCase();
    
    // Degree level mapping hierarchy
    const degreeRank: Record<string, number> = {
      'high school': 1,
      'diploma': 2,
      'bachelor': 3,
      "bachelor's": 3,
      'b.tech': 3,
      'b.e.': 3,
      'b.sc': 3,
      'bca': 3,
      'master': 4,
      "master's": 4,
      'm.tech': 4,
      'm.sc': 4,
      'mca': 4,
      'phd': 5
    };

    let requiredRank = 0;
    for (const [key, rank] of Object.entries(degreeRank)) {
      if (reqDegree.includes(key)) {
        requiredRank = Math.max(requiredRank, rank);
      }
    }

    let candidateRank = 0;
    for (const [key, rank] of Object.entries(degreeRank)) {
      if (candidateDegree.includes(key)) {
        candidateRank = Math.max(candidateRank, rank);
      }
    }

    if (requiredRank > 0 && candidateRank < requiredRank) {
      isEligible = false;
      reasons.push({
        requirement_name: 'Mandatory Education Degree',
        status: 'FAILED',
        explanation: `Requires ${opportunity.education_level_required || opportunity.explicit_eligibility?.required_degree}, but candidate has ${candidate.education_level || 'unspecified education'}.`
      });
    } else {
      reasons.push({
        requirement_name: 'Mandatory Education Degree',
        status: 'PASSED',
        explanation: `Candidate satisfies required education level.`
      });
    }
  }

  // 3. Minimum Workplace Experience Years Check (via Canonical Experience Engine)
  if (opportunity.min_experience_years > 0) {
    const expSummary = candidate.experience_summary || calculateCandidateExperienceSummary(candidate);
    const allowInternships = opportunity.opportunity_type === 'internship' || opportunity.min_experience_years <= 1;
    const expEval = evaluateWorkplaceExperienceEligibility(expSummary, opportunity.min_experience_years, allowInternships);

    if (!expEval.isSatisfied) {
      isEligible = false;
      reasons.push({
        requirement_name: 'Minimum Workplace Experience',
        status: 'FAILED',
        explanation: expEval.explanation
      });
    } else {
      reasons.push({
        requirement_name: 'Minimum Workplace Experience',
        status: 'PASSED',
        explanation: expEval.explanation
      });
    }
  }

  // 4. Age Constraints (e.g. Government Examinations / Public Sector)
  if (opportunity.explicit_eligibility?.min_age || opportunity.explicit_eligibility?.max_age) {
    reasons.push({
      requirement_name: 'Age Cutoff Compliance',
      status: 'PASSED',
      explanation: `Age eligibility requirement (${opportunity.explicit_eligibility.min_age || 18}–${opportunity.explicit_eligibility.max_age || 35} years) cannot be automatically verified. Candidate self-attestation is required before applying.`
    });
  }

  // 5. Nationality & Citizenship Constraints
  if (opportunity.explicit_eligibility?.nationality) {
    reasons.push({
      requirement_name: 'Citizenship Requirement',
      status: 'PASSED',
      explanation: `Citizenship requirement (${opportunity.explicit_eligibility.nationality}) cannot be automatically verified. Candidate self-attestation is required before applying.`
    });
  }

  return {
    eligible: isEligible,
    reasons
  };
}
