'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Flame,
  Gauge,
  TriangleAlert,
  Printer,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import StudentNav from '@/components/student-nav';
import AttendanceHeatmap from '@/components/attendance-heatmap';
import SubjectSparkline from '@/components/subject-sparkline';
import AttendanceSimulator from '@/components/attendance-simulator';
import StreakBadge from '@/components/streak-badge';
import WeeklyDigest from '@/components/weekly-digest';
import NotificationsPanel from '@/components/notifications-panel';
import GoalSetter from '@/components/goal-setter';
import Reveal from '@/components/reveal';
import {
  AngledAxisTick,
  ChartTooltipCard,
  Meter,
  Panel,
  SectionHeader,
  StatCard,
  StatusPill,
  TrendChip,
} from '@/components/ui-kit';

interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  stats: {
    totalLectures: number;
    totalPresent: number;
    totalAbsent: number;
    percentage: number;
    status: 'safe' | 'warning' | 'at-risk';
    statusLabel: string;
  };
  classesNeeded: { classesNeeded: number; message: string };
  trend: {
    estimatedPercentage: number;
    trend: 'improving' | 'declining' | 'stable';
    trendMessage: string;
  };
  classAverage?: number;
  lectureCount: number;
}

const ringThemes: Record<string, [string, string]> = {
  safe: ['#34d399', '#22d3ee'],
  warning: ['#fbbf24', '#fb923c'],
  'at-risk': ['#fb7185', '#f43f5e'],
};

