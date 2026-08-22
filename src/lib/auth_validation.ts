import { z } from 'zod';

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  uppercaseRegex: /[A-Z]/,
  lowercaseRegex: /[a-z]/,
  numberRegex: /[0-9]/,
  specialCharRegex: /[!@#$%^&*(),.?":{}|<>\-_=+~`[\]\\/]/
};

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(PASSWORD_REQUIREMENTS.uppercaseRegex, 'Password must contain at least 1 uppercase letter')
  .regex(PASSWORD_REQUIREMENTS.numberRegex, 'Password must contain at least 1 number')
  .regex(PASSWORD_REQUIREMENTS.specialCharRegex, 'Password must contain at least 1 special character');

export const LoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const SignupSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long'),
    email: z.string().trim().email('Please enter a valid email address'),
    password: PasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;

export interface PasswordStrengthReport {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  score: number; // 0 to 5
  label: 'Weak' | 'Fair' | 'Strong';
  isValid: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthReport {
  const hasMinLength = password.length >= PASSWORD_REQUIREMENTS.minLength;
  const hasUppercase = PASSWORD_REQUIREMENTS.uppercaseRegex.test(password);
  const hasLowercase = PASSWORD_REQUIREMENTS.lowercaseRegex.test(password);
  const hasNumber = PASSWORD_REQUIREMENTS.numberRegex.test(password);
  const hasSpecial = PASSWORD_REQUIREMENTS.specialCharRegex.test(password);

  const checks = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial];
  const score = checks.filter(Boolean).length;

  let label: 'Weak' | 'Fair' | 'Strong' = 'Weak';
  if (score === 5) {
    label = 'Strong';
  } else if (score >= 3) {
    label = 'Fair';
  }

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    score,
    label,
    isValid: hasMinLength && hasUppercase && hasNumber && hasSpecial
  };
}
