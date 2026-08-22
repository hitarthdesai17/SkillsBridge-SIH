import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCandidateProfile,
  setCandidateProfileStore,
  clearCandidateProfileStore
} from './candidate_service';
import { saveCandidateProfileToDatabase } from './resume_parser';
import { ParsedResumeData } from '../types';

describe('SkillBridge Phase 4: User Data Isolation & Multi-Tenant Security', () => {
  beforeEach(() => {
    clearCandidateProfileStore();
  });

  it('TEST-04-ISO01: clearCandidateProfileStore clears cached candidate session on logout', async () => {
    setCandidateProfileStore({
      id: 'profile_1',
      user_id: 'user_1',
      full_name: 'User One',
      email: 'user1@example.com',
      desired_role_title: 'Developer',
      skills: [],
      projects: [],
      experience: [],
      created_at: new Date().toISOString()
    });

    let profile = await getCandidateProfile('user_1');
    expect(profile.user_id).toBe('user_1');

    clearCandidateProfileStore();

    // After clearing, querying for another user does not return user 1's store
    profile = await getCandidateProfile('user_2');
    expect(profile.user_id).not.toBe('user_1');
  });

  it('TEST-04-ISO02: saveCandidateProfileToDatabase binds candidate record to authenticated userId', async () => {
    const sampleParsed: ParsedResumeData = {
      full_name: 'Authenticated Candidate',
      email: 'auth_cand@example.com',
      summary: 'Experienced ML Engineer',
      desired_role_title: 'ML Engineer',
      skills: [
        {
          name: 'Python',
          normalized_name: 'python',
          proficiency_level: 'advanced',
          provenance_source: 'Resume PDF',
          provenance_context: 'Skills list',
          extraction_confidence: 'HIGH',
          source_evidence: 'Python developer'
        }
      ],
      projects: [
        {
          title: 'AI Vision Project',
          description: 'Object detection system',
          tech_stack: ['Python', 'PyTorch']
        }
      ],
      experiences: [
        {
          organization: 'Tech Corp',
          role_title: 'Software Engineer',
          duration_months: 24,
          description: 'Backend ML systems',
          is_current: true
        }
      ]
    };

    const targetUserId = 'usr_tenant_test_999';
    const profileId = await saveCandidateProfileToDatabase(sampleParsed, 'Raw Resume Text', targetUserId);
    expect(profileId).toBeTruthy();

    const retrieved = await getCandidateProfile(targetUserId);
    expect(retrieved.user_id).toBe(targetUserId);
    expect(retrieved.full_name).toBe('Authenticated Candidate');
    expect(retrieved.skills.length).toBeGreaterThan(0);
    expect(retrieved.skills[0].name).toBe('Python');
  });

  it('TEST-04-ISO03: User A cannot retrieve User B data from active store', async () => {
    const userA_id = 'user_alpha_01';
    const userB_id = 'user_beta_02';

    setCandidateProfileStore({
      id: 'prof_alpha',
      user_id: userA_id,
      full_name: 'Alpha User',
      email: 'alpha@example.com',
      desired_role_title: 'Cloud Architect',
      skills: [],
      projects: [],
      experience: [],
      created_at: new Date().toISOString()
    });

    const profA = await getCandidateProfile(userA_id);
    expect(profA.user_id).toBe(userA_id);
    expect(profA.full_name).toBe('Alpha User');

    // Querying for User B must not return User A's data
    const profB = await getCandidateProfile(userB_id);
    expect(profB.user_id).not.toBe(userA_id);
    expect(profB.full_name).not.toBe('Alpha User');
  });
});
