'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  TriangleAlert,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import TeacherNav from '@/components/teacher-nav';
import ExportButton from '@/components/export-button';
import Reveal from '@/components/reveal';
import {
  ChartTooltipCard,
  EmptyState,
  IconTile,
  Meter,
  Panel,
  SectionHeader,
  Segmented,
  StatCard,
  StatusPill,
} from '@/components/ui-kit';

interface StudentStats {
  studentId: string;
  studentName: string;
  rollNumber?: string;
  division?: string;
  stats: {
    totalLectures: number;
    totalPresent: number;
    totalAbsent: number;
    percentage: number;
    status: 'safe' | 'warning' | 'at-risk';
    statusLabel: string;
  };
}

interface DailyAttendance {
  lectureNumber: number;
  date: string;
  presentCount: number;
  totalCount: number;
  percentage: number;
}

interface ClassAnalytics {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectDisplayName: string;
  division: string;
  year: number;
  totalStudents: number;
  classAverage: number;
  lowestPerformers: StudentStats[];
  dailyAttendance: DailyAttendance[];
}

interface LectureInfo {
  id: string;
  subjectId: string;
  date: string;
  lectureNumber: number;
}

interface StudentAttendance {
  studentId: string;
  studentName: string;
  rollNumber: string;
  division: string;
  status: 'present' | 'absent' | null;
}

type TeacherTab = 'analytics' | 'mark';

