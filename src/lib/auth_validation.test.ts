import { describe, it, expect } from 'vitest';
import {
  PasswordSchema,
  LoginSchema,
  SignupSchema,
  evaluatePasswordStrength
} from './auth_validation';

describe('SkillBridge Phase 4: Password Security Policy & Auth Validation', () => {
  describe('Password Policy Enforcement', () => {
    it('TEST-04-AUTH01: accepts valid password satisfying all 5 criteria', () => {
      const validPasswords = [
        'TEST_USER1!',
        'SecureP@ss123',
        'C0mpl3x#P@ss',
        'Valid123!@#'
      ];

      for (const pwd of validPasswords) {
        const result = PasswordSchema.safeParse(pwd);
        expect(result.success).toBe(true);
      }
    });

    it('TEST-04-AUTH02: rejects spec-defined invalid passwords', () => {
      const invalidPasswords = [
        { pwd: 'password', reason: 'all lowercase, no number, no special' },
        { pwd: '12345678', reason: 'numbers only' },
        { pwd: 'TESTUSER', reason: 'uppercase only' },
        { pwd: 'TestUser1', reason: 'missing special character' },
        { pwd: 'TestUser!', reason: 'missing number' },
        { pwd: 'Short1!', reason: 'too short (< 8 chars)' },
        { pwd: '', reason: 'empty string' }
      ];

      for (const { pwd } of invalidPasswords) {
        const result = PasswordSchema.safeParse(pwd);
        expect(result.success).toBe(false);
      }
    });

    it('TEST-04-AUTH03: dynamic strength evaluator accurately breaks down rules', () => {
      const weak = evaluatePasswordStrength('short');
      expect(weak.hasMinLength).toBe(false);
      expect(weak.hasUppercase).toBe(false);
      expect(weak.hasLowercase).toBe(true);
      expect(weak.hasNumber).toBe(false);
      expect(weak.hasSpecial).toBe(false);
      expect(weak.label).toBe('Weak');
      expect(weak.isValid).toBe(false);

      const fair = evaluatePasswordStrength('TestUser1');
      expect(fair.hasMinLength).toBe(true);
      expect(fair.hasUppercase).toBe(true);
      expect(fair.hasLowercase).toBe(true);
      expect(fair.hasNumber).toBe(true);
      expect(fair.hasSpecial).toBe(false);
      expect(fair.label).toBe('Fair');
      expect(fair.isValid).toBe(false);

      const strong = evaluatePasswordStrength('TEST_USER1!');
      expect(strong.hasMinLength).toBe(true);
      expect(strong.hasUppercase).toBe(true);
      expect(strong.hasLowercase).toBe(true);
      expect(strong.hasNumber).toBe(true);
      expect(strong.hasSpecial).toBe(true);
      expect(strong.label).toBe('Strong');
      expect(strong.isValid).toBe(true);
    });
  });

  describe('Signup Schema Validation', () => {
    it('TEST-04-AUTH04: validates complete signup input successfully', () => {
      const validSignup = {
        fullName: 'Test User',
        email: 'test_user@skillbridge.local',
        password: 'TEST_USER1!',
        confirmPassword: 'TEST_USER1!'
      };

      const result = SignupSchema.safeParse(validSignup);
      expect(result.success).toBe(true);
    });

    it('TEST-04-AUTH05: rejects signup when passwords do not match', () => {
      const mismatchedSignup = {
        fullName: 'Test User',
        email: 'test_user@skillbridge.local',
        password: 'TEST_USER1!',
        confirmPassword: 'DIFFERENT_PASSWORD1!'
      };

      const result = SignupSchema.safeParse(mismatchedSignup);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Passwords don't match");
      }
    });

    it('TEST-04-AUTH06: rejects signup with invalid email format', () => {
      const invalidEmail = {
        fullName: 'Test User',
        email: 'not-an-email',
        password: 'TEST_USER1!',
        confirmPassword: 'TEST_USER1!'
      };

      const result = SignupSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });
  });

  describe('Login Schema Validation', () => {
    it('TEST-04-AUTH07: validates valid login payload', () => {
      const validLogin = {
        email: 'test_user@skillbridge.local',
        password: 'TEST_USER1!'
      };

      const result = LoginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('TEST-04-AUTH08: rejects login with invalid email or empty password', () => {
      expect(LoginSchema.safeParse({ email: 'bad-email', password: '123' }).success).toBe(false);
      expect(LoginSchema.safeParse({ email: 'valid@example.com', password: '' }).success).toBe(false);
    });
  });
});
