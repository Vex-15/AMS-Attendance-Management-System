'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Trophy, Medal, Crown } from 'lucide-react';
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

  const currentStudentId = (() => {
    try { return JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}').id || ''; }
    catch { return ''; }
  })();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/'); return; }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?${new URLSearchParams({ branch, year, division })}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setClassAverage(data.classAverage || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [branch, year, division]);

  const isTeacher = user?.role === 'teacher';
  const Nav = isTeacher ? TeacherNav : StudentNav;

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
                      <p className="text-sm font-medium text-white truncate">
                        {student.name}
                        {isMe && <span className="ml-2 text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">You</span>}
                      </p>
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
      </main>
    </div>
  );
}