function ProgressRing({
  percentage,
  status,
  size = 74,
  strokeWidth = 6,
}: {
  percentage: number;
  status: string;
  size?: number;
  strokeWidth?: number;
}) {
  const id = useId().replace(/:/g, '');
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (clamped / 100) * circumference;
  const [from, to] = ringThemes[status] ?? ringThemes.safe;
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`ring-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={drawn ? offset : circumference}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-[15px] font-semibold leading-none text-white">
          {clamped.toFixed(0)}
          <span className="text-[9px] font-medium text-slate-500">%</span>
        </span>
      </div>
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const [analytics, setAnalytics] = useState<SubjectAnalytics[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentId, setStudentId] = useState('');
  const [selectedSubjectTab, setSelectedSubjectTab] = useState('0');
  const [header, setHeader] = useState<{ greeting: string; date: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const subjectDetailsRef = useRef<HTMLDivElement>(null);

  // Computed after mount so the prerendered HTML and the browser agree.
  useEffect(() => {
    setHeader({
      greeting: greeting(),
      date: new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    });
  }, []);

  const loadAnalytics = useCallback(async () => {
    const roleData = JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}');
    setStudentId(roleData.id || '');
    const response = await fetch(`/api/student/analytics?studentId=${roleData.id}`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    const data = await response.json();
    setAnalytics(data.analytics);
    setAttendanceHistory(data.attendanceHistory || {});
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    loadAnalytics()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error loading analytics');
        toast.error('Failed to load analytics');
      })
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, isAuthenticated, router, loadAnalytics]);

  const currentStreak = useMemo(() => {
    const dateMap = new Map<string, { total: number; present: number }>();
    Object.values(attendanceHistory).forEach((records) => {
      records.forEach((r: any) => {
        const dateKey = new Date(r.date).toISOString().split('T')[0];
        if (!dateMap.has(dateKey)) dateMap.set(dateKey, { total: 0, present: 0 });
        const e = dateMap.get(dateKey)!;
        e.total++;
        if (r.status === 'present') e.present++;
      });
    });
    const sorted = Array.from(dateMap.entries())
      .filter(([, d]) => d.total > 0)
      .sort(([a], [b]) => a.localeCompare(b));
    let streak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i][1].present === sorted[i][1].total) streak++;
      else break;
    }
    return streak;
  }, [attendanceHistory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAnalytics();
      setError('');
      toast.success('Analytics refreshed');
    } catch {
      toast.error('Could not refresh analytics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const atRiskSubjects = analytics.filter((s) => s.stats.status === 'at-risk');
  const safeSubjects = analytics.filter((s) => s.stats.status === 'safe');
  const avgAttendance =
    analytics.length > 0
      ? Math.round(analytics.reduce((sum, s) => sum + s.stats.percentage, 0) / analytics.length)
      : 0;
  const totalLectures = analytics.reduce((sum, s) => sum + s.lectureCount, 0);

  const strongest = analytics.reduce<SubjectAnalytics | null>(
    (best, s) => (!best || s.stats.percentage > best.stats.percentage ? s : best),
    null
  );
  const weakest = analytics.reduce<SubjectAnalytics | null>(
    (worst, s) => (!worst || s.stats.percentage < worst.stats.percentage ? s : worst),
    null
  );

  const comparativeData = analytics.map((s) => ({
    name: s.subjectName,
    fullName: s.subjectName,
    yours: Math.round(s.stats.percentage),
    classAvg: Math.round(s.classAverage || 0),
  }));

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      const item = comparativeData.find((d) => d.name === label);
      return (
        <ChartTooltipCard>
          <p className="font-semibold text-white">{item?.fullName || label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="mt-1 flex items-center gap-1.5" style={{ color: p.color }}>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: p.color }}
              />
              {p.name}: <span className="tnum font-medium">{p.value}%</span>
            </p>
          ))}
        </ChartTooltipCard>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <StudentNav userName={user?.name || 'Student'} onLogout={logout} />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          <div className="mb-8 h-9 w-64 rounded-lg skeleton-sheen" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card h-[142px] rounded-2xl skeleton-sheen" />
            ))}
          </div>
          <div className="mt-4 glass-card h-[280px] rounded-2xl skeleton-sheen" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <StudentNav userName={user?.name || 'Student'} onLogout={logout} />

      <main id="content" tabIndex={-1} className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-6 lg:px-8 focus:outline-none">
        {/* ─────────── Header ─────────── */}
        <header className="animate-slide-up flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-indigo-300" />
              Student workspace
            </p>
            <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-white sm:text-[30px]">
              {header?.greeting ?? 'Welcome'}, {(user?.name || 'Student').split(' ')[0]}
            </h1>
            <p className="mt-1.5 text-[13px] text-slate-400">
              {header?.date}
              <span className="mx-2 text-slate-700">·</span>
              {analytics.length} subjects in view
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {Object.keys(attendanceHistory).length > 0 && (
              <StreakBadge attendanceHistory={attendanceHistory} />
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh analytics"
              title="Refresh analytics"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.04] text-slate-300 transition-all duration-300 hover:border-white/20 hover:text-white active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/dashboard/student/report"
              className="btn-soft px-3.5 py-2 text-xs font-semibold"
            >
              <Printer className="h-3.5 w-3.5" />
              Report
              <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
            </Link>
          </div>
        </header>

        {error && (
          <div className="animate-slide-down mt-6 flex items-center gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ─────────── At-risk notice ─────────── */}
        {atRiskSubjects.length > 0 && (
          <div className="animate-slide-up mt-6 overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/12 via-rose-500/[0.06] to-transparent">
            <div className="flex items-start gap-3 p-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-400/25 bg-rose-500/15 text-rose-300">
                <TriangleAlert className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-rose-100">
                  Below the 75% threshold in {atRiskSubjects.length}{' '}
                  {atRiskSubjects.length === 1 ? 'subject' : 'subjects'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-rose-200/70">
                  {atRiskSubjects.map((s) => s.subjectName).join(' · ')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <NotificationsPanel analytics={analytics} currentStreak={currentStreak} />
        </div>

        {/* ─────────── KPIs ─────────── */}
        <section className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={Gauge}
            label="Average attendance"
            value={avgAttendance}
            suffix="%"
            tone="indigo"
            index={0}
            hint={avgAttendance >= 85 ? 'On track' : avgAttendance >= 75 ? 'Watch' : 'Action needed'}
            progress={{ value: avgAttendance, variant: 'brand' }}
          />
          <StatCard
            icon={CheckCircle2}
            label="Subjects safe"
            value={safeSubjects.length}
            tone="emerald"
            index={1}
            hint={`of ${analytics.length}`}
          />
          <StatCard
            icon={TriangleAlert}
            label="At risk"
            value={atRiskSubjects.length}
            tone="rose"
            index={2}
            hint="below 75%"
          />
          <StatCard
            icon={CalendarDays}
            label="Lectures tracked"
            value={totalLectures}
            tone="violet"
            index={3}
            hint="all subjects"
          />
        </section>

        {/* ─────────── Subjects ─────────── */}
        <Reveal className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-white">Subject performance</h2>
              <p className="mt-1 text-xs text-slate-500">
                Tap a subject to open its lecture-by-lecture breakdown.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Safe
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Warning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> At risk
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {analytics.map((subject, idx) => (
              <button
                key={subject.subjectId}
                type="button"
                aria-label={`View ${subject.subjectName} attendance details`}
                onClick={() => {
                  setSelectedSubjectTab(String(idx));
                  subjectDetailsRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
                className="glass-card-hover group animate-slide-up rounded-2xl p-5 text-left"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {subject.subjectCode}
                    </p>
                    <h3 className="mt-1 truncate text-[13.5px] font-semibold text-white">
                      {subject.subjectName}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {subject.teacherName}
                    </p>
                  </div>
                  <ProgressRing percentage={subject.stats.percentage} status={subject.stats.status} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <StatusPill status={subject.stats.status} label={subject.stats.statusLabel} />
                  <TrendChip trend={subject.trend.trend} />
                </div>

                <Meter
                  value={subject.stats.percentage}
                  variant={
                    subject.stats.status === 'safe'
                      ? 'safe'
                      : subject.stats.status === 'warning'
                        ? 'warning'
                        : 'danger'
                  }
                  className="mt-3.5"
                />

                <SubjectSparkline
                  records={attendanceHistory[subject.subjectId] || []}
                  status={subject.stats.status}
                  className="mt-2"
                />

                <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-slate-500">
                  <span className="tnum">
                    {subject.stats.totalPresent}/{subject.stats.totalLectures} attended
                  </span>
                  <span className="tnum">
                    Class avg {Math.round(subject.classAverage || 0)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Reveal>

        {/* ─────────── Heatmap + side rail ─────────── */}
        <Reveal className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel className="p-5 sm:p-6 lg:col-span-2">
            <SectionHeader
              icon={Flame}
              tone="amber"
              title="Attendance heatmap"
              subtitle="Rolling 12 weeks · hover a day for the full record"
              className="mb-5"
            />
            <AttendanceHeatmap attendanceHistory={attendanceHistory} />
          </Panel>

          <div className="space-y-4">
            <WeeklyDigest attendanceHistory={attendanceHistory} />
            <GoalSetter studentId={studentId} analytics={analytics} />
          </div>
        </Reveal>

        {/* ─────────── Comparison chart ─────────── */}
        <Reveal className="mt-4">
          <Panel className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.05] p-5 sm:p-6">
              <SectionHeader
                icon={Users}
                tone="indigo"
                title="You vs. the class"
                subtitle="Subject-wise attendance against your section average"
              />
              <div className="flex flex-wrap items-center gap-2">
                {strongest && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-200">
                    <TrendingUp className="h-3 w-3" />
                    Strongest: {strongest.subjectName}
                  </span>
                )}
                {weakest && weakest.stats.percentage < 75 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/20 bg-rose-400/10 px-2.5 py-1 text-[10px] font-medium text-rose-200">
                    <TrendingDown className="h-3 w-3" />
                    Focus: {weakest.subjectName}
                  </span>
                )}
              </div>
            </div>
            <div className="px-2 pb-4 pt-6 sm:px-4">
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={comparativeData} barCategoryGap="26%" barGap={5}>
                  <defs>
                    <linearGradient id="bar-safe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#0f766e" stopOpacity={0.55} />
                    </linearGradient>
                    <linearGradient id="bar-warn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#b45309" stopOpacity={0.55} />
                    </linearGradient>
                    <linearGradient id="bar-risk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="100%" stopColor="#9f1239" stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 6"
                    vertical={false}
                    stroke="rgba(255,255,255,0.055)"
                  />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    height={58}
                    stroke="transparent"
                    tick={(props: any) => <AngledAxisTick {...props} />}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <YAxis
                    stroke="transparent"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    width={34}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                    iconType="circle"
                    iconSize={7}
                  />
                  <ReferenceLine
                    y={75}
                    stroke="rgba(251,113,133,0.55)"
                    strokeDasharray="4 5"
                    label={{
                      value: '75% threshold',
                      fill: '#fda4af',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                  <Bar dataKey="yours" name="Your attendance" radius={[6, 6, 0, 0]} maxBarSize={38}>
                    {comparativeData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.yours >= 85
                            ? 'url(#bar-safe)'
                            : entry.yours >= 75
                              ? 'url(#bar-warn)'
                              : 'url(#bar-risk)'
                        }
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="classAvg"
                    name="Class average"
                    fill="rgba(148,163,184,0.32)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </Reveal>

        {/* ─────────── Subject deep dive ─────────── */}
        <Reveal className="mt-4">
          <Panel className="scroll-mt-24 p-5 sm:p-6">
            <div ref={subjectDetailsRef} className="scroll-mt-24" />
            <SectionHeader
              icon={Target}
              tone="violet"
              title="Subject details & simulator"
              subtitle="Attendance, classes needed and the full lecture history"
              className="mb-5"
            />

            <Tabs
              value={selectedSubjectTab}
              onValueChange={setSelectedSubjectTab}
              className="space-y-5"
            >
              <TabsList className="h-auto w-full grid grid-cols-2 gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1 sm:grid-cols-3 lg:grid-cols-5">
                {analytics.map((s, idx) => (
                  <TabsTrigger
                    key={s.subjectId}
                    value={String(idx)}
                    title={s.subjectName}
                    className="overflow-hidden rounded-lg py-2 text-[10.5px] font-semibold text-slate-400 transition-all data-[state=active]:bg-white/[0.09] data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                    <span className="block truncate">{s.subjectName}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {analytics.map((subject, idx) => (
                <TabsContent key={subject.subjectId} value={String(idx)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                    <div className="surface-quiet rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Attendance
                      </p>
                      <p className="tnum mt-2 text-[28px] font-semibold leading-none text-white">
                        {subject.stats.percentage.toFixed(1)}
                        <span className="text-sm text-slate-500">%</span>
                      </p>
                      <Meter
                        value={subject.stats.percentage}
                        variant={
                          subject.stats.status === 'safe'
                            ? 'safe'
                            : subject.stats.status === 'warning'
                              ? 'warning'
                              : 'danger'
                        }
                        className="mt-3"
                      />
                      <div className="mt-3 flex gap-4 text-[11px]">
                        <span className="text-emerald-300">
                          {subject.stats.totalPresent} present
                        </span>
                        <span className="text-rose-300">{subject.stats.totalAbsent} absent</span>
                      </div>
                    </div>

                    <div className="surface-quiet rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Classes to 75%
                      </p>
                      {subject.classesNeeded.classesNeeded === 0 ? (
                        <div className="mt-2 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-300">Target met</span>
                        </div>
                      ) : (
                        <p className="tnum mt-2 text-[28px] font-semibold leading-none text-amber-300">
                          {subject.classesNeeded.classesNeeded}
                        </p>
                      )}
                      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                        {subject.classesNeeded.message}
                      </p>
                    </div>

                    <div className="surface-quiet rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Trend
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {subject.trend.trend === 'improving' ? (
                          <TrendingUp className="h-5 w-5 text-emerald-400" />
                        ) : subject.trend.trend === 'declining' ? (
                          <TrendingDown className="h-5 w-5 text-rose-400" />
                        ) : (
                          <span className="h-px w-5 bg-slate-500" />
                        )}
                        <span className="text-sm font-medium capitalize text-white">
                          {subject.trend.trend}
                        </span>
                      </div>
                      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                        {subject.trend.trendMessage}
                      </p>
                    </div>
                  </div>

                  <AttendanceSimulator
                    studentId={studentId}
                    subjectId={subject.subjectId}
                    subjectName={subject.subjectName}
                  />

                  <div className="rounded-xl border border-white/[0.06]">
                    <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                      <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
                        <BookOpen className="h-3.5 w-3.5 text-violet-300" />
                        Lecture history
                      </h3>
                      <span className="text-[10px] text-slate-500">
                        {(attendanceHistory[subject.subjectId] || []).length} lectures
                      </span>
                    </div>
                    <div className="max-h-72 space-y-1 overflow-y-auto p-2">
                      {(attendanceHistory[subject.subjectId] || [])
                        .slice()
                        .reverse()
                        .map((record: any, recordIndex: number) => (
                          <div
                            key={record.lectureId || `${record.date}-${recordIndex}`}
                            className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.035]"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  record.status === 'present' ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-200">
                                  {new Date(`${record.date.slice(0, 10)}T00:00:00`).toLocaleDateString(
                                    undefined,
                                    { day: 'numeric', month: 'short', year: 'numeric' }
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-600">
                                  Lecture {record.lectureNumber}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                record.status === 'present' ? 'status-safe' : 'status-danger'
                              }`}
                            >
                              {record.status === 'present' ? 'Present' : 'Absent'}
                            </span>
                          </div>
                        ))}
                      {(attendanceHistory[subject.subjectId] || []).length === 0 && (
                        <p className="px-3 py-6 text-center text-xs text-slate-500">
                          No lecture attendance records available.
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </Panel>
        </Reveal>
      </main>
    </div>
  );
}
