import { describe, it, expect } from 'vitest';
import { POST } from './route';

const CANDIDATE_PROFILE = {
  id: 'cand_aarav_mehta_01',
  user_id: 'usr_aarav_mehta',
  full_name: 'Aarav Mehta',
  email: 'aarav.mehta@example.com',
  education_level: "Bachelor's Degree",
  education_field: 'Computer Science',
  graduation_year: 2025,
  career_domain: 'DATA_ANALYTICS',
  skills: [
    { id: 's1', profile_id: 'cand_aarav_mehta_01', name: 'Python', normalized_name: 'python', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' },
    { id: 's2', profile_id: 'cand_aarav_mehta_01', name: 'SQL', normalized_name: 'sql', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' },
    { id: 's7', profile_id: 'cand_aarav_mehta_01', name: 'Pandas', normalized_name: 'pandas', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' },
    { id: 's8', profile_id: 'cand_aarav_mehta_01', name: 'PostgreSQL', normalized_name: 'postgresql', proficiency_level: 'intermediate', provenance_source: 'Skills Section', extraction_confidence: 'HIGH' }
  ],
  projects: [],
  experience: [],
  created_at: new Date().toISOString()
};

describe('Phase 7.X+: Gap Action Plan API Endpoint (/api/roadmap/action-plan)', () => {

  it('TEST 1: Returns a full learning plan for a real learnable gap', async () => {
    const request = new Request('http://localhost:3000/api/roadmap/action-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_career: 'Python Backend Developer',
        gap_capability: 'PySpark / Data Pipelines',
        candidate_profile: CANDIDATE_PROFILE
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.result.kind).toBe('PLAN');
    expect(data.result.plan.gap_capability_name).toContain('PySpark');
    expect(data.result.plan.learning_phases.length).toBeGreaterThanOrEqual(4);
    expect(data.result.plan.project_blueprint.closes_gap_capabilities.length).toBeGreaterThan(0);
  });

  it('TEST 2: Returns ELIGIBILITY_BLOCKER (no learning plan) for a hard eligibility gap', async () => {
    const request = new Request('http://localhost:3000/api/roadmap/action-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_career: 'Machine Learning Engineer',
        gap_capability: 'Mandatory Education Degree',
        candidate_profile: CANDIDATE_PROFILE
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.result.kind).toBe('ELIGIBILITY_BLOCKER');
  });

  it('TEST 3: Returns NOT_FOUND for an unsupported/uncatalogued career', async () => {
    const request = new Request('http://localhost:3000/api/roadmap/action-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_career: 'Teacher',
        gap_capability: 'Anything',
        candidate_profile: CANDIDATE_PROFILE
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.result.kind).toBe('NOT_FOUND');
  });

  it('TEST 4: Rejects a request missing required fields', async () => {
    const request = new Request('http://localhost:3000/api/roadmap/action-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_career: '' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

});
