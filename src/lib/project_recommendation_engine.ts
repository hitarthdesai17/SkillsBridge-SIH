import { z } from 'zod';
import { CandidateProfile, Opportunity, ProjectRecommendation, SkillGap } from '../types';
import { PROJECT_RECOMMENDATION_SYSTEM_PROMPT } from './ai/prompts/project_recommendation_prompt';
import { getServiceRoleSupabase } from './supabase';

export const ProjectRecommendationZodSchema = z.object({
  title: z.string(),
  objective: z.string(),
  why_recommended: z.string(),
  skills_demonstrated: z.array(z.string()),
  skills_learned: z.array(z.string()),
  existing_strengths_leveraged: z.array(z.string()),
  suggested_tech_stack: z.array(z.string()),
  scope_deliverables: z.array(z.string()),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Intermediate'),
  feasibility_score: z.number().default(85.0),
  estimated_effort_hours: z.number().default(12),
  expected_readiness_delta: z.number().default(20.0)
});

/**
 * Generate a targeted portfolio project recommendation to close candidate readiness gaps.
 */
export async function generateTargetedProjectRecommendation(
  profile: CandidateProfile,
  opportunity: Opportunity,
  gaps: SkillGap[]
): Promise<ProjectRecommendation> {
  const missingSkills = gaps
    .filter(g => g.gap_type === 'SKILL_GAP' || g.gap_type === 'EVIDENCE_GAP')
    .map(g => g.missing_capability);

  const existingSkills = (profile.skills || []).map(s => s.name);

  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  // 1. Try Gemini API if key is present
  if (geminiKey && geminiKey.trim().length > 10 && !geminiKey.includes('your-gemini-api-key')) {
    try {
      let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${PROJECT_RECOMMENDATION_SYSTEM_PROMPT}\n\nCandidate Existing Strengths: ${JSON.stringify(existingSkills)}\nTarget Opportunity: "${opportunity.title}" at "${opportunity.organization}"\nIdentified Missing Gaps: ${JSON.stringify(missingSkills)}\nGenerate a targeted project recommendation.`
            }]
          }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
        })
      });

      if (!response.ok) {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey.trim()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${PROJECT_RECOMMENDATION_SYSTEM_PROMPT}\n\nCandidate Existing Strengths: ${JSON.stringify(existingSkills)}\nTarget Opportunity: "${opportunity.title}" at "${opportunity.organization}"\nIdentified Missing Gaps: ${JSON.stringify(missingSkills)}\nGenerate a targeted project recommendation.`
              }]
            }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
          })
        });
      }

      if (response.ok) {
        const json = await response.json();
        const rawJsonText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          const content = JSON.parse(rawJsonText);
          const validated = ProjectRecommendationZodSchema.safeParse(content);
          if (validated.success) {
            const rec = validated.data;
            return {
              id: `proj_rec_${Math.random().toString(36).substring(2, 7)}`,
              title: rec.title,
              objective: rec.objective,
              why_recommended: rec.why_recommended,
              skills_demonstrated: rec.skills_demonstrated,
              skills_learned: rec.skills_learned,
              existing_strengths_leveraged: rec.existing_strengths_leveraged,
              suggested_tech_stack: rec.suggested_tech_stack,
              scope_deliverables: rec.scope_deliverables,
              difficulty: rec.difficulty,
              feasibility_score: rec.feasibility_score,
              estimated_effort_hours: rec.estimated_effort_hours,
              expected_readiness_delta: rec.expected_readiness_delta
            };
          }
        }
      }
    } catch (err) {
      // Fall through to OpenAI or Fallback
    }
  }

  // 2. Try OpenAI API if key is present
  if (openAiKey && openAiKey.startsWith('sk-') && !openAiKey.includes('your-openai-api-key')) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: PROJECT_RECOMMENDATION_SYSTEM_PROMPT },
            { 
              role: 'user', 
              content: `Candidate Existing Strengths: ${JSON.stringify(existingSkills)}\nTarget Opportunity: "${opportunity.title}" at "${opportunity.organization}"\nIdentified Missing Gaps: ${JSON.stringify(missingSkills)}\nGenerate a targeted project recommendation.` 
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        })
      });

      if (response.ok) {
        const json = await response.json();
        const content = JSON.parse(json.choices[0].message.content);
        const validated = ProjectRecommendationZodSchema.safeParse(content);
        if (validated.success) {
          const rec = validated.data;
          return {
            id: `proj_rec_${Math.random().toString(36).substring(2, 7)}`,
            title: rec.title,
            objective: rec.objective,
            why_recommended: rec.why_recommended,
            skills_demonstrated: rec.skills_demonstrated,
            skills_learned: rec.skills_learned,
            existing_strengths_leveraged: rec.existing_strengths_leveraged,
            suggested_tech_stack: rec.suggested_tech_stack,
            scope_deliverables: rec.scope_deliverables,
            difficulty: rec.difficulty,
            feasibility_score: rec.feasibility_score,
            estimated_effort_hours: rec.estimated_effort_hours,
            expected_readiness_delta: rec.expected_readiness_delta
          };
        }
      }
    } catch (err) {
      // Fall through to deterministic generator
    }
  }

  // Deterministic Project Recommendation Generator (Fallback)
  return fallbackProjectGenerator(profile, opportunity, gaps);
}

