'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, ArrowRight, User, LogOut, LayoutDashboard, Upload, FileText, Target } from 'lucide-react';

export function SiteNavbar() {
  const pathname = usePathname();
  const { user, signOut, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Marketplace' },
    { href: '/upload', label: 'Upload Resume' },
    { href: '/profile', label: 'Candidate Profile' }
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border)',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'background-color 0.25s ease'
      }}
    >
      <style jsx>{`
        .desktop-nav {
          display: none;
        }
        @media (min-width: 900px) {
          .desktop-nav {
            display: flex !important;
            align-items: center;
            gap: 0.35rem;
          }
        }
        .sm-show {
          display: none;
        }
        @media (min-width: 640px) {
          .sm-show {
            display: inline !important;
          }
        }
        .mobile-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.4rem;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--foreground);
          cursor: pointer;
        }
        @media (min-width: 900px) {
          .mobile-toggle {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <Logo />

        {/* Desktop Nav Links */}
        <nav className="desktop-nav">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '9999px',
                  background: isActive ? 'var(--surface-2)' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ThemeToggle />

          {!isLoading && (
            <>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Link
                    href="/dashboard"
                    className="btn-primary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.825rem' }}
                  >
                    <LayoutDashboard size={14} />
                    <span>Dashboard</span>
                  </Link>

                  <button
                    onClick={signOut}
                    title="Log out"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '9999px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={13} />
                    <span className="sm-show">Logout</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Link
                    href="/login"
                    style={{
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--muted-foreground)',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '9999px',
                      transition: 'color 0.15s'
                    }}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/upload"
                    className="btn-primary"
                    style={{ padding: '0.45rem 1.15rem', fontSize: '0.85rem' }}
                  >
                    <span>Analyze Resume</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="mobile-toggle"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--background)',
            padding: '1rem 1.5rem 1.5rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                textDecoration: 'none',
                fontSize: '0.925rem',
                fontWeight: 600,
                color: pathname === link.href ? 'var(--primary)' : 'var(--foreground)',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                background: pathname === link.href ? 'var(--surface-2)' : 'transparent'
              }}
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
export default SiteNavbar;
