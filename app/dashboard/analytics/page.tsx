'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertCircle,
  LoaderCircle,
  PieChart as PieIcon,
  Search,
  Sparkles,
  Target,
  UserRound,
  Users,
} from 'lucide-react';
import StudentNav from '@/components/student-nav';
import TeacherNav from '@/components/teacher-nav';
import Reveal from '@/components/reveal';
import {
  AngledAxisTick,
  ChartTooltipCard,
  EmptyState,
  Meter,
  Panel,
  SectionHeader,
  Segmented,
  StatusPill,
  TrendChip,
} from '@/components/ui-kit';

interface SearchResult {
  id: string;
  userId: string;
  user: { name: string; email: string };
  branch: string;
  year: number;
  division: string;
}

const PIE_COLORS = ['#34d399', '#fbbf24', '#fb7185'];

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<SearchResult | null>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<'overview' | 'details'>('overview');
  const [teacherId, setTeacherId] = useState('');
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/');
      return;
    }
    // Students explore the institute, faculty explore their own sections.
    if (user.role !== 'student' && user.role !== 'teacher') {
      router.push(user.role === 'admin' ? '/dashboard/admin' : '/');
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!isTeacher) {
      setTeacherId('');
      return;
    }
    try {
      const roleData = JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}');
      if (typeof roleData.id === 'string') setTeacherId(roleData.id);
    } catch {
      /* ignore malformed storage */
    }
  }, [isTeacher]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const scope = teacherId ? `&teacherId=${encodeURIComponent(teacherId)}` : '';
      const response = await fetch(
        `/api/search/students?query=${encodeURIComponent(query)}${scope}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('[AMS] Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStudent = async (student: SearchResult) => {
    setSelectedStudent(student);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/student/analytics?studentId=${student.id}`);
      if (response.ok) {
        const data = await response.json();
        setStudentAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('[AMS] Analytics fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Deep link support: /dashboard/analytics?student=<id> opens that profile.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get('student');
    if (!studentId) return;

    let active = true;
    const openLinkedStudent = async () => {
      try {
        const response = await fetch(
          `/api/search/students?studentId=${encodeURIComponent(studentId)}`
        );
        if (!response.ok) return;
        const data = await response.json();
        if (active && data.student) {
          setSearchQuery(data.student.user.name);
          setSearchResults([data.student]);
          void handleSelectStudent(data.student);
        }
      } catch {
        /* ignore deep-link failures */
      }
    };

    void openLinkedStudent();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusDistribution =
    selectedStudent && studentAnalytics
      ? [
          {
            name: 'Safe',
            value: studentAnalytics.filter((s: any) => s.stats.status === 'safe').length,
          },
          {
            name: 'Warning',
            value: studentAnalytics.filter((s: any) => s.stats.status === 'warning').length,
          },
          {
            name: 'At risk',
            value: studentAnalytics.filter((s: any) => s.stats.status === 'at-risk').length,
          },
        ]
      : [];

  const average = studentAnalytics?.length
    ? studentAnalytics.reduce((sum: number, s: any) => sum + s.stats.percentage, 0) /
      studentAnalytics.length
    : 0;

  return (
    <div className="min-h-screen">
      {isTeacher ? (
        <TeacherNav userName={user?.name || 'Faculty'} onLogout={logout} />
      ) : (
        <StudentNav userName={user?.name || 'User'} onLogout={logout} />
      )}

      <main id="content" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-6 lg:px-8 focus:outline-none">
        <header className="animate-slide-up">
          <p className="eyebrow flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-indigo-300" />
            {isTeacher ? 'Faculty explorer' : 'Explorer'}
          </p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-white sm:text-[30px]">
            Student explorer
          </h1>
          <p className="mt-1.5 text-[13px] text-slate-400">
            {isTeacher
              ? 'Look up a student from your sections and inspect their subject-level attendance.'
              : 'Look up any student and inspect their subject-level attendance in detail.'}
          </p>
        </header>

        <Reveal className="mt-6">
          <Panel className="p-5 sm:p-6">
            <SectionHeader
              icon={Search}
              tone="indigo"
              title="Find a student"
              subtitle="Search by name or institutional email"
              className="mb-4"
            />
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="e.g. Aarav Sharma or aarav.sharma0@mitaoe.edu.in"
                className="glass-input h-11 w-full rounded-xl pl-11 pr-11 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                aria-label="Search students"
              />
              {isSearching && (
                <LoaderCircle className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-300" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-white/[0.06] p-1.5">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectStudent(result)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      selectedStudent?.id === result.id
                        ? 'bg-indigo-500/[0.12] shadow-[inset_2px_0_0_0_rgba(129,140,248,0.9)]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[10px] font-semibold text-slate-300">
                      {result.user.name.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-white">
                        {result.user.name}
                      </p>
                      <p className="truncate text-[10.5px] text-slate-500">
                        {result.branch} · Year {result.year} · Div {result.division}
                      </p>
                    </div>
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-slate-700" />
                  </button>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <p className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-xs text-slate-500">
                No students match “{searchQuery}”.
              </p>
            )}
          </Panel>
        </Reveal>

        {!selectedStudent && (
          <Reveal className="mt-4">
            <Panel>
              <EmptyState
                icon={UserRound}
                title="No student selected"
                description="Start typing a name or email above to open a student's attendance profile."
                tone="indigo"
              />
            </Panel>
          </Reveal>
        )}

        {selectedStudent && (
          <>
            <Reveal className="mt-4">
              <Panel className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] bg-gradient-to-r from-indigo-500/[0.08] to-transparent p-5">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/25">
                      {selectedStudent.user.name.charAt(0)}
                    </span>
                    <div>
                      <h2 className="text-[15px] font-semibold text-white">
                        {selectedStudent.user.name}
                      </h2>
                      <p className="text-[11px] text-slate-500">{selectedStudent.user.email}</p>
                    </div>
                  </div>
                  <Segmented
                    value={tab}
                    onChange={setTab}
                    options={[
                      { value: 'overview', label: 'Overview' },
                      { value: 'details', label: 'Details' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 divide-white/[0.05] p-5 sm:grid-cols-4 sm:divide-x">
                  {[
                    { label: 'Branch', value: selectedStudent.branch },
                    { label: 'Year', value: `Year ${selectedStudent.year}` },
                    { label: 'Division', value: selectedStudent.division },
                    {
                      label: 'Subjects',
                      value: String(studentAnalytics?.length ?? 0),
                    },
                  ].map((item) => (
                    <div key={item.label} className="py-2 sm:px-4 sm:first:pl-0 sm:last:pr-0">
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-1 truncate text-[13px] font-medium text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            </Reveal>

            {isLoading ? (
              <div className="mt-4 space-y-3">
                <div className="h-40 rounded-2xl skeleton-sheen" />
                <div className="h-40 rounded-2xl skeleton-sheen" />
              </div>
            ) : tab === 'overview' && studentAnalytics?.length ? (
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Reveal>
                  <Panel className="h-full p-5">
                    <SectionHeader
                      icon={PieIcon}
                      tone="violet"
                      title="Status distribution"
                      subtitle="Subjects grouped by attendance band"
                      className="mb-4"
                    />
                    {statusDistribution.some((d) => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={92}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }: any) =>
                              active && payload?.length ? (
                                <ChartTooltipCard>
                                  <p className="font-semibold text-white">
                                    {payload[0].name}
                                  </p>
                                  <p className="mt-1 text-slate-300">
                                    {payload[0].value}{' '}
                                    {payload[0].value === 1 ? 'subject' : 'subjects'}
                                  </p>
                                </ChartTooltipCard>
                              ) : null
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState icon={PieIcon} title="No data available" />
                    )}
                    <div className="mt-2 flex items-center justify-center gap-4">
                      {statusDistribution.map((entry, i) => (
                        <span
                          key={entry.name}
                          className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: PIE_COLORS[i] }}
                          />
                          {entry.name} · {entry.value}
                        </span>
                      ))}
                    </div>
                  </Panel>
                </Reveal>

                <Reveal delay={80}>
                  <Panel className="h-full p-5">
                    <SectionHeader
                      icon={Target}
                      tone="indigo"
                      title="Summary"
                      subtitle="Aggregate performance across all subjects"
                      className="mb-4"
                    />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Average attendance
                    </p>
                    <p className="tnum mt-2 text-[34px] font-semibold leading-none text-white">
                      {average.toFixed(1)}
                      <span className="text-base text-slate-500">%</span>
                    </p>
                    <Meter
                      value={average}
                      variant={average >= 85 ? 'safe' : average >= 75 ? 'warning' : 'danger'}
                      className="mt-4"
                    />
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="surface-quiet rounded-xl p-3.5">
                        <p className="text-[10px] text-slate-500">At risk</p>
                        <p className="tnum mt-1 text-xl font-semibold text-rose-300">
                          {studentAnalytics.filter((s: any) => s.stats.status === 'at-risk').length}
                        </p>
                      </div>
                      <div className="surface-quiet rounded-xl p-3.5">
                        <p className="text-[10px] text-slate-500">Safe</p>
                        <p className="tnum mt-1 text-xl font-semibold text-emerald-300">
                          {studentAnalytics.filter((s: any) => s.stats.status === 'safe').length}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <SectionHeader
                        icon={Users}
                        title="Subject spread"
                        subtitle="Attendance percentage by subject"
                      />
                      <div className="mt-3">
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart
                            data={studentAnalytics.map((s: any) => ({
                              name: s.subjectName,
                              value: Math.round(s.stats.percentage),
                            }))}
                            barCategoryGap="30%"
                          >
                            <defs>
                              <linearGradient id="spread" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.4} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 6"
                              vertical={false}
                              stroke="rgba(255,255,255,0.05)"
                            />
                            <XAxis
                              dataKey="name"
                              interval={0}
                              height={54}
                              tick={(props: any) => (
                                <AngledAxisTick {...props} fill="#64748b" fontSize={9} />
                              )}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip
                              content={({ active, payload, label }: any) =>
                                active && payload?.length ? (
                                  <ChartTooltipCard>
                                    <p className="font-semibold text-white">{label}</p>
                                    <p className="mt-1 text-slate-300">{payload[0].value}%</p>
                                  </ChartTooltipCard>
                                ) : null
                              }
                              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                            />
                            <Bar dataKey="value" fill="url(#spread)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </Panel>
                </Reveal>
              </div>
            ) : tab === 'details' && studentAnalytics?.length ? (
              <Reveal className="mt-4">
                <Panel className="overflow-hidden">
                  <div className="border-b border-white/[0.05] px-5 py-4">
                    <SectionHeader
                      icon={UserRound}
                      tone="cyan"
                      title="Subject-wise attendance"
                      subtitle="Every enrolled subject with current standing"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table-premium w-full min-w-[680px]">
                      <thead>
                        <tr>
                          {['Subject', 'Attendance', 'Present', 'Total', 'Status', 'Trend'].map(
                            (heading, i) => (
                              <th
                                key={heading}
                                className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 ${
                                  i === 0 ? 'text-left' : i === 4 || i === 5 ? 'text-center' : 'text-right'
                                }`}
                              >
                                {heading}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {studentAnalytics.map((subject: any, idx: number) => (
                          <tr key={subject.subjectId || idx}>
                            <td className="px-4 py-3">
                              <p className="text-[13px] font-medium text-white">
                                {subject.subjectName}
                              </p>
                              <p className="text-[10px] text-slate-500">{subject.subjectCode}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <Meter
                                  value={subject.stats.percentage}
                                  variant={
                                    subject.stats.status === 'safe'
                                      ? 'safe'
                                      : subject.stats.status === 'warning'
                                        ? 'warning'
                                        : 'danger'
                                  }
                                  className="w-20"
                                />
                                <span className="tnum w-12 text-right text-[13px] font-semibold text-white">
                                  {subject.stats.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="tnum px-4 py-3 text-right text-[11px] text-emerald-300">
                              {subject.stats.totalPresent}
                            </td>
                            <td className="tnum px-4 py-3 text-right text-[11px] text-slate-400">
                              {subject.stats.totalLectures}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <StatusPill
                                status={subject.stats.status}
                                label={subject.stats.statusLabel}
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex justify-center">
                                <TrendChip trend={subject.trend.trend} />
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </Reveal>
            ) : (
              <Reveal className="mt-4">
                <Panel>
                  <EmptyState
                    icon={AlertCircle}
                    title="No analytics data"
                    description="This student has no attendance records yet."
                  />
                </Panel>
              </Reveal>
            )}
          </>
        )}
      </main>
    </div>
  );
}
