'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Trophy, Medal, Crown, LoaderCircle } from 'lucide-react';
import StudentNav from '@/components/student-nav';
import TeacherNav from '@/components/teacher-nav';

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

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [classAverage, setClassAverage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [branch, setBranch] = useState('Computer Engineering');
  const [year, setYear] = useState('2');
  const [division, setDivision] = useState('A');
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardEntry | null>(null);
  const [attendanceDetails, setAttendanceDetails] = useState<StudentAttendanceDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const roleData = (() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}'); }
    catch { return ''; }
  })();
  const currentStudentId = typeof roleData.id === 'string' ? roleData.id : '';
  const currentTeacherId = user?.role === 'teacher' && typeof roleData.id === 'string' ? roleData.id : '';
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    if (!isAuthenticated) { router.push('/'); return; }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isTeacher) {
      setBranch('all');
      setYear('all');
      setDivision('all');
    }
  }, [isTeacher]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        if (isTeacher && !currentTeacherId) throw new Error('Teacher profile is unavailable. Please sign in again.');
        const params = new URLSearchParams();
        if (branch !== 'all') params.set('branch', branch);
        if (year !== 'all') params.set('year', year);
        if (division !== 'all') params.set('division', division);
        if (isTeacher) params.set('teacherId', currentTeacherId);
        const res = await fetch(`/api/leaderboard?${params}`);
        if (!res.ok) throw new Error('Failed');
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
      const params = new URLSearchParams({ teacherId: currentTeacherId, studentId: student.studentId });
      const response = await fetch(`/api/teacher/student-attendance?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load student attendance.');
      setAttendanceDetails(data);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Unable to load student attendance.');
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return <span className="text-xs text-slate-400 font-mono">#{rank}</span>;
  };

  const getRowBg = (pct: number, isMe: boolean) => {
    if (isMe) return 'bg-blue-500/10 border-l-2 border-l-blue-500';
    if (pct >= 85) return 'bg-emerald-500/[0.03]';
    if (pct >= 75) return 'bg-yellow-500/[0.03]';
    return 'bg-red-500/[0.03]';
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav userName={user?.name || 'User'} onLogout={logout} />

      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
            <p className="text-sm text-slate-400">Ranked by overall attendance</p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Branch</label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="glass-input text-white border-white/10 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="all">All branches</SelectItem>
                  <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                  <SelectItem value="Data Science">Data Science</SelectItem>
                  <SelectItem value="AI & ML">AI & ML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Year</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="glass-input text-white border-white/10 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="all">All years</SelectItem>
                  <SelectItem value="1">FY (Year 1)</SelectItem>
                  <SelectItem value="2">SY (Year 2)</SelectItem>
                  <SelectItem value="3">TY (Year 3)</SelectItem>
                  <SelectItem value="4">BE (Year 4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Division</label>
              <Select value={division} onValueChange={setDivision}>
                <SelectTrigger className="glass-input text-white border-white/10 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-card border-white/10">
                  <SelectItem value="all">All divisions</SelectItem>
                  <SelectItem value="A">Division A</SelectItem>
                  <SelectItem value="B">Division B</SelectItem>
                  <SelectItem value="C">Division C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Class Average */}
        <div className="glass-card rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-sm text-slate-400 font-medium">Class Average</span>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-32 rounded-full bg-white/5 overflow-hidden">
              <div className="progress-gradient h-full" style={{ width: `${classAverage}%` }} />
            </div>
            <span className="text-lg font-bold text-white">{classAverage}%</span>
          </div>
        </div>

        {error && <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

        {isLoading ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full bg-white/5 rounded-xl" />)}</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm text-slate-500">No students found</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {leaderboard.map((student) => {
              const isMe = user?.role === 'student' && student.studentId === currentStudentId;
              return (
                <div
                  key={student.studentId}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-white/[0.04] ${getRowBg(student.overallPercentage, isMe)} animate-slide-up`}
                  style={{ animationDelay: `${student.rank * 0.02}s` }}
                >
                  {/* Rank */}
                  <div className="w-10 text-center shrink-0">
                    {getRankDisplay(student.rank)}
                  </div>

                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                      student.rank <= 3 ? 'bg-gradient-to-br from-amber-500 to-yellow-600' : 'bg-white/10'
                    }`}>
                      {student.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      {isTeacher ? (
                        <button
                          type="button"
                          onClick={() => void openStudentDetails(student)}
                          aria-label={`View attendance details for ${student.name}`}
                          className="truncate text-left text-sm font-medium text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                        >
                          {student.name}
                        </button>
                      ) : (
                        <p className="truncate text-sm font-medium text-white">
                          {student.name}
                          {isMe && <span className="ml-2 rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[9px] text-blue-400">You</span>}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500">Div {student.division}</p>
                    </div>
                  </div>

                  {/* Percentage + Progress */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="h-1.5 w-20 rounded-full bg-white/5 overflow-hidden hidden md:block">
                      <div className="progress-gradient h-full" style={{ width: `${student.overallPercentage}%` }} />
                    </div>
                    <span className="text-sm font-bold text-white w-14 text-right">{student.overallPercentage.toFixed(1)}%</span>
                  </div>

                  {/* Status */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    student.status === 'safe' ? 'status-safe' :
                    student.status === 'warning' ? 'status-warning' : 'status-danger pulse-danger'
                  }`}>
                    {student.statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={selectedStudent !== null} onOpenChange={(open) => !open && setSelectedStudent(null)}>
          <DialogContent className="max-h-[88vh] overflow-y-auto border-white/10 bg-slate-950 text-white shadow-2xl sm:max-w-3xl">
            <DialogHeader className="text-left">
              <DialogTitle className="text-white">{attendanceDetails?.student.name || selectedStudent?.name || 'Student attendance'}</DialogTitle>
              <DialogDescription className="text-slate-300">
                {attendanceDetails
                  ? `${attendanceDetails.student.branch} · Year ${attendanceDetails.student.year} · Division ${attendanceDetails.student.division}`
                  : 'Attendance records for your assigned subjects.'}
              </DialogDescription>
            </DialogHeader>

            {isDetailsLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-300">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Loading attendance details
              </div>
            ) : detailsError ? (
              <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{detailsError}</AlertDescription>
              </Alert>
            ) : attendanceDetails?.subjects.length ? (
              <div className="space-y-5">
                {attendanceDetails.subjects.map((subject) => (
                  <section key={subject.id} className="border-t border-white/10 pt-4 first:border-0 first:pt-0">
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{subject.name}</h3>
                        <p className="mt-1 text-xs text-slate-400">{subject.code} · Year {subject.year} · Division {subject.division}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white">{subject.attendanceRate}%</p>
                        <p className="text-xs text-slate-400">{subject.presentCount} present · {subject.absentCount} absent</p>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-md border border-white/10">
                      <div className="grid grid-cols-[1fr_auto] bg-white/[0.04] px-3 py-2 text-[10px] font-medium uppercase text-slate-400">
                        <span>Lecture</span><span>Attendance</span>
                      </div>
                      <div className="max-h-56 divide-y divide-white/5 overflow-y-auto">
                        {subject.lectures.map((lecture) => (
                          <div key={lecture.lectureId} className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 text-xs">
                            <span className="text-slate-300">
                              {new Date(`${lecture.date.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              <span className="ml-2 text-slate-500">Lecture {lecture.lectureNumber}</span>
                            </span>
                            <span className={lecture.status === 'present' ? 'text-emerald-300' : lecture.status === 'absent' ? 'text-rose-300' : 'text-slate-400'}>
                              {lecture.status === 'present' ? 'Present' : lecture.status === 'absent' ? 'Absent' : 'Not marked'}
                            </span>
                          </div>
                        ))}
                        {subject.lectures.length === 0 && <p className="px-3 py-4 text-xs text-slate-400">No lectures recorded.</p>}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">No attendance details are available for this student.</p>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
