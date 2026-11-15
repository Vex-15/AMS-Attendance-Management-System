'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CommandPalette from '@/components/command-palette';
import ThemeToggle from '@/components/theme-toggle';
import {
  BookOpen,
  ChevronDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  Trophy,
  X,
} from 'lucide-react';

export type NavRole = 'student' | 'teacher' | 'admin';

interface AppNavProps {
  userName: string;
  onLogout: () => void;
  role: NavRole;
}

export interface NavLinkDef {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface RoleConfig {
  portal: string;
  icon: typeof LayoutDashboard;
  home: string;
  badge: string;
  gradient: string;
  ring: string;
  badgeStyle: string;
  links: NavLinkDef[];
}

const roleConfig: Record<NavRole, RoleConfig> = {
  student: {
    portal: 'Student Portal',
    icon: GraduationCap,
    home: '/dashboard/student',
    badge: 'Student',
    gradient: 'from-sky-400 via-indigo-500 to-violet-500',
    ring: 'shadow-[0_10px_28px_-14px_rgba(99,102,241,0.9)]',
    badgeStyle: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
    links: [
      { href: '/dashboard/student', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
      { href: '/dashboard/analytics', label: 'Student explorer', icon: Search },
      { href: '/dashboard/student/report', label: 'Report', icon: FileText },
    ],
  },
  teacher: {
    portal: 'Faculty Portal',
    icon: BookOpen,
    home: '/dashboard/teacher',
    badge: 'Faculty',
    gradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
    ring: 'shadow-[0_10px_28px_-14px_rgba(168,85,247,0.9)]',
    badgeStyle: 'border-violet-400/25 bg-violet-400/10 text-violet-200',
    links: [
      { href: '/dashboard/teacher', label: 'Class Analytics', icon: LayoutDashboard },
      { href: '/dashboard/analytics', label: 'Student explorer', icon: Search },
      { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  admin: {
    portal: 'Administration',
    icon: Shield,
    home: '/dashboard/admin',
    badge: 'Admin',
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    ring: 'shadow-[0_10px_28px_-14px_rgba(251,146,60,0.9)]',
    badgeStyle: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
    links: [{ href: '/dashboard/admin', label: 'System Overview', icon: LayoutDashboard }],
  },
};

export function getNavLinks(role: NavRole): NavLinkDef[] {
  return roleConfig[role].links;
}

export default function AppNav({ userName, onLogout, role }: AppNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const config = roleConfig[role];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mitaoe_user') || '{}');
      if (typeof stored.email === 'string') setEmail(stored.email);
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLogout = () => {
    onLogout();
    router.push('/');
  };

  // The most specific matching link wins (so /report doesn't light up Dashboard).
  const activeHref = config.links
    .filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const initial = userName?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <nav
      className={`glass-nav sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'nav-scrolled' : ''
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link href={config.home} className="group flex items-center gap-3">
          <span
            className={`relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} ${config.ring} transition-transform duration-500 group-hover:scale-105`}
          >
            <config.icon className="h-[18px] w-[18px] text-white" />
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/25" />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[13px] font-semibold tracking-tight text-white">
              MITAOE
            </span>
            <span className="block text-[10px] font-medium tracking-wide text-slate-500">
              {config.portal}
            </span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-0.5 rounded-full border border-white/[0.06] bg-white/[0.03] p-1 md:flex">
          {config.links.map((link) => {
            const Icon = link.icon;
            const active = link.href === activeHref;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
                  active
                    ? 'bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.09)]'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-indigo-300' : ''}`} />
                {link.label}
              </Link>
            );
          })}
        </div>

        <CommandPalette role={role} />

        <ThemeToggle className="shrink-0" />

        {/* Desktop user */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 rounded-full border border-white/[0.07] bg-white/[0.035] py-1 pl-1 pr-2.5 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.07]"
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${config.gradient} text-[11px] font-bold text-white`}
            >
              {initial}
            </span>
            <span className="max-w-[120px] truncate text-xs font-medium text-slate-200">
              {userName}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-300 ${
                menuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {menuOpen && (
            <>
              <button
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div
                role="menu"
                className="popover-surface animate-slide-down absolute right-0 z-50 mt-2 w-64 rounded-2xl p-2"
              >
                <div className="rounded-xl bg-white/[0.03] px-3 py-3">
                  <p className="truncate text-sm font-semibold text-white">{userName}</p>
                  {email && (
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">{email}</p>
                  )}
                  <span
                    className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.badgeStyle}`}
                  >
                    <config.icon className="h-2.5 w-2.5" />
                    {config.badge}
                  </span>
                </div>
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
                <div className="mt-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-400">
                  Appearance
                  <ThemeToggle className="h-7 px-2 text-[11px]" withLabel />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08] md:hidden"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="animate-slide-down border-t border-white/[0.06] bg-[#080b14]/95 px-4 pb-4 pt-3 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-3">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${config.gradient} text-xs font-bold text-white`}
            >
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{userName}</p>
              <p className="text-[10px] text-slate-500">{config.portal}</p>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            {config.links.map((link) => {
              const Icon = link.icon;
              const active = link.href === activeHref;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2.5 rounded-xl border-t border-white/[0.06] px-3 py-2.5 text-sm font-medium text-rose-300/90 transition-colors hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
