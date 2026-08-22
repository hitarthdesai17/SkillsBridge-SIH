'use client';

import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  User,
  Target,
  Search,
  Bell,
  Sparkles,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/context/AuthContext';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [headerSearch, setHeaderSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Marketplace', icon: LayoutDashboard },
    { href: '/upload', label: 'Upload Resume', icon: Upload },
    { href: '/profile', label: 'Candidate Profile', icon: User },
    { href: '/dashboard#opportunities', label: 'Opportunities', icon: Target },
  ];

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Candidate';
  const userInitials = (userDisplayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)) || 'SB';

  return (
    <div className="app-shell-root">
      <style jsx>{`
        .app-shell-root {
          min-height: 100vh;
          background-color: var(--background);
          display: grid;
          grid-template-columns: 1fr;
          width: 100%;
        }

        @media (min-width: 1024px) {
          .app-shell-root {
            grid-template-columns: 260px 1fr;
          }
        }

        .desktop-sidebar {
          display: none;
        }

        @media (min-width: 1024px) {
          .desktop-sidebar {
            display: flex;
            flex-direction: column;
            width: 260px;
            height: 100vh;
            position: sticky;
            top: 0;
            left: 0;
            z-index: 40;
            background-color: var(--sidebar);
            border-right: 1px solid var(--border);
            overflow-y: auto;
          }
        }

        .app-main-column {
          display: flex;
          flex-direction: column;
          min-width: 0;
          width: 100%;
          overflow-x: hidden;
        }

        .app-top-header {
          position: sticky;
          top: 0;
          z-index: 30;
          height: 64px;
          border-bottom: 1px solid var(--border);
          background-color: var(--nav-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justifyContent: space-between;
          padding: 0 1.25rem;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .app-top-header {
            padding: 0 2rem;
          }
        }

        .mobile-logo-wrap {
          display: flex;
          align-items: center;
        }

        @media (min-width: 1024px) {
          .mobile-logo-wrap {
            display: none !important;
          }
        }

        .header-crumb {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--foreground);
          display: none;
        }

        @media (min-width: 1024px) {
          .header-crumb {
            display: block;
          }
        }

        .header-search-container {
          display: none;
          position: relative;
          max-width: 320px;
          width: 100%;
          min-width: 0;
        }

        @media (min-width: 768px) {
          .header-search-container {
            display: block;
          }
        }

        .user-name-text {
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--foreground);
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: none;
        }

        @media (min-width: 640px) {
          .user-name-text {
            display: inline-block;
          }
        }

        .logout-btn-label {
          display: none;
        }

        @media (min-width: 640px) {
          .logout-btn-label {
            display: inline;
          }
        }

        .app-content-container {
          flex: 1;
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 1.5rem 1rem 4rem 1rem;
          box-sizing: border-box;
        }

        @media (min-width: 640px) {
          .app-content-container {
            padding: 2rem 1.5rem 5rem 1.5rem;
          }
        }

        @media (min-width: 1024px) {
          .app-content-container {
            padding: 2.25rem 2rem 5rem 2rem;
          }
        }

        .mobile-bottom-bar {
          display: flex;
          position: sticky;
          bottom: 0;
          z-index: 30;
          border-top: 1px solid var(--border);
          background-color: var(--nav-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          justify-content: space-around;
          padding: 0.5rem 0.75rem;
          width: 100%;
        }

        @media (min-width: 1024px) {
          .mobile-bottom-bar {
            display: none !important;
          }
        }
      `}</style>

      {/* Desktop Sticky Sidebar */}
      <aside className="desktop-sidebar">
        {/* Brand Header */}
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <Logo />
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname.startsWith('/opportunity'));
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                  background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--primary)' : 'inherit', flexShrink: 0 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* AI Career Coach Card */}
        <div
          style={{
            margin: '0.75rem',
            padding: '1rem',
            borderRadius: '16px',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.825rem' }}>
            <Sparkles size={15} />
            <span>AI Career Readiness</span>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', lineHeight: 1.5, color: 'var(--muted-foreground)' }}>
            Deterministic scoring &amp; gap-targeted portfolio blueprints.
          </p>
          <Link
            href="/upload"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.65rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--primary)',
              textDecoration: 'none'
            }}
          >
            Upload Resume <ArrowRight size={12} />
          </Link>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="app-main-column">
        {/* Top Header */}
        <header className="app-top-header">
          {/* Left Region */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="mobile-logo-wrap">
              <Logo compact />
            </div>
            <span className="header-crumb">
              SkillBridge Operating System
            </span>
          </div>

          {/* Center Region */}
          <div className="header-search-container">
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)'
              }}
            />
            <input
              type="text"
              placeholder="Search opportunities, skills, gaps..."
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.4rem',
                paddingRight: '0.85rem',
                paddingTop: '0.45rem',
                paddingBottom: '0.45rem',
                fontSize: '0.825rem',
                borderRadius: '12px'
              }}
            />
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            <ThemeToggle />

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer'
                }}
              >
                <Bell size={16} />
                <span
                  style={{
                    position: 'absolute',
                    top: '7px',
                    right: '7px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)'
                  }}
                />
              </button>
            </div>

            {/* User Profile Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.2rem 0.55rem 0.2rem 0.3rem',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--surface)'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'var(--gradient-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#ffffff'
                }}
              >
                {userInitials}
              </div>
              <span className="user-name-text">
                {userDisplayName}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={signOut}
              title="Log out"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} />
              <span className="logout-btn-label">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="app-content-container">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-bottom-bar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  textDecoration: 'none',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                  padding: '0.25rem 0.5rem'
                }}
              >
                <Icon size={18} />
                <span>{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
export default AppShell;
