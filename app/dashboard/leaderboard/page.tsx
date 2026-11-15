'use client';

import { useEffect, useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  ChevronRight,
  Crown,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import StudentNav from '@/components/student-nav';
import TeacherNav from '@/components/teacher-nav';
import Reveal from '@/components/reveal';
import { Meter, Panel, SectionHeader, StatusPill } from '@/components/ui-kit';

interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  division: string;
  overallPercentage: number;
  status: 'safe' | 'warning' | 'at-risk';
  statusLabel: string;
}

interface StudentAttendanceDetails {
  student: {
    id: string;
    name: string;
    branch: string;
    year: number;
    division: string;
  };
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    year: number;
    division: string;
    lectureCount: number;
    markedCount: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
    lectures: Array<{
      lectureId: string;
      date: string;
      lectureNumber: number;
      status: 'present' | 'absent' | null;
    }>;
  }>;
}

const variantFor = (status: string) =>
  status === 'safe' ? 'safe' : status === 'warning' ? 'warning' : 'danger';

const FALLBACK_SCOPE = { branch: 'Computer Engineering', year: '2', division: 'A' };

/** The student's own class, so the board opens on their section. */
function readScope() {
  if (typeof window === 'undefined') return FALLBACK_SCOPE;
  try {
    const role = JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}');
    return {
      branch: typeof role.branch === 'string' ? role.branch : FALLBACK_SCOPE.branch,
      year: role.year ? String(role.year) : FALLBACK_SCOPE.year,
      division: typeof role.division === 'string' ? role.division : FALLBACK_SCOPE.division,
    };
  } catch {
    return FALLBACK_SCOPE;
  }
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [classAverage, setClassAverage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [branch, setBranch] = useState(FALLBACK_SCOPE.branch);
  const [year, setYear] = useState(FALLBACK_SCOPE.year);
  const [division, setDivision] = useState(FALLBACK_SCOPE.division);
  const [scope, setScope] = useState(FALLBACK_SCOPE);
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardEntry | null>(null);
  const [attendanceDetails, setAttendanceDetails] = useState<StudentAttendanceDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const roleData = (() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}');
    } catch {
      return {};
    }
  })();
  const currentStudentId = typeof roleData.id === 'string' ? roleData.id : '';
  const currentTeacherId =
    user?.role === 'teacher' && typeof roleData.id === 'string' ? roleData.id : '';
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    // Wait for the auth context to hydrate from storage before deciding.
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Faculty see the whole institute; students start scoped to their own class.
  useEffect(() => {
    const next = isTeacher
      ? { branch: 'all', year: 'all', division: 'all' }
      : readScope();
    setScope(next);
    setBranch(next.branch);
    setYear(next.year);
    setDivision(next.division);
  }, [isTeacher]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        if (isTeacher && !currentTeacherId) {
          throw new Error('Teacher profile is unavailable. Please sign in again.');
        }
        const params = new URLSearchParams();
        if (branch !== 'all') params.set('branch', branch);
        if (year !== 'all') params.set('year', year);
        if (division !== 'all') params.set('division', division);
        if (isTeacher) params.set('teacherId', currentTeacherId);
        const res = await fetch(`/api/leaderboard?${params}`);
        if (!res.ok) throw new Error('Failed to load leaderboard');
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setClassAverage(data.classAverage || 0);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [branch, year, division, isTeacher, currentTeacherId]);

  const Nav = isTeacher ? TeacherNav : StudentNav;

  const openStudentDetails = async (student: LeaderboardEntry) => {
    setSelectedStudent(student);
    setAttendanceDetails(null);
    setDetailsError('');
    setIsDetailsLoading(true);

    try {
      const params = new URLSearchParams({
        teacherId: currentTeacherId,
        studentId: student.studentId,
      });
      const response = await fetch(`/api/teacher/student-attendance?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load student attendance.');
      setAttendanceDetails(data);
    } catch (err) {
      setDetailsError(
        err instanceof Error ? err.message : 'Unable to load student attendance.'
      );
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const isMe = (student: LeaderboardEntry) =>
    user?.role === 'student' && student.studentId === currentStudentId;

  const isFiltered =
    branch !== scope.branch || year !== scope.year || division !== scope.division;
  const myEntry = leaderboard.find((entry) => isMe(entry));

  const resetFilters = () => {
    setBranch(scope.branch);
    setYear(scope.year);
    setDivision(scope.division);
  };

  const top3 = leaderboard.slice(0, 3);
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardEntry[];

  return (
    <div className="min-h-screen">
      <Nav userName={user?.name || 'User'} onLogout={logout} />

      <main id="content" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-24 pt-8 md:px-6 lg:px-8 focus:outline-none">
        <header className="animate-slide-up flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-300" />
              Academic standing
            </p>
            <h1 className="mt-2 flex items-center gap-2.5 text-[26px] font-semibold tracking-tight text-white sm:text-[30px]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/25 bg-gradient-to-br from-amber-400/20 to-orange-500/10 text-amber-300">
                <Trophy className="h-[18px] w-[18px]" />
              </span>
              Leaderboard
            </h1>
            <p className="mt-1.5 text-[13px] text-slate-400">
              Ranked by overall attendance across every enrolled subject.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Class average
            </p>
            <p className="tnum mt-1 text-lg font-semibold text-white">{classAverage}%</p>
          </div>
        </header>

        {/* Your standing */}
        {myEntry && (
          <Reveal className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-400/25 bg-gradient-to-r from-indigo-500/[0.14] via-violet-500/[0.06] to-transparent p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-400/10 text-indigo-200">
                  <Trophy className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-200/70">
                    Your standing
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold text-white">
                    Rank #{myEntry.rank} of {leaderboard.length}
                    <span className="mx-2 text-slate-600">·</span>
                    {myEntry.overallPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
              <StatusPill status={myEntry.status} label={myEntry.statusLabel} />
            </div>
          </Reveal>
        )}

        {/* Filters */}
        <Reveal className="mt-6">
          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Filters
              </p>
              {isFiltered && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-[10.5px] font-medium text-indigo-300 transition-colors hover:text-indigo-200"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                {
                  label: 'Branch',
                  value: branch,
                  onChange: setBranch,
                  options: [
                    { value: 'all', label: 'All branches' },
                    { value: 'Computer Engineering', label: 'Computer Engineering' },
                    { value: 'Data Science', label: 'Data Science' },
                    { value: 'AI & ML', label: 'AI & ML' },
                  ],
                },
                {
                  label: 'Year',
                  value: year,
                  onChange: setYear,
                  options: [
                    { value: 'all', label: 'All years' },
                    { value: '1', label: 'FY · Year 1' },
                    { value: '2', label: 'SY · Year 2' },
                    { value: '3', label: 'TY · Year 3' },
                    { value: '4', label: 'BE · Year 4' },
                  ],
                },
                {
                  label: 'Division',
                  value: division,
                  onChange: setDivision,
                  options: [
                    { value: 'all', label: 'All divisions' },
                    { value: 'A', label: 'Division A' },
                    { value: 'B', label: 'Division B' },
                    { value: 'C', label: 'Division C' },
                  ],
                },
              ].map((filter) => (
                <div key={filter.label}>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {filter.label}
                  </label>
                  <Select value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger className="glass-input h-9 rounded-lg text-xs text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </Panel>
        </Reveal>

        {error && (
          <div className="animate-slide-down mt-4 flex items-center gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-4 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl skeleton-sheen" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <Panel className="mt-4">
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Trophy className="h-5 w-5 text-slate-500" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-200">No students found</p>
              <p className="mt-1 text-xs text-slate-500">
                Adjust the branch, year or division filters to see rankings.
              </p>
            </div>
          </Panel>
        ) : (
          <>
            {/* Podium */}
            {podium.length === 3 && (
              <Reveal className="mt-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
                  {podium.map((student) => {
                    const first = student.rank === 1;
                    const me = isMe(student);
                    return (
                      <div
                        key={student.studentId}
                        className={`sheen relative overflow-hidden rounded-2xl border p-5 transition-transform duration-500 hover:-translate-y-1 ${
                          first
                            ? 'border-amber-400/30 bg-gradient-to-b from-amber-400/[0.14] via-amber-400/[0.05] to-transparent sm:pb-7'
                            : 'border-white/[0.07] bg-white/[0.03]'
                        } ${me ? 'ring-1 ring-indigo-400/50' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              first
                                ? 'bg-amber-400/15 text-amber-200'
                                : student.rank === 2
                                  ? 'bg-slate-300/10 text-slate-200'
                                  : 'bg-orange-400/10 text-orange-200'
                            }`}
                          >
                            {first ? <Crown className="h-3 w-3" /> : <Trophy className="h-3 w-3" />}
                            Rank {student.rank}
                          </span>
                          {me && (
                            <span className="rounded-full bg-indigo-400/15 px-2 py-0.5 text-[9px] font-semibold text-indigo-200">
                              You
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
                              first
                                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                : 'bg-gradient-to-br from-slate-500/60 to-slate-700/60'
                            }`}
                          >
                            {student.name.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            {isTeacher ? (
                              <button
                                onClick={() => void openStudentDetails(student)}
                                className="truncate text-left text-[13px] font-semibold text-white underline-offset-4 hover:underline"
                              >
                                {student.name}
                              </button>
                            ) : (
                              <p className="truncate text-[13px] font-semibold text-white">
                                {student.name}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-500">Division {student.division}</p>
                          </div>
                        </div>

                        <p
                          className={`tnum mt-4 text-[26px] font-semibold leading-none ${
                            first ? 'text-amber-200' : 'text-white'
                          }`}
                        >
                          {student.overallPercentage.toFixed(1)}
                          <span className="text-xs text-slate-500">%</span>
                        </p>
                        <Meter
                          value={student.overallPercentage}
                          variant={variantFor(student.status)}
                          className="mt-3"
                        />
                      </div>
                    );
                  })}
                </div>
              </Reveal>
            )}

            {/* Full ranking */}
            <Reveal className="mt-4">
              <Panel className="overflow-hidden">
                <div className="border-b border-white/[0.05] px-5 py-4">
                  <SectionHeader
                    icon={Users}
                    tone="cyan"
                    title="Full ranking"
                    subtitle={`${leaderboard.length} students ordered by overall attendance`}
                  />
                </div>
                <div className="divide-y divide-white/[0.035]">
                  {leaderboard.map((student, index) => {
                    const me = isMe(student);
                    return (
                      <div
                        key={student.studentId}
                        className={`group flex animate-slide-up items-center gap-3 px-4 py-3 transition-colors sm:gap-4 sm:px-5 ${
                          me
                            ? 'bg-indigo-500/[0.08] shadow-[inset_2px_0_0_0_rgba(129,140,248,0.9)]'
                            : 'hover:bg-white/[0.03]'
                        }`}
                        style={{ animationDelay: `${Math.min(index, 12) * 0.025}s` }}
                      >
                        <span
                          className={`tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-semibold ${
                            student.rank === 1
                              ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                              : student.rank === 2
                                ? 'border-slate-300/20 bg-slate-300/10 text-slate-200'
                                : student.rank === 3
                                  ? 'border-orange-400/25 bg-orange-400/10 text-orange-200'
                                  : 'border-white/[0.06] bg-white/[0.03] text-slate-500'
                          }`}
                        >
                          {student.rank}
                        </span>

                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[10px] font-semibold text-slate-300 sm:flex">
                            {student.name.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {isTeacher ? (
                                <button
                                  type="button"
                                  onClick={() => void openStudentDetails(student)}
                                  aria-label={`View attendance details for ${student.name}`}
                                  className="truncate text-left text-[13px] font-medium text-sky-200 underline-offset-4 hover:text-sky-100 hover:underline"
                                >
                                  {student.name}
                                </button>
                              ) : (
                                <p className="truncate text-[13px] font-medium text-white">
                                  {student.name}
                                </p>
                              )}
                              {me && (
                                <span className="shrink-0 rounded-full bg-indigo-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-200">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">Div {student.division}</p>
                          </div>
                        </div>

                        <div className="hidden w-28 shrink-0 items-center gap-2 md:flex">
                          <Meter
                            value={student.overallPercentage}
                            variant={variantFor(student.status)}
                            className="flex-1"
                          />
                        </div>

                        <span className="tnum w-14 shrink-0 text-right text-[13px] font-semibold text-white">
                          {student.overallPercentage.toFixed(1)}%
                        </span>

                        <StatusPill
                          status={student.status}
                          label={student.statusLabel}
                          className="hidden shrink-0 sm:inline-flex"
                        />

                        {isTeacher && (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-slate-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </Reveal>
          </>
        )}

        {/* Student detail dialog */}
        <Dialog open={selectedStudent !== null} onOpenChange={(open) => !open && setSelectedStudent(null)}>
          <DialogContent className="max-h-[88vh] overflow-y-auto rounded-2xl text-white shadow-2xl sm:max-w-3xl">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-3 text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold">
                  {(attendanceDetails?.student.name || selectedStudent?.name || 'S').charAt(0)}
                </span>
                <span>{attendanceDetails?.student.name || selectedStudent?.name || 'Student attendance'}</span>
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {attendanceDetails
                  ? `${attendanceDetails.student.branch} · Year ${attendanceDetails.student.year} · Division ${attendanceDetails.student.division}`
                  : 'Attendance records for your assigned subjects.'}
              </DialogDescription>
            </DialogHeader>

            {isDetailsLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-sm text-slate-400">
                <LoaderCircle className="h-5 w-5 animate-spin text-indigo-300" />
                Loading attendance details…
              </div>
            ) : detailsError ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                <AlertCircle className="h-4 w-4" />
                {detailsError}
              </div>
            ) : attendanceDetails?.subjects.length ? (
              <div className="space-y-4">
                {attendanceDetails.subjects.map((subject) => (
                  <section
                    key={subject.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h3 className="text-[13px] font-semibold text-white">{subject.name}</h3>
                        <p className="mt-0.5 text-[10.5px] text-slate-500">
                          {subject.code} · Year {subject.year} · Division {subject.division}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="tnum text-base font-semibold text-white">
                          {subject.attendanceRate}%
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {subject.presentCount} present · {subject.absentCount} absent
                        </p>
                      </div>
                    </div>

                    <Meter
                      value={subject.attendanceRate}
                      variant={
                        subject.attendanceRate >= 85
                          ? 'safe'
                          : subject.attendanceRate >= 75
                            ? 'warning'
                            : 'danger'
                      }
                      className="mb-3"
                    />

                    <div className="max-h-52 overflow-y-auto rounded-lg border border-white/[0.05]">
                      {subject.lectures.map((lecture) => (
                        <div
                          key={lecture.lectureId}
                          className="flex items-center justify-between gap-3 border-b border-white/[0.04] px-3 py-2 text-[11px] last:border-0"
                        >
                          <span className="text-slate-300">
                            {new Date(`${lecture.date.slice(0, 10)}T00:00:00`).toLocaleDateString(
                              undefined,
                              { day: 'numeric', month: 'short', year: 'numeric' }
                            )}
                            <span className="ml-2 text-slate-600">
                              Lecture {lecture.lectureNumber}
                            </span>
                          </span>
                          <span
                            className={
                              lecture.status === 'present'
                                ? 'text-emerald-300'
                                : lecture.status === 'absent'
                                  ? 'text-rose-300'
                                  : 'text-slate-500'
                            }
                          >
                            {lecture.status === 'present'
                              ? 'Present'
                              : lecture.status === 'absent'
                                ? 'Absent'
                                : 'Not marked'}
                          </span>
                        </div>
                      ))}
                      {subject.lectures.length === 0 && (
                        <p className="px-3 py-4 text-[11px] text-slate-500">
                          No lectures recorded.
                        </p>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">
                No attendance details are available for this student.
              </p>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
