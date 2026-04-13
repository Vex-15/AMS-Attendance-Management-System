'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label, Cell, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, AlertCircle, BookOpen, Flame, Target, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import StudentNav from '@/components/student-nav';
import AttendanceHeatmap from '@/components/attendance-heatmap';
import StreakBadge from '@/components/streak-badge';
import WeeklyDigest from '@/components/weekly-digest';
import NotificationsPanel from '@/components/notifications-panel';
import GoalSetter from '@/components/goal-setter';

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

// Circular progress ring component
function CircularProgress({ percentage, size = 80, strokeWidth = 6, status }: { percentage: number; size?: number; strokeWidth?: number; status: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = status === 'safe' ? '#22c55e' : status === 'warning' ? '#eab308' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [analytics, setAnalytics] = useState<SubjectAnalytics[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { router.push('/'); return; }
    const fetchAnalytics = async () => {
      try {
        const roleData = JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}');
        setStudentId(roleData.id || '');
        const response = await fetch(`/api/student/analytics?studentId=${roleData.id}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        setAnalytics(data.analytics);
        setAttendanceHistory(data.attendanceHistory || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading analytics');
        toast.error('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [isAuthenticated, router]);

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
    const sorted = Array.from(dateMap.entries()).filter(([_, d]) => d.total > 0).sort(([a], [b]) => a.localeCompare(b));
    let streak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i][1].present === sorted[i][1].total) streak++;
      else break;
    }
    return streak;
  }, [attendanceHistory]);

  const atRiskSubjects = analytics.filter(s => s.stats.status === 'at-risk');
  const avgAttendance = analytics.length > 0 ? Math.round(analytics.reduce((sum, s) => sum + s.stats.percentage, 0) / analytics.length) : 0;
  const totalLectures = analytics.reduce((sum, s) => sum + s.lectureCount, 0);

  // Chart data: student vs class average (using subject CODE abbreviations)
  const comparativeData = analytics.map(s => ({
    name: s.subjectCode,
    fullName: s.subjectName,
    yours: Math.round(s.stats.percentage),
    classAvg: Math.round(s.classAverage || 0),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      const item = comparativeData.find(d => d.name === label);
      return (
        <div className="glass-card rounded-lg px-3 py-2 text-xs">
          <p className="font-semibold text-white mb-1">{item?.fullName || label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {p.value}%</p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <StudentNav userName={user?.name || 'Student'} onLogout={logout} />
        <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-6"><Skeleton className="h-8 w-16 bg-white/5" /><Skeleton className="h-4 w-24 mt-2 bg-white/5" /></div>
            ))}
          </div>
          <div className="glass-card rounded-xl p-6"><Skeleton className="h-[300px] w-full bg-white/5" /></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNav userName={user?.name || 'Student'} onLogout={logout} />

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-400" />
              Academic Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Track your attendance and performance</p>
          </div>
          {Object.keys(attendanceHistory).length > 0 && (
            <StreakBadge attendanceHistory={attendanceHistory} />
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* At-risk banner */}
        {atRiskSubjects.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-slide-up pulse-danger">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300">Attendance Alert</p>
              <p className="text-xs text-red-300/80 mt-0.5">
                Below 75% in: {atRiskSubjects.map(s => s.subjectName).join(', ')}
              </p>
            </div>
          </div>
        )}

        <NotificationsPanel analytics={analytics} currentStreak={currentStreak} />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 stagger-children">
          <div className="glass-card-hover rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400 font-medium">Average</span>
            </div>
            <p className="text-2xl font-bold text-white">{avgAttendance}%</p>
            <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="progress-gradient h-full" style={{ width: `${avgAttendance}%` }} />
            </div>
          </div>

          <div className="glass-card-hover rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400 font-medium">Safe</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{analytics.filter(s => s.stats.status === 'safe').length}</p>
            <p className="text-xs text-slate-500 mt-1">of {analytics.length} subjects</p>
          </div>

          <div className="glass-card-hover rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400 font-medium">At Risk</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{atRiskSubjects.length}</p>
            <p className="text-xs text-slate-500 mt-1">below 75%</p>
          </div>

          <div className="glass-card-hover rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-slate-400 font-medium">Lectures</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalLectures}</p>
            <p className="text-xs text-slate-500 mt-1">across all subjects</p>
          </div>
        </div>

        {/* Subject Cards with Circular Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {analytics.map((subject, idx) => (
            <div key={idx} className="glass-card-hover rounded-xl p-5 animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{subject.subjectName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{subject.subjectCode} · {subject.teacherName}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      subject.stats.status === 'safe' ? 'status-safe' :
                      subject.stats.status === 'warning' ? 'status-warning' : 'status-danger pulse-danger'
                    }`}>
                      {subject.stats.statusLabel}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                      {subject.trend.trend === 'improving' ? <TrendingUp className="w-3 h-3 text-emerald-400" /> :
                       subject.trend.trend === 'declining' ? <TrendingDown className="w-3 h-3 text-red-400" /> : null}
                      {subject.trend.trend}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    {subject.stats.totalPresent}/{subject.stats.totalLectures} classes · Class avg: {subject.classAverage?.toFixed(0)}%
                  </p>
                </div>
                <CircularProgress percentage={subject.stats.percentage} status={subject.stats.status} />
              </div>
            </div>
          ))}
        </div>

        {/* Heatmap + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 glass-card rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-400" />
              Attendance Heatmap
            </h2>
            <p className="text-xs text-slate-500 mb-4">12-week rolling calendar · hover for details</p>
            <AttendanceHeatmap attendanceHistory={attendanceHistory} />
          </div>

          <div className="space-y-4">
            <WeeklyDigest attendanceHistory={attendanceHistory} />
            <GoalSetter studentId={studentId} analytics={analytics} />
          </div>
        </div>

        {/* Comparative Bar Chart */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            Your Performance vs Class Average
          </h2>
          <p className="text-xs text-slate-500 mb-4">Subject-wise comparison</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparativeData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }}>
                <Label value="Subject" position="insideBottom" offset={-5} style={{ fill: '#64748b', fontSize: 11 }} />
              </XAxis>
              <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }}>
                <Label value="Attendance %" angle={-90} position="insideLeft" style={{ fill: '#64748b', fontSize: 11 }} />
              </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '75%', fill: '#ef4444', fontSize: 10 }} />
              <Bar dataKey="yours" name="Your Attendance" radius={[4, 4, 0, 0]}>
                {comparativeData.map((entry, i) => (
                  <Cell key={i} fill={entry.yours >= 85 ? '#22c55e' : entry.yours >= 75 ? '#eab308' : '#ef4444'} />
                ))}
              </Bar>
              <Bar dataKey="classAvg" name="Class Average" fill="rgba(148,163,184,0.4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Subject Tabs */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Subject Details & Simulator</h2>
          <Tabs defaultValue="0" className="space-y-4">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-lg grid gap-1" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(80px, 1fr))` }}>
              {analytics.map((s, idx) => (
                <TabsTrigger key={idx} value={String(idx)} className="text-[10px] data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md">
                  {s.subjectCode}
                </TabsTrigger>
              ))}
            </TabsList>

            {analytics.map((subject, idx) => (
              <TabsContent key={idx} value={String(idx)}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-card rounded-xl p-5">
                    <p className="text-xs text-slate-400 mb-1">Attendance</p>
                    <p className="text-3xl font-bold text-white">{subject.stats.percentage.toFixed(1)}%</p>
                    <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="progress-gradient h-full" style={{ width: `${subject.stats.percentage}%` }} />
                    </div>
                    <div className="flex gap-4 mt-3 text-xs">
                      <span className="text-emerald-400">{subject.stats.totalPresent} present</span>
                      <span className="text-red-400">{subject.stats.totalAbsent} absent</span>
                    </div>
                  </div>

                  <div className="glass-card rounded-xl p-5">
                    <p className="text-xs text-slate-400 mb-1">Classes to 75%</p>
                    {subject.classesNeeded.classesNeeded === 0 ? (
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-emerald-400 font-medium">Target met!</span>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-orange-400">{subject.classesNeeded.classesNeeded}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">{subject.classesNeeded.message}</p>
                  </div>

                  <div className="glass-card rounded-xl p-5">
                    <p className="text-xs text-slate-400 mb-1">Trend</p>
                    <div className="flex items-center gap-2 mt-1">
                      {subject.trend.trend === 'improving' ? <TrendingUp className="w-5 h-5 text-emerald-400" /> :
                       subject.trend.trend === 'declining' ? <TrendingDown className="w-5 h-5 text-red-400" /> :
                       <span className="text-slate-400">—</span>}
                      <span className="text-sm font-medium text-white capitalize">{subject.trend.trend}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{subject.trend.trendMessage}</p>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
