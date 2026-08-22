'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SignupSchema, evaluatePasswordStrength } from '@/lib/auth_validation';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle2, Check, X, Loader2 } from 'lucide-react';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const supabase = createClient();
  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});

    // Client-side Zod validation
    const validationResult = SignupSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        errors[path] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim()
          }
        }
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          setErrorMessage('This email is already registered. Please log in instead.');
        } else {
          setErrorMessage(error.message || 'Signup failed. Please check your details.');
        }
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        setSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
          router.push(redirectPath);
          router.refresh();
        }, 600);
      } else if (data?.user) {
        setSuccessMessage('Account created! Please check your email to confirm your account before logging in.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during signup.');
      setIsLoading(false);
    }
  };

  const getStrengthBarColor = () => {
    if (passwordStrength.label === 'Strong') return 'var(--success)';
    if (passwordStrength.label === 'Fair') return 'var(--warning)';
    return 'var(--destructive)';
  };

  return (
    <div>
      {/* Error alert */}
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.875rem',
            marginBottom: '1.25rem'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success alert */}
      {successMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.875rem',
            marginBottom: '1.25rem'
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        {/* Full Name */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--foreground)' }}>
            Full Name
          </label>
          <div style={{ position: 'relative' }}>
            <User
              size={18}
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}
            />
            <input
              id="signup-name"
              type="text"
              placeholder="e.g. Hitarth Desai"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                borderRadius: '12px',
                border: `1px solid ${fieldErrors.fullName ? 'rgba(239, 68, 68, 0.6)' : 'var(--border)'}`,
                background: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '0.95rem'
              }}
              required
            />
          </div>
          {fieldErrors.fullName && (
            <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem' }}>{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--foreground)' }}>
            Email address
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={18}
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}
            />
            <input
              id="signup-email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                borderRadius: '12px',
                border: `1px solid ${fieldErrors.email ? 'rgba(239, 68, 68, 0.6)' : 'var(--border)'}`,
                background: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '0.95rem'
              }}
              required
            />
          </div>
          {fieldErrors.email && (
            <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem' }}>{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--foreground)' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={18}
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}
            />
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 chars, uppercase, digit, special char"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 2.75rem 0.75rem 2.75rem',
                borderRadius: '12px',
                border: `1px solid ${fieldErrors.password ? 'rgba(239, 68, 68, 0.6)' : 'var(--border)'}`,
                background: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '0.95rem'
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Dynamic strength bar & requirements */}
          {password.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.725rem', color: 'var(--muted-foreground)' }}>Password strength</span>
                <span style={{ fontSize: '0.725rem', fontWeight: 700, color: getStrengthBarColor() }}>
                  {passwordStrength.label}
                </span>
              </div>
              <div style={{ height: '4px', width: '100%', background: 'var(--surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    background: getStrengthBarColor(),
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>

              {/* Requirements checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', marginTop: '0.5rem', fontSize: '0.725rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: passwordStrength.hasMinLength ? 'var(--success)' : 'var(--muted-foreground)' }}>
                  {passwordStrength.hasMinLength ? <Check size={12} /> : <X size={12} />}
                  <span>8+ Characters</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: passwordStrength.hasUppercase ? 'var(--success)' : 'var(--muted-foreground)' }}>
                  {passwordStrength.hasUppercase ? <Check size={12} /> : <X size={12} />}
                  <span>Uppercase letter</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: passwordStrength.hasLowercase ? 'var(--success)' : 'var(--muted-foreground)' }}>
                  {passwordStrength.hasLowercase ? <Check size={12} /> : <X size={12} />}
                  <span>Lowercase letter</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: passwordStrength.hasNumber ? 'var(--success)' : 'var(--muted-foreground)' }}>
                  {passwordStrength.hasNumber ? <Check size={12} /> : <X size={12} />}
                  <span>Number (0-9)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: passwordStrength.hasSpecial ? 'var(--success)' : 'var(--muted-foreground)' }}>
                  {passwordStrength.hasSpecial ? <Check size={12} /> : <X size={12} />}
                  <span>Special character</span>
                </div>
              </div>
            </div>
          )}

          {fieldErrors.password && (
            <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem' }}>{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--foreground)' }}>
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={18}
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}
            />
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 2.75rem 0.75rem 2.75rem',
                borderRadius: '12px',
                border: `1px solid ${fieldErrors.confirmPassword ? 'rgba(239, 68, 68, 0.6)' : 'var(--border)'}`,
                background: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '0.95rem'
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: 'absolute',
                right: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem' }}>{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* Submit */}
        <button
          id="signup-submit-btn"
          type="submit"
          disabled={isLoading}
          className="btn-primary"
          style={{
            marginTop: '0.5rem',
            width: '100%',
            padding: '0.85rem',
            justifyContent: 'center',
            fontSize: '0.95rem',
            borderRadius: '12px',
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader2 size={18} className="animate-spin" /> Creating account...
            </span>
          ) : (
            <>
              <span>Create account</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join SkillBridge AI to evaluate readiness and bridge your career gaps."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            Log in
          </Link>
        </>
      }
    >
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Loading sign up...</div>}>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
