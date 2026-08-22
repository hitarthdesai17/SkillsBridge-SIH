import { describe, it, expect } from 'vitest';
import { POST } from './route';

describe('Phase 7: Roadmap API Endpoint (/api/roadmap)', () => {

  it('TEST 1: POST /api/roadmap returns selection prompt when no target career is provided', async () => {
    const request = new Request('http://localhost:3000/api/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_career: ''
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.roadmap.is_empty_selection).toBe(true);
  });

  it('TEST 2: POST /api/roadmap generates milestones for target career Data Analyst', async () => {
    const request = new Request('http://localhost:3000/api/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_career: 'Data Analyst'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.roadmap.target_career_title).toBe('Data Analyst');
    expect(data.roadmap.milestones.length).toBeGreaterThan(0);
  });

});
