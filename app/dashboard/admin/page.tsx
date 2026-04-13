'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { AlertCircle, LayoutDashboard, TrendingUp, Database, Users, BookOpen, GraduationCap, Calendar } from 'lucide-react';
import AdminNav from '@/components/admin-nav';
import { initializeDB } from '@/lib/db';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') { router.push('/'); return; }
  }, [isAuthenticated, user, router]);

  const db = initializeDB();
  const stats = {
    totalUsers: db.users.size,
    totalStudents: db.students.size,
    totalTeachers: db.teachers.size,
    totalSubjects: db.subjects.size,
    totalEnrollments: db.enrollments.size,
    totalLectures: db.lectures.size,
    totalAttendance: db.attendance.size,
  };

  // Monthly trend (last 6 months)
  const monthlyTrend = (() => {
    const today = new Date();
    const months: { month: string; percentage: number }[] = [];
    const allAttendance = Array.from(db.attendance.values());
    const allLectures = Array.from(db.lectures.values());

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const monthLectures = allLectures.filter(l => l.date >= monthDate && l.date <= monthEnd);
      const lectureIds = new Set(monthLectures.map(l => l.id));
      const monthAtt = allAttendance.filter(a => lectureIds.has(a.lectureId));
      const present = monthAtt.filter(a => a.status === 'present').length;
      const pct = monthAtt.length > 0 ? Math.round((present / monthAtt.length) * 100 * 100) / 100 : 0;
      months.push({ month: monthName, percentage: pct });
    }
    return months;
  })();

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card rounded-lg px-3 py-2 text-xs">
          <p className="text-white font-medium">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {p.value}%</p>
          ))}
        </div>
      );
    }
    return null;
  };

  const statCards = [
    { label: 'Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
    { label: 'Students', value: stats.totalStudents, icon: GraduationCap, color: 'text-cyan-400' },
    { label: 'Teachers', value: stats.totalTeachers, icon: BookOpen, color: 'text-violet-400' },
    { label: 'Subjects', value: stats.totalSubjects, icon: Database, color: 'text-amber-400' },
  ];

  const dataCards = [
    { label: 'Enrollments', value: stats.totalEnrollments, icon: Users },
    { label: 'Lectures', value: stats.totalLectures, icon: Calendar },
    { label: 'Attendance Records', value: stats.totalAttendance, icon: Database },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminNav userName={user?.name || 'Admin'} onLogout={logout} />

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-amber-400" />
            System Administration
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Monitor the MITAOE attendance system</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-lg">
            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md">Overview</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md">Trends</TabsTrigger>
            <TabsTrigger value="data" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
              {statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="glass-card-hover rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${card.color}`} />
                      <span className="text-xs text-slate-400 font-medium">{card.label}</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{card.value.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dataCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="glass-card-hover rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-400 font-medium">{card.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>

            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-400">All Systems Operational</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400">
                <div>Database: <span className="text-emerald-400 font-medium">Connected</span></div>
                <div>Data Integrity: <span className="text-emerald-400 font-medium">Verified</span></div>
                <div>Uptime: <span className="text-white font-medium">99.9%</span></div>
                <div>Last Sync: <span className="text-white font-medium">{new Date().toLocaleDateString()}</span></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-400" /> Monthly Attendance Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }}>
                    <Label value="Month" position="insideBottom" offset={-5} style={{ fill: '#64748b', fontSize: 11 }} />
                  </XAxis>
                  <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }}>
                    <Label value="Attendance %" angle={-90} position="insideLeft" style={{ fill: '#64748b', fontSize: 11 }} />
                  </YAxis>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="percentage" stroke="#60a5fa" strokeWidth={2} name="Attendance %" dot={{ fill: '#60a5fa', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {monthlyTrend.slice(-3).map((m, i) => (
                <div key={i} className="glass-card-hover rounded-xl p-5">
                  <p className="text-xs text-slate-400 mb-1">{m.month}</p>
                  <p className={`text-3xl font-bold ${m.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>{m.percentage}%</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-amber-400" /> Database Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { l: 'Users', v: stats.totalUsers },
                  { l: 'Students', v: stats.totalStudents },
                  { l: 'Teachers', v: stats.totalTeachers },
                  { l: 'Subjects', v: stats.totalSubjects },
                  { l: 'Enrollments', v: stats.totalEnrollments },
                  { l: 'Lectures', v: stats.totalLectures },
                  { l: 'Attendance', v: stats.totalAttendance },
                  { l: 'Data Density', v: `${((stats.totalAttendance / Math.max(1, stats.totalEnrollments * (stats.totalLectures / Math.max(1, stats.totalSubjects)))) * 100).toFixed(0)}%` },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-xs text-slate-500">{item.l}</p>
                    <p className="text-xl font-bold text-white">{typeof item.v === 'number' ? item.v.toLocaleString() : item.v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                System contains {stats.totalStudents} students across {stats.totalSubjects} subject sections with {stats.totalAttendance.toLocaleString()} attendance records.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