const YEAR_LABELS: Record<number, string> = { 1: 'FY', 2: 'SY', 3: 'TY', 4: 'BE' };
const yearLabel = (year: number) => YEAR_LABELS[year] ?? `Y${year}`;

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const [subjects, setSubjects] = useState<ClassAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<TeacherTab>('analytics');
  const [lectures, setLectures] = useState<LectureInfo[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [isLoadingLectures, setIsLoadingLectures] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterRisk, setFilterRisk] = useState('all');
  const [studentQuery, setStudentQuery] = useState('');
  const [isCreatingLecture, setIsCreatingLecture] = useState(false);

  const selectedSubject = subjects[selectedSubjectIdx] || null;

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    const fetchAnalytics = async () => {
      try {
        const roleData = JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}');
        const response = await fetch(`/api/teacher/class-analytics?teacherId=${roleData.id}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        const subjectsList = Array.isArray(data.subjects) ? data.subjects : [data];
        setSubjects(subjectsList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading analytics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!selectedSubject) return;
    setIsLoadingLectures(true);
    fetch(`/api/teacher/lectures?subjectId=${selectedSubject.subjectId}`)
      .then((r) => r.json())
      .then((data) => {
        setLectures(data.lectures || []);
        setSelectedLectureId('');
        setStudentAttendance([]);
      })
      .catch(() => toast.error('Failed to load lectures'))
      .finally(() => setIsLoadingLectures(false));
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedLectureId) return;
    setIsLoadingStudents(true);
    fetch(`/api/teacher/lecture-attendance?lectureId=${selectedLectureId}`)
      .then((r) => r.json())
      .then((data) => setStudentAttendance(data.students || []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setIsLoadingStudents(false));
  }, [selectedLectureId]);

  const toggleStatus = (sid: string) => {
    setStudentAttendance((prev) =>
      prev.map((s) =>
        s.studentId === sid
          ? { ...s, status: s.status === 'present' ? 'absent' : 'present' }
          : s
      )
    );
  };

  const setStatus = (sid: string, status: 'present' | 'absent') => {
    setStudentAttendance((prev) =>
      prev.map((s) => (s.studentId === sid ? { ...s, status } : s))
    );
  };

  const markAll = (status: 'present' | 'absent') =>
    setStudentAttendance((prev) => prev.map((s) => ({ ...s, status })));
  const resetAll = () =>
    setStudentAttendance((prev) => prev.map((s) => ({ ...s, status: null })));

  const copyPreviousLecture = async () => {
    const currentIdx = lectures.findIndex((l) => l.id === selectedLectureId);
    if (currentIdx <= 0) {
      toast.info('No previous lecture');
      return;
    }
    try {
      const res = await fetch(
        `/api/teacher/lecture-attendance?lectureId=${lectures[currentIdx - 1].id}`
      );
      const data = await res.json();
      const prevMap = new Map(
        (data.students || []).map((s: StudentAttendance) => [s.studentId, s.status])
      );
      setStudentAttendance((prev) =>
        prev.map((s) => ({ ...s, status: (prevMap.get(s.studentId) as any) || s.status }))
      );
      toast.success('Copied from previous lecture');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const submitAttendance = async () => {
    const unmarked = studentAttendance.filter((s) => s.status === null);
    if (unmarked.length > 0) {
      toast.warning(`${unmarked.length} students unmarked`);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/teacher/mark-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureId: selectedLectureId,
          attendanceData: studentAttendance.map((s) => ({
            studentId: s.studentId,
            status: s.status,
          })),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      toast.success(`Saved for ${result.markedCount} students`);
    } catch {
      toast.error('Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createLecture = async () => {
    if (!selectedSubject) return;
    setIsCreatingLecture(true);
    try {
      const response = await fetch('/api/teacher/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubject.subjectId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to schedule lecture');

      const listResponse = await fetch(
        `/api/teacher/lectures?subjectId=${selectedSubject.subjectId}`
      );
      const listData = await listResponse.json();
      setLectures(listData.lectures || []);
      setSelectedLectureId(data.lecture.id);
      toast.success(`Lecture #${data.lecture.lectureNumber} scheduled for today`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to schedule lecture');
    } finally {
      setIsCreatingLecture(false);
    }
  };

  const getFilteredStudents = (students: StudentStats[]) => {
    if (filterRisk === 'all') return students;
    return students.filter((s) => s.stats.status === filterRisk);
  };

  const visibleStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    if (!query) return studentAttendance;
    return studentAttendance.filter((student) =>
      [student.studentName, student.rollNumber, student.division].some((value) =>
        String(value ?? '').toLowerCase().includes(query)
      )
    );
  }, [studentAttendance, studentQuery]);

  const markedCounts = useMemo(
    () => ({
      present: studentAttendance.filter((s) => s.status === 'present').length,
      absent: studentAttendance.filter((s) => s.status === 'absent').length,
      unset: studentAttendance.filter((s) => s.status === null).length,
    }),
    [studentAttendance]
  );

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <ChartTooltipCard>
          <p className="font-semibold text-white">Lecture #{label}</p>
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

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <TeacherNav userName={user?.name || 'Faculty'} onLogout={logout} />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          <div className="mb-8 h-9 w-64 rounded-lg skeleton-sheen" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card h-[142px] rounded-2xl skeleton-sheen" />
            ))}
          </div>
          <div className="mt-4 glass-card h-[300px] rounded-2xl skeleton-sheen" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TeacherNav userName={user?.name || 'Faculty'} onLogout={logout} />

      <main id="content" tabIndex={-1} className="mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-6 lg:px-8 focus:outline-none">
        {/* Header */}
        <header className="animate-slide-up flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-violet-300" />
              Faculty workspace
            </p>
            <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-white sm:text-[30px]">
              Class analytics
            </h1>
            <p className="mt-1.5 text-[13px] text-slate-400">
              Monitor performance, spot risk early and mark attendance in seconds.
            </p>
          </div>
          {selectedSubject && (
            <ExportButton
              subjectCode={selectedSubject.subjectCode}
              subjectName={selectedSubject.subjectName}
              subjectId={selectedSubject.subjectId}
            />
          )}
        </header>

        {error && (
          <div className="animate-slide-down mt-6 flex items-center gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Class switcher */}
        {selectedSubject && (
          <Reveal className="mt-6">
            <Panel className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <IconTile icon={BarChart3} tone="violet" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Active class
                    </p>
                    <Select
                      value={String(selectedSubjectIdx)}
                      onValueChange={(v) => setSelectedSubjectIdx(Number(v))}
                    >
                      <SelectTrigger className="mt-1 h-9 w-full max-w-md border-0 bg-transparent px-0 text-[15px] font-semibold text-white shadow-none focus:ring-0 [&>span]:truncate">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72 rounded-xl">
                        {subjects.map((subject, idx) => (
                          <SelectItem
                            key={subject.subjectId || idx}
                            value={String(idx)}
                            className="text-slate-200 focus:bg-white/10 focus:text-white"
                          >
                            {subject.subjectDisplayName ||
                              `${subject.subjectName} — ${subject.division}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-300">
                    {yearLabel(selectedSubject.year)} · Div {selectedSubject.division}
                  </span>
                  <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-300">
                    {selectedSubject.totalStudents} students
                  </span>
                  <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-300">
                    {selectedSubject.subjectCode}
                  </span>
                  <Segmented
                    value={activeTab}
                    onChange={setActiveTab}
                    options={[
                      { value: 'analytics', label: 'Analytics', icon: BarChart3 },
                      { value: 'mark', label: 'Mark attendance', icon: ClipboardCheck },
                    ]}
                    className="ml-auto"
                  />
                </div>
              </div>
            </Panel>
          </Reveal>
        )}

        {selectedSubject && activeTab === 'analytics' && (
          <>
            <section className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-4">
              <StatCard
                icon={BarChart3}
                label="Class average"
                value={selectedSubject.classAverage}
                decimals={1}
                suffix="%"
                tone="indigo"
                index={0}
                progress={{ value: selectedSubject.classAverage, variant: 'brand' }}
              />
              <StatCard
                icon={Users}
                label="Students enrolled"
                value={selectedSubject.totalStudents}
                tone="cyan"
                index={1}
                hint={selectedSubject.division ? `Div ${selectedSubject.division}` : undefined}
              />
              <StatCard
                icon={TriangleAlert}
                label="At risk"
                value={selectedSubject.lowestPerformers.filter((s) => s.stats.status === 'at-risk').length}
                tone="rose"
                index={2}
                hint="below 75%"
              />
            </section>

            <Reveal className="mt-4">
              <Panel className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05] px-5 py-4">
                  <SectionHeader
                    icon={CalendarDays}
                    tone="cyan"
                    title="Daily attendance trend"
                    subtitle="Students present across the last 10 lectures"
                  />
                  <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-[10px] font-medium text-slate-400">
                    Threshold 75%
                  </span>
                </div>
                <div className="px-2 pb-4 pt-6 sm:px-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={selectedSubject.dailyAttendance}>
                      <defs>
                        <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#818cf8" />
                          <stop offset="55%" stopColor="#a78bfa" />
                          <stop offset="100%" stopColor="#4fd1e8" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 6"
                        vertical={false}
                        stroke="rgba(255,255,255,0.055)"
                      />
                      <XAxis
                        dataKey="lectureNumber"
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
                        cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="percentage"
                        stroke="url(#line-gradient)"
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

            <Reveal className="mt-4">
              <Panel className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05] px-5 py-4">
                  <SectionHeader
                    icon={Users}
                    tone="violet"
                    title="Student performance"
                    subtitle="Ranked from lowest to highest attendance"
                  />
                  <Select value={filterRisk} onValueChange={setFilterRisk}>
                    <SelectTrigger className="glass-input h-9 w-[140px] rounded-lg text-xs text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="at-risk">At risk</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="safe">Safe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-x-auto">
                  <table className="table-premium w-full min-w-[680px]">
                    <thead>
                      <tr>
                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          Student
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          Attendance
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          Present
                        </th>
                        <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredStudents(selectedSubject.lowestPerformers).map((student, idx) => (
                        <tr key={student.studentId || idx}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[10px] font-semibold text-slate-300">
                                {student.studentName.charAt(0)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-white">
                                  {student.studentName}
                                </p>
                                {student.rollNumber && (
                                  <p className="text-[10px] text-slate-500">
                                    Roll {student.rollNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="tnum text-[13px] font-semibold text-white">
                              {student.stats.percentage.toFixed(1)}%
                            </span>
                            <Meter
                              value={student.stats.percentage}
                              variant={
                                student.stats.status === 'safe'
                                  ? 'safe'
                                  : student.stats.status === 'warning'
                                    ? 'warning'
                                    : 'danger'
                              }
                              className="ml-auto mt-1.5 w-20"
                            />
                          </td>
                          <td className="tnum px-4 py-3 text-right text-[11px] text-slate-400">
                            {student.stats.totalPresent}/{student.stats.totalLectures}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <StatusPill
                              status={student.stats.status}
                              label={student.stats.statusLabel}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {getFilteredStudents(selectedSubject.lowestPerformers).length === 0 && (
                    <EmptyState
                      icon={Users}
                      title="No students in this view"
                      description="Try clearing the status filter to see the full class roster."
                    />
                  )}
                </div>
              </Panel>
            </Reveal>
          </>
        )}

        {selectedSubject && activeTab === 'mark' && (
          <Reveal className="mt-4">
            <Panel className="overflow-hidden">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.05] px-5 py-5">
                <SectionHeader
                  icon={ClipboardCheck}
                  tone="emerald"
                  title={selectedSubject.subjectDisplayName || selectedSubject.subjectName}
                  subtitle="Choose a lecture, then mark attendance with one tap per student."
                />
                <div className="w-full sm:w-auto">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Lecture
                    </label>
                    <button
                      onClick={createLecture}
                      disabled={isCreatingLecture}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-300 transition-colors hover:text-indigo-200 disabled:opacity-60"
                    >
                      {isCreatingLecture ? (
                        <LoaderCircle className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      New lecture
                    </button>
                  </div>
                  {isLoadingLectures ? (
                    <div className="h-9 rounded-lg skeleton-sheen" />
                  ) : (
                    <Select value={selectedLectureId} onValueChange={setSelectedLectureId}>
                      <SelectTrigger className="glass-input h-9 rounded-lg text-xs text-slate-200 sm:w-64">
                        <SelectValue placeholder="Choose a lecture…" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 rounded-xl">
                        {lectures.map((l) => (
                          <SelectItem key={l.id} value={l.id} className="text-slate-200">
                            Lecture #{l.lectureNumber} — {format(new Date(l.date), 'dd MMM yyyy')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {!selectedLectureId ? (
                <EmptyState
                  icon={CalendarDays}
                  title="Select a lecture to begin"
                  description="Attendance is saved against the selected lecture and updates student analytics instantly."
                  tone="emerald"
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.05] px-5 py-3">
                    <button
                      onClick={() => markAll('present')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> All present
                    </button>
                    <button
                      onClick={() => markAll('absent')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-[11px] font-semibold text-rose-200 transition-colors hover:bg-rose-400/20"
                    >
                      <XCircle className="h-3.5 w-3.5" /> All absent
                    </button>
                    <button
                      onClick={copyPreviousLecture}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[11px] font-semibold text-sky-200 transition-colors hover:bg-sky-400/20"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy previous
                    </button>
                    <button
                      onClick={resetAll}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-white/[0.08]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </button>
                    <label className="relative ml-auto w-full sm:w-48">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                      <input
                        value={studentQuery}
                        onChange={(event) => setStudentQuery(event.target.value)}
                        placeholder="Find student"
                        aria-label="Filter students by name, roll number or division"
                        className="h-8 w-full rounded-lg border border-white/[0.09] bg-white/[0.035] pl-8 pr-2.5 text-[11px] text-white outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-400/50"
                      />
                    </label>
                    <div
                      aria-live="polite"
                      className="flex items-center gap-3 text-[10.5px] font-medium"
                    >
                      <span className="text-emerald-300">{markedCounts.present} present</span>
                      <span className="text-rose-300">{markedCounts.absent} absent</span>
                      <span className="text-slate-500">{markedCounts.unset} unset</span>
                    </div>
                  </div>

                  {isLoadingStudents ? (
                    <div className="space-y-2 p-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-11 rounded-lg skeleton-sheen" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="table-premium w-full min-w-[640px]">
                          <thead>
                            <tr>
                              <th className="w-10 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                                Student
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                                Roll no
                              </th>
                              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                                Div
                              </th>
                              <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                                Mark
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleStudents.map((student, idx) => (
                              <tr
                                key={student.studentId}
                                className="cursor-pointer"
                                onClick={() => toggleStatus(student.studentId)}
                              >
                                <td className="px-4 py-2.5 text-[11px] text-slate-600">{idx + 1}</td>
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[9px] font-semibold text-slate-300">
                                      {student.studentName.charAt(0)}
                                    </span>
                                    <span className="text-[13px] font-medium text-white">
                                      {student.studentName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-[11px] text-slate-400">
                                  {student.rollNumber}
                                </td>
                                <td className="px-4 py-2.5 text-[11px] text-slate-400">
                                  {student.division}
                                </td>
                                <td className="px-5 py-2.5">
                                  <div
                                    className="ml-auto flex w-fit items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.03] p-0.5"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => setStatus(student.studentId, 'present')}
                                      className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
                                        student.status === 'present'
                                          ? 'bg-emerald-500/20 text-emerald-200 shadow-sm'
                                          : 'text-slate-500 hover:text-emerald-200'
                                      }`}
                                    >
                                      Present
                                    </button>
                                    <button
                                      onClick={() => setStatus(student.studentId, 'absent')}
                                      className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
                                        student.status === 'absent'
                                          ? 'bg-rose-500/20 text-rose-200 shadow-sm'
                                          : 'text-slate-500 hover:text-rose-200'
                                      }`}
                                    >
                                      Absent
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {visibleStudents.length === 0 && (
                          <p className="px-5 py-8 text-center text-xs text-slate-500">
                            No students match “{studentQuery.trim()}”.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] px-5 py-4">
                        <div className="min-w-[140px] flex-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Marked</span>
                            <span className="tnum">
                              {studentAttendance.length - markedCounts.unset}/
                              {studentAttendance.length}
                            </span>
                          </div>
                          <Meter
                            value={
                              studentAttendance.length
                                ? ((studentAttendance.length - markedCounts.unset) /
                                    studentAttendance.length) *
                                  100
                                : 0
                            }
                            variant="safe"
                            className="mt-1.5"
                          />
                        </div>
                        <button
                          onClick={submitAttendance}
                          disabled={isSubmitting}
                          className="gradient-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Submitting…
                            </>
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5" />
                              Submit attendance
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </Panel>
          </Reveal>
        )}
      </main>
    </div>
  );
}
