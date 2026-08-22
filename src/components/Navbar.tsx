'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, LogIn, Sparkles } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut, isLoading } = useAuth();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Upload Resume', path: '/upload' },
    { label: 'Candidate Profile', path: '/profile' },
    { label: 'Dashboard', path: '/dashboard' }
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.85rem 2rem',
      transition: 'background-color 0.25s ease'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#ffffff',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}>
            SB
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Skill<span style={{ color: '#6366f1' }}>Bridge</span>
            </span>
            <span style={{
              display: 'inline-block',
              marginLeft: '0.5rem',
              fontSize: '0.65rem',
              fontWeight: '700',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              AI ACTIVE
            </span>
          </div>
        </Link>

        {/* Nav Links & Theme Toggle & Auth Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {navItems.map(item => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  style={{
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    background: isActive ? 'var(--border-color)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <ThemeToggle />

          {/* User Auth Section */}
          {!isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)'
                  }}>
                    <User size={14} style={{ color: '#818cf8' }} />
                    <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </span>
                  </div>

                  <button
                    id="nav-logout-btn"
                    onClick={signOut}
                    title="Log out"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Link
                    href="/login"
                    style={{
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <LogIn size={14} />
                    <span>Sign In</span>
                  </Link>

                  <Link
                    href="/signup"
                    style={{
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      padding: '0.45rem 0.95rem',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