/**
 * Deterministic targeted project generator fallback.
 */
export function fallbackProjectGenerator(
  profile: CandidateProfile,
  opportunity: Opportunity,
  gaps: SkillGap[]
): ProjectRecommendation {
  const missingSkillNames = gaps
    .filter(g => g.gap_type === 'SKILL_GAP' || g.gap_type === 'EVIDENCE_GAP')
    .map(g => {
      return g.missing_capability
        .replace(/^Missing\s+(?:mandatory\s+skill:\s*)?/i, '')
        .replace(/:\s*Verified\s+skill\s+present.*$/i, '')
        .replace(/:\s*Demonstrates\s+baseline\s+skill.*$/i, '')
        .replace(/:\s*No\s+evidence\s+found.*$/i, '')
        .replace(/Skill\s+'([^']+)'\s+claimed.*$/i, '$1')
        .trim();
    })
    .filter(s => s.length > 0);

  const existingSkills = (profile.skills || []).map(s => s.name);
  const primaryGap = missingSkillNames.length > 0 ? missingSkillNames[0] : 'Data Visualization';

  let title = `Targeted ${primaryGap} Portfolio Project`;
  let objective = `Build a production-ready application demonstrating ${primaryGap} to fulfill requirements for ${opportunity.title}.`;
  let suggestedStack = [...existingSkills.slice(0, 2), primaryGap];
  let deliverables = [
    'GitHub repository with clean modular code structure and README documentation',
    'Interactive dashboard or REST API exposing core functionality',
    'Unit tests and dataset processing script demonstrating data validation'
  ];

  const isDataRole = opportunity.title.toLowerCase().includes('data') || 
                     opportunity.title.toLowerCase().includes('bi') || 
                     opportunity.title.toLowerCase().includes('analytics');

  if (isDataRole) {
    title = primaryGap.toLowerCase().includes('pipeline') || primaryGap.toLowerCase().includes('pyspark')
      ? 'Retail Sales Analytics Pipeline & Executive Dashboard'
      : `Interactive ${primaryGap} Analytics Dashboard`;
    objective = `Design an end-to-end data pipeline extracting SQL records, processing metrics with Python/Pandas, and presenting executive KPIs in an interactive dashboard.`;
    suggestedStack = ['Python', 'SQL', 'Pandas', primaryGap];
    deliverables = [
      'SQL data extraction queries & cleaned CSV datasets',
      'Automated Python ETL data processing script',
      'Interactive executive dashboard with filterable drill-downs',
      'Portfolio write-up explaining business key insights'
    ];
  } else if (opportunity.title.toLowerCase().includes('web') || opportunity.title.toLowerCase().includes('software') || opportunity.title.toLowerCase().includes('frontend')) {
    title = `Full-Stack ${primaryGap} Application with PostgreSQL Backend`;
    objective = `Develop a responsive web application implementing ${primaryGap} with REST API integration and database persistence.`;
    suggestedStack = ['TypeScript', 'React.js', 'Node.js', 'PostgreSQL', primaryGap];
  }

  return {
    id: `proj_rec_${Math.random().toString(36).substring(2, 7)}`,
    title,
    objective,
    why_recommended: `This project directly closes your critical ${primaryGap} gap while leveraging your existing strengths in ${existingSkills.join(', ') || 'programming'}.`,
    skills_demonstrated: existingSkills.length > 0 ? existingSkills.slice(0, 3) : ['Problem Solving'],
    skills_learned: missingSkillNames.length > 0 ? missingSkillNames.slice(0, 3) : [primaryGap],
    existing_strengths_leveraged: existingSkills.slice(0, 3),
    suggested_tech_stack: suggestedStack,
    scope_deliverables: deliverables,
    difficulty: 'Intermediate',
    feasibility_score: 85.0,
    estimated_effort_hours: 14,
    expected_readiness_delta: 22.5
  };
}

/**
 * Save project recommendation to Supabase database.
 */
export async function saveProjectRecommendationToDatabase(assessmentId: string, rec: ProjectRecommendation) {
  if (!assessmentId || !rec) return;

  const serviceClient = getServiceRoleSupabase();
  await serviceClient.from('project_recommendations').insert({
    assessment_id: assessmentId,
    title: rec.title,
    objective: rec.objective,
    why_recommended: rec.why_recommended,
    skills_demonstrated: rec.skills_demonstrated,
    skills_learned: rec.skills_learned,
    existing_strengths_leveraged: rec.existing_strengths_leveraged,
    suggested_tech_stack: rec.suggested_tech_stack,
    scope_deliverables: rec.scope_deliverables,
    difficulty: rec.difficulty,
    feasibility_score: rec.feasibility_score,
    estimated_effort_hours: rec.estimated_effort_hours,
    expected_readiness_delta: rec.expected_readiness_delta
  });
}
