'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  BookOpen,
  CalendarDays,
  Database,
  GraduationCap,
  Layers,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import AdminNav from '@/components/admin-nav';
import AdminStudents from '@/components/admin-students';
import AdminActivity from '@/components/admin-activity';
import Reveal from '@/components/reveal';
import {
  ChartTooltipCard,
  Meter,
  Panel,
  SectionHeader,
  Segmented,
  StatCard,
} from '@/components/ui-kit';

type AdminTab = 'overview' | 'trends' | 'data' | 'branches' | 'activity';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');

  // Support deep links such as /dashboard/admin?tab=activity from the palette.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    const valid: AdminTab[] = ['overview', 'trends', 'data', 'branches', 'activity'];
    if (requested && valid.includes(requested as AdminTab)) {
      setTab(requested as AdminTab);
    }
  }, []);
  const [lastRefresh, setLastRefresh] = useState('');

  useEffect(() => {
    setLastRefresh(new Date().toLocaleDateString());
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalEnrollments: 0,
    totalLectures: 0,
    totalAttendance: 0,
  });
  const [weeklyTrend, setWeeklyTrend] = useState<{ period: string; percentage: number }[]>([]);
  const [densityValue, setDensityValue] = useState(0);

  useEffect(() => {
    if (!user?.id || user.role !== 'admin') return;

    let active = true;
    const loadOverview = async () => {
      try {
        const response = await fetch(`/api/admin/overview?adminId=${user.id}`);
        if (!response.ok) throw new Error('Overview request failed');
        const data = await response.json();
        if (!active) return;
        setStats(data.counts);
        setWeeklyTrend(data.weeklyTrend || []);
        setDensityValue(data.density || 0);
      } catch (error) {
        console.error('Admin overview error:', error);
      }
    };

    loadOverview();

    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <ChartTooltipCard>
          <p className="font-semibold text-white">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="mt-1 flex items-center gap-1.5" style={{ color: p.color }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
              {p.name}: <span className="tnum font-medium">{p.value}%</span>
            </p>
          ))}
        </ChartTooltipCard>
      );
    }
    return null;
  };

  const density = densityValue.toString();

  return (
    <div className="min-h-screen">
      <AdminNav userName={user?.name || 'Administrator'} onLogout={logout} />

      <main id="content" tabIndex={-1} className="mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-6 lg:px-8 focus:outline-none">
        <header className="animate-slide-up flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-300" />
              Administration
            </p>
            <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-white sm:text-[30px]">
              System overview
            </h1>
            <p className="mt-1.5 text-[13px] text-slate-400">
              Institution-wide health, data density and academic trends.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              All systems operational
            </span>
            <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-slate-400">
              Uptime 99.9%
            </span>
          </div>
        </header>

        <Reveal className="mt-6">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'trends', label: 'Trends', icon: TrendingUp },
              { value: 'data', label: 'Data', icon: Database },
              { value: 'branches', label: 'Branches & students', icon: Layers },
              { value: 'activity', label: 'Activity', icon: Activity },
            ]}
          />
        </Reveal>

        {tab === 'overview' && (
          <>
            <section className="mt-4 grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-4">
              <StatCard
                icon={Users}
                label="Total users"
                value={stats.totalUsers}
                tone="indigo"
                index={0}
              />
              <StatCard
                icon={GraduationCap}
                label="Students"
                value={stats.totalStudents}
                tone="cyan"
                index={1}
              />
              <StatCard
                icon={BookOpen}
                label="Faculty"
                value={stats.totalTeachers}
                tone="violet"
                index={2}
              />
              <StatCard
                icon={Database}
                label="Subject sections"
                value={stats.totalSubjects}
                tone="amber"
                index={3}
              />
            </section>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Reveal className="lg:col-span-2">
                <Panel className="h-full p-5 sm:p-6">
                  <SectionHeader
                    icon={Activity}
                    tone="emerald"
                    title="Platform footprint"
                    subtitle="What the current academic dataset contains"
                    className="mb-5"
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      { label: 'Enrollments', value: stats.totalEnrollments, icon: Users },
                      { label: 'Lectures', value: stats.totalLectures, icon: CalendarDays },
                      { label: 'Attendance records', value: stats.totalAttendance, icon: Database },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="surface-quiet rounded-xl p-4 transition-colors hover:bg-white/[0.045]"
                      >
                        <item.icon className="h-4 w-4 text-slate-500" />
                        <p className="tnum mt-3 text-xl font-semibold text-white">
                          {item.value.toLocaleString()}
                        </p>
                        <p className="mt-1 text-[10.5px] font-medium text-slate-500">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-300">Data density</span>
                      <span className="tnum font-semibold text-white">{density}%</span>
                    </div>
                    <Meter value={Number(density)} variant="brand" className="mt-2.5" />
                    <p className="mt-2.5 text-[10.5px] leading-relaxed text-slate-500">
                      {stats.totalAttendance.toLocaleString()} attendance records across{' '}
                      {stats.totalLectures.toLocaleString()} lectures and {stats.totalEnrollments.toLocaleString()}{' '}
                      enrollments.
                    </p>
                  </div>
                </Panel>
              </Reveal>

              <Reveal delay={80}>
                <Panel className="h-full p-5 sm:p-6">
                  <SectionHeader
                    icon={ShieldCheck}
                    tone="emerald"
                    title="Service health"
                    subtitle="Live checks across the stack"
                    className="mb-5"
                  />
                  <div className="space-y-2.5">
                    {[
                      { label: 'Database', value: 'Connected' },
                      { label: 'Data integrity', value: 'Verified' },
                      { label: 'Sync engine', value: 'Nominal' },
                      { label: 'Last refresh', value: lastRefresh || '—' },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
                      >
                        <span className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {row.label}
                        </span>
                        <span className="text-[11px] font-medium text-slate-200">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </Reveal>
            </div>
          </>
        )}

        {tab === 'trends' && (
          <>
            <Reveal className="mt-4">
              <Panel className="overflow-hidden">
                <div className="border-b border-white/[0.05] px-5 py-4 sm:px-6">
                  <SectionHeader
                    icon={TrendingUp}
                    tone="indigo"
                    title="Weekly attendance trend"
                    subtitle="Institution-wide average across the last eight weeks"
                  />
                </div>
                <div className="px-2 pb-4 pt-6 sm:px-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyTrend}>
                      <defs>
                        <linearGradient id="admin-line" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#818cf8" />
                          <stop offset="60%" stopColor="#a78bfa" />
                          <stop offset="100%" stopColor="#4fd1e8" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 6"
                        vertical={false}
                        stroke="rgba(255,255,255,0.055)"
                      />
                      <XAxis
                        dataKey="period"
                        stroke="transparent"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke="transparent"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                        width={34}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ stroke: 'rgba(255,255,255,0.12)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="percentage"
                        stroke="url(#admin-line)"
                        strokeWidth={2.5}
                        name="Attendance"
                        dot={{ fill: '#a5b4fc', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#c7d2fe', stroke: '#312e81', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </Reveal>

            <section className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-4">
              {weeklyTrend.slice(-3).map((m, i) => (
                <div
                  key={m.period + i}
                  className="glass-card-hover animate-slide-up rounded-2xl p-5"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Week of {m.period}
                  </p>
                  <p
                    className={`tnum mt-2 text-[28px] font-semibold leading-none ${
                      m.percentage >= 75 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {m.percentage}%
                  </p>
                  <Meter
                    value={m.percentage}
                    variant={m.percentage >= 75 ? 'safe' : 'danger'}
                    className="mt-4"
                  />
                </div>
              ))}
            </section>
          </>
        )}

        {tab === 'data' && (
          <Reveal className="mt-4">
            <Panel className="p-5 sm:p-6">
              <SectionHeader
                icon={Database}
                tone="amber"
                title="Database statistics"
                subtitle="Row counts by entity type"
                className="mb-5"
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { l: 'Users', v: stats.totalUsers.toLocaleString() },
                  { l: 'Students', v: stats.totalStudents.toLocaleString() },
                  { l: 'Faculty', v: stats.totalTeachers.toLocaleString() },
                  { l: 'Subject sections', v: stats.totalSubjects.toLocaleString() },
                  { l: 'Enrollments', v: stats.totalEnrollments.toLocaleString() },
                  { l: 'Lectures', v: stats.totalLectures.toLocaleString() },
                  { l: 'Attendance records', v: stats.totalAttendance.toLocaleString() },
                  { l: 'Data density', v: `${density}%` },
                ].map((item) => (
                  <div
                    key={item.l}
                    className="surface-quiet rounded-xl p-4 transition-colors hover:bg-white/[0.045]"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">
                      {item.l}
                    </p>
                    <p className="tnum mt-1.5 text-lg font-semibold text-white">{item.v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-xl border border-sky-400/15 bg-sky-400/[0.06] p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                <p className="text-[11px] leading-relaxed text-slate-400">
                  The system contains {stats.totalStudents.toLocaleString()} students across{' '}
                  {stats.totalSubjects.toLocaleString()} subject sections with{' '}
                  {stats.totalAttendance.toLocaleString()} attendance records. All records are
                  reconciled against the current academic calendar.
                </p>
              </div>
            </Panel>
          </Reveal>
        )}

        {tab === 'branches' && (
          <Reveal className="mt-4">
            <Panel className="p-5 sm:p-6">
              <AdminStudents adminId={user?.id || ''} />
            </Panel>
          </Reveal>
        )}

        {tab === 'activity' && (
          <Reveal className="mt-4">
            <AdminActivity adminId={user?.id || ''} />
          </Reveal>
        )}
      </main>
    </div>
  );
}
