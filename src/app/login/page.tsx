'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoginSchema } from '@/lib/auth_validation';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});

    // Client-side Zod validation
    const validationResult = LoginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const errors: { email?: string; password?: string } = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0] === 'email') errors.email = err.message;
        if (err.path[0] === 'password') errors.password = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMessage('Invalid email or password. Please double check your credentials.');
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          setErrorMessage('Please confirm your email address before logging in.');
        } else {
          setErrorMessage(error.message || 'Authentication failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        setSuccessMessage('Logged in successfully! Redirecting...');
        setTimeout(() => {
          router.push(redirectPath);
          router.refresh();
        }, 500);
      }
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('network')) {
        setErrorMessage('Unable to connect to authentication server. Please verify your internet connection or click "Instant Demo Access" below.');
      } else {
        setErrorMessage(errMsg || 'An unexpected error occurred during login.');
      }
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage('Initializing instant demo access...');

    try {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      setSuccessMessage('Demo access ready! Redirecting...');
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 400);
    } catch (err) {
      router.push(redirectPath);
    }
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
            marginBottom: '1.5rem'
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
            marginBottom: '1.5rem'
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Email Field */}
        <div>
          <label
            htmlFor="login-email"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--foreground)',
              marginBottom: '0.5rem'
            }}
          >
            Email Address
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={18}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)'
              }}
            />
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem 0.85rem 2.85rem',
                borderRadius: '12px',
                background: 'var(--surface-2)',
                border: `1px solid ${fieldErrors.email ? '#ef4444' : 'var(--border)'}`,
                color: 'var(--foreground)',
                fontSize: '0.925rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          {fieldErrors.email && (
            <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem' }}>{fieldErrors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label
              htmlFor="login-password"
              style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}
            >
              Password
            </label>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock
              size={18}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)'
              }}
            />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 2.85rem 0.85rem 2.85rem',
                borderRadius: '12px',
                background: 'var(--surface-2)',
                border: `1px solid ${fieldErrors.password ? '#ef4444' : 'var(--border)'}`,
                color: 'var(--foreground)',
                fontSize: '0.925rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                padding: 0
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password && (
            <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem' }}>{fieldErrors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          id="login-submit-btn"
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
              <Loader2 size={18} className="animate-spin" /> Signing in...
            </span>
          ) : (
            <>
              <span>Log in</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* One-Click Instant Demo Login */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="btn-secondary"
          style={{
            width: '100%',
            padding: '0.75rem',
            justifyContent: 'center',
            fontSize: '0.875rem',
            borderRadius: '12px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            border: '1px dashed var(--primary)',
            background: 'rgba(99, 102, 241, 0.08)'
          }}
        >
          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
          <span>Instant Demo Access (One Click)</span>
        </button>
      </form>

      {/* Guest Explore Shortcut */}
      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.825rem',
            fontWeight: 600,
            color: 'var(--muted-foreground)',
            textDecoration: 'none'
          }}
        >
          <Sparkles size={13} style={{ color: 'var(--primary)' }} />
          <span>Explore Opportunity Marketplace</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Pick up where your career readiness analysis left off."
      footer={
        <>
          New to SkillBridge?{' '}
          <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
