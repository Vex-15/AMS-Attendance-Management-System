'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import ThemeToggle from '@/components/theme-toggle';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  Layers,
  LineChart,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const demoAccounts = [
  {
    email: 'aarav.sharma0@mitaoe.edu.in',
    password: 'student123',
    role: 'Student',
    icon: GraduationCap,
    gradient: 'from-sky-400 via-indigo-500 to-violet-500',
    tile: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
  },
  {
    email: 'deshmukh@mitaoe.edu.in',
    password: 'teacher123',
    role: 'Faculty',
    icon: BookOpen,
    gradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
    tile: 'border-violet-400/25 bg-violet-400/10 text-violet-200',
  },
  {
    email: 'admin@mitaoe.edu.in',
    password: 'admin123',
    role: 'Admin',
    icon: Shield,
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    tile: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  },
];

const highlights = [
  {
    icon: LineChart,
    title: 'Live academic analytics',
    body: 'Attendance, subject trends and class averages in one continuously updated view.',
  },
  {
    icon: ShieldCheck,
    title: 'Early risk detection',
    body: 'Know exactly how many lectures stand between you and the 75% threshold.',
  },
  {
    icon: Layers,
    title: 'Built for every role',
    body: 'Distinct workspaces for students, faculty and administrators — same source of truth.',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const redirectForRole = (role?: string) => {
    if (role === 'student') router.push('/dashboard/student');
    else if (role === 'teacher') router.push('/dashboard/teacher');
    else if (role === 'admin') router.push('/dashboard/admin');
  };

  useEffect(() => {
    if (isAuthenticated) {
      const user = JSON.parse(localStorage.getItem('mitaoe_user') || '{}');
      redirectForRole(user.role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem('mitaoe_user') || '{}');
      redirectForRole(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (demoEmail: string, demoPassword: string) => {
    setError('');
    setIsLoading(true);
    setEmail(demoEmail);
    setPassword(demoPassword);

    try {
      await login(demoEmail, demoPassword);
      const user = JSON.parse(localStorage.getItem('mitaoe_user') || '{}');
      redirectForRole(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div id="content" tabIndex={-1} className="relative min-h-screen overflow-hidden focus:outline-none">
      <div className="absolute right-5 top-5 z-20 lg:right-8 lg:top-6">
        <ThemeToggle withLabel />
      </div>
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-12 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10 lg:py-14">
        {/* ───────────────── Brand narrative ───────────────── */}
        <section className="hidden lg:block">
          <div className="animate-slide-up">
            <div className="flex items-center gap-3">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-[0_16px_40px_-18px_rgba(99,102,241,0.9)]">
                <GraduationCap className="h-5 w-5 text-white" />
                <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/25" />
              </span>
              <div>
                <p className="text-[15px] font-semibold tracking-tight text-white">MITAOE</p>
                <p className="text-[11px] font-medium tracking-wide text-slate-500">
                  Academic Intelligence Platform
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 animate-slide-up" style={{ animationDelay: '80ms' }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-300">
              <Sparkles className="h-3 w-3 text-indigo-300" />
              MIT Academy of Engineering, Pune
            </span>
            <h1 className="mt-6 max-w-xl text-[44px] font-semibold leading-[1.06] tracking-[-0.035em] text-shine">
              Attendance clarity,
              <br />
              engineered for campus.
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-slate-400">
              A single, quiet workspace for attendance records, subject-level
              insight and early academic warning — for every student, every
              lecture, every division.
            </p>
          </div>

          <div
            className="mt-10 max-w-lg space-y-2.5 animate-slide-up"
            style={{ animationDelay: '160ms' }}
          >
            {highlights.map((item) => (
              <div
                key={item.title}
                className="group feature-tile flex items-start gap-3.5 rounded-2xl p-4 transition-all duration-500 hover:border-white/15 hover:bg-white/[0.055]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-indigo-300 transition-transform duration-500 group-hover:scale-105">
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-10 flex items-center gap-6 animate-slide-up"
            style={{ animationDelay: '240ms' }}
          >
            {[
              { value: '1,000+', label: 'Attendance records' },
              { value: '180', label: 'Subject sections' },
              { value: '99.9%', label: 'Platform uptime' },
            ].map((stat) => (
              <div key={stat.label} className="border-l border-white/10 pl-4 first:border-0 first:pl-0">
                <p className="tnum text-lg font-semibold text-white">{stat.value}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────────── Sign in ───────────────── */}
        <section className="mx-auto w-full max-w-[430px]">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-lg shadow-indigo-500/25">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">MITAOE</p>
              <p className="text-[10px] text-slate-500">Academic Intelligence Platform</p>
            </div>
          </div>

          <div className="animate-scale-in">
            <div className="glass-card sheen relative rounded-[26px] p-7 sm:p-8">
              {/* top hairline accent */}
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

              <div className="mb-7">
                <h2 className="text-[22px] font-semibold tracking-tight text-white">
                  Sign in
                </h2>
                <p className="mt-1.5 text-[13px] text-slate-400">
                  Continue to your academic workspace.
                </p>
              </div>

              {error && (
                <div className="animate-slide-down mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-3 text-xs text-rose-200">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    <Mail className="h-3 w-3" />
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@mitaoe.edu.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      autoComplete="email"
                      className="glass-input h-12 rounded-xl border-white/10 bg-white/[0.035] pl-11 text-sm text-white placeholder:text-slate-600 focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    <Lock className="h-3 w-3" />
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="glass-input h-12 rounded-xl border-white/10 bg-white/[0.035] pl-11 pr-11 text-sm text-white placeholder:text-slate-600 focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition-colors hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="gradient-btn group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
                  Demo access
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {demoAccounts.map((account) => {
                  const Icon = account.icon;
                  return (
                    <button
                      key={account.role}
                      onClick={() => quickLogin(account.email, account.password)}
                      disabled={isLoading}
                      className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-2 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06] disabled:opacity-50"
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border ${account.tile} transition-transform duration-300 group-hover:scale-105`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[11px] font-semibold text-slate-200">
                        {account.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="mt-7 text-center text-[11px] leading-relaxed text-slate-600">
            MIT Academy of Engineering, Pune · Attendance &amp; Academic
            Intelligence v2.0
          </p>
        </section>
      </div>
    </div>
  );
}
